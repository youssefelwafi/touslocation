#!/usr/bin/env bash
#
# TousLocation — Assistant de déploiement VPS (Ubuntu 22.04 / 24.04)
# Installe PHP, MariaDB, Nginx, Node ; configure l'app ; build le frontend ;
# publie le tout derrière Nginx.
#
# Usage :   sudo bash deploy/deploy.sh
#
set -euo pipefail

# ---------- helpers ----------
G='\033[0;32m'; B='\033[0;34m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
say(){ echo -e "\n${B}▸ $1${N}"; }
ok(){ echo -e "${G}✔ $1${N}"; }
warn(){ echo -e "${Y}! $1${N}"; }
die(){ echo -e "${R}✗ $1${N}"; exit 1; }
ask(){ local p="$1" d="${2:-}" v; if [ -n "$d" ]; then read -rp "$p [$d] : " v; echo "${v:-$d}"; else read -rp "$p : " v; echo "$v"; fi; }

[ "$(id -u)" -eq 0 ] || die "Lancez ce script en root :  sudo bash deploy/deploy.sh"
command -v apt-get >/dev/null || die "Ce script cible Ubuntu/Debian (apt)."

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PHP_V="8.3"

clear
echo "==================================================================="
echo "        TousLocation — Assistant de déploiement (VPS)"
echo "==================================================================="
echo "  Application : $APP_DIR"
echo "  Cible       : Ubuntu 22.04 / 24.04 (fraîche de préférence)"
echo "-------------------------------------------------------------------"

# ---------- questions ----------
DOMAIN=$(ask "Nom de domaine ou IP du serveur" "_")
DB_NAME=$(ask "Nom de la base de données" "touslocation")
DB_USER=$(ask "Utilisateur MySQL" "touslocation")
read -rsp "Mot de passe MySQL (vide = généré automatiquement) : " DB_PASS; echo
if [ -z "$DB_PASS" ]; then DB_PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 22)"; warn "Mot de passe DB généré."; fi
INSTALL=$(ask "Installer les paquets système (php, nginx, mariadb, node) ? [O/n]" "O")
DO_SSL=$(ask "Activer HTTPS via Let's Encrypt (domaine réel + DNS requis) ? [o/N]" "N")
DO_SEED=$(ask "Charger les données de démonstration (seed) ? [O/n]" "O")

WEBROOT_BACK="$APP_DIR/backend/public"
WEBROOT_FRONT="$APP_DIR/frontend/dist"
APP_URL="http://$DOMAIN"; [[ "$DO_SSL" =~ ^[OoYy] ]] && APP_URL="https://$DOMAIN"

echo
echo "  Domaine/IP : $DOMAIN"
echo "  Base       : $DB_NAME (user: $DB_USER)"
echo "  URL finale : $APP_URL"
CONFIRM=$(ask "Continuer ? [O/n]" "O"); [[ "$CONFIRM" =~ ^[OoYy] ]] || die "Annulé."

# ---------- paquets ----------
if [[ "$INSTALL" =~ ^[OoYy] ]]; then
  say "Installation des paquets système…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y software-properties-common curl unzip git openssl
  add-apt-repository -y ppa:ondrej/php
  apt-get update -y
  apt-get install -y nginx mariadb-server \
    php${PHP_V}-fpm php${PHP_V}-cli php${PHP_V}-mysql php${PHP_V}-mbstring \
    php${PHP_V}-xml php${PHP_V}-curl php${PHP_V}-zip php${PHP_V}-gd php${PHP_V}-bcmath
  if ! command -v composer >/dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
  fi
  if ! command -v node >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  systemctl enable --now mariadb "php${PHP_V}-fpm" nginx
  ok "Paquets installés."
fi

# ---------- base de données ----------
say "Création de la base de données…"
mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"
ok "Base « ${DB_NAME} » prête."

# ---------- backend ----------
say "Configuration du backend (Laravel)…"
cd "$APP_DIR/backend"
composer install --no-dev --optimize-autoloader --no-interaction
[ -f .env ] || cp .env.example .env
upsert(){ local k="$1" v="$2"; if grep -q "^${k}=" .env; then sed -i "s#^${k}=.*#${k}=${v}#" .env; else echo "${k}=${v}" >> .env; fi; }
upsert APP_NAME TousLocation
upsert APP_ENV production
upsert APP_DEBUG false
upsert APP_URL "$APP_URL"
upsert APP_TIMEZONE Africa/Casablanca
upsert APP_LOCALE fr
upsert DB_CONNECTION mysql
upsert DB_HOST 127.0.0.1
upsert DB_PORT 3306
upsert DB_DATABASE "$DB_NAME"
upsert DB_USERNAME "$DB_USER"
upsert DB_PASSWORD "$DB_PASS"
php artisan key:generate --force
if [[ "$DO_SEED" =~ ^[OoYy] ]]; then php artisan migrate --force --seed; else php artisan migrate --force; fi
php artisan storage:link || true
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache
ok "Backend configuré."

# ---------- frontend ----------
say "Build du frontend (React/Vite)…"
cd "$APP_DIR/frontend"
echo "VITE_API_URL=/api" > .env.production
npm ci 2>/dev/null || npm install
npm run build
ok "Frontend buildé → $WEBROOT_FRONT"

# ---------- nginx ----------
say "Configuration de Nginx…"
TPL="$APP_DIR/deploy/nginx-touslocation.conf.template"
OUT="/etc/nginx/sites-available/touslocation"
sed -e "s#__DOMAIN__#${DOMAIN}#g" \
    -e "s#__FRONT__#${WEBROOT_FRONT}#g" \
    -e "s#__BACK__#${WEBROOT_BACK}#g" \
    -e "s#__PHP__#${PHP_V}#g" "$TPL" > "$OUT"
ln -sf "$OUT" /etc/nginx/sites-enabled/touslocation
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configuré et rechargé."

# ---------- HTTPS ----------
if [[ "$DO_SSL" =~ ^[OoYy] ]] && [ "$DOMAIN" != "_" ]; then
  say "Émission du certificat HTTPS…"
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN}" --redirect \
    && ok "HTTPS actif." || warn "Certbot a échoué (vérifiez le DNS du domaine)."
fi

# ---------- récapitulatif ----------
echo
echo "==================================================================="
ok "Déploiement terminé !"
echo "-------------------------------------------------------------------"
echo "  URL de l'application : $APP_URL"
echo "  Base de données      : $DB_NAME"
echo "  Utilisateur MySQL    : $DB_USER"
echo "  Mot de passe MySQL   : $DB_PASS"
echo "  Connexion (démo)     : admin@touslocations.com / 1234567890"
echo "==================================================================="
warn "EN PRODUCTION : supprimez/changez les comptes de démonstration et le mot de passe."
warn "Conservez le mot de passe MySQL ci-dessus."
