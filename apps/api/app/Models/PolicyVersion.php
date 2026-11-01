<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class PolicyVersion extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['threshold_minor' => 'integer', 'version_number' => 'integer', 'published_at' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Published policy versions cannot be changed.'));
        static::deleting(fn () => throw new LogicException('Published policy versions cannot be deleted.'));
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'manager_membership_id');
    }

    public function finance(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'finance_membership_id');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'published_by_membership_id');
    }
}
