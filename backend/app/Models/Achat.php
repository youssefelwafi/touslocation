<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'fournisseur_id', 'utilisateur_id', 'reference', 'date_achat', 'statut', 'montant_total', 'note'])]
class Achat extends Model
{
    protected $table = 'achats';

    protected $appends = ['montant_paye', 'montant_restant', 'statut_paiement'];

    protected function casts(): array
    {
        return [
            'date_achat' => 'date',
            'montant_total' => 'decimal:2',
        ];
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneAchat::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(PaiementAchat::class);
    }

    protected function montantPaye(): Attribute
    {
        return Attribute::get(fn () => (float) $this->paiements()->sum('montant'));
    }

    protected function montantRestant(): Attribute
    {
        return Attribute::get(fn () => max(0, (float) $this->montant_total - $this->montant_paye));
    }

    // unpaid | partial | paid (par rapport au fournisseur)
    protected function statutPaiement(): Attribute
    {
        return Attribute::get(function () {
            $paid = $this->montant_paye;
            if ($paid <= 0) {
                return 'unpaid';
            }

            return $paid >= (float) $this->montant_total ? 'paid' : 'partial';
        });
    }
}
