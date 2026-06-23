# 6. API REST

L'API Laravel expose des endpoints JSON consommés par le frontend React.
Base URL : `/api`. Authentification : **Bearer Token** (Laravel Sanctum).

---

## 6.1 Conventions

- Format : **JSON** en entrée et en sortie.
- En-tête d'authentification : `Authorization: Bearer {token}`.
- Codes de statut : `200` OK, `201` créé, `401` non authentifié, `403` interdit,
  `404` introuvable, `422` validation échouée.
- Pagination : `?page=1&per_page=15`.

---

## 6.2 Authentification

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| POST | `/api/register` | Inscription d'un client | Public |
| POST | `/api/login` | Connexion → retourne un token | Public |
| POST | `/api/logout` | Déconnexion (révoque le token) | Authentifié |
| GET | `/api/me` | Profil de l'utilisateur connecté | Authentifié |

**Exemple — `POST /api/login`**
```json
// Requête
{ "email": "admin@touslocations.com", "password": "1234567890" }

// Réponse 200
{
  "token": "1|aBcD...XyZ",
  "user": { "id": 1, "name": "Admin", "role": "admin" }
}
```

---

## 6.3 Utilisateurs

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/users` | Liste des utilisateurs | Admin |
| POST | `/api/users` | Créer un utilisateur | Admin |
| GET | `/api/users/{id}` | Détail | Admin |
| PUT | `/api/users/{id}` | Modifier | Admin |
| DELETE | `/api/users/{id}` | Supprimer | Admin |

---

## 6.4 Catégories

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/categories` | Liste | Authentifié |
| POST | `/api/categories` | Créer | Admin / Employé |
| PUT | `/api/categories/{id}` | Modifier | Admin / Employé |
| DELETE | `/api/categories/{id}` | Supprimer | Admin |

---

## 6.5 Matériel (equipments)

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/equipments` | Liste + filtres (`?category_id=&status=&search=`) | Authentifié |
| POST | `/api/equipments` | Ajouter | Admin / Employé |
| GET | `/api/equipments/{id}` | Détail | Authentifié |
| PUT | `/api/equipments/{id}` | Modifier | Admin / Employé |
| DELETE | `/api/equipments/{id}` | Supprimer | Admin |
| GET | `/api/equipments/{id}/availability` | Disponibilité sur une période (`?from=&to=`) | Authentifié |

**Exemple — `POST /api/equipments`**
```json
{
  "category_id": 2,
  "name": "Vidéoprojecteur Epson EB-X05",
  "description": "3300 lumens, HDMI",
  "price_per_day": 25.00,
  "quantity": 5,
  "status": "available"
}
```

---

## 6.6 Locations (rentals)

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/rentals` | Liste (filtrée par rôle) | Authentifié |
| POST | `/api/rentals` | Créer une réservation | Client / Employé |
| GET | `/api/rentals/{id}` | Détail | Propriétaire / Staff |
| PUT | `/api/rentals/{id}/confirm` | Confirmer | Admin / Employé |
| PUT | `/api/rentals/{id}/return` | Enregistrer le retour | Admin / Employé |
| PUT | `/api/rentals/{id}/cancel` | Annuler | Propriétaire / Staff |

**Exemple — `POST /api/rentals`**
```json
{
  "start_date": "2026-06-10",
  "end_date": "2026-06-14",
  "items": [
    { "equipment_id": 12, "quantity": 2 },
    { "equipment_id": 7,  "quantity": 1 }
  ]
}
```

---

## 6.7 Contrats

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| POST | `/api/rentals/{id}/contract` | Générer le contrat PDF | Admin / Employé |
| GET | `/api/rentals/{id}/contract` | Télécharger le PDF | Propriétaire / Staff |

---

## 6.8 Notifications

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/notifications` | Mes notifications | Authentifié |
| PUT | `/api/notifications/{id}/read` | Marquer comme lue | Authentifié |

---

## 6.9 Tableau de bord

| Méthode | Endpoint | Description | Accès |
| ------- | -------- | ----------- | ----- |
| GET | `/api/dashboard/stats` | KPI globaux (revenus, locations, occupation) | Admin / Employé |
| GET | `/api/dashboard/revenue?period=month` | Revenus par période | Admin |
| GET | `/api/dashboard/top-equipments` | Matériel le plus loué | Admin / Employé |

**Exemple — réponse `GET /api/dashboard/stats`**
```json
{
  "total_revenue": 12450.00,
  "active_rentals": 8,
  "total_equipments": 64,
  "available_equipments": 41,
  "rentals_by_status": { "pending": 3, "ongoing": 8, "returned": 120 }
}
```

---

⬅️ Précédent : [05 — Modèle de données](05-modele-donnees.md) · ➡️ Suite : [07 — Rôles & permissions](07-roles-permissions.md)
