<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ra extends Model
{
    protected $table = 'ras';

    protected $fillable = [
        'descripcio',
        'resultat_aprenentatge_codi'
    ];

    public function resultatAprenentatge()
    {
        return $this->belongsTo(ResultatsAprenentatge::class, 'resultat_aprenentatge_codi', 'codi');
    }
}
