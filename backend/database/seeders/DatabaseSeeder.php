<?php

namespace Database\Seeders;

use App\Models\Achat;
use App\Models\Categorie;
use App\Models\Depense;
use App\Models\Devise;
use App\Models\Fournisseur;
use App\Models\Location;
use App\Models\Marque;
use App\Models\Materiel;
use App\Models\Taxe;
use App\Models\TypePaiement;
use App\Models\Unite;
use App\Models\Utilisateur;
use App\Models\Vente;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Super-admin : voit toutes les données de tous les tenants ---
        Utilisateur::create([
            'nom' => 'Super Admin',
            'email' => 'admin@touslocations.com',
            'password' => Hash::make('1234567890'),
            'role' => 'admin',
            'statut' => 'active',
        ]);

        // --- Tenant A : manager principal avec données complètes ---
        $managerA = Utilisateur::create([
            'nom' => 'Karim Benani (Loc Maroc)',
            'email' => 'manager@touslocations.com',
            'password' => Hash::make('1234567890'),
            'role' => 'manager',
            'statut' => 'active',
        ]);
        $this->seedTenant($managerA->id, full: true);

        // --- Tenant B : second manager, données minimales (démontre l'isolation) ---
        $managerB = Utilisateur::create([
            'nom' => 'Sara El Idrissi (EventPro)',
            'email' => 'manager2@touslocations.com',
            'password' => Hash::make('1234567890'),
            'role' => 'manager',
            'statut' => 'active',
        ]);
        $this->seedTenant($managerB->id, full: false);
    }

    // Crée le catalogue + (option) une location de démo pour un tenant donné.
    private function seedTenant(int $ownerId, bool $full): void
    {
        // Devises (MAD par défaut)
        $mad = Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Dirham marocain', 'code' => 'MAD', 'symbole' => 'DH', 'taux_change' => 1, 'par_defaut' => true]);
        Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Euro', 'code' => 'EUR', 'symbole' => '€', 'taux_change' => 0.092]);
        Devise::create(['proprietaire_id' => $ownerId, 'nom' => 'Dollar US', 'code' => 'USD', 'symbole' => '$', 'taux_change' => 0.099]);

        // Unités
        $jour = Unite::create(['proprietaire_id' => $ownerId, 'nom' => 'Jour', 'symbole' => 'j']);
        Unite::create(['proprietaire_id' => $ownerId, 'nom' => 'Heure', 'symbole' => 'h']);
        Unite::create(['proprietaire_id' => $ownerId, 'nom' => 'Semaine', 'symbole' => 'sem']);
        Unite::create(['proprietaire_id' => $ownerId, 'nom' => 'Pièce', 'symbole' => 'pc']);

        // TVA (taux marocains, 20% par défaut)
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA standard', 'taux' => 20, 'par_defaut' => true]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA réduite', 'taux' => 14]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'TVA super-réduite', 'taux' => 10]);
        Taxe::create(['proprietaire_id' => $ownerId, 'nom' => 'Exonéré', 'taux' => 0]);

        // Types de paiement
        $cash = null;
        foreach (['Espèces', 'Carte bancaire', 'Virement', 'Chèque'] as $pt) {
            $created = TypePaiement::create(['proprietaire_id' => $ownerId, 'nom' => $pt]);
            $cash ??= $created;
        }

        // Marques
        $brands = [];
        foreach (['Dell', 'HP', 'LG', 'Epson', 'JBL', 'Shure', 'Bosch', 'Générique'] as $b) {
            $brands[$b] = Marque::create(['proprietaire_id' => $ownerId, 'nom' => $b]);
        }

        // Catalogue : complet pour A, réduit pour B.
        $catalog = $full ? [
            'Informatique' => [
                ['Ordinateur portable Dell Latitude', 180, 12, 'Dell'],
                ['Écran 27" LG UltraFine', 80, 20, 'LG'],
                ['Imprimante laser HP', 100, 6, 'HP'],
            ],
            'Audiovisuel' => [
                ['Vidéoprojecteur Epson EB-X05', 250, 5, 'Epson'],
                ['Sonorisation portable JBL', 350, 4, 'JBL'],
                ['Micro sans fil Shure', 120, 10, 'Shure'],
            ],
            'Événementiel' => [
                ['Tente pliante 3x3m', 400, 8, 'Générique'],
                ['Table buffet pliante', 60, 30, 'Générique'],
                ['Chaise pliante', 15, 200, 'Générique'],
            ],
            'Chantier' => [
                ['Perforateur Bosch', 220, 7, 'Bosch'],
                ['Échafaudage roulant', 450, 3, 'Générique'],
                ['Groupe électrogène 5kW', 600, 2, 'Générique'],
            ],
        ] : [
            'Événementiel' => [
                ['Sonorisation 2000W', 500, 3, 'JBL'],
                ['Podium modulaire', 300, 5, 'Générique'],
            ],
        ];

        foreach ($catalog as $categoryName => $equipments) {
            $category = Categorie::create(['proprietaire_id' => $ownerId, 'nom' => $categoryName]);
            foreach ($equipments as [$name, $price, $qty, $brandName]) {
                Materiel::create([
                    'proprietaire_id' => $ownerId,
                    'categorie_id' => $category->id,
                    'marque_id' => $brands[$brandName]->id,
                    'unite_id' => $jour->id,
                    'devise_id' => $mad->id,
                    'nom' => $name,
                    'prix_par_jour' => $price,
                    'quantite' => $qty,
                    'statut' => 'available',
                    'image' => $this->makeImage($ownerId, $name, $categoryName),
                ]);
            }
        }

        // Battements post-location (nettoyage / contrôle).
        Materiel::where('proprietaire_id', $ownerId)->where('nom', 'like', 'Vidéoprojecteur%')->update(['jours_tampon' => 1, 'note_tampon' => 'Nettoyage et test optique']);
        Materiel::where('proprietaire_id', $ownerId)->where('nom', 'like', 'Groupe électrogène%')->update(['jours_tampon' => 2, 'note_tampon' => 'Vidange et vérification moteur']);
        Materiel::where('proprietaire_id', $ownerId)->where('nom', 'like', 'Tente pliante%')->update(['jours_tampon' => 1, 'note_tampon' => 'Séchage et pliage']);

        if (! $full) {
            return;
        }

        // Employé + client appartenant à ce tenant.
        Utilisateur::create([
            'nom' => 'Employé Démo',
            'email' => 'employe@touslocations.com',
            'password' => Hash::make('1234567890'),
            'role' => 'employee',
            'proprietaire_id' => $ownerId,
            'statut' => 'active',
            'permissions' => ['materiels', 'locations', 'clients', 'rapports'],
        ]);
        $client = Utilisateur::create([
            'nom' => 'Client Démo',
            'email' => 'client@touslocations.com',
            'password' => Hash::make('1234567890'),
            'role' => 'client',
            'proprietaire_id' => $ownerId,
            'telephone' => '+212612345678',
            'statut' => 'active',
        ]);

        // Fournisseur + commande d'achat en attente (à réceptionner).
        $supplier = Fournisseur::create([
            'proprietaire_id' => $ownerId,
            'nom' => 'TechPro Distribution',
            'telephone' => '+212522334455',
            'email' => 'contact@techpro.ma',
            'adresse' => 'Casablanca',
        ]);
        $laptop = Materiel::where('proprietaire_id', $ownerId)->where('nom', 'like', 'Ordinateur%')->first();
        $purchase = Achat::create([
            'proprietaire_id' => $ownerId,
            'fournisseur_id' => $supplier->id,
            'utilisateur_id' => $ownerId,
            'reference' => 'BC-2026-001',
            'date_achat' => Carbon::parse('2026-06-05'),
            'statut' => 'pending',
            'montant_total' => 0,
        ]);
        $purchase->lignes()->create([
            'materiel_id' => $laptop->id,
            'quantite' => 5,
            'cout_unitaire' => 4500,
            'sous_total' => 22500,
        ]);
        $purchase->update(['montant_total' => 22500]);

        // Achat réceptionné (compte comme coût dans le rapport).
        $recv = Achat::create([
            'proprietaire_id' => $ownerId, 'fournisseur_id' => $supplier->id, 'utilisateur_id' => $ownerId,
            'reference' => 'BC-2026-002', 'date_achat' => Carbon::parse('2026-03-12'),
            'statut' => 'received', 'montant_total' => 9000,
        ]);
        $recv->lignes()->create(['materiel_id' => $laptop->id, 'quantite' => 2, 'cout_unitaire' => 4500, 'sous_total' => 9000]);

        // --- Données de démonstration pour les rapports ---
        $byName = fn ($like) => Materiel::where('proprietaire_id', $ownerId)->where('nom', 'like', $like)->first();

        // Ventes (avec TVA 20%)
        $sales = [
            ['2026-02-18', $byName('Chaise%'), 20, 45],
            ['2026-04-05', $byName('Table buffet%'), 6, 180],
            ['2026-05-22', $byName('Micro%'), 2, 900],
        ];
        foreach ($sales as $i => [$d, $eq, $qty, $price]) {
            if (! $eq) continue;
            $ht = $qty * $price;
            $tax = round($ht * 0.20, 2);
            $sale = Vente::create([
                'proprietaire_id' => $ownerId, 'client_id' => $client->id, 'utilisateur_id' => $ownerId,
                'reference' => 'VTE-2026-00'.($i + 1), 'date_vente' => Carbon::parse($d),
                'sous_total' => $ht, 'taux_taxe' => 20, 'montant_taxe' => $tax, 'montant_total' => $ht + $tax,
            ]);
            $sale->lignes()->create(['materiel_id' => $eq->id, 'quantite' => $qty, 'prix_unitaire' => $price, 'sous_total' => $ht]);
            $eq->decrement('quantite', $qty);
        }

        // Dépenses
        $expenses = [
            ['2026-01-05', 'Loyer', 'Loyer dépôt janvier', 4500],
            ['2026-02-05', 'Loyer', 'Loyer dépôt février', 4500],
            ['2026-03-05', 'Loyer', 'Loyer dépôt mars', 4500],
            ['2026-03-20', 'Électricité', 'Facture ONEE T1', 1200],
            ['2026-04-01', 'Salaires', 'Salaires équipe', 18000],
            ['2026-05-10', 'Carburant', 'Livraisons', 900],
        ];
        $cashType = TypePaiement::where('proprietaire_id', $ownerId)->value('id');
        foreach ($expenses as [$d, $cat, $label, $amount]) {
            Depense::create([
                'proprietaire_id' => $ownerId, 'utilisateur_id' => $ownerId, 'type_paiement_id' => $cashType,
                'categorie' => $cat, 'libelle' => $label, 'montant' => $amount, 'date_depense' => Carbon::parse($d),
            ]);
        }

        // Locations passées (variété de statuts + paiements)
        $past = [
            ['2026-02-01', '2026-02-05', 'returned', $byName('Vidéoprojecteur%'), 1, 'full'],
            ['2026-03-10', '2026-03-12', 'returned', $byName('Sonorisation%'), 1, 'full'],
            ['2026-05-15', '2026-05-18', 'ongoing', $byName('Tente pliante%'), 2, 'partial'],
            ['2026-06-02', '2026-06-04', 'pending', $byName('Perforateur%'), 1, 'none'],
        ];
        foreach ($past as [$s, $e, $st, $eq, $qty, $pay]) {
            if (! $eq) {
                continue;
            }
            $days = Carbon::parse($s)->diffInDays(Carbon::parse($e)) + 1;
            $ht = $eq->prix_par_jour * $qty * $days;
            $tax = round($ht * 0.20, 2);
            $ttc = $ht + $tax;
            $rent = Location::create([
                'proprietaire_id' => $ownerId, 'utilisateur_id' => $client->id, 'employe_id' => $ownerId,
                'date_debut' => Carbon::parse($s), 'date_fin' => Carbon::parse($e),
                'statut' => $st, 'sous_total' => $ht, 'taux_taxe' => 20, 'montant_taxe' => $tax, 'montant_total' => $ttc,
                'date_retour' => $st === 'returned' ? Carbon::parse($e) : null,
            ]);
            $rent->lignes()->create(['materiel_id' => $eq->id, 'quantite' => $qty, 'prix_unitaire' => $eq->prix_par_jour, 'sous_total' => $ht]);
            if ($pay !== 'none') {
                $rent->paiements()->create([
                    'utilisateur_id' => $ownerId, 'type_paiement_id' => $cashType,
                    'montant' => $pay === 'partial' ? round($ttc / 3, 2) : $ttc,
                    'date_paiement' => Carbon::parse($e), 'note' => $pay === 'partial' ? 'Acompte' : 'Réglé',
                ]);
            }
        }
    }

    // Génère une image SVG de démonstration (dégradé par catégorie + nom).
    private function makeImage(int $ownerId, string $name, string $category): string
    {
        $palette = [
            'Informatique' => ['#0071e3', '#42a5f5'],
            'Audiovisuel' => ['#7c3aed', '#a78bfa'],
            'Événementiel' => ['#ff9500', '#ffcc00'],
            'Chantier' => ['#ff3b30', '#ff9f0a'],
        ];
        [$c1, $c2] = $palette[$category] ?? ['#6e6e73', '#aeaeb2'];
        $label = htmlspecialchars($name, ENT_QUOTES);
        // découpe le nom sur ~2 lignes
        $words = explode(' ', $label);
        $mid = (int) ceil(count($words) / 2);
        $line1 = implode(' ', array_slice($words, 0, $mid));
        $line2 = implode(' ', array_slice($words, $mid));

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{$c1}"/><stop offset="1" stop-color="{$c2}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#g)"/>
  <circle cx="400" cy="70" r="120" fill="rgba(255,255,255,0.10)"/>
  <circle cx="70" cy="320" r="90" fill="rgba(255,255,255,0.08)"/>
  <text x="40" y="300" font-family="Arial, sans-serif" font-size="13" fill="rgba(255,255,255,0.85)">{$category}</text>
  <text x="40" y="180" font-family="Arial, sans-serif" font-weight="bold" font-size="30" fill="#fff">{$line1}</text>
  <text x="40" y="218" font-family="Arial, sans-serif" font-weight="bold" font-size="30" fill="#fff">{$line2}</text>
</svg>
SVG;

        $path = 'materiels/demo-'.$ownerId.'-'.Str::slug($name).'.svg';
        Storage::disk('public')->put($path, $svg);

        return $path;
    }
}
