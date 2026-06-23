# Nomenclature française — référentiel unique

Ce document est la **source de vérité** pour le renommage français du projet TousLocation.
Tout identifiant (table, colonne, classe, relation, route, variable) suit STRICTEMENT ce mapping.

## Exceptions volontairement conservées en anglais
Ces identifiants sont couplés au framework Laravel / standards techniques et restent inchangés :

- **Tables d'infrastructure** : `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `sessions`, `password_reset_tokens`, `personal_access_tokens`.
- **Colonnes couplées au framework** : `email`, `password`, `remember_token`, `email_verified_at`, `created_at`, `updated_at`, `id`.
- **Valeurs d'énumération (codes de statut stockés)** : `pending`, `confirmed`, `ongoing`, `returned`, `cancelled`, `received`, `available`, `maintenance`, `inactive`, `active`, `in`, `out`, `unpaid`, `partial`, `paid`, et les rôles `admin`, `manager`, `employee`, `client`. (L'affichage est déjà en français via i18n.)
- **Clés de traduction i18n** (ex. `t("rentals.create")`) : identifiants internes, la sortie est déjà française.

---

## 1. Tables (anglais → français)
| Anglais | Français |
|---|---|
| users | utilisateurs |
| categories | categories *(inchangé)* |
| equipments | materiels |
| brands | marques |
| units | unites |
| currencies | devises |
| taxes | taxes *(inchangé)* |
| payment_types | types_paiement |
| suppliers | fournisseurs |
| rentals | locations |
| rental_items | lignes_location |
| contracts | contrats |
| payments | paiements |
| purchases | achats |
| purchase_items | lignes_achat |
| purchase_payments | paiements_achat |
| sales | ventes |
| sale_items | lignes_vente |
| stock_adjustments | ajustements_stock |
| expenses | depenses |

## 2. Colonnes (anglais → français) — appliquer partout
| Anglais | Français |
|---|---|
| name | nom |
| phone | telephone |
| address | adresse |
| reason | motif |
| label | libelle |
| category *(colonne string sur depenses)* | categorie |
| amount | montant |
| quantity | quantite |
| subtotal | sous_total |
| total_amount | montant_total |
| unit_price | prix_unitaire |
| unit_cost | cout_unitaire |
| price_per_day | prix_par_jour |
| tax_rate | taux_taxe |
| tax_amount | montant_taxe |
| rate | taux |
| is_default | par_defaut |
| is_active | actif |
| exchange_rate | taux_change |
| symbol | symbole |
| method *(paiements)* | mode |
| buffer_days | jours_tampon |
| buffer_note | note_tampon |
| quantity_before | quantite_avant |
| quantity_after | quantite_apres |
| unit_value | valeur_unitaire |
| total_value | valeur_totale |
| contract_number | numero_contrat |
| pdf_path | chemin_pdf |
| status | statut |
| start_date | date_debut |
| end_date | date_fin |
| return_date | date_retour |
| paid_at | date_paiement |
| purchase_date | date_achat |
| sale_date | date_vente |
| expense_date | date_depense |
| generated_at | date_generation |

Inchangées : `description`, `note`, `reference`, `code`, `image`, `type`, `role`, `permissions`, `email`, `password`.

### Clés étrangères (FK)
| Anglais | Français |
|---|---|
| owner_id | proprietaire_id |
| user_id | utilisateur_id |
| employee_id | employe_id |
| client_id | client_id *(inchangé)* |
| category_id | categorie_id |
| brand_id | marque_id |
| unit_id | unite_id |
| currency_id | devise_id |
| supplier_id | fournisseur_id |
| equipment_id | materiel_id |
| rental_id | location_id |
| purchase_id | achat_id |
| sale_id | vente_id |
| payment_type_id | type_paiement_id |

> Toutes les `->constrained('users')` deviennent `->constrained('utilisateurs')`, `constrained('equipments')` → `constrained('materiels')`, etc. Quand le nom de table ne se déduit pas du nom de colonne, préciser explicitement (ex. `foreignId('proprietaire_id')->constrained('utilisateurs')`).

