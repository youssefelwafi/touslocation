# 8. Installation & mise en place

## 8.1 Prérequis

| Outil | Version minimale |
| ----- | ---------------- |
| PHP | 8.2+ |
| Composer | 2.x |
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0+ |
| Git | — |

Environnement local conseillé sous Windows : **Laragon** ou **XAMPP**.

---

## 8.2 Structure du dépôt

```
locapro/
├── backend/     # Application Laravel (API)
├── frontend/    # Application React (Vite)
├── docs/        # Documentation du projet
└── README.md
```

---

## 8.3 Installation du backend (Laravel)

```bash
cd backend

# 1. Dépendances PHP
composer install

# 2. Fichier d'environnement
cp .env.example .env
php artisan key:generate

# 3. Configurer la base dans .env
#    DB_DATABASE=locapro
#    DB_USERNAME=root
#    DB_PASSWORD=

# 4. Migrations + données de démonstration
php artisan migrate --seed

# 5. Lien de stockage (images, PDF)
php artisan storage:link

# 6. Lancer le serveur
php artisan serve   # http://127.0.0.1:8000
```

**Extrait `.env` :**
```env
APP_NAME=LocaPro
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=locapro
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
```

---

## 8.4 Installation du frontend (React)

```bash
cd frontend

# 1. Dépendances JS
npm install

# 2. Fichier d'environnement
cp .env.example .env
#    VITE_API_URL=http://127.0.0.1:8000/api

# 3. Lancer le serveur de développement
npm run dev   # http://localhost:5173
```

**`.env` frontend :**
```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## 8.5 Comptes de démonstration (seeders)

| Rôle | Email | Mot de passe |
| ---- | ----- | ------------ |
| Administrateur | admin@touslocations.com | 1234567890 |
| Employé | employe@touslocations.com | 1234567890 |
| Client | client@touslocations.com | 1234567890 |

---

## 8.6 Tâches planifiées (notifications)

Pour activer les rappels automatiques de retour :

```bash
# En développement
php artisan schedule:work

# En production (cron Linux)
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 8.7 Commandes utiles

```bash
# Backend
php artisan migrate:fresh --seed   # Réinitialiser la base
php artisan test                   # Lancer les tests
php artisan route:list             # Lister les routes

# Frontend
npm run build                      # Build de production
npm run lint                       # Vérifier le code
```

---

## 8.8 Dépannage rapide

| Problème | Solution |
| -------- | -------- |
| Erreur CORS | Vérifier `config/cors.php` et `FRONTEND_URL` |
| 401 sur les requêtes | Vérifier le token et `SANCTUM_STATEFUL_DOMAINS` |
| Images/PDF introuvables | Exécuter `php artisan storage:link` |
| Migrations en échec | Vérifier les identifiants MySQL dans `.env` |

---

⬅️ Précédent : [07 — Rôles & permissions](07-roles-permissions.md) · ➡️ Suite : [09 — Planning](09-planning.md)
