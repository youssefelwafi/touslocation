# TousLocation — Système de Gestion de Location de Matériel

> Application web moderne pour la gestion complète de la location de matériel
> (informatique, chantier, événementiel, audiovisuel, etc.).
> Stack : **Laravel** (API REST) + **React.js** (interface) + **MySQL**.
> Bilingue **français / arabe (RTL)**, multi-entreprises. Nomenclature 100 % française.

---

## 🎯 En bref

LocaPro remplace les méthodes manuelles (papier, fichiers Excel) par une plateforme
centralisée qui gère les utilisateurs, le matériel, les locations, les contrats PDF,
les notifications et les statistiques.

| Couche          | Technologie | Rôle                       |
| --------------- | ----------- | -------------------------- |
| Frontend        | React.js    | Interface utilisateur      |
| Backend         | Laravel     | Logique métier & API REST  |
| Base de données | MySQL       | Stockage des données       |

---

## 📚 Documentation

La documentation complète se trouve dans le dossier [`docs/`](docs/) :

| #  | Document | Contenu |
| -- | -------- | ------- |
| 01 | [Présentation du projet](docs/01-presentation.md) | Contexte, problématique, objectifs |
| 02 | [Fonctionnalités](docs/02-fonctionnalites.md) | Description détaillée des modules |
| 03 | [Stack technique](docs/03-stack-technique.md) | Technologies, versions, librairies |
| 04 | [Architecture](docs/04-architecture.md) | Schéma global, frontend/backend, flux |
| 05 | [Modèle de données](docs/05-modele-donnees.md) | Entités, relations, schéma SQL |
| 06 | [API REST](docs/06-api-endpoints.md) | Endpoints, requêtes, réponses |
| 07 | [Rôles & permissions](docs/07-roles-permissions.md) | Admin, employé, client |
| 08 | [Installation](docs/08-installation.md) | Mise en place de l'environnement |
| 09 | [Planning](docs/09-planning.md) | Sprints, jalons, livrables |

---

## 🚀 Démarrage rapide

### Windows — en un clic

Double-cliquez sur **`deploy-windows.bat`**. Le script installe les dépendances,
configure la base, charge les données de démo (avec images du matériel) et lance
l'application sur <http://localhost:5173>.
Détails et options : [DEPLOIEMENT-WINDOWS.md](DEPLOIEMENT-WINDOWS.md).

Comptes de démo (mot de passe `1234567890`) : `admin@touslocations.com`,
`manager@touslocations.com`, `employe@touslocations.com`, `client@touslocations.com`.

### Manuel (Linux / macOS / Windows)

```bash
# Backend (Laravel)
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend (React)
cd frontend
npm install
npm run dev
```

Déploiement VPS Linux (nginx) : dossier [`deploy/`](deploy/).

---

## 👥 Rôles

- **Administrateur** — contrôle total : utilisateurs, matériel, locations, statistiques.
- **Employé** — gestion opérationnelle : locations, retours, contrats.
- **Client** — consultation du catalogue, demandes de réservation, historique.

---

## 📄 Licence

Projet de Fin d'Études — usage académique.
