<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'nom', 'actif'])]
class TypePaiement extends Model
{
    protected $table = 'types_paiement';

    protected function casts(): array
    {
        return ['actif' => 'boolean'];
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }
}
