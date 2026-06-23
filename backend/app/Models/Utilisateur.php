<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['nom', 'email', 'password', 'role', 'proprietaire_id', 'telephone', 'statut', 'permissions'])]
#[Hidden(['password', 'remember_token'])]
class Utilisateur extends Authenticatable
{
    protected $table = 'utilisateurs';

    // Tous les modules gérables (pour la gestion des permissions employé).
    public const MODULES = ['materiels', 'locations', 'clients', 'fournisseurs', 'achats', 'ventes', 'depenses', 'ajustements', 'rapports', 'parametres'];

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
        ];
    }

    // Un employé n'accède qu'aux modules cochés ; admin/manager accèdent à tout.
    public function hasModule(string $key): bool
    {
        if ($this->role === 'admin' || $this->role === 'manager') {
            return true;
        }
        if ($this->role === 'employee') {
            return in_array($key, $this->permissions ?? [], true);
        }

        return false;
    }

    // Locations passées en tant que client.
    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    // Locations gérées en tant qu'employé.
    public function locationsGerees(): HasMany
    {
        return $this->hasMany(Location::class, 'employe_id');
    }

    // Matériel de l'espace (pour un manager = propriétaire / boutique).
    public function materielsPossedes(): HasMany
    {
        return $this->hasMany(Materiel::class, 'proprietaire_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Super-administrateur : voit toutes les données de tous les tenants.
    public function isSuperAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    // Staff = peut gérer le catalogue et les locations (hors clients).
    public function isStaff(): bool
    {
        return in_array($this->role, ['admin', 'manager', 'employee'], true);
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    // Identifiant du tenant (workspace) auquel appartiennent les données.
    // null pour le super-admin (= aucun filtrage, voit tout).
    public function tenantId(): ?int
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        return $this->isManager() ? $this->id : $this->proprietaire_id;
    }
}
