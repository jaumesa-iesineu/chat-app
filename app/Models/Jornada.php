<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Jornada extends Model
{
    protected $table = 'jornades';

    protected $fillable = [
        'user_id',
        'data',
        'hora_entrada',
        'hora_sortida',
        'activitats'
        //més endevant... quines ra's ha completat aquella jornada?
    ];

    protected $casts = [
        'data' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
