#!/bin/bash

# Colors per la sortida
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sense color

# Directori del projecte
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Funció per mostrar el menú
show_menu() {
    clear
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   GESTOR DEL XAT - MacBook${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo "1) Engegar tot"
    echo "2) Apagar tot"
    echo "3) Esborrar totes les converses"
    echo "4) Veure estat"
    echo "5) Obrir xat al navegador"
    echo "6) Veure logs del servidor"
    echo "0) Sortir"
    echo ""
    echo -ne "${YELLOW}Tria una opció: ${NC}"
}

# Funció per verificar si MySQL està funcionant
check_mysql() {
    if brew services list | grep mysql | grep started > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Funció per verificar si el servidor Laravel està funcionant
check_laravel() {
    if lsof -ti:80 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Funció per engegar tot
start_all() {
    echo -e "${GREEN}=== Engegant serveis ===${NC}"

    # Iniciar MySQL
    echo -ne "Iniciant MySQL... "
    if check_mysql; then
        echo -e "${YELLOW}Ja està funcionant${NC}"
    else
        brew services start mysql
        echo -e "${GREEN}Iniciat${NC}"
        sleep 3
    fi

    # Iniciar servidor Laravel
    echo -ne "Iniciant servidor Laravel... "
    if check_laravel; then
        echo -e "${YELLOW}Ja està funcionant${NC}"
    else
        sudo php -d upload_max_filesize=50M -d post_max_size=50M -d memory_limit=256M artisan serve --host=0.0.0.0 --port=80 > /tmp/laravel-server.log 2>&1 &
        sleep 2
        if check_laravel; then
            echo -e "${GREEN}Iniciat a http://localhost:80${NC}"
        else
            echo -e "${RED}Error en iniciar${NC}"
        fi
    fi

    echo ""
    echo -e "${GREEN}Serveis iniciats${NC}"
    echo -e "Xat disponible a: ${BLUE}http://localhost:80/chat.html${NC}"
    echo ""
    read -p "Prem Enter per continuar..."
}

# Funció per apagar tot
stop_all() {
    echo -e "${RED}=== Apagant serveis ===${NC}"

    # Aturar servidor Laravel
    echo -ne "Aturant servidor Laravel... "
    if check_laravel; then
        kill $(lsof -ti:80) 2>/dev/null
        echo -e "${GREEN}Aturat${NC}"
    else
        echo -e "${YELLOW}No estava funcionant${NC}"
    fi

    # Aturar MySQL
    echo -ne "Aturant MySQL... "
    if check_mysql; then
        brew services stop mysql
        echo -e "${GREEN}Aturat${NC}"
    else
        echo -e "${YELLOW}No estava funcionant${NC}"
    fi

    echo ""
    echo -e "${GREEN}Serveis aturats${NC}"
    echo ""
    read -p "Prem Enter per continuar..."
}

# Funció per esborrar converses
clear_conversations() {
    echo -e "${YELLOW}=== Esborrar converses ===${NC}"
    echo ""
    echo -e "${RED}ADVERTÈNCIA: Això esborrarà TOTES les converses i missatges${NC}"
    echo ""
    read -p "Estàs segur? (escriu SI per confirmar): " confirm

    if [ "$confirm" = "SI" ]; then
        if ! check_mysql; then
            echo -e "${RED}Error: MySQL no està funcionant. Engega els serveis primer.${NC}"
            read -p "Prem Enter per continuar..."
            return
        fi

        echo ""
        echo -ne "Esborrant converses... "

        mysql -h 127.0.0.1 -u root -D chat_db -e "
        SET FOREIGN_KEY_CHECKS = 0;
        TRUNCATE TABLE chat_message_notifications;
        TRUNCATE TABLE chat_messages;
        TRUNCATE TABLE chat_participation;
        TRUNCATE TABLE chat_conversations;
        SET FOREIGN_KEY_CHECKS = 1;
        " 2>/dev/null

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Esborrat correctament${NC}"
            echo ""
            echo "Totes les converses han estat eliminades"
            echo "Els usuaris (professor, alumne, empresari) continuen existint"
        else
            echo -e "${RED}Error en esborrar${NC}"
        fi
    else
        echo ""
        echo "Operació cancel·lada"
    fi

    echo ""
    read -p "Prem Enter per continuar..."
}

# Funció per veure l'estat
show_status() {
    echo -e "${BLUE}=== Estat de serveis ===${NC}"
    echo ""

    # Estat de MySQL
    echo -n "MySQL: "
    if check_mysql; then
        echo -e "${GREEN}Funcionant${NC}"
    else
        echo -e "${RED}Aturat${NC}"
    fi

    # Estat del servidor Laravel
    echo -n "Servidor Laravel: "
    if check_laravel; then
        echo -e "${GREEN}Funcionant al port 80${NC}"
    else
        echo -e "${RED}Aturat${NC}"
    fi

    # Estadístiques de la base de dades
    if check_mysql; then
        echo ""
        echo -e "${BLUE}=== Estadístiques de la BD ===${NC}"
        mysql -h 127.0.0.1 -u root -D chat_db -e "
        SELECT
            'Converses' as tipus, COUNT(*) as quantitat FROM chat_conversations
        UNION ALL
        SELECT 'Missatges', COUNT(*) FROM chat_messages
        UNION ALL
        SELECT 'Usuaris', COUNT(*) FROM users;
        " 2>/dev/null
    fi

    echo ""
    read -p "Prem Enter per continuar..."
}

# Funció per obrir el navegador
open_browser() {
    echo -e "${BLUE}Obrint navegador...${NC}"

    if check_laravel; then
        open "http://localhost/chat.html"
        echo -e "${GREEN}Navegador obert${NC}"
    else
        echo -e "${RED}Error: El servidor no està funcionant. Engega els serveis primer.${NC}"
    fi

    echo ""
    read -p "Prem Enter per continuar..."
}

# Funció per veure logs
show_logs() {
    echo -e "${BLUE}=== Logs del servidor (Ctrl+C per sortir) ===${NC}"
    echo ""

    if [ -f /tmp/laravel-server.log ]; then
        tail -f /tmp/laravel-server.log
    else
        echo -e "${YELLOW}No hi ha logs disponibles${NC}"
        echo ""
        read -p "Prem Enter per continuar..."
    fi
}

# Funció per mostrar ajuda
show_help() {
    echo "Ús: $0 [comanda]"
    echo ""
    echo "Comandes disponibles:"
    echo "  start    - Engegar tot (MySQL + Laravel)"
    echo "  stop     - Apagar tot"
    echo "  clear    - Esborrar totes les converses"
    echo "  status   - Veure estat de serveis"
    echo "  open     - Obrir xat al navegador"
    echo "  logs     - Veure logs del servidor"
    echo ""
    echo "Sense paràmetres: Mostra menú interactiu"
}

# Mode amb paràmetres (per ús en scripts/comandes)
if [ $# -gt 0 ]; then
    case "$1" in
        start)
            start_all
            exit 0
            ;;
        stop)
            stop_all
            exit 0
            ;;
        clear)
            # Esborrar sense confirmació en mode no interactiu
            if ! check_mysql; then
                echo -e "${RED}Error: MySQL no està funcionant${NC}"
                exit 1
            fi
            mysql -h 127.0.0.1 -u root -D chat_db -e "
            SET FOREIGN_KEY_CHECKS = 0;
            TRUNCATE TABLE chat_message_notifications;
            TRUNCATE TABLE chat_messages;
            TRUNCATE TABLE chat_participation;
            TRUNCATE TABLE chat_conversations;
            SET FOREIGN_KEY_CHECKS = 1;
            " 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}Converses esborrades${NC}"
                exit 0
            else
                echo -e "${RED}Error en esborrar${NC}"
                exit 1
            fi
            ;;
        status)
            show_status
            exit 0
            ;;
        open)
            open_browser
            exit 0
            ;;
        logs)
            show_logs
            exit 0
            ;;
        help|-h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Comanda desconeguda: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
fi

# Mode interactiu (sense paràmetres)
while true; do
    show_menu
    read option

    case $option in
        1) start_all ;;
        2) stop_all ;;
        3) clear_conversations ;;
        4) show_status ;;
        5) open_browser ;;
        6) show_logs ;;
        0)
            echo ""
            echo -e "${GREEN}Adéu!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opció invàlida${NC}"
            sleep 1
            ;;
    esac
done
