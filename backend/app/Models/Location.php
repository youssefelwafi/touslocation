<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['proprietaire_id', 'utilisateur_id', 'employe_id', 'date_debut', 'date_fin', 'date_retour', 'statut', 'sous_total', 'taux_taxe', 'montant_taxe', 'montant_total'])]
class Location extends Model
{
    protected $table = 'locations';

    // Attributs calculés exposés dans le JSON.
    protected $appends = ['montant_paye', 'montant_restant', 'statut_paiement'];

    protected function casts(): array
    {
        return [
            'date_debut' => 'date',
            'date_fin' => 'date',
            'date_retour' => 'date',
            'sous_total' => 'decimal:2',
            'taux_taxe' => 'decimal:2',
            'montant_taxe' => 'decimal:2',
            'montant_total' => 'decimal:2',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'employe_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneLocation::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function contrat(): HasOne
    {
        return $this->hasOne(Contrat::class);
    }

    // Montant total déjà encaissé.
    protected function montantPaye(): Attribute
    {
        return Attribute::get(fn () => (float) $this->paiements()->sum('montant'));
    }

    // Reste à payer (TTC - encaissé).
    protected function montantRestant(): Attribute
    {
        return Attribute::get(fn () => max(0, (float) $this->montant_total - $this->montant_paye));
    }

    // unpaid | partial | paid
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
