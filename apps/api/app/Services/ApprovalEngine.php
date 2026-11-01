<?php

namespace App\Services;

use App\Models\ApprovalDecision;
use App\Models\ApprovalPolicy;
use App\Models\ApprovalStep;
use App\Models\AuditEvent;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\PolicyVersion;
use App\Models\PurchaseRequest;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ApprovalEngine
{
    public function __construct(private TenantAccess $access, private RequestPresenter $presenter) {}

    public function audit(Membership $actor, string $type, string $description, ?PurchaseRequest $request = null, array $metadata = []): void
    {
        AuditEvent::create([
            'organization_id' => $actor->organization_id, 'actor_membership_id' => $actor->id,
            'purchase_request_id' => $request?->id, 'event_type' => $type,
            'description' => $description, 'metadata' => $metadata, 'occurred_at' => now(),
        ]);
    }

    private function command(Membership $member, string $action, string $key, array $payload, Closure $operation): array
    {
        abort_unless(preg_match('/^[a-zA-Z0-9._:-]{8,100}$/', $key), 422, 'Supply an Idempotency-Key containing 8 to 100 letters, digits, dots, colons, underscores, or hyphens.');
        $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($member, $action, $key, $hash, $operation) {
            // A database advisory lock also serializes reuse of a key across different target rows.
            $lock = hexdec(substr(hash('sha256', $member->organization_id.$member->id.$action.$key), 0, 15));
            DB::select('SELECT pg_advisory_xact_lock(?)', [$lock]);
            $stored = DB::table('command_results')->where('organization_id', $member->organization_id)
                ->where('actor_membership_id', $member->id)->where('action', $action)->where('key', $key)->first();
            if ($stored) {
                abort_unless(hash_equals($stored->payload_hash, $hash), 409, 'This action key was already used with different input.');

                return json_decode($stored->result, true, flags: JSON_THROW_ON_ERROR);
            }
            $result = $operation();
            DB::table('command_results')->insert([
                'id' => (string) Str::uuid(), 'organization_id' => $member->organization_id,
                'actor_membership_id' => $member->id, 'action' => $action, 'key' => $key,
                'payload_hash' => $hash, 'result' => json_encode($result, JSON_THROW_ON_ERROR), 'created_at' => now(),
            ]);

            return $result;
        }, 3);
    }

    private function lockRequest(Membership $member, string $id, int $revision): PurchaseRequest
    {
        $request = $this->access->visibleRequests($member)->whereKey($id)->lockForUpdate()->firstOrFail();
        abort_unless($request->revision === $revision, 409, 'This request changed. Refresh it before trying again.');

        return $request;
    }

    private function owned(Membership $member, PurchaseRequest $request): void
    {
        $this->access->requireRole($member, 'requester');
        abort_unless($request->requester_membership_id === $member->id, 403, 'Only the requester can perform this action.');
    }

    public function createDraft(Membership $member, array $input, string $key, ?string $source = null): array
    {
        $this->access->requireRole($member, 'requester');

        return $this->command($member, 'create', $key, ['input' => $input, 'source' => $source], function () use ($member, $input, $source) {
            $policy = ApprovalPolicy::where('organization_id', $member->organization_id)->firstOrFail();
            $organization = Organization::whereKey($member->organization_id)->lockForUpdate()->firstOrFail();
            $number = $organization->next_request_number;
            $organization->increment('next_request_number');
            if ($source) {
                $original = $this->access->visibleRequests($member)->whereKey($source)->firstOrFail();
                $this->owned($member, $original);
                abort_unless(in_array($original->status, ['rejected', 'cancelled'], true), 409, 'Only rejected or cancelled requests can be copied.');
            }
            $request = PurchaseRequest::create([
                ...$input, 'organization_id' => $member->organization_id,
                'requester_membership_id' => $member->id, 'policy_version_id' => $policy->current_version_id,
                'source_request_id' => $source, 'reference' => 'PR-'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
                'status' => 'draft', 'currency' => 'MYR',
            ]);
            $this->audit($member, 'request.created', 'Created a purchase request draft.', $request);

            return $this->presenter->request($request->fresh(), $member);
        });
    }

    public function updateDraft(Membership $member, string $id, array $input): array
    {
        return DB::transaction(function () use ($member, $id, $input) {
            $request = $this->lockRequest($member, $id, $input['revision']);
            $this->owned($member, $request);
            abort_unless($request->status === 'draft', 409, 'Submitted requests cannot be edited.');
            $request->update([...collect($input)->except('revision')->all(), 'revision' => $request->revision + 1]);
            $this->audit($member, 'request.updated', 'Updated the purchase request draft.', $request);

            return $this->presenter->request($request->fresh(), $member);
        });
    }

    public function submit(Membership $member, string $id, array $input, string $key): array
    {
        return $this->command($member, 'submit', $key, ['id' => $id, ...$input], function () use ($member, $id, $input) {
            // Publishing and submission acquire this same policy lock before selecting a version.
            $policy = ApprovalPolicy::where('organization_id', $member->organization_id)->lockForUpdate()->firstOrFail();
            $request = $this->lockRequest($member, $id, $input['revision']);
            $this->owned($member, $request);
            abort_unless($request->status === 'draft', 409, 'This request has already been submitted or cancelled.');
            abort_unless($policy->current_version_id === $input['policy_version_id'], 409, 'The approval policy changed. Review the current policy before submitting.');
            $version = $policy->currentVersion;
            $assignments = [[$version->manager_membership_id, 'Manager review']];
            if ($request->amount_minor >= $version->threshold_minor) {
                $assignments[] = [$version->finance_membership_id, 'Finance review'];
            }
            foreach ($assignments as [$assignee]) {
                $this->access->eligibleApprover($member->organization_id, $assignee);
                abort_if($assignee === $member->id, 422, 'You cannot approve your own request. Ask an administrator to publish a policy with another approver.');
            }
            foreach ($assignments as $index => [$assignee, $label]) {
                ApprovalStep::create([
                    'organization_id' => $member->organization_id, 'purchase_request_id' => $request->id,
                    'assignee_membership_id' => $assignee, 'position' => $index + 1, 'label' => $label,
                    'status' => $index === 0 ? 'pending' : 'waiting', 'activated_at' => $index === 0 ? now() : null,
                ]);
            }
            $request->update(['policy_version_id' => $version->id, 'status' => 'pending', 'submitted_at' => now(), 'revision' => $request->revision + 1]);
            $this->audit($member, 'request.submitted', 'Submitted for approval under policy v'.$version->version_number.'.', $request, ['policy_version' => $version->version_number]);

            return $this->presenter->request($request->fresh(), $member);
        });
    }

    public function decide(Membership $member, string $id, string $stepId, string $decision, array $input, string $key): array
    {
        $this->access->requireRole($member, 'approver');

        return $this->command($member, 'decide', $key, ['id' => $id, 'step' => $stepId, 'decision' => $decision, ...$input], function () use ($member, $id, $stepId, $decision, $input) {
            $request = $this->lockRequest($member, $id, $input['revision']);
            abort_unless($request->status === 'pending', 409, 'This request is no longer awaiting approval.');
            $step = ApprovalStep::where('organization_id', $member->organization_id)->where('purchase_request_id', $request->id)->whereKey($stepId)->lockForUpdate()->firstOrFail();
            abort_unless($step->status === 'pending', 409, 'This step is no longer awaiting a decision.');
            abort_unless($step->assignee_membership_id === $member->id && $request->requester_membership_id !== $member->id, 403, 'You are not permitted to decide this step.');
            ApprovalDecision::create([
                'organization_id' => $member->organization_id, 'purchase_request_id' => $request->id,
                'approval_step_id' => $step->id, 'actor_membership_id' => $member->id,
                'decision' => $decision, 'reason' => $input['reason'] ?? null, 'decided_at' => now(),
            ]);
            $step->update(['status' => $decision, 'completed_at' => now()]);
            $status = $decision;
            if ($decision === 'approved') {
                $next = $request->steps()->where('status', 'waiting')->first();
                if ($next) {
                    $next->update(['status' => 'pending', 'activated_at' => now()]);
                    $status = 'pending';
                }
            } else {
                $request->steps()->where('status', 'waiting')->update(['status' => 'cancelled', 'completed_at' => now()]);
            }
            $request->update(['status' => $status, 'completed_at' => $status === 'pending' ? null : now(), 'revision' => $request->revision + 1]);
            $this->audit($member, 'step.'.$decision, $step->label.' '.($decision === 'approved' ? 'approved.' : 'rejected.'), $request, ['reason' => $input['reason'] ?? null]);

            return $this->presenter->request($request->fresh(), $member);
        });
    }

    public function cancel(Membership $member, string $id, array $input, string $key): array
    {
        return $this->command($member, 'cancel', $key, ['id' => $id, ...$input], function () use ($member, $id, $input) {
            $request = $this->lockRequest($member, $id, $input['revision']);
            $this->owned($member, $request);
            abort_unless(in_array($request->status, ['draft', 'pending'], true), 409, 'A completed request cannot be cancelled.');
            $request->steps()->whereIn('status', ['waiting', 'pending'])->update(['status' => 'cancelled', 'completed_at' => now()]);
            $request->update(['status' => 'cancelled', 'completed_at' => now(), 'revision' => $request->revision + 1]);
            $this->audit($member, 'request.cancelled', 'Cancelled the purchase request.', $request);

            return $this->presenter->request($request->fresh(), $member);
        });
    }

    public function publish(Membership $member, array $input, string $key): array
    {
        $this->access->requireRole($member, 'administrator');

        return $this->command($member, 'publish', $key, $input, function () use ($member, $input) {
            $policy = ApprovalPolicy::where('organization_id', $member->organization_id)->lockForUpdate()->firstOrFail();
            abort_unless($policy->revision === $input['revision'], 409, 'The policy changed. Refresh before publishing another version.');
            $this->access->eligibleApprover($member->organization_id, $input['manager_membership_id']);
            $this->access->eligibleApprover($member->organization_id, $input['finance_membership_id']);
            abort_if($input['manager_membership_id'] === $input['finance_membership_id'], 422, 'Manager and finance reviewers must be different people.');
            $number = ($policy->currentVersion?->version_number ?? 0) + 1;
            $version = PolicyVersion::create([
                'organization_id' => $member->organization_id, 'approval_policy_id' => $policy->id,
                'version_number' => $number, 'threshold_minor' => $input['threshold_minor'],
                'manager_membership_id' => $input['manager_membership_id'], 'finance_membership_id' => $input['finance_membership_id'],
                'published_by_membership_id' => $member->id, 'published_at' => now(), 'change_note' => $input['change_note'],
            ]);
            $policy->update(['current_version_id' => $version->id, 'revision' => $policy->revision + 1]);
            $this->audit($member, 'policy.published', 'Published purchase approval policy v'.$number.'.', metadata: ['version_number' => $number]);

            return $this->presenter->policyVersion($version);
        });
    }
}
