<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Empresa extends Model
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'title',
        'logo',
        'description',
        'location',
    ];

    public function getLogoUrlAttribute()
    {
        return $this->logo ? asset('storage/'.$this->logo) : null;
    }
}
