<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['proprietaire_id', 'nom', 'code', 'symbole', 'taux_change', 'par_defaut'])]
class Devise extends Model
{
    protected $table = 'devises';

    protected function casts(): array
    {
        return [
            'taux_change' => 'decimal:4',
            'par_defaut' => 'boolean',
        ];
    }

    public function materiels(): HasMany
    {
        return $this->hasMany(Materiel::class);
    }
}
