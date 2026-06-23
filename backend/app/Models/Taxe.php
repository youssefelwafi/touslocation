<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['proprietaire_id', 'nom', 'taux', 'par_defaut'])]
class Taxe extends Model
{
    protected $table = 'taxes';

    protected function casts(): array
    {
        return [
            'taux' => 'decimal:2',
            'par_defaut' => 'boolean',
        ];
    }

    // Taux de TVA par défaut d'un tenant (sinon 20%).
    public static function defaultRateFor(?int $ownerId): float
    {
        return (float) (static::where('proprietaire_id', $ownerId)->where('par_defaut', true)->value('taux') ?? 20);
    }
}
