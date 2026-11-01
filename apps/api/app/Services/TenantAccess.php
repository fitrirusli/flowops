<?php

namespace App\Services;

use App\Models\Membership;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TenantAccess
{
    public function membership(User $user, string $organizationId): Membership
    {
        return Membership::where('organization_id', $organizationId)
            ->where('user_id', $user->id)->where('active', true)->firstOrFail();
    }

    public function requireRole(Membership $member, string $role): void
    {
        abort_unless($member->active && $member->hasRole($role), 403, 'You do not have permission to perform this action.');
    }

    public function visibleRequests(Membership $member): Builder
    {
        return PurchaseRequest::where('organization_id', $member->organization_id)
            ->where(function (Builder $query) use ($member) {
                $query->where('requester_membership_id', $member->id);
                $query->orWhere(function (Builder $submitted) use ($member) {
                    $submitted->where('status', '!=', 'draft');
                    if (! $member->hasRole('administrator') && ! $member->hasRole('auditor')) {
                        $submitted->whereHas('steps', fn (Builder $steps) => $steps->where('assignee_membership_id', $member->id));
                    }
                });
            });
    }

    public function eligibleApprover(string $organizationId, string $membershipId): Membership
    {
        $member = Membership::where('organization_id', $organizationId)->whereKey($membershipId)->where('active', true)->first();
        abort_unless($member && $member->hasRole('approver'), 422, 'Choose an active approver from this organization.');

        return $member;
    }
}
