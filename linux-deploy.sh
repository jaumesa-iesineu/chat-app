#!/bin/bash

# ============================================================
#   DESPLEGAMENT AUTOMÀTIC - CHAT APP LARAVEL - DEBIAN LINUX
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/chat-deploy.log"
DB_NAME="chat_db"
DB_USER="chatapp"
DB_PASSWORD_FILE="$PROJECT_DIR/.db_password"
APP_PORT=80
APP_PORT_FALLBACK=8080

# ---- Helpers ----
log()    { echo "$(date '+%H:%M:%S') $1" >> "$LOG_FILE"; }
ok()     { echo -e "${GREEN}  ✓${NC} $1"; log "OK: $1"; }
info()   { echo -e "${BLUE}  →${NC} $1"; log "INFO: $1"; }
warn()   { echo -e "${YELLOW}  ⚠${NC} $1"; log "WARN: $1"; }
error()  { echo -e "${RED}  ✗ ERROR:${NC} $1"; log "ERROR: $1"; }
header() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
die()    { error "$1"; exit 1; }

# ---- Capçalera ----
clear
echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║        CHAT APP - DESPLEGAMENT AUTOMÀTIC         ║"
echo "  ║              Debian Linux / PHP Laravel           ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Log: $LOG_FILE"
echo "  Directori: $PROJECT_DIR"
echo ""

# ============================================================
# COMPROVACIÓ PRÈVIA: ROOT
# ============================================================
if [ "$EUID" -ne 0 ]; then
    die "Cal executar com a root:\n\n    sudo bash linux-deploy.sh\n"
fi

cd "$PROJECT_DIR"
> "$LOG_FILE"

# ============================================================
# FASE 1: ACTUALITZAR PAQUETS
# ============================================================
header "Actualitzant llista de paquets"
apt-get update -qq >> "$LOG_FILE" 2>&1
ok "Llista de paquets actualitzada"

# ============================================================
# FASE 2: PHP 8.2+
# ============================================================
header "PHP 8.2+"

php_ok() {
    command -v php &>/dev/null && \
    php -r "exit(version_compare(PHP_VERSION, '8.2', '>=') ? 0 : 1);" 2>/dev/null
}

if php_ok; then
    ok "PHP $(php -r 'echo PHP_VERSION;') ja instal·lat"
else
    info "Instal·lant PHP 8.2..."
    # Intentem paquets estàndard de Debian 12
    if apt-cache show php8.2-cli &>/dev/null 2>&1; then
        apt-get install -y -qq php8.2-cli >> "$LOG_FILE" 2>&1
    else
        # Afegim repositori sury.org per a Debian
        info "Afegint repositori de PHP (sury.org)..."
        apt-get install -y -qq curl lsb-release gnupg2 >> "$LOG_FILE" 2>&1
        curl -fsSL https://packages.sury.org/php/apt.gpg \
            -o /usr/share/keyrings/sury-php.gpg >> "$LOG_FILE" 2>&1
        echo "deb [signed-by=/usr/share/keyrings/sury-php.gpg] \
https://packages.sury.org/php/ $(lsb_release -sc) main" \
            > /etc/apt/sources.list.d/sury-php.list
        apt-get update -qq >> "$LOG_FILE" 2>&1
        apt-get install -y -qq php8.2-cli >> "$LOG_FILE" 2>&1
    fi
    php_ok || die "No s'ha pogut instal·lar PHP 8.2+"
    ok "PHP $(php -r 'echo PHP_VERSION;') instal·lat"
fi

# Extensions requerides per Laravel
EXTENSIONS=(mysql mbstring xml curl zip bcmath tokenizer fileinfo)
MISSING_EXT=()

for ext in "${EXTENSIONS[@]}"; do
    php_module="${ext}"
    [ "$ext" = "mysql" ] && php_module="pdo_mysql"
    if ! php -m 2>/dev/null | grep -qi "$php_module"; then
        MISSING_EXT+=("$ext")
    fi
