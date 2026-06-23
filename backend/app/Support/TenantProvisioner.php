<?php

namespace App\Support;

use App\Models\Categorie;
use App\Models\Devise;
use App\Models\Marque;
use App\Models\Taxe;
use App\Models\TypePaiement;
use App\Models\Unite;

// Crée les référentiels par défaut d'un nouvel espace (manager) à l'inscription,
// afin que l'application soit immédiatement utilisable.
class TenantProvisioner
{
    public static function provision(int $ownerId): void
    {
        // Devises (MAD par défaut)
        Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Dirham marocain', 'code' => 'MAD', 'symbole' => 'DH', 'taux_change' => 1, 'par_defaut' => true]);
        Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Euro', 'code' => 'EUR', 'symbole' => '€', 'taux_change' => 0.092]);
        Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Dollar US', 'code' => 'USD', 'symbole' => '$', 'taux_change' => 0.099]);

        // TVA (taux marocains, 20% par défaut)
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA standard', 'taux' => 20, 'par_defaut' => true]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA réduite', 'taux' => 14]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA super-réduite', 'taux' => 10]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'Exonéré', 'taux' => 0]);

        // Unités
        foreach ([['Jour', 'j'], ['Heure', 'h'], ['Semaine', 'sem'], ['Pièce', 'pc']] as [$n, $s]) {
            Unite::create(['proprietaire_id' => $ownerId, 'nom' => $n, 'symbole' => $s]);
        }

        // Types de paiement
        foreach (['Espèces', 'Carte bancaire', 'Virement', 'Chèque'] as $pt) {
            TypePaiement::create(['proprietaire_id' => $ownerId, 'nom' => $pt]);
        }

        // Catégories & marque génériques de départ
        foreach (['Informatique', 'Audiovisuel', 'Événementiel', 'Chantier'] as $cat) {
            Categorie::create(['proprietaire_id' => $ownerId, 'nom' => $cat]);
        }
        Marque::create(['proprietaire_id' => $ownerId, 'nom' => 'Générique']);
    }
}
