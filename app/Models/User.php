<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Musonza\Chat\Traits\Messageable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, Messageable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Contractes als que pertany aquest usuari.
     */
    public function contracts(): BelongsToMany
    {
        return $this->belongsToMany(Contract::class);
    }

    /**
     * Atributs afegits automàticament al JSON.
     */
    protected $appends = ['role'];

    /**
     * Retorna el rol derivat de les taules relacionades.
     */
    public function getRoleAttribute(): string
    {
        if ($this->relationLoaded('professor') ? $this->professor !== null : $this->professor()->exists()) {
            return 'professor';
        }
        if ($this->relationLoaded('empresari') ? $this->empresari !== null : $this->empresari()->exists()) {
            return 'empresari';
        }
        if ($this->relationLoaded('alumne') ? $this->alumne !== null : $this->alumne()->exists()) {
            return 'alumne';
        }
        return 'unknown';
    }

    public function professor(): HasOne
    {
        return $this->hasOne(Professor::class);
    }

    public function alumne(): HasOne
    {
        return $this->hasOne(Alumne::class);
    }

    public function empresari(): HasOne
    {
        return $this->hasOne(Empresari::class);
    }
}
