# Canvis realitzats

## 1. Llibreries locals en lloc d'externes

Bootstrap CSS i JavaScript s'han descarregat i guardat dins `public/vendor/bootstrap/`. Abans es carregaven des d'internet (CDN), ara es carreguen des del propi servidor. Això fa que l'aplicació funcioni sense connexió a internet.

**Fitxers afectats:** `index.html`, `chat.html`, `empresa-detalls.html`

---

## 2. Relació Empresa-Alumne

S'ha creat una nova migració que afegeix el camp `empresa_id` a la taula d'usuaris. Això permet assignar cada alumne a una empresa concreta.

- **Migració:** `2026_03_18_082200_afegir_empresa_id_a_users_table.php`
- **Model User:** nova relació `empresa()` que retorna l'empresa assignada
- **Model Empresa:** nova relació `alumnes()` que retorna els alumnes de l'empresa
- **Seeder:** l'alumne de prova ara s'assigna automàticament a la primera empresa

---

## 3. Alumnes només veuen la seva empresa

Abans, tots els usuaris veien totes les empreses. Ara, un alumne només veu l'empresa on està assignat. Professors i empresaris continuen veient-les totes.

**Fitxer afectat:** `app/Http/Controllers/EmpresaController.php`

---

## 4. Empresa i RA fets al seguiment d'alumnes

A la vista de seguiment que tenen professors i empresaris, la taula d'alumnes ara mostra dues columnes noves:

- **Empresa:** el nom de l'empresa on l'alumne fa pràctiques
- **RA fets:** quants Resultats d'Aprenentatge (RA) únics ha completat l'alumne vs el total (ex: "22 / 57")

Al **perfil del professor**, la secció d'insights ara mostra cada alumne amb el seu nombre de RA completats i jornades pendents.

**Fitxers afectats:**
- `app/Http/Controllers/Api/DashboardController.php` (backend: calcula i envia les dades)
- `public/js/ui/UiInici.js` (frontend: taula d'alumnes amb noves columnes)
- `public/js/ui/UiPerfil.js` (frontend: insights del professor amb RA per alumne)

---

## 5. Estadístiques de RA per alumnes

L'alumne ara veu al seu panell d'inici una barra de progrés de Resultats d'Aprenentatge, mostrant quants RA ha completat del total (ex: "22 / 57 RA").

**Fitxers afectats:**
- `index.html` (nova barra de progrés de RA)
- `public/js/ui/UiInici.js` (lògica per actualitzar la barra)

---

## 6. Perfil del professor millorat

- El "Resum d'activitat" ara mostra dades agregades dels alumnes (alumnes assignats, hores alumnes, actius setmana, amb jornades pendents) en lloc de les dades pròpies del professor (que sempre eren 0).
- S'han eliminat els camps "ID Usuari" i "D'alta des de" del perfil, que no aportaven informació útil.
- Les mencions a "pendents" ara especifiquen "jornades pendents" per evitar confusió amb els RA.

**Fitxers afectats:**
- `index.html` (eliminats camps ID i data d'alta)
- `public/js/ui/UiPerfil.js` (KPIs adaptats per professors)

---

## 7. Script de gestió (chat.sh)

- **MySQL s'encén amb l'usuari correcte:** Quan el script s'executa amb `sudo`, MySQL s'inicia explícitament com a `jaumesampolalcover` per evitar errors de permisos.
- **Comprovació de MySQL millorada:** Ara es fa servir `mysqladmin ping` en lloc de comprovar serveis del sistema, que és més fiable.
