<?php

namespace Tests\Feature;

use App\Models\ApprovalDecision;
use App\Models\ApprovalPolicy;
use App\Models\ApprovalStep;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\PolicyVersion;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use LogicException;
use Tests\TestCase;

class ApprovalEngineTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    protected function beforeRefreshingDatabase(): void
    {
        if (config('database.default') !== 'pgsql' || ! str_ends_with(config('database.connections.pgsql.database'), '_test')) {
            throw new \RuntimeException('Tests require a dedicated PostgreSQL database with a name ending in _test.');
        }
    }

    private function org(string $slug = 'northstar-labs'): Organization
    {
        return Organization::where('slug', $slug)->firstOrFail();
    }

    private function member(string $email, string $slug = 'northstar-labs'): Membership
    {
        return Membership::where('organization_id', $this->org($slug)->id)->whereHas('user', fn ($query) => $query->where('email', $email.'@flowops.test'))->firstOrFail();
    }

    private function signIn(string $email = 'alex'): void
    {
        // Each API test request normally receives a fresh guard container in a real HTTP process.
        // Clear Sanctum's request-local cache when deliberately changing identities in one test.
        app('auth')->forgetGuards();
        $this->actingAs(User::where('email', $email.'@flowops.test')->firstOrFail(), 'web');
    }

    private function path(string $suffix = '', string $slug = 'northstar-labs'): string
    {
        return '/api/v1/organizations/'.$this->org($slug)->id.$suffix;
    }

    private function key(?string $key = null): array
    {
        return ['Idempotency-Key' => $key ?? (string) Str::uuid()];
    }

    private function draft(int $amount = 125000): array
    {
        return $this->postJson($this->path('/requests'), ['title' => 'Test purchase request', 'department' => 'Engineering', 'justification' => 'A new purchase to support the next product release.', 'amount_minor' => $amount], $this->key())->assertCreated()->json('data');
    }

    private function submitted(int $amount = 125000): array
    {
        $draft = $this->draft($amount);

        return $this->postJson($this->path('/requests/'.$draft['id'].'/submit'), ['revision' => $draft['revision'], 'policy_version_id' => $draft['policy_version']['id']], $this->key())->assertOk()->json('data');
    }

    private function publish(int $threshold = 1000000): array
    {
        $this->signIn();
        $policy = ApprovalPolicy::where('organization_id', $this->org()->id)->firstOrFail();

        return $this->postJson($this->path('/policy/publish'), ['revision' => $policy->revision, 'threshold_minor' => $threshold, 'manager_membership_id' => $this->member('maya')->id, 'finance_membership_id' => $this->member('noah')->id, 'change_note' => 'Updated threshold after a budget review.'], $this->key())->assertCreated()->json('data');
    }

    public function test_session_login_logout_and_wrong_credentials(): void
    {
        $this->postJson('/login', ['email' => 'alex@flowops.test', 'password' => 'wrong'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/login', ['email' => 'alex@flowops.test', 'password' => 'FlowOpsDemo!2026'])->assertOk()->assertJsonPath('data.name', 'Alex Morgan');
        $this->getJson('/api/v1/me')->assertOk()->assertJsonCount(2, 'data.organizations');
        $this->postJson('/logout')->assertNoContent();
        $this->assertGuest('web');
    }

    public function test_unauthenticated_api_request_is_rejected(): void
    {
        $this->getJson($this->path('/requests'))->assertUnauthorized();
    }

    public function test_repeated_failed_credentials_are_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/login', ['email' => 'alex@flowops.test', 'password' => 'incorrect'])->assertUnprocessable();
        }
        $this->postJson('/login', ['email' => 'alex@flowops.test', 'password' => 'incorrect'])->assertStatus(429);
    }

    public function test_all_organization_read_paths_enforce_membership(): void
    {
        $this->signIn('maya');
        foreach (['/requests', '/policy', '/overview', '/members', '/audit-events'] as $suffix) {
            $this->getJson($this->path($suffix, 'cedar-works'))->assertNotFound();
        }
        $foreign = PurchaseRequest::where('organization_id', $this->org('cedar-works')->id)->firstOrFail();
        $this->getJson($this->path('/requests/'.$foreign->id))->assertNotFound();
    }

    public function test_roles_differ_between_organizations_for_the_same_identity(): void
    {
        $this->signIn();
        $this->getJson($this->path('/members'))->assertOk();
        $this->getJson($this->path('/members', 'cedar-works'))->assertForbidden();
        $this->getJson($this->path('/audit-events', 'cedar-works'))->assertOk();
    }

    public function test_other_requesters_cannot_read_a_private_draft(): void
    {
        $this->signIn();
        $draft = $this->draft();
        $this->signIn('sarah');
        $this->getJson($this->path('/requests/'.$draft['id']))->assertNotFound();
    }

    public function test_client_cannot_forge_tenant_owner_or_status(): void
    {
        $this->signIn();
        $response = $this->postJson($this->path('/requests'), ['title' => 'Forged input test', 'department' => 'Engineering', 'justification' => 'Verify that protected server fields cannot be injected.', 'amount_minor' => 10000, 'organization_id' => $this->org('cedar-works')->id, 'status' => 'approved', 'requester_membership_id' => $this->member('maya')->id], $this->key())->assertCreated();
        $item = PurchaseRequest::findOrFail($response->json('data.id'));
        $this->assertSame($this->org()->id, $item->organization_id);
        $this->assertSame($this->member('alex')->id, $item->requester_membership_id);
        $this->assertSame('draft', $item->status);
    }

    public function test_amount_boundaries_select_the_expected_route(): void
    {
        $this->signIn();
        foreach ([499999 => 1, 500000 => 2, 500001 => 2] as $amount => $count) {
            $item = $this->submitted($amount);
            $this->assertCount($count, $item['steps']);
            $this->assertSame('pending', $item['steps'][0]['status']);
        }
    }

    public function test_a_small_request_completes_with_one_manager_decision(): void
    {
        $this->signIn();
        $item = $this->submitted();
        $this->signIn('maya');
        $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$item['current_step']['id'].'/approve'), ['revision' => $item['revision']], $this->key())->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertSame(1, ApprovalDecision::where('purchase_request_id', $item['id'])->count());
    }

    public function test_sequential_finance_step_cannot_be_decided_early(): void
    {
        $this->signIn();
        $item = $this->submitted(800000);
        $this->signIn('noah');
        $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$item['steps'][1]['id'].'/approve'), ['revision' => $item['revision']], $this->key())->assertConflict();
        $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$item['steps'][0]['id'].'/approve'), ['revision' => $item['revision']], $this->key())->assertForbidden();
        $this->signIn('maya');
        $next = $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$item['steps'][0]['id'].'/approve'), ['revision' => $item['revision']], $this->key())->assertOk()->assertJsonPath('data.status', 'pending')->json('data');
        $this->signIn('noah');
        $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$next['current_step']['id'].'/approve'), ['revision' => $next['revision']], $this->key())->assertOk()->assertJsonPath('data.status', 'approved');
    }

    public function test_administrator_permission_does_not_grant_decision_authority(): void
    {
        $this->signIn();
        $item = $this->submitted();
        $this->postJson($this->path('/requests/'.$item['id'].'/steps/'.$item['current_step']['id'].'/approve'), ['revision' => $item['revision']], $this->key())->assertForbidden();
    }

    public function test_self_approval_is_blocked_without_partial_submission(): void
    {
        $this->member('maya')->update(['roles' => ['requester', 'approver']]);
        $this->signIn('maya');
        $draft = $this->draft();
        $this->postJson($this->path('/requests/'.$draft['id'].'/submit'), ['revision' => $draft['revision'], 'policy_version_id' => $draft['policy_version']['id']], $this->key())->assertUnprocessable();
        $this->assertSame('draft', PurchaseRequest::find($draft['id'])->status);
        $this->assertSame(0, ApprovalStep::where('purchase_request_id', $draft['id'])->count());
    }

    public function test_membership_revocation_is_checked_with_an_existing_login(): void
    {
        $this->signIn('maya');
        $this->getJson($this->path('/overview'))->assertOk();
        $this->member('maya')->update(['active' => false]);
        $this->getJson($this->path('/overview'))->assertNotFound();
    }

    public function test_inactive_assignee_blocks_submission(): void
    {
        $this->signIn();
        $draft = $this->draft();
        $this->member('maya')->update(['active' => false]);
        $this->postJson($this->path('/requests/'.$draft['id'].'/submit'), ['revision' => 1, 'policy_version_id' => $draft['policy_version']['id']], $this->key())->assertUnprocessable();
        $this->assertSame(0, ApprovalStep::where('purchase_request_id', $draft['id'])->count());
    }

    public function test_submission_replay_is_duplicate_safe_and_changed_input_conflicts(): void
    {
        $this->signIn();
        $draft = $this->draft(800000);
        $key = $this->key();
        $url = $this->path('/requests/'.$draft['id'].'/submit');
        $input = ['revision' => 1, 'policy_version_id' => $draft['policy_version']['id']];
        $first = $this->postJson($url, $input, $key)->assertOk()->json();
        $this->postJson($url, $input, $key)->assertOk()->assertExactJson($first);
        $this->assertSame(2, ApprovalStep::where('purchase_request_id', $draft['id'])->count());
        $this->postJson($url, [...$input, 'revision' => 2], $key)->assertConflict();
    }

    public function test_repeated_decision_produces_one_record_and_stale_revision_conflicts(): void
    {
        $this->signIn();
        $item = $this->submitted();
        $this->signIn('maya');
        $url = $this->path('/requests/'.$item['id'].'/steps/'.$item['current_step']['id'].'/approve');
        $headers = $this->key();
        $first = $this->postJson($url, ['revision' => $item['revision']], $headers)->assertOk()->json();
        $this->postJson($url, ['revision' => $item['revision']], $headers)->assertOk()->assertExactJson($first);
        $this->postJson($url, ['revision' => $item['revision']], $this->key())->assertConflict();
        $this->assertSame(1, ApprovalDecision::where('purchase_request_id', $item['id'])->count());
    }

    public function test_new_policy_does_not_change_a_submitted_route(): void
    {
        $this->signIn();
        $item = $this->submitted(800000);
        $newVersion = $this->publish(1000000);
        $response = $this->getJson($this->path('/requests/'.$item['id']))->assertOk();
        $response->assertJsonPath('data.policy_version.id', $item['policy_version']['id'])->assertJsonCount(2, 'data.steps');
        $this->assertNotSame($newVersion['id'], $item['policy_version']['id']);
    }

    public function test_stale_draft_requires_explicit_review_of_the_new_policy(): void
    {
        $this->signIn();
        $draft = $this->draft(800000);
        $newVersion = $this->publish(1000000);
        $url = $this->path('/requests/'.$draft['id'].'/submit');
        $this->postJson($url, ['revision' => 1, 'policy_version_id' => $draft['policy_version']['id']], $this->key())->assertConflict();
        $this->postJson($url, ['revision' => 1, 'policy_version_id' => $newVersion['id']], $this->key())->assertOk()->assertJsonCount(1, 'data.steps')->assertJsonPath('data.policy_version.id', $newVersion['id']);
    }

    public function test_published_versions_cannot_be_modified_through_the_model(): void
    {
        $version = PolicyVersion::firstOrFail();
        $this->expectException(LogicException::class);
        $version->update(['threshold_minor' => 1]);
    }

    public function test_publishing_rejects_foreign_and_duplicate_assignees(): void
    {
        $this->signIn();
        $input = ['revision' => 3, 'threshold_minor' => 500000, 'manager_membership_id' => $this->member('felix', 'cedar-works')->id, 'finance_membership_id' => $this->member('noah')->id, 'change_note' => 'This policy contains an invalid assignment.'];
        $this->postJson($this->path('/policy/publish'), $input, $this->key())->assertUnprocessable();
        $this->postJson($this->path('/policy/publish'), [...$input, 'manager_membership_id' => $this->member('noah')->id], $this->key())->assertUnprocessable();
    }

    public function test_rejection_requires_a_reason_and_terminal_requests_cannot_resume(): void
    {
        $this->signIn();
        $item = $this->submitted(800000);
        $this->signIn('maya');
        $url = $this->path('/requests/'.$item['id'].'/steps/'.$item['current_step']['id'].'/reject');
        $this->postJson($url, ['revision' => $item['revision']], $this->key())->assertUnprocessable();
        $result = $this->postJson($url, ['revision' => $item['revision'], 'reason' => 'Please compare alternatives.'], $this->key())->assertOk()->assertJsonPath('data.status', 'rejected')->json('data');
        $this->assertSame(0, ApprovalStep::where('purchase_request_id', $item['id'])->whereIn('status', ['pending', 'waiting'])->count());
        $this->signIn();
        $this->postJson($this->path('/requests/'.$item['id'].'/cancel'), ['revision' => $result['revision']], $this->key())->assertConflict();
        $this->postJson($this->path('/requests/'.$item['id'].'/copy'), [], $this->key())->assertCreated()->assertJsonPath('data.status', 'draft')->assertJsonPath('data.source_request_id', $item['id']);
    }

    public function test_cancellation_removes_all_actionable_steps(): void
    {
        $this->signIn();
        $item = $this->submitted(800000);
        $this->postJson($this->path('/requests/'.$item['id'].'/cancel'), ['revision' => $item['revision']], $this->key())->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(0, ApprovalStep::where('purchase_request_id', $item['id'])->whereIn('status', ['pending', 'waiting'])->count());
    }

    public function test_submitted_fields_cannot_be_edited_and_invalid_money_is_rejected(): void
    {
        $this->signIn();
        $item = $this->submitted();
        $body = ['title' => 'Changed request title', 'amount_minor' => 10000, 'department' => 'Engineering', 'justification' => 'A modified submitted purchase request.', 'revision' => $item['revision']];
        $this->patchJson($this->path('/requests/'.$item['id']), $body)->assertConflict();
        foreach ([-1, 0, 1.5, 100000000000] as $amount) {
            $this->postJson($this->path('/requests'), [...$body, 'amount_minor' => $amount], $this->key())->assertUnprocessable();
        }
    }

    public function test_composite_database_constraint_rejects_a_cross_tenant_reference(): void
    {
        $request = PurchaseRequest::where('organization_id', $this->org()->id)->where('status', 'pending')->firstOrFail();
        try {
            DB::transaction(fn () => ApprovalStep::create(['organization_id' => $request->organization_id, 'purchase_request_id' => $request->id, 'assignee_membership_id' => $this->member('felix', 'cedar-works')->id, 'position' => 99, 'label' => 'Invalid cross-tenant assignment', 'status' => 'waiting']));
            $this->fail('Expected a database foreign-key violation.');
        } catch (QueryException $error) {
            $this->assertSame('23503', $error->errorInfo[0]);
        }
    }
}
