<?php

namespace App\Http\Controllers;

use App\Models\ApprovalPolicy;
use App\Models\AuditEvent;
use App\Models\Membership;
use App\Services\ApprovalEngine;
use App\Services\RequestPresenter;
use App\Services\TenantAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WorkspaceController extends Controller
{
    public function __construct(private TenantAccess $access, private RequestPresenter $presenter) {}

    public function overview(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $visible = $this->access->visibleRequests($member);
        $counts = (clone $visible)->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');
        $assigned = (clone $visible)->where('status', 'pending')->whereHas('steps', fn ($steps) => $steps->where('status', 'pending')->where('assignee_membership_id', $member->id))->count();
        $recent = (clone $visible)->with(['requester.user', 'policyVersion', 'steps.assignee.user', 'steps.decision.actor.user'])->latest('updated_at')->limit(5)->get();
        $activity = AuditEvent::where('organization_id', $organization)
            ->where(function ($query) use ($member, $visible) {
                $query->whereIn('purchase_request_id', (clone $visible)->select('purchase_requests.id'));
                if ($member->hasRole('administrator') || $member->hasRole('auditor')) {
                    $query->orWhereNull('purchase_request_id');
                }
            })->with('actor.user')->latest('occurred_at')->limit(6)->get();

        return response()->json(['data' => [
            'counts' => $counts, 'assigned_to_me' => $assigned, 'total' => $counts->sum(),
            'approved_amount_minor' => (int) (clone $visible)->where('status', 'approved')->sum('amount_minor'),
            'recent_requests' => $recent->map(fn ($item) => $this->presenter->request($item, $member, false)),
            'activity' => $activity->map(fn ($item) => $this->presenter->audit($item)),
        ]]);
    }

    public function policy(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $policy = ApprovalPolicy::where('organization_id', $organization)->with('currentVersion')->firstOrFail();
        $approvers = Membership::where('organization_id', $organization)->where('active', true)->whereJsonContains('roles', 'approver')->with('user')->get();

        return response()->json(['data' => [
            'id' => $policy->id, 'name' => $policy->name, 'revision' => $policy->revision,
            'current' => $this->presenter->policyVersion($policy->currentVersion),
            'versions' => ($member->hasRole('administrator') || $member->hasRole('auditor'))
                ? $policy->versions()->with(['manager.user', 'finance.user', 'publisher.user'])->get()->map(fn ($version) => $this->presenter->policyVersion($version)) : [],
            'approvers' => $member->hasRole('administrator') ? $approvers->map(fn ($person) => ['id' => $person->id, 'name' => $person->user->name])->values() : [],
        ]]);
    }

    public function publish(Request $request, string $organization, ApprovalEngine $engine): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $input = $request->validate([
            'revision' => 'required|integer|min:1', 'threshold_minor' => 'required|integer|min:1|max:99999999999',
            'manager_membership_id' => 'required|uuid', 'finance_membership_id' => 'required|uuid',
            'change_note' => 'required|string|min:8|max:500',
        ]);

        return response()->json(['data' => $engine->publish($member, $input, $request->header('Idempotency-Key', ''))], 201);
    }

    public function audit(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        abort_unless($member->hasRole('administrator') || $member->hasRole('auditor'), 403);
        $request->validate(['page' => 'sometimes|integer|min:1', 'type' => ['sometimes', Rule::in(['all', 'request', 'step', 'policy'])]]);
        $query = AuditEvent::where('organization_id', $organization)->with('actor.user')->latest('occurred_at')->latest('id');
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('event_type', 'like', $request->input('type').'.%');
        }
        $page = $query->paginate(20);

        return response()->json(['data' => $page->getCollection()->map(fn ($event) => $this->presenter->audit($event)), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]]);
    }

    public function members(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $this->access->requireRole($member, 'administrator');

        return response()->json(['data' => Membership::where('organization_id', $organization)->with('user')->get()->map(fn ($item) => [
            'id' => $item->id, 'name' => $item->user->name, 'email' => $item->user->email, 'roles' => $item->roles, 'active' => $item->active,
        ])]);
    }
}
