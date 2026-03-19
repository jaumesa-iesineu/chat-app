<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Professor extends Model
{
    protected $fillable = ['user_id', 'curs'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
