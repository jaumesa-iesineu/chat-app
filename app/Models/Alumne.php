<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alumne extends Model
{
    protected $fillable = ['user_id', 'numero_seguretat_social'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
