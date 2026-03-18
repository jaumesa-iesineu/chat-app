<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'logo',
        'description',
        'location',
    ];

    /**
     * Alumnes assignats a aquesta empresa.
     */
    public function alumnes(): HasMany
    {
        return $this->hasMany(User::class, 'empresa_id')
            ->where('role', 'alumne');
    }

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/'.$this->logo) : null;
    }
}
