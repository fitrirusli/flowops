<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('industry');
            $table->unsignedInteger('next_request_number')->default(1);
            $table->timestampsTz();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->jsonb('roles');
            $table->boolean('active')->default(true);
            $table->timestampsTz();
            $table->unique(['organization_id', 'user_id']);
            $table->unique(['organization_id', 'id']);
        });

        Schema::create('approval_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->unique()->constrained()->restrictOnDelete();
            $table->string('name')->default('Purchase approval');
            $table->unsignedInteger('revision')->default(1);
            $table->uuid('current_version_id')->nullable();
            $table->timestampsTz();
            $table->unique(['organization_id', 'id']);
        });

        Schema::create('policy_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('approval_policy_id');
            $table->unsignedInteger('version_number');
            $table->bigInteger('threshold_minor');
            $table->uuid('manager_membership_id');
            $table->uuid('finance_membership_id');
            $table->uuid('published_by_membership_id');
            $table->text('change_note');
            $table->timestampTz('published_at');
            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'approval_policy_id', 'version_number']);
            $table->unique(['organization_id', 'approval_policy_id', 'id']);
            $table->foreign(['organization_id', 'approval_policy_id'])->references(['organization_id', 'id'])->on('approval_policies')->restrictOnDelete();
            foreach (['manager_membership_id', 'finance_membership_id', 'published_by_membership_id'] as $column) {
                $table->foreign(['organization_id', $column])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
            }
        });

        Schema::table('approval_policies', function (Blueprint $table) {
            $table->foreign(['organization_id', 'id', 'current_version_id'], 'policy_current_version_fk')->references(['organization_id', 'approval_policy_id', 'id'])->on('policy_versions')->restrictOnDelete();
        });

        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->restrictOnDelete();
            $table->string('reference', 30);
            $table->uuid('requester_membership_id');
            $table->uuid('policy_version_id');
            $table->uuid('source_request_id')->nullable();
            $table->string('title', 160);
            $table->string('department', 80);
            $table->text('justification');
            $table->bigInteger('amount_minor');
            $table->char('currency', 3)->default('MYR');
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('revision')->default(1);
            $table->timestampTz('submitted_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'reference']);
            $table->index(['organization_id', 'status', 'created_at']);
            $table->index(['organization_id', 'requester_membership_id']);
            $table->foreign(['organization_id', 'requester_membership_id'])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
            $table->foreign(['organization_id', 'policy_version_id'])->references(['organization_id', 'id'])->on('policy_versions')->restrictOnDelete();
            $table->foreign(['organization_id', 'source_request_id'])->references(['organization_id', 'id'])->on('purchase_requests')->restrictOnDelete();
        });

        Schema::create('approval_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('purchase_request_id');
            $table->uuid('assignee_membership_id');
            $table->unsignedSmallInteger('position');
            $table->string('label');
            $table->string('status', 20);
            $table->timestampTz('activated_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestampsTz();
            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'purchase_request_id', 'id']);
            $table->unique(['purchase_request_id', 'position']);
            $table->index(['organization_id', 'assignee_membership_id', 'status']);
            $table->foreign(['organization_id', 'purchase_request_id'])->references(['organization_id', 'id'])->on('purchase_requests')->restrictOnDelete();
            $table->foreign(['organization_id', 'assignee_membership_id'])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
        });

        Schema::create('approval_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('purchase_request_id');
            $table->uuid('approval_step_id')->unique();
            $table->uuid('actor_membership_id');
            $table->string('decision', 20);
            $table->text('reason')->nullable();
            $table->timestampTz('decided_at');
            $table->foreign(['organization_id', 'purchase_request_id', 'approval_step_id'], 'decision_step_tenant_fk')->references(['organization_id', 'purchase_request_id', 'id'])->on('approval_steps')->restrictOnDelete();
            $table->foreign(['organization_id', 'actor_membership_id'])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('actor_membership_id');
            $table->uuid('purchase_request_id')->nullable();
            $table->string('event_type');
            $table->string('description', 500);
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('occurred_at');
            $table->index(['organization_id', 'occurred_at']);
            $table->foreign(['organization_id', 'actor_membership_id'])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
            $table->foreign(['organization_id', 'purchase_request_id'])->references(['organization_id', 'id'])->on('purchase_requests')->restrictOnDelete();
        });

        Schema::create('command_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('actor_membership_id');
            $table->string('action', 40);
            $table->string('key', 100);
            $table->char('payload_hash', 64);
            $table->jsonb('result');
            $table->timestampTz('created_at');
            $table->unique(['organization_id', 'actor_membership_id', 'action', 'key'], 'command_key_unique');
            $table->foreign(['organization_id', 'actor_membership_id'])->references(['organization_id', 'id'])->on('memberships')->restrictOnDelete();
        });

        DB::statement('ALTER TABLE policy_versions ADD CONSTRAINT valid_threshold CHECK (threshold_minor BETWEEN 1 AND 99999999999)');
        DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT valid_amount CHECK (amount_minor BETWEEN 1 AND 99999999999 AND currency = 'MYR')");
        DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT valid_request_status CHECK (status IN ('draft','pending','approved','rejected','cancelled'))");
        DB::statement("ALTER TABLE approval_steps ADD CONSTRAINT valid_step_status CHECK (status IN ('waiting','pending','approved','rejected','cancelled'))");
        DB::statement("ALTER TABLE approval_decisions ADD CONSTRAINT valid_decision CHECK (decision IN ('approved','rejected'))");
        DB::statement("CREATE UNIQUE INDEX one_pending_step ON approval_steps (purchase_request_id) WHERE status = 'pending'");
    }

    public function down(): void
    {
        foreach (['command_results', 'audit_events', 'approval_decisions', 'approval_steps', 'purchase_requests'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('approval_policies', fn (Blueprint $table) => $table->dropForeign('policy_current_version_fk'));
        foreach (['policy_versions', 'approval_policies', 'memberships', 'organizations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
