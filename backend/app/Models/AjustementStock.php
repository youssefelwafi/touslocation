<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['proprietaire_id', 'materiel_id', 'utilisateur_id', 'type', 'quantite', 'quantite_avant', 'quantite_apres', 'valeur_unitaire', 'valeur_totale', 'motif', 'note'])]
class AjustementStock extends Model
{
    protected $table = 'ajustements_stock';

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
            'quantite_avant' => 'integer',
            'quantite_apres' => 'integer',
            'valeur_unitaire' => 'decimal:2',
            'valeur_totale' => 'decimal:2',
        ];
    }

    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class);
    }
}
