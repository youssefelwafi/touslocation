# 10. Schéma de la base de données (TousLocation)

Ce document présente la structure complète de la base de données de l'application
**TousLocation**, sous forme de diagramme entité-association (Mermaid), suivi d'un
explicatif en français.

---

## 10.1 Diagramme ER (Mermaid)

Le diagramme entité-association est maintenu dans un **fichier séparé** :
👉 [`database-schema.mmd`](database-schema.mmd)

> 💡 Pour le visualiser : ouvrez `database-schema.mmd` dans VS Code (extension
> *Mermaid Preview*), sur GitHub (rendu automatique), ou collez son contenu dans
> [mermaid.live](https://mermaid.live).

---

## 10.2 Explicatif (français)

### Architecture multi-tenant (multi-espaces)

La base est conçue en **multi-tenant** : chaque **manager** dispose de son propre espace
de travail totalement isolé. Cela repose sur la colonne **`owner_id`** présente sur la
plupart des tables (catégories, marques, unités, devises, TVA, types de paiement,
fournisseurs, matériel, locations, ventes, achats, dépenses, ajustements).

- `owner_id` pointe vers l'utilisateur **manager** propriétaire des données.
- Le **super-admin** (`role = admin`) n'est pas filtré : il voit toutes les données.
- Les **employés** et **clients** appartiennent à un manager via `users.owner_id`.

La table `users` est donc **auto-référente** : un utilisateur (employé/client) peut
avoir un `owner_id` qui désigne son manager.

### Les grands groupes de tables

| Groupe | Tables | Rôle |
| ------ | ------ | ---- |
| **Utilisateurs** | `users` | Comptes : admin, manager, employé, client (rôle + tenant) |
| **Référentiels** | `categories`, `brands`, `units`, `currencies`, `taxes`, `payment_types`, `suppliers` | Données de paramétrage propres à chaque espace |
| **Inventaire** | `equipments` | Catalogue du matériel (capacité, prix/jour, image, battement) |
| **Locations** | `rentals`, `rental_items`, `contracts`, `payments` | Cœur métier : réservations, lignes, contrats PDF, paiements partiels |
| **Approvisionnement** | `purchases`, `purchase_items` | Achats qui **alimentent** le stock |
| **Ventes** | `sales`, `sale_items` | Ventes qui **retirent** du stock |
| **Ajustements** | `stock_adjustments` | Corrections de stock (entrée/sortie) valorisées |
| **Dépenses** | `expenses` | Charges (loyer, salaires, électricité…) |

### Relations clés

- **Matériel** : un `equipment` appartient à une `category`, une `brand`, une `unit`
  et une `currency` (toutes facultatives sauf la catégorie).
- **Location** : une `rental` est liée à un **client** (`user_id`) et à un **employé**
  (`employee_id`). Elle contient plusieurs `rental_items` (chaque ligne référence un
  `equipment`), possède au plus **un** `contract` (relation 1-1) et plusieurs
  `payments` (acomptes / règlements).
- **Achat** : une `purchase` provient d'un `supplier` et contient des `purchase_items`.
  Au statut **`received`**, les quantités sont **ajoutées** à `equipments.quantity`.
- **Vente** : une `sale` contient des `sale_items` ; elle **décrémente** le stock.
- **Ajustement** : chaque `stock_adjustment` enregistre l'état du stock avant/après et
  une **valorisation** (`unit_value` ≈ dernier prix d'achat).

### Règles métier importantes

1. **Disponibilité = capacité − réservations concurrentes − battement.**
   Le champ `equipments.quantity` représente la **capacité totale** ; la disponibilité
   réelle sur une période est calculée à partir des `rental_items` actifs (statuts
   *pending / confirmed / ongoing*) plus les `buffer_days` (délai d'indisponibilité
   après retour, ex. nettoyage).
2. **TVA configurable.** Le taux par défaut provient de `taxes` (Maroc : 20 % standard,
   14 %, 10 %, 0 %). Chaque `rental` / `sale` **fige** son `tax_rate` au moment de la
   création → `total_amount` = `subtotal` (HT) + `tax_amount` (TTC).
3. **Paiements partiels.** `payments.amount` cumulés donnent le payé ; le reste à payer
   et le statut (*unpaid / partial / paid*) sont calculés (attributs dérivés).
4. **Multi-devises.** Une seule devise `is_default = true` par tenant (idem pour `taxes`).
5. **Suppression sécurisée.** Supprimer une vente **restitue** le stock ; supprimer un
   achat réceptionné **retire** le stock ; un référentiel utilisé (catégorie, devise…)
   ne peut pas être supprimé.

### Authentification

L'API utilise **Laravel Sanctum** : la table `personal_access_tokens` (non représentée
ci-dessus) stocke les jetons d'accès Bearer associés aux utilisateurs.

---

⬅️ Précédent : [09 — Planning](09-planning.md) · 🏠 [README](../README.md)
