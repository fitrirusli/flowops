<?php

use App\Models\ApprovalDecision;
use App\Models\ApprovalStep;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\PurchaseRequest;
use App\Services\ApprovalEngine;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

require __DIR__.'/../../apps/api/vendor/autoload.php';
$app = require __DIR__.'/../../apps/api/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('testing') || ! str_ends_with(config('database.connections.pgsql.database'), '_test')) {
    throw new RuntimeException('Concurrency verification may only use a dedicated _test database.');
}

$mode = $argv[1] ?? '';
$engine = app(ApprovalEngine::class);

if ($mode === 'prepare') {
    Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
    $org = Organization::where('slug', 'northstar-labs')->firstOrFail();
    $members = Membership::where('organization_id', $org->id)->with('user')->get()->keyBy(fn ($member) => $member->user->email);
    $owner = $members['alex@flowops.test'];
    $version = App\Models\ApprovalPolicy::where('organization_id', $org->id)->firstOrFail()->current_version_id;
    $scenarios = [];
    foreach (['decisions', 'approve-cancel', 'duplicate-submit'] as $scenario) {
        $item = $engine->createDraft($owner, ['title' => 'Concurrent '.$scenario, 'department' => 'Engineering', 'amount_minor' => 125000, 'justification' => 'A synthetic request used to verify real simultaneous database actions.'], (string) Str::uuid());
        if ($scenario !== 'duplicate-submit') {
            $item = $engine->submit($owner, $item['id'], ['revision' => $item['revision'], 'policy_version_id' => $version], (string) Str::uuid());
        }
        $scenarios[$scenario] = ['id' => $item['id'], 'revision' => $item['revision'], 'step' => $item['current_step']['id'] ?? null, 'policy_version_id' => $version, 'owner' => $owner->id, 'manager' => $members['maya@flowops.test']->id];
    }
    echo json_encode($scenarios, JSON_THROW_ON_ERROR);
    exit;
}

$input = json_decode(file_get_contents($argv[2]), true, flags: JSON_THROW_ON_ERROR);
if ($mode === 'inspect') {
    $request = PurchaseRequest::findOrFail($input['id']);
    echo json_encode(['status' => $request->status, 'revision' => $request->revision, 'decisions' => ApprovalDecision::where('purchase_request_id', $request->id)->count(), 'steps' => ApprovalStep::where('purchase_request_id', $request->id)->count(), 'pending_steps' => ApprovalStep::where('purchase_request_id', $request->id)->where('status', 'pending')->count()], JSON_THROW_ON_ERROR);
    exit;
}

// Both processes acquire independent PostgreSQL connections before the release barrier.
DB::connection()->getPdo();
file_put_contents($argv[3].'.ready', 'ready');
$deadline = microtime(true) + 15;
while (! file_exists($argv[4])) {
    if (microtime(true) > $deadline) throw new RuntimeException('Concurrency barrier timed out.');
    usleep(10000);
}
try {
    $member = Membership::findOrFail($mode === 'cancel' || $mode === 'submit' ? $input['owner'] : $input['manager']);
    $result = match ($mode) {
        'approve', 'reject' => $engine->decide($member, $input['id'], $input['step'], $mode === 'approve' ? 'approved' : 'rejected', ['revision' => $input['revision'], 'reason' => 'Concurrent verification decision.'], (string) Str::uuid()),
        'cancel' => $engine->cancel($member, $input['id'], ['revision' => $input['revision']], (string) Str::uuid()),
        'submit' => $engine->submit($member, $input['id'], ['revision' => $input['revision'], 'policy_version_id' => $input['policy_version_id']], $input['key']),
        default => throw new RuntimeException('Unknown action.'),
    };
    echo json_encode(['code' => 200, 'status' => $result['status'], 'id' => $result['id']], JSON_THROW_ON_ERROR);
} catch (HttpExceptionInterface $error) {
    echo json_encode(['code' => $error->getStatusCode(), 'message' => $error->getMessage()], JSON_THROW_ON_ERROR);
}
