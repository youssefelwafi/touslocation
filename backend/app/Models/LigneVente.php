<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['vente_id', 'materiel_id', 'quantite', 'prix_unitaire', 'sous_total'])]
class LigneVente extends Model
{
    protected $table = 'lignes_vente';

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
            'prix_unitaire' => 'decimal:2',
            'sous_total' => 'decimal:2',
        ];
    }

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class);
    }

    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class);
    }
}
