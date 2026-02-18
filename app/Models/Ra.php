<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ra extends Model
{
    protected $table = 'ras';

    protected $fillable = [
        'resultat_aprenentatge_codi',
        'ra',
        'descripcio',
    ];

    public function resultatAprenentatge()
    {
        return $this->belongsTo(ResultatsAprenentatge::class, 'resultat_aprenentatge_codi', 'codi');
    }

    public function jornades(): BelongsToMany
    {
        return $this->belongsToMany(Jornada::class, 'jornada_ra');
    }
}