## 3. Modèles Eloquent (classe → classe) + `$table`
| Classe anglaise | Classe française | $table |
|---|---|---|
| User | Utilisateur | utilisateurs |
| Category | Categorie | categories |
| Equipment | Materiel | materiels |
| Brand | Marque | marques |
| Unit | Unite | unites |
| Currency | Devise | devises |
| Tax | Taxe | taxes |
| PaymentType | TypePaiement | types_paiement |
| Supplier | Fournisseur | fournisseurs |
| Rental | Location | locations |
| RentalItem | LigneLocation | lignes_location |
| Contract | Contrat | contrats |
| Payment | Paiement | paiements |
| Purchase | Achat | achats |
| PurchaseItem | LigneAchat | lignes_achat |
| PurchasePayment | PaiementAchat | paiements_achat |
| Sale | Vente | ventes |
| SaleItem | LigneVente | lignes_vente |
| StockAdjustment | AjustementStock | ajustements_stock |
| Expense | Depense | depenses |

> **Chaque modèle reçoit un `protected $table = '<table_fr>';` explicite** (la pluralisation Laravel est anglaise).
> Le fichier est rencommé pour correspondre à la classe (PSR-4) : `Equipment.php` → `Materiel.php`, etc. Créer le nouveau fichier, supprimer l'ancien.

### Modèle Utilisateur — cas particuliers
- `protected $table = 'utilisateurs';`
- Constante des modules (clés) traduites :
  `const MODULES = ['materiels', 'locations', 'clients', 'fournisseurs', 'achats', 'ventes', 'depenses', 'ajustements', 'rapports', 'parametres'];`
- `config/auth.php` : `'model' => env('AUTH_MODEL', App\Models\Utilisateur::class)`.

## 4. Méthodes de relation (et accès JSON correspondant)
| Anglais | Français |
|---|---|
| user() | utilisateur() |
| owner() | proprietaire() |
| employee() | employe() |
| client() | client() *(inchangé)* |
| category() | categorie() |
| brand() | marque() |
| unit() | unite() |
| currency() | devise() |
| supplier() | fournisseur() |
| equipment() | materiel() |
| items() | lignes() |
| payments() | paiements() |
| paymentType() | typePaiement() |
| rental() | location() |
| rentals() | locations() |
| managedRentals() | locationsGerees() |
| ownedEquipments() | materielsPossedes() |
| contract() | contrat() |
| purchase() | achat() |
| sale() | vente() |
| tax() | taxe() |

## 5. Attributs calculés (`$appends` + accesseurs)
| Méthode anglaise | Méthode française | Clé `$appends` / JSON |
|---|---|---|
| paidAmount() | montantPaye() | montant_paye |
| remainingAmount() | montantRestant() | montant_restant |
| paymentStatus() | statutPaiement() | statut_paiement |
| imageUrl() | urlImage() | url_image |

> Les références internes suivent : `$this->paid_amount` → `$this->montant_paye`, `$this->total_amount` → `$this->montant_total`, etc.

## 6. Contrôleurs (classe / fichier)
Renommer la partie métier, garder le suffixe `Controller` :
| Anglais | Français |
|---|---|
| AuthController | AuthController *(inchangé — abréviation technique)* |
| UserController | UtilisateurController |
| EmployeeController | EmployeController |
| ClientController | ClientController |
| CategoryController | CategorieController |
| BrandController | MarqueController |
| UnitController | UniteController |
| CurrencyController | DeviseController |
| TaxController | TaxeController |
| PaymentTypeController | TypePaiementController |
| SupplierController | FournisseurController |
| EquipmentController | MaterielController |
| RentalController | LocationController |
| PaymentController | PaiementController |
| PurchaseController | AchatController |
| SaleController | VenteController |
| ExpenseController | DepenseController |
| AdjustmentController | AjustementController |
| ReportController | RapportController |
| InvoiceController | FactureController |
| ShopController | BoutiqueController |
| DashboardController | TableauBordController |

> Variables locales et paramètres de route-model-binding suivent le mapping : `$rental` → `$location`, `{rental}` → `{location}`, `$purchase` → `$achat`, etc.
> Les appels `requireModule($request, 'purchases')` utilisent les **clés FR** (`'achats'`, `'locations'`, …) — voir §3 MODULES.

