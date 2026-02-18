<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Jornada extends Model
{
    protected $table = 'jornades';

    protected $fillable = [
        'user_id',
        'data',
        'hora_entrada',
        'hora_sortida',
        'activitats',
    ];

    protected $casts = [
        'data' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ras(): BelongsToMany
    {
        return $this->belongsToMany(Ra::class, 'jornada_ra');
    }
}
