<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ApprovalStep extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['activated_at' => 'datetime', 'completed_at' => 'datetime'];
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'assignee_membership_id');
    }

    public function decision(): HasOne
    {
        return $this->hasOne(ApprovalDecision::class);
    }
}
