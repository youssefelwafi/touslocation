# Déploiement de TousLocation sur un VPS

Assistant de déploiement **interactif** pour mettre l'application en ligne sur un
serveur Ubuntu (22.04 ou 24.04). Il installe les dépendances, crée la base, configure
Laravel, build le frontend React et publie le tout derrière **Nginx**.

---

## 1. Pré-requis

- Un VPS **Ubuntu 22.04 / 24.04** vierge, avec accès **root** (SSH).
- (Optionnel) Un **nom de domaine** pointant (enregistrement A) vers l'IP du VPS,
  si vous voulez HTTPS.
- ~2 Go de RAM recommandés (le build frontend consomme de la mémoire).

## 2. Envoyer le projet sur le VPS

Au choix :

```bash
# Option A — via git
git clone <votre-repo> /var/www/touslocation
cd /var/www/touslocation

# Option B — via scp depuis votre PC
scp -r ./yo-pfe root@IP_DU_VPS:/var/www/touslocation
```

## 3. Lancer l'assistant

```bash
cd /var/www/touslocation
sudo bash deploy/deploy.sh
```

L'assistant pose quelques questions :

| Question | Exemple |
| -------- | ------- |
| Nom de domaine ou IP | `app.mondomaine.com` ou `_` (IP seule) |
| Nom de la base | `touslocation` |
| Utilisateur MySQL | `touslocation` |
| Mot de passe MySQL | *(vide = généré)* |
| Installer les paquets | `O` |
| Activer HTTPS (Let's Encrypt) | `o` si domaine réel |
| Charger les données démo | `O` |

Puis il exécute automatiquement :

1. Installation : Nginx, MariaDB, PHP 8.3 + extensions, Composer, Node 20.
2. Création de la base et de l'utilisateur MySQL.
3. `composer install`, configuration du `.env`, `key:generate`, `migrate --seed`,
   `storage:link`, mise en cache (config/route).
4. `npm install` + `npm run build` (frontend en `VITE_API_URL=/api`).
5. Génération du site Nginx et rechargement.
6. (Option) Certificat HTTPS via Certbot.

## 4. Résultat

- Application accessible sur **`http(s)://votre-domaine`**.
- Le frontend est servi en statique ; l'API Laravel répond sous **`/api`**.
- Connexion de démonstration : **`admin@touslocations.com` / `1234567890`**.

> ⚠️ **En production**, supprimez ou modifiez les comptes de démonstration et
> conservez le mot de passe MySQL affiché à la fin du script.

---

## 5. Mises à jour ultérieures

```bash
cd /var/www/touslocation
git pull                      # ou re-scp
cd backend  && composer install --no-dev -o && php artisan migrate --force && php artisan config:cache && php artisan route:cache
cd ../frontend && npm install && npm run build
sudo systemctl reload nginx
```

## 6. Dépannage

| Problème | Piste |
| -------- | ----- |
| Erreur 502 | PHP-FPM arrêté → `systemctl status php8.3-fpm` ; vérifier le socket dans le conf Nginx |
| 404 sur l'API | Vérifier le bloc `location /api` et que `backend/public/index.php` existe |
| Images/Storage 404 | `php artisan storage:link` dans `backend/` |
| Erreur DB | Identifiants `.env` (`DB_*`) ; service `mariadb` actif |
| Script "permission denied" | Lancer avec `sudo bash deploy/deploy.sh` |
| Fins de ligne (CRLF) | `sed -i 's/\r$//' deploy/deploy.sh` si le script vient de Windows |

---

## Architecture déployée

```
Navigateur ──► Nginx ──┬── /            → frontend/dist (React SPA)
                       ├── /api         → Laravel (PHP-FPM, backend/public)
                       └── /storage     → fichiers publics (images, PDF)
                              │
                              └── MariaDB (localhost:3306)
```
