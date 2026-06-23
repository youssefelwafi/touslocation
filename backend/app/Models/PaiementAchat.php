<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['achat_id', 'type_paiement_id', 'utilisateur_id', 'montant', 'date_paiement', 'note'])]
class PaiementAchat extends Model
{
    protected $table = 'paiements_achat';

    protected function casts(): array
    {
        return ['montant' => 'decimal:2', 'date_paiement' => 'date'];
    }

    public function achat(): BelongsTo
    {
        return $this->belongsTo(Achat::class);
    }

    public function typePaiement(): BelongsTo
    {
        return $this->belongsTo(TypePaiement::class);
    }
}
