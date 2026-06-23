<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['location_id', 'numero_contrat', 'chemin_pdf', 'date_generation'])]
class Contrat extends Model
{
    protected $table = 'contrats';

    protected function casts(): array
    {
        return ['date_generation' => 'datetime'];
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
