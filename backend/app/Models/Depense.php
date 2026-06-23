<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['proprietaire_id', 'fournisseur_id', 'type_paiement_id', 'utilisateur_id', 'categorie', 'libelle', 'montant', 'date_depense', 'reference', 'note'])]
class Depense extends Model
{
    protected $table = 'depenses';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_depense' => 'date',
        ];
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function typePaiement(): BelongsTo
    {
        return $this->belongsTo(TypePaiement::class);
    }
}
