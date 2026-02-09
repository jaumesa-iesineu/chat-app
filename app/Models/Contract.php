<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Contract extends Model
{
    protected $fillable = ['name'];

    /**
     * Usuarios asignados a este contrato
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