### Identifiants à NE PAS renommer (conservés)
- **Méthodes REST + métier des contrôleurs** : `index`, `store`, `show`, `update`, `destroy`, `receive`, `confirm`, `return`, `cancel`, `availability`, `availabilityRange`, `profit`, `rentals`, `stats`, `download`, `storePayment`, `destroyPayment`, `register`, `registerManager`, `registerClient`, `login`, `logout`, `me` — INCHANGÉES (conventions internes ; le frontend appelle par URL, pas par nom de méthode).
- **Trait `TenantScoped`** : noms de méthodes `scopeToTenant`, `ownerId`, `ensureOwned`, `requireModule` INCHANGÉS (mais leur contenu utilise la colonne `proprietaire_id`).
- **Prédicats du modèle Utilisateur** : `isAdmin`, `isManager`, `isSuperAdmin`, `isStaff`, `isClient`, `hasModule`, `tenantId` INCHANGÉS.

> **Règle d'or** : ne renommer QUE les identifiants présents dans ce glossaire. Tout identifiant non listé reste inchangé.

## 7. Routes API (chemin → chemin)
| Anglais | Français |
|---|---|
| /login | /connexion |
| /logout | /deconnexion |
| /register | /inscription |
| /register-manager | /inscription-gerant |
| /register-client | /inscription-client |
| /me | /profil |
| /shops, /shops/{shop} | /boutiques, /boutiques/{boutique} |
| /users | /utilisateurs |
| /modules | /modules *(inchangé)* |
| /employees | /employes |
| /clients | /clients |
| /categories | /categories |
| /brands | /marques |
| /suppliers | /fournisseurs |
| /purchases | /achats |
| /purchase-payments/{payment} | /paiements-achat/{paiement} |
| /sales | /ventes |
| /expenses | /depenses |
| /adjustments | /ajustements |
| /taxes | /taxes |
| /payment-types | /types-paiement |
| /currencies | /devises |
| /units | /unites |
| /equipments | /materiels |
| /equipments-availability | /materiels-disponibilite |
| /rentals | /locations |
| /rentals/{rental}/confirm,return,cancel | /locations/{location}/confirmer,retour,annuler |
| /rentals/{rental}/payments | /locations/{location}/paiements |
| /payments/{payment} | /paiements/{paiement} |
| /rentals/{rental}/invoice | /locations/{location}/facture |
| /reports/profit | /rapports/benefice |
| /reports/rentals | /rapports/locations |
| /dashboard/stats | /tableau-de-bord/stats |

> **Noms de méthodes de contrôleur INCHANGÉS** (voir §6 « Identifiants à NE PAS renommer »). Seuls les **chemins** d'URL passent en français ; le contrôleur/méthode ciblé reste le même. Ex. `Route::put('/locations/{location}/confirmer', [LocationController::class, 'confirm'])`.

## 8. Frontend (React)
- **Endpoints axios** : suivent §7 (ex. `api.get("/rentals")` → `api.get("/locations")`).
- **Accès aux champs JSON** : suivent §2/§4/§5 (ex. `p.supplier?.name` → `p.fournisseur?.nom`, `eq.price_per_day` → `eq.prix_par_jour`, `r.total_amount` → `r.montant_total`, `eq.image_url` → `eq.url_image`, `p.payment_status` → `p.statut_paiement`, `x.equipment` → `x.materiel`).
- **Payloads POST/PUT** : clés FR (ex. `{ start_date, end_date }` → `{ date_debut, date_fin }`).
- **Variables JS de domaine** : traduites quand raisonnable (`rentals` → `locations`, `equipments` → `materiels`).
- **Routes React Router** (`/reports` → `/rapports`, `/rentals` → `/locations`, etc.) : suivre §7 sans le préfixe. Mettre à jour `<Link>`, `useNavigate`, redirections, et la barre latérale.
- **Clés de module** (permissions employé) : valeurs FR de §3 MODULES.
- **Clés i18n** : INCHANGÉES.
- `downloadInvoice` : `/rentals/${id}/invoice` → `/locations/${id}/facture`.

## 9. Vue Blade `invoice.blade.php`
Suivre §2/§4/§5 pour `$rental`/`$location` et ses relations (`location.utilisateur.nom`, `ligne.materiel`, `montant_total`, etc.). Le contrôleur passe désormais la variable `location`.

## 10. Seeder & TenantProvisioner
Suivre tout le mapping : noms de modèles, colonnes, clés MODULES dans `permissions`.
