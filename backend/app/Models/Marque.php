<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'nom', 'description'])]
class Marque extends Model
{
    protected $table = 'marques';

    public function materiels(): HasMany
    {
        return $this->hasMany(Materiel::class);
    }
}
