<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['location_id', 'type_paiement_id', 'utilisateur_id', 'montant', 'mode', 'date_paiement', 'note'])]
class Paiement extends Model
{
    protected $table = 'paiements';

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'date_paiement' => 'date',
        ];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function typePaiement(): BelongsTo
    {
        return $this->belongsTo(TypePaiement::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class);
    }
}
