<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'nom', 'description'])]
class Categorie extends Model
{
    protected $table = 'categories';

    public function materiels(): HasMany
    {
        return $this->hasMany(Materiel::class);
    }
}
