# TousLocation — API (Backend Laravel)

API REST de l'application **TousLocation** (gestion et location de matériel).

- **Framework** : Laravel 13 (PHP 8.3)
- **Base de données** : MySQL / MariaDB
- **Authentification** : Laravel Sanctum (jetons Bearer)
- **PDF** : barryvdh/laravel-dompdf (factures, reçus)

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
# Configurer la base dans .env (DB_DATABASE, DB_USERNAME, DB_PASSWORD)
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```

## Boutiques de démonstration

```bash
php artisan demo:makita        # catalogue Makita
php artisan demo:transpalette  # catalogue manutention
```

Comptes de démonstration (mot de passe `1234567890`) : `admin@touslocations.com`,
`manager@touslocations.com`, `client@touslocations.com`.

> Le frontend (React / Vite) se trouve dans le dossier `../frontend`.
> Déploiement Windows en un clic : voir `../DEPLOIEMENT-WINDOWS.md`.
