<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['achat_id', 'materiel_id', 'quantite', 'cout_unitaire', 'sous_total'])]
class LigneAchat extends Model
{
    protected $table = 'lignes_achat';

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
            'cout_unitaire' => 'decimal:2',
            'sous_total' => 'decimal:2',
        ];
    }

    public function achat(): BelongsTo
    {
        return $this->belongsTo(Achat::class);
    }

    public function materiel(): BelongsTo
    {
        return $this->belongsTo(Materiel::class);
    }
}
