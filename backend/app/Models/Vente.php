<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'client_id', 'utilisateur_id', 'reference', 'date_vente', 'sous_total', 'taux_taxe', 'montant_taxe', 'montant_total', 'note'])]
class Vente extends Model
{
    protected $table = 'ventes';

    protected function casts(): array
    {
        return [
            'date_vente' => 'date',
            'sous_total' => 'decimal:2',
            'taux_taxe' => 'decimal:2',
            'montant_taxe' => 'decimal:2',
            'montant_total' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'client_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneVente::class);
    }
}
