# 5. Modèle de données

## 5.1 Diagramme entité-association (résumé)

```
┌──────────────┐        ┌───────────────┐        ┌──────────────────┐
│    users     │        │  categories   │        │    equipments    │
│──────────────│        │───────────────│        │──────────────────│
│ id           │        │ id            │1      *│ id               │
│ name         │        │ name          │───────►│ category_id (FK) │
│ email        │        │ description   │        │ name             │
│ password     │        └───────────────┘        │ description      │
│ role         │                                 │ price_per_day    │
│ phone        │                                 │ quantity         │
│ status       │                                 │ status           │
└──────┬───────┘                                 │ image            │
       │1                                        └────────┬─────────┘
       │                                                  │1
       │*                                                 │
┌──────▼────────────┐                                     │*
│     rentals       │        ┌────────────────────┐       │
│───────────────────│       *│   rental_items     │*      │
│ id                │1──────►│────────────────────│◄──────┘
│ user_id (FK)      │        │ id                 │
│ employee_id (FK)  │        │ rental_id (FK)     │
│ start_date        │        │ equipment_id (FK)  │
│ end_date          │        │ quantity           │
│ status            │        │ unit_price         │
│ total_amount      │        │ subtotal           │
│ created_at        │        └────────────────────┘
└──────┬────────────┘
       │1
       │1
┌──────▼────────────┐        ┌────────────────────┐
│    contracts      │        │   notifications    │
│───────────────────│        │────────────────────│
│ id                │        │ id                 │
│ rental_id (FK)    │        │ user_id (FK)       │
│ contract_number   │        │ type               │
│ pdf_path          │        │ message            │
│ generated_at      │        │ read_at            │
└───────────────────┘        └────────────────────┘
```

---

## 5.2 Description des tables

### `users`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| name | VARCHAR | Nom complet |
| email | VARCHAR UNIQUE | Email (login) |
| password | VARCHAR | Mot de passe haché |
| role | ENUM(admin, employee, client) | Rôle |
| phone | VARCHAR NULL | Téléphone |
| status | ENUM(active, inactive) | Statut du compte |
| timestamps | — | created_at / updated_at |

### `categories`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| name | VARCHAR | Nom de la catégorie |
| description | TEXT NULL | Description |

### `equipments`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| category_id | BIGINT FK → categories | Catégorie |
| name | VARCHAR | Nom du matériel |
| description | TEXT NULL | Description |
| price_per_day | DECIMAL(10,2) | Prix de location par jour |
| quantity | INT | Quantité en stock |
| status | ENUM(available, maintenance, inactive) | État |
| image | VARCHAR NULL | Chemin de l'image |

### `rentals`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| user_id | BIGINT FK → users | Client |
| employee_id | BIGINT FK → users NULL | Employé gérant la location |
| start_date | DATE | Début de location |
| end_date | DATE | Fin prévue |
| return_date | DATE NULL | Date de retour réelle |
| status | ENUM(pending, confirmed, ongoing, returned, cancelled) | Statut |
| total_amount | DECIMAL(10,2) | Montant total |

### `rental_items` (table pivot enrichie)
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| rental_id | BIGINT FK → rentals | Location |
| equipment_id | BIGINT FK → equipments | Matériel loué |
| quantity | INT | Quantité louée |
| unit_price | DECIMAL(10,2) | Prix/jour au moment de la location |
| subtotal | DECIMAL(10,2) | Sous-total ligne |

### `contracts`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| rental_id | BIGINT FK → rentals | Location associée |
| contract_number | VARCHAR UNIQUE | Numéro de contrat |
| pdf_path | VARCHAR | Chemin du PDF généré |
| generated_at | TIMESTAMP | Date de génération |

### `notifications`
| Colonne | Type | Description |
| ------- | ---- | ----------- |
| id | BIGINT PK | Identifiant |
| user_id | BIGINT FK → users | Destinataire |
| type | VARCHAR | Type (confirmation, reminder, late…) |
| message | TEXT | Contenu |
| read_at | TIMESTAMP NULL | Date de lecture |

---

## 5.3 Relations (Eloquent)

| Relation | Type |
| -------- | ---- |
| User → rentals (en tant que client) | hasMany |
| User → managedRentals (en tant qu'employé) | hasMany |
| Category → equipments | hasMany |
| Equipment → category | belongsTo |
| Rental → user (client) | belongsTo |
| Rental → items (rental_items) | hasMany |
| Rental → contract | hasOne |
| RentalItem → equipment | belongsTo |
| Contract → rental | belongsTo |
| User → notifications | hasMany |

---

## 5.4 Règles d'intégrité

- Une location ne peut être confirmée que si la **quantité disponible** du matériel
  est suffisante sur la période demandée.
- `total_amount` = Σ des `subtotal` × nombre de jours.
- Le retour met à jour `return_date`, le `status`, et **réincrémente** le stock.
- Un contrat est généré **une seule fois** par location (relation `hasOne`).

---

⬅️ Précédent : [04 — Architecture](04-architecture.md) · ➡️ Suite : [06 — API REST](06-api-endpoints.md)
