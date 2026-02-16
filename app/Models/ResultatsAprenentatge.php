<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResultatsAprenentatge extends Model
{
    protected $table = 'resultats_aprenentatge';

    protected $primaryKey = 'codi';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'codi',
        'modul'
    ];

    public function ras()
    {
        return $this->hasMany(Ra::class, 'resultat_aprenentatge_codi', 'codi');
    }
}
