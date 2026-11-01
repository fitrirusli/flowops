<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalPolicy extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function currentVersion(): BelongsTo
    {
        return $this->belongsTo(PolicyVersion::class, 'current_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PolicyVersion::class)->orderByDesc('version_number');
    }
}
