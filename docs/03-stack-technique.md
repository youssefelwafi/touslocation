# 3. Stack technique

## 3.1 Vue d'ensemble

| Couche | Technologie | Rôle |
| ------ | ----------- | ---- |
| Frontend | React.js | Interface utilisateur (SPA) |
| Backend | Laravel | Logique métier & API REST |
| Base de données | MySQL | Stockage des données |

---

## 3.2 Backend — Laravel

| Élément | Choix | Version conseillée |
| ------- | ----- | ------------------ |
| Framework | Laravel | 11.x |
| Langage | PHP | 8.2+ |
| API | REST (JSON) | — |
| Authentification | Laravel Sanctum | 4.x |
| Génération PDF | barryvdh/laravel-dompdf | 3.x |
| Permissions/rôles | spatie/laravel-permission | 6.x |
| Notifications | Laravel Notifications + Mail | — |
| Tâches planifiées | Laravel Scheduler / Queue | — |
| Tests | PHPUnit / Pest | — |

### Pourquoi Laravel ?
- Écosystème mature, ORM **Eloquent** expressif.
- Sécurité intégrée (CSRF, hachage, validation).
- Sanctum pour une authentification API par token simple et robuste.
- Outils natifs pour migrations, seeders, notifications et tâches planifiées.

---

## 3.3 Frontend — React.js

| Élément | Choix | Version conseillée |
| ------- | ----- | ------------------ |
| Librairie UI | React | 18.x |
| Build tool | Vite | 5.x |
| Routing | React Router | 6.x |
| Requêtes HTTP | Axios | 1.x |
| Gestion d'état serveur | TanStack Query (React Query) | 5.x |
| Formulaires | React Hook Form | 7.x |
| UI / Styles | Tailwind CSS | 3.x |
| Graphiques | Recharts | 2.x |
| Notifications UI | react-hot-toast | — |

### Pourquoi React ?
- Composants réutilisables, écosystème riche.
- Excellent pour une **Single Page Application** réactive.
- Vite offre un démarrage et un rechargement à chaud très rapides.

---

## 3.4 Base de données — MySQL

- Moteur **InnoDB** (transactions, clés étrangères).
- Migrations versionnées via Laravel.
- Index sur les colonnes de recherche et clés étrangères.
- Encodage `utf8mb4`.

---

## 3.5 Outils & environnement

| Catégorie | Outil |
| --------- | ----- |
| Gestion de version | Git + GitHub |
| Gestionnaire de dépendances PHP | Composer |
| Gestionnaire de paquets JS | npm |
| Environnement local | Laragon / XAMPP / Docker (option) |
| Test API | Postman / Insomnia |
| Éditeur | VS Code |
| CI (option) | GitHub Actions |

---

## 3.6 Architecture de communication

```
┌──────────────┐    HTTP/JSON (REST)    ┌──────────────┐    SQL    ┌──────────┐
│   React SPA  │  ────────────────────► │   Laravel    │  ──────►  │  MySQL   │
│  (Frontend)  │  ◄──────────────────── │   API REST   │  ◄──────  │   (DB)   │
└──────────────┘   Token (Sanctum)      └──────────────┘           └──────────┘
```

Le frontend et le backend sont **découplés** : React consomme l'API Laravel via Axios,
l'authentification se fait par token Bearer (Sanctum).

---

⬅️ Précédent : [02 — Fonctionnalités](02-fonctionnalites.md) · ➡️ Suite : [04 — Architecture](04-architecture.md)