done

if [ ${#MISSING_EXT[@]} -gt 0 ]; then
    info "Instal·lant extensions PHP: ${MISSING_EXT[*]}"
    # Detectar versió exacta per al nom del paquet
    PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
    PKG_LIST=()
    for ext in "${MISSING_EXT[@]}"; do
        PKG_LIST+=("php${PHP_VER}-${ext}")
    done
    apt-get install -y -qq "${PKG_LIST[@]}" >> "$LOG_FILE" 2>&1 || \
    apt-get install -y -qq "${MISSING_EXT[@]/#/php-}" >> "$LOG_FILE" 2>&1 || \
    warn "Alguna extensió podria no haver-se instal·lat correctament"
    ok "Extensions PHP instal·lades"
else
    ok "Totes les extensions PHP estan disponibles"
fi

# ============================================================
# FASE 3: MYSQL / MARIADB
# ============================================================
header "MySQL / MariaDB"

detect_db_service() {
    if systemctl is-active --quiet mysql 2>/dev/null; then
        echo "mysql"
    elif systemctl is-active --quiet mariadb 2>/dev/null; then
        echo "mariadb"
    elif command -v mysqladmin &>/dev/null; then
        # Instal·lat però aturat
        systemctl is-enabled mysql &>/dev/null && echo "mysql" || echo "mariadb"
    else
        echo ""
    fi
}

DB_SERVICE=$(detect_db_service)

if [ -z "$DB_SERVICE" ]; then
    info "Instal·lant MariaDB..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server >> "$LOG_FILE" 2>&1
    DB_SERVICE="mariadb"
    ok "MariaDB instal·lat"
fi

# Assegurar que el servei està en execució
if ! systemctl is-active --quiet "$DB_SERVICE" 2>/dev/null; then
    info "Iniciant $DB_SERVICE..."
    systemctl start "$DB_SERVICE" >> "$LOG_FILE" 2>&1
    sleep 2
fi
systemctl enable "$DB_SERVICE" --quiet >> "$LOG_FILE" 2>&1
ok "$DB_SERVICE en execució i activat"

# ============================================================
# FASE 4: CONFIGURAR BASE DE DADES
# ============================================================
header "Configuració de la base de dades"

# Generar o recuperar contrasenya
if [ -f "$DB_PASSWORD_FILE" ]; then
    DB_PASS=$(cat "$DB_PASSWORD_FILE")
    info "Usant contrasenya existent de $DB_PASSWORD_FILE"
else
    DB_PASS=$(openssl rand -base64 24 | tr -d '=/+' | head -c 24)
    echo "$DB_PASS" > "$DB_PASSWORD_FILE"
    chmod 600 "$DB_PASSWORD_FILE"
    info "Contrasenya generada i guardada a $DB_PASSWORD_FILE"
fi

# Executar SQL com a root (MariaDB/MySQL en Debian permet root sense password via socket)
mysql_root() {
    mysql -u root "$@" 2>/dev/null || \
    mysql --user=root --password="" "$@" 2>/dev/null || \
    die "No s'ha pogut connectar a MySQL/MariaDB com a root"
}

mysql_root << SQL_EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL_EOF

ok "Base de dades '$DB_NAME' preparada"
ok "Usuari MySQL '$DB_USER' configurat"

# ============================================================
# FASE 5: COMPOSER
# ============================================================
header "Composer"

if command -v composer &>/dev/null && composer --version --no-ansi &>/dev/null; then
    ok "Composer ja instal·lat ($(composer --version --no-ansi 2>&1 | head -1))"
else
    info "Instal·lant Composer..."
    apt-get install -y -qq curl >> "$LOG_FILE" 2>&1
    COMPOSER_INSTALLER="/tmp/composer-installer.php"
    curl -fsSL https://getcomposer.org/installer -o "$COMPOSER_INSTALLER" >> "$LOG_FILE" 2>&1
    php "$COMPOSER_INSTALLER" --quiet --install-dir=/usr/local/bin --filename=composer >> "$LOG_FILE" 2>&1
    rm -f "$COMPOSER_INSTALLER"
    ok "Composer instal·lat"
fi

# ============================================================
# FASE 6: CONFIGURAR .ENV
# ============================================================
header "Configuració .env"

if [ ! -f "$PROJECT_DIR/.env" ]; then
    [ -f "$PROJECT_DIR/.env.example" ] || die "No s'ha trobat .env ni .env.example"
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    info ".env creat des de .env.example"
fi

# Funció per establir valor al .env (crea la línia si no existeix)
env_set() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" "$PROJECT_DIR/.env"; then
        sed -i "s|^${key}=.*|${key}=${val}|" "$PROJECT_DIR/.env"
    elif grep -q "^#\s*${key}=" "$PROJECT_DIR/.env"; then
        sed -i "s|^#\s*${key}=.*|${key}=${val}|" "$PROJECT_DIR/.env"
    else
        echo "${key}=${val}" >> "$PROJECT_DIR/.env"
    fi
}

env_set "DB_CONNECTION"  "mysql"
env_set "DB_HOST"        "127.0.0.1"
env_set "DB_PORT"        "3306"
env_set "DB_DATABASE"    "$DB_NAME"
env_set "DB_USERNAME"    "$DB_USER"
env_set "DB_PASSWORD"    "$DB_PASS"
env_set "APP_ENV"        "production"
env_set "APP_DEBUG"      "false"

ok ".env configurat"

# ============================================================
# FASE 7: DEPENDÈNCIES PHP
# ============================================================
header "Instal·lant dependències PHP"

info "Executant composer install..."
composer install \
    --no-interaction \
    --no-dev \
    --optimize-autoloader \
    --quiet \
    >> "$LOG_FILE" 2>&1
ok "Dependències PHP instal·lades"

# ============================================================
# FASE 8: APP KEY
# ============================================================
# Conservem la clau existent del .env copiat (sessions compatibles)
if grep -q "^APP_KEY=$\|^APP_KEY=\"\"" "$PROJECT_DIR/.env" 2>/dev/null; then
    header "Generant APP_KEY"
    php artisan key:generate --force >> "$LOG_FILE" 2>&1
    ok "APP_KEY generada"
else
    info "APP_KEY ja existeix, es conserva"
fi

# ============================================================
# FASE 9: MIGRACIONS I DADES INICIALS
# ============================================================
header "Migracions de base de dades"

php artisan config:clear --quiet
php artisan migrate --force --no-interaction >> "$LOG_FILE" 2>&1
ok "Migracions executades"

# Seeders: només si les taules estan buides
USER_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    -se "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq 0 ]; then
    info "Omplint dades inicials (seeders)..."
    php artisan db:seed --force --no-interaction >> "$LOG_FILE" 2>&1
    ok "Dades inicials creades"
else
    info "La BD ja té $USER_COUNT usuaris, s'ometen els seeders"
fi

# ============================================================
# FASE 10: PERMISOS
# ============================================================
header "Permisos de fitxers"

chmod -R 775 "$PROJECT_DIR/storage" "$PROJECT_DIR/bootstrap/cache"

# Intentem canviar propietari al usuari del servidor web
for web_user in www-data nginx apache http nobody; do
    if id "$web_user" &>/dev/null; then
        chown -R "$web_user:$web_user" \
            "$PROJECT_DIR/storage" \
            "$PROJECT_DIR/bootstrap/cache" \
            2>/dev/null && break
    fi
done

ok "Permisos configurats"

# ============================================================
# FASE 11: CACHÉ D'OPTIMITZACIÓ
# ============================================================
header "Optimitzant aplicació"

php artisan config:cache  >> "$LOG_FILE" 2>&1 && ok "Caché de configuració" || warn "config:cache no disponible"
php artisan route:cache   >> "$LOG_FILE" 2>&1 && ok "Caché de rutes"        || warn "route:cache no disponible"
php artisan view:cache    >> "$LOG_FILE" 2>&1 && ok "Caché de vistes"       || warn "view:cache no disponible"

# ============================================================
# FASE 12: INICIAR SERVIDOR LARAVEL
# ============================================================
header "Iniciant servidor Laravel"

# Aturar instàncies anteriors
if [ -f /tmp/laravel-server.pid ]; then
    OLD_PID=$(cat /tmp/laravel-server.pid)
    if kill -0 "$OLD_PID" 2>/dev/null; then
        kill "$OLD_PID" 2>/dev/null
        info "Servidor anterior aturat (PID $OLD_PID)"
        sleep 1
    fi
    rm -f /tmp/laravel-server.pid
fi

start_laravel() {
    local port=$1
    nohup php artisan serve \
        --host=0.0.0.0 \
        --port="$port" \
        >> /tmp/laravel-server.log 2>&1 &
    local pid=$!
    sleep 3
    if kill -0 "$pid" 2>/dev/null; then
        echo "$pid" > /tmp/laravel-server.pid
        echo "$port" > /tmp/laravel-server.port
        return 0
    fi
    return 1
}

if start_laravel $APP_PORT; then
    APP_PORT_USED=$APP_PORT
    ok "Servidor Laravel iniciat al port $APP_PORT"
else
    warn "Port $APP_PORT no disponible, provant port $APP_PORT_FALLBACK..."
    if start_laravel $APP_PORT_FALLBACK; then
        APP_PORT_USED=$APP_PORT_FALLBACK
        ok "Servidor Laravel iniciat al port $APP_PORT_FALLBACK"
    else
        die "No s'ha pogut iniciar el servidor Laravel"
    fi
fi

# ============================================================
# RESUM FINAL
# ============================================================
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
LARAVEL_PID=$(cat /tmp/laravel-server.pid 2>/dev/null || echo "?")

echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║              DESPLEGAMENT COMPLETAT! ✓               ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}ACCÉS A L'APLICACIÓ${NC}"
echo -e "  ┌─────────────────────────────────────────────────┐"
echo -e "  │  URL principal:  http://$SERVER_IP:$APP_PORT_USED"
echo -e "  │  Xat:            http://$SERVER_IP:$APP_PORT_USED/chat.html"
echo -e "  │  Índex:          http://$SERVER_IP:$APP_PORT_USED/index.html"
echo -e "  └─────────────────────────────────────────────────┘"
echo ""
echo -e "  ${BOLD}CREDENCIALS DE L'APP${NC}"
echo -e "  ┌─────────────────────────────────────────────────┐"
echo -e "  │  Professor:  professor@example.com / password123 │"
echo -e "  │  Alumne:     alumne@example.com    / password123 │"
echo -e "  │  Empresari:  empresari@example.com / password123 │"
echo -e "  └─────────────────────────────────────────────────┘"
echo ""
echo -e "  ${BOLD}BASE DE DADES${NC}"
echo -e "  ┌─────────────────────────────────────────────────┐"
echo -e "  │  Base de dades: $DB_NAME                         │"
echo -e "  │  Usuari:        $DB_USER                         │"
echo -e "  │  Contrasenya:   guardada a .db_password          │"
echo -e "  └─────────────────────────────────────────────────┘"
echo ""
echo -e "  ${BOLD}SERVIDOR${NC}"
echo -e "  ┌─────────────────────────────────────────────────┐"
echo -e "  │  Procés Laravel: PID $LARAVEL_PID               │"
echo -e "  │  Log servidor:   /tmp/laravel-server.log         │"
echo -e "  │  Log despleg.:   $LOG_FILE  │"
echo -e "  └─────────────────────────────────────────────────┘"
echo ""
echo -e "  ${YELLOW}Per aturar el servidor:${NC}  kill \$(cat /tmp/laravel-server.pid)"
echo -e "  ${YELLOW}Per veure logs:${NC}          tail -f /tmp/laravel-server.log"
echo ""
