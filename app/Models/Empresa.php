<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Empresa extends Model
{
    use HasFactory;

    protected $appends = ['logo_url'];

    protected $fillable = [
        'title',
        'logo',
        'description',
        'location',
        'telefon',
        'nom_empresari',
    ];

    /**
     * Empresari propietari d'aquesta empresa.
     */
    public function empresari(): HasOne
    {
        return $this->hasOne(Empresari::class);
    }

    /**
     * Empresaris assignats a aquesta empresa.
     */
    public function empresaris(): HasMany
    {
        return $this->hasMany(Empresari::class);
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/'.$this->logo) : null;
    }
}
