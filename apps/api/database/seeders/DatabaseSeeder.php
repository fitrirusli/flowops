<?php

namespace Database\Seeders;

use App\Models\ApprovalPolicy;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use App\Services\ApprovalEngine;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        try {
            DB::transaction(fn () => $this->seedDemo());
        } finally {
            Carbon::setTestNow();
        }
    }

    private function seedDemo(): void
    {
        if (Organization::exists()) {
            $this->command?->warn('Demo data already exists. No records were changed.');

            return;
        }
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Synthetic demo accounts may only be seeded in local or testing environments.');
        }
        $password = Hash::make('FlowOpsDemo!2026');
        $users = [];
        foreach (['alex' => 'Alex Morgan', 'maya' => 'Maya Chen', 'noah' => 'Noah Williams', 'sarah' => 'Sarah Lim', 'felix' => 'Felix Tan', 'ava' => 'Ava Patel', 'jordan' => 'Jordan Lee'] as $key => $name) {
            $users[$key] = User::create(['name' => $name, 'email' => $key.'@flowops.test', 'password' => $password]);
        }
        $northstar = Organization::create(['name' => 'Northstar Labs', 'slug' => 'northstar-labs', 'industry' => 'Technology & product']);
        $cedar = Organization::create(['name' => 'Cedar Works', 'slug' => 'cedar-works', 'industry' => 'Design & manufacturing']);
        $members = [];
        foreach ([
            [$northstar, 'alex', ['administrator', 'requester']], [$northstar, 'maya', ['approver']],
            [$northstar, 'noah', ['approver']], [$northstar, 'sarah', ['requester']], [$northstar, 'jordan', ['auditor']],
            [$cedar, 'alex', ['auditor']], [$cedar, 'sarah', ['administrator', 'requester']],
            [$cedar, 'felix', ['approver']], [$cedar, 'ava', ['approver']],
        ] as [$organization, $key, $roles]) {
            $members[$organization->slug][$key] = Membership::create(['organization_id' => $organization->id, 'user_id' => $users[$key]->id, 'roles' => $roles]);
        }
        $engine = app(ApprovalEngine::class);
        $north = $members['northstar-labs'];
        $ced = $members['cedar-works'];
        Carbon::setTestNow(now()->subDays(15)->startOfDay()->addHours(9));
        $northPolicy = ApprovalPolicy::create(['organization_id' => $northstar->id]);
        $engine->publish($north['alex'], ['revision' => 1, 'threshold_minor' => 300000, 'manager_membership_id' => $north['maya']->id, 'finance_membership_id' => $north['noah']->id, 'change_note' => 'Initial purchase approval policy.'], (string) Str::uuid());
        $cedPolicy = ApprovalPolicy::create(['organization_id' => $cedar->id]);
        $engine->publish($ced['sarah'], ['revision' => 1, 'threshold_minor' => 1000000, 'manager_membership_id' => $ced['felix']->id, 'finance_membership_id' => $ced['ava']->id, 'change_note' => 'Initial Cedar Works approval policy.'], (string) Str::uuid());
        Carbon::setTestNow();
        $samples = [
            ['Team workspace subscription', 124000, 'Engineering', 'approved', 'alex', 12],
            ['Product design monitors', 420000, 'Design', 'approved', 'sarah', 10],
            ['Annual analytics platform', 680000, 'Marketing', 'rejected', 'alex', 8],
            ['Developer workstations', 1460000, 'Engineering', 'pending', 'alex', 4],
            ['Customer research incentives', 185000, 'Design', 'pending', 'sarah', 3],
            ['Office meeting room equipment', 825000, 'Operations', 'finance', 'alex', 2],
            ['Conference passes for the team', 360000, 'People', 'draft', 'alex', 1],
            ['Brand photography session', 275000, 'Marketing', 'cancelled', 'alex', 1],
        ];
        foreach ($samples as [$title, $amount, $department, $status, $owner, $days]) {
            Carbon::setTestNow(now()->subDays($days)->startOfDay()->addHours(10));
            $item = $engine->createDraft($north[$owner], ['title' => $title, 'amount_minor' => $amount, 'department' => $department, 'justification' => 'This purchase supports the team’s upcoming delivery milestones. The selected option balances quality, team requirements, and the available department budget.'], (string) Str::uuid());
            if ($status !== 'draft') {
                $item = $engine->submit($north[$owner], $item['id'], ['revision' => $item['revision'], 'policy_version_id' => $northPolicy->fresh()->current_version_id], (string) Str::uuid());
            }
            if ($status === 'cancelled') {
                $engine->cancel($north[$owner], $item['id'], ['revision' => $item['revision']], (string) Str::uuid());
            } elseif ($status === 'rejected') {
                $engine->decide($north['maya'], $item['id'], $item['current_step']['id'], 'rejected', ['revision' => $item['revision'], 'reason' => 'Please include a comparison with the existing platform before resubmitting.'], (string) Str::uuid());
            } elseif (in_array($status, ['approved', 'finance'], true)) {
                $item = $engine->decide($north['maya'], $item['id'], $item['current_step']['id'], 'approved', ['revision' => $item['revision'], 'reason' => 'Reviewed and within the team budget.'], (string) Str::uuid());
                if ($status === 'approved' && $item['status'] === 'pending') {
                    $engine->decide($north['noah'], $item['id'], $item['current_step']['id'], 'approved', ['revision' => $item['revision'], 'reason' => 'Budget confirmed.'], (string) Str::uuid());
                }
            }
            Carbon::setTestNow();
        }
        Carbon::setTestNow(now()->subDay()->startOfDay()->addHours(14));
        $engine->publish($north['alex'], ['revision' => $northPolicy->fresh()->revision, 'threshold_minor' => 500000, 'manager_membership_id' => $north['maya']->id, 'finance_membership_id' => $north['noah']->id, 'change_note' => 'Raised the finance review threshold to MYR 5,000. Existing requests retain their original policy.'], (string) Str::uuid());
        Carbon::setTestNow();
        $cedarItem = $engine->createDraft($ced['sarah'], ['title' => 'Workshop tooling supplies', 'amount_minor' => 245000, 'department' => 'Operations', 'justification' => 'Replacement workshop supplies for the next production cycle.'], (string) Str::uuid());
        $engine->submit($ced['sarah'], $cedarItem['id'], ['revision' => $cedarItem['revision'], 'policy_version_id' => $cedPolicy->fresh()->current_version_id], (string) Str::uuid());
    }
}
