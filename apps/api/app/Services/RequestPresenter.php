<?php

namespace App\Services;

use App\Models\AuditEvent;
use App\Models\Membership;
use App\Models\PolicyVersion;
use App\Models\PurchaseRequest;

class RequestPresenter
{
    public function policyVersion(PolicyVersion $version): array
    {
        $version->loadMissing(['manager.user', 'finance.user', 'publisher.user']);

        return [
            'id' => $version->id,
            'version_number' => $version->version_number,
            'threshold_minor' => $version->threshold_minor,
            'manager' => ['id' => $version->manager->id, 'name' => $version->manager->user->name],
            'finance' => ['id' => $version->finance->id, 'name' => $version->finance->user->name],
            'published_by' => $version->publisher->user->name,
            'published_at' => $version->published_at->toISOString(),
            'change_note' => $version->change_note,
        ];
    }

    public function request(PurchaseRequest $request, Membership $viewer, bool $details = true): array
    {
        $request->loadMissing(['requester.user', 'policyVersion.manager.user', 'policyVersion.finance.user', 'steps.assignee.user', 'steps.decision.actor.user']);
        $current = $request->steps->firstWhere('status', 'pending');
        $isOwner = $request->requester_membership_id === $viewer->id;
        $result = [
            'id' => $request->id,
            'reference' => $request->reference,
            'title' => $request->title,
            'department' => $request->department,
            'amount_minor' => $request->amount_minor,
            'currency' => 'MYR',
            'status' => $request->status,
            'revision' => $request->revision,
            'requester' => ['id' => $request->requester->id, 'name' => $request->requester->user->name],
            'created_at' => $request->created_at->toISOString(),
            'updated_at' => $request->updated_at->toISOString(),
            'submitted_at' => $request->submitted_at?->toISOString(),
            'completed_at' => $request->completed_at?->toISOString(),
            'policy_version_number' => $request->policyVersion->version_number,
            'current_step' => $current ? ['id' => $current->id, 'label' => $current->label, 'assignee' => $current->assignee->user->name] : null,
            'permissions' => [
                'edit' => $isOwner && $viewer->hasRole('requester') && $request->status === 'draft',
                'submit' => $isOwner && $viewer->hasRole('requester') && $request->status === 'draft',
                'cancel' => $isOwner && $viewer->hasRole('requester') && in_array($request->status, ['draft', 'pending'], true),
                'decide' => $request->status === 'pending' && $current?->assignee_membership_id === $viewer->id && ! $isOwner && $viewer->hasRole('approver'),
                'copy' => $isOwner && $viewer->hasRole('requester') && in_array($request->status, ['rejected', 'cancelled'], true),
            ],
        ];
        if ($details) {
            $result['justification'] = $request->justification;
            $result['source_request_id'] = $request->source_request_id;
            $result['policy_version'] = $this->policyVersion($request->policyVersion);
            $result['steps'] = $request->steps->map(fn ($step) => [
                'id' => $step->id, 'position' => $step->position, 'label' => $step->label,
                'status' => $step->status, 'assignee' => $step->assignee->user->name,
                'decision' => $step->decision ? ['decision' => $step->decision->decision, 'reason' => $step->decision->reason, 'actor' => $step->decision->actor->user->name, 'decided_at' => $step->decision->decided_at->toISOString()] : null,
            ])->values()->all();
            $result['history'] = $request->auditEvents()->with('actor.user')->get()->map(fn ($event) => $this->audit($event))->all();
        }

        return $result;
    }

    public function audit(AuditEvent $event): array
    {
        return [
            'id' => $event->id, 'event_type' => $event->event_type,
            'description' => $event->description, 'actor' => $event->actor->user->name,
            'request_id' => $event->purchase_request_id,
            'metadata' => $event->metadata,
            'occurred_at' => $event->occurred_at->toISOString(),
        ];
    }
}
