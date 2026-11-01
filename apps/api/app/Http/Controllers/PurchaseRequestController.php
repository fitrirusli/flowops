<?php

namespace App\Http\Controllers;

use App\Services\ApprovalEngine;
use App\Services\RequestPresenter;
use App\Services\TenantAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PurchaseRequestController extends Controller
{
    public function __construct(private TenantAccess $access, private RequestPresenter $presenter, private ApprovalEngine $engine) {}

    private function fields(): array
    {
        return [
            'title' => 'required|string|min:3|max:160', 'amount_minor' => 'required|integer|min:1|max:99999999999',
            'department' => ['required', Rule::in(['Engineering', 'Design', 'Marketing', 'Operations', 'Finance', 'People'])],
            'justification' => 'required|string|min:10|max:10000',
        ];
    }

    public function index(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $request->validate([
            'status' => ['sometimes', Rule::in(['all', 'draft', 'pending', 'approved', 'rejected', 'cancelled'])],
            'view' => ['sometimes', Rule::in(['all', 'mine', 'inbox'])], 'search' => 'sometimes|nullable|string|max:100', 'page' => 'sometimes|integer|min:1',
        ]);
        $query = $this->access->visibleRequests($member);
        if ($request->input('view') === 'mine') {
            $query->where('requester_membership_id', $member->id);
        }
        if ($request->input('view') === 'inbox') {
            $this->access->requireRole($member, 'approver');
            $query->where('status', 'pending')->whereHas('steps', fn ($steps) => $steps->where('status', 'pending')->where('assignee_membership_id', $member->id));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $search = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $request->input('search'));
            $query->where(fn ($q) => $q->where('title', 'ilike', '%'.$search.'%')->orWhere('reference', 'ilike', '%'.$search.'%'));
        }
        $page = $query->with(['requester.user', 'policyVersion', 'steps.assignee.user', 'steps.decision.actor.user'])->latest('updated_at')->latest('id')->paginate(12);

        return response()->json(['data' => $page->getCollection()->map(fn ($item) => $this->presenter->request($item, $member, false)), 'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()]]);
    }

    public function show(Request $request, string $organization, string $purchaseRequest): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $item = $this->access->visibleRequests($member)->whereKey($purchaseRequest)->firstOrFail();

        return response()->json(['data' => $this->presenter->request($item, $member)]);
    }

    public function store(Request $request, string $organization): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);

        return response()->json(['data' => $this->engine->createDraft($member, $request->validate($this->fields()), $request->header('Idempotency-Key', ''))], 201);
    }

    public function update(Request $request, string $organization, string $purchaseRequest): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);

        return response()->json(['data' => $this->engine->updateDraft($member, $purchaseRequest, $request->validate([...$this->fields(), 'revision' => 'required|integer|min:1']))]);
    }

    public function submit(Request $request, string $organization, string $purchaseRequest): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);

        return response()->json(['data' => $this->engine->submit($member, $purchaseRequest, $request->validate(['revision' => 'required|integer|min:1', 'policy_version_id' => 'required|uuid']), $request->header('Idempotency-Key', ''))]);
    }

    public function cancel(Request $request, string $organization, string $purchaseRequest): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);

        return response()->json(['data' => $this->engine->cancel($member, $purchaseRequest, $request->validate(['revision' => 'required|integer|min:1']), $request->header('Idempotency-Key', ''))]);
    }

    public function decide(Request $request, string $organization, string $purchaseRequest, string $step, string $action): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $decision = $action === 'approve' ? 'approved' : 'rejected';
        $input = $request->validate(['revision' => 'required|integer|min:1', 'reason' => ($decision === 'rejected' ? 'required' : 'nullable').'|string|max:2000']);

        return response()->json(['data' => $this->engine->decide($member, $purchaseRequest, $step, $decision, $input, $request->header('Idempotency-Key', ''))]);
    }

    public function copy(Request $request, string $organization, string $purchaseRequest): JsonResponse
    {
        $member = $this->access->membership($request->user(), $organization);
        $source = $this->access->visibleRequests($member)->whereKey($purchaseRequest)->firstOrFail();

        return response()->json(['data' => $this->engine->createDraft($member, $source->only(['title', 'amount_minor', 'department', 'justification']), $request->header('Idempotency-Key', ''), $source->id)], 201);
    }
}
