# Contrat frontend — renommage français

Le backend est DÉJÀ renommé en français (tables, colonnes, modèles, relations, routes API).
Ce document fige le contrat que le frontend React doit suivre. Compléter avec `NOMENCLATURE-FR.md`.

> **Règle de sécurité** : en cas de doute sur une clé JSON renvoyée par un endpoint « sur-mesure »
> (tableau de bord, rapports, disponibilité, boutiques, auth), **lire le contrôleur backend correspondant**
> dans `backend/app/Http/Controllers/` pour utiliser EXACTEMENT les clés qu'il renvoie.

## 1. Endpoints API (axios) — anglais → français
| Avant | Après |
|---|---|
| /login | /connexion |
| /logout | /deconnexion |
| /register | /inscription |
| /register-manager | /inscription-gerant |
| /register-client | /inscription-client |
| /me | /profil |
| /shops, /shop/{id} *(API)* | /boutiques, /boutiques/{id} |
| /users | /utilisateurs |
| /modules | /modules *(inchangé)* |
| /employees | /employes |
| /clients | /clients *(inchangé)* |
| /categories | /categories *(inchangé)* |
| /brands | /marques |
| /suppliers | /fournisseurs |
| /purchases | /achats |
| /purchases/{id}/receive | /achats/{id}/receptionner |
| /purchases/{id}/payments | /achats/{id}/paiements |
| /purchase-payments/{id} | /paiements-achat/{id} |
| /sales | /ventes |
| /expenses | /depenses |
| /adjustments | /ajustements |
| /taxes | /taxes *(inchangé)* |
| /payment-types | /types-paiement |
| /currencies | /devises |
| /units | /unites |
| /equipments | /materiels |
| /equipments-availability | /materiels-disponibilite |
| /equipments/{id}/availability | /materiels/{id}/disponibilite |
| /rentals | /locations |
| /rentals/{id}/confirm,return,cancel | /locations/{id}/confirmer,retour,annuler |
| /rentals/{id}/payments | /locations/{id}/paiements |
| /payments/{id} | /paiements/{id} |
| /rentals/{id}/invoice | /locations/{id}/facture |
| /reports/profit | /rapports/benefice |
| /reports/rentals | /rapports/locations |
| /dashboard/stats | /tableau-de-bord/stats |

## 2. Champs JSON des modèles (lecture des réponses) — anglais → français
`name`→`nom`, `phone`→`telephone`, `address`→`adresse`, `status`→`statut`,
`price_per_day`→`prix_par_jour`, `quantity`→`quantite`, `total_amount`→`montant_total`,
`subtotal`→`sous_total`, `tax_rate`→`taux_taxe`, `tax_amount`→`montant_taxe`,
`unit_price`→`prix_unitaire`, `unit_cost`→`cout_unitaire`, `amount`→`montant`,
`start_date`→`date_debut`, `end_date`→`date_fin`, `return_date`→`date_retour`,
`purchase_date`→`date_achat`, `sale_date`→`date_vente`, `expense_date`→`date_depense`,
`paid_at`→`date_paiement`, `buffer_days`→`jours_tampon`, `buffer_note`→`note_tampon`,
`reason`→`motif`, `label`→`libelle`, `method`→`mode`, `symbol`→`symbole`, `rate`→`taux`,
`exchange_rate`→`taux_change`, `is_default`→`par_defaut`, `is_active`→`actif`,
`quantity_before`→`quantite_avant`, `quantity_after`→`quantite_apres`,
`unit_value`→`valeur_unitaire`, `total_value`→`valeur_totale`.

### Relations imbriquées (accès objet)
`.category`→`.categorie`, `.brand`→`.marque`, `.unit`→`.unite`, `.currency`→`.devise`,
`.supplier`→`.fournisseur`, `.equipment`→`.materiel`, `.items`→`.lignes`,
`.payments`→`.paiements`, `.paymentType`→`.typePaiement`, `.user`→`.utilisateur`,
`.employee`→`.employe`, `.client`→`.client` *(inchangé)*, `.rental`→`.location`.

