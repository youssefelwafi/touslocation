<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'nom', 'telephone', 'email', 'adresse'])]
class Fournisseur extends Model
{
    protected $table = 'fournisseurs';

    public function achats(): HasMany
    {
        return $this->hasMany(Achat::class);
    }
}
