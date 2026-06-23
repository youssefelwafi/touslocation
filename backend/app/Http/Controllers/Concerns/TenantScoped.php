<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Isolation multi-tenant : chaque manager ne voit/modifie que ses données
 * (proprietaire_id = son tenant). Le super-admin n'est pas filtré (voit tout).
 */
trait TenantScoped
{
    // Applique le filtre tenant à une requête (sauf super-admin).
    protected function scopeToTenant(Builder $query, Request $request, string $column = 'proprietaire_id'): Builder
    {
        $tenantId = $request->user()->tenantId();
        if ($tenantId !== null) {
            $query->where($column, $tenantId);
        }

        return $query;
    }

    // proprietaire_id à appliquer lors d'une création.
    protected function ownerId(Request $request): int
    {
        return $request->user()->tenantId() ?? $request->user()->id;
    }

    // Bloque un EMPLOYÉ qui n'a pas le module ; admin/manager passent.
    protected function requireModule(Request $request, string $key): void
    {
        $u = $request->user();
        abort_unless($u->isStaff(), 403);
        abort_unless($u->hasModule($key), 403, 'Module non autorisé pour cet utilisateur.');
    }

    // Vérifie qu'un modèle appartient bien au tenant courant (404 sinon).
    protected function ensureOwned(Request $request, Model $model, string $column = 'proprietaire_id'): void
    {
        $tenantId = $request->user()->tenantId();
        if ($tenantId !== null && (int) $model->{$column} !== $tenantId) {
            abort(404);
        }
    }
}