### Attributs calculés
`.paid_amount`→`.montant_paye`, `.remaining_amount`→`.montant_restant`,
`.payment_status`→`.statut_paiement`, `.image_url`→`.url_image`.

### FK dans les payloads POST/PUT
`owner_id`→`proprietaire_id`, `user_id`→`utilisateur_id`, `employee_id`→`employe_id`,
`category_id`→`categorie_id`, `brand_id`→`marque_id`, `unit_id`→`unite_id`,
`currency_id`→`devise_id`, `supplier_id`→`fournisseur_id`, `equipment_id`→`materiel_id`,
`rental_id`→`location_id`, `purchase_id`→`achat_id`, `sale_id`→`vente_id`,
`payment_type_id`→`type_paiement_id`, `client_id`→`client_id` *(inchangé)*.

## 3. À CONSERVER (ne pas traduire)
- **Valeurs d'énum / statuts** lues ou comparées : `'pending'`, `'confirmed'`, `'ongoing'`, `'returned'`, `'cancelled'`, `'received'`, `'available'`, `'maintenance'`, `'inactive'`, `'active'`, `'in'`, `'out'`, `'unpaid'`, `'partial'`, `'paid'`, rôles `'admin'`/`'manager'`/`'employee'`/`'client'`. (Le badge/texte reste affiché via i18n.)
- **Clés d'enveloppe d'auth** renvoyées par le backend : `data.token`, `data.user` (vérifier dans `AuthController`). L'objet `user` a maintenant des champs FR : `user.nom`, `user.role`, `user.telephone`, `user.statut`, `user.permissions`.
- **Clés JSON sur-mesure** encore en anglais côté backend (tableau de bord, rapports, disponibilité, alias `withCount`) : les LIRE dans le contrôleur et matcher tel quel. Ex. RapportController renvoie `revenue/cost/profit/monthly/by_status/top_equipments` ; TableauBordController renvoie ses clés de stats ; l'alias `rentals_count` reste en l'état. **Ne pas inventer de clés françaises non renvoyées par le backend.**
- **Clés de traduction i18n** (ex. `t("rentals.create")`, `t("nav.materials")`) : INCHANGÉES.

## 4. Routes React Router (chemins navigateur) — anglais → français
| Avant | Après |
|---|---|
| /login | /connexion |
| /register | /inscription |
| /register-client | /inscription-client |
| /shops | /boutiques |
| /shop/:id | /boutique/:id |
| /store *(client)* | /magasin |
| /my-rentals *(client)* | /mes-locations |
| /dashboard | /tableau-de-bord |
| /equipments | /materiels |
| /rentals | /locations |
| /clients | /clients *(inchangé)* |
| /suppliers | /fournisseurs |
| /purchases | /achats |
| /sales | /ventes |
| /expenses | /depenses |
| /adjustments | /ajustements |
| /reports | /rapports |
| /settings | /parametres |
| /employees | /employes |
| /users | /utilisateurs |
| / *(landing)* | / *(inchangé)* |

Mettre à jour TOUTES les occurrences : `<Route path>`, `<Link to>`, `useNavigate()(...)`,
`<Navigate to>`, et `homeFor()` (`/store`→`/magasin`, `/dashboard`→`/tableau-de-bord`).

## 5. Clés de module (permissions employé) — valeurs DATA, à traduire
`materials`→`materiels`, `rentals`→`locations`, `clients`→`clients`, `suppliers`→`fournisseurs`,
`purchases`→`achats`, `sales`→`ventes`, `expenses`→`depenses`, `adjustments`→`ajustements`,
`reports`→`rapports`, `settings`→`parametres`.
- Dans `App.jsx` `NAV[].mod`, dans `hasModule(user, key)`, dans la page Employees (cases à cocher) et partout où une clé de module est comparée/envoyée.
- **Exception i18n** : le bloc `mod: { ... }` de `i18n.js` (FR et AR) doit être re-clé en clés FR (`mod.materiels`, `mod.locations`, …) pour rester aligné avec `/modules`. C'est la SEULE retouche de clés i18n autorisée.
