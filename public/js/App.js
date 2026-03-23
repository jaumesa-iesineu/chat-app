/**
 * Classe principal de l'aplicació.
 * Coordina tots els serveis i components UI.
 */
import { obtenirEtiquetaRol } from './utilitats/Formatadors.js';
import { assignarText } from './utilitats/Helpers.js';

// Serveis
import { ServeiAuth } from './serveis/ServeiAuth.js';
import { ServeiDashboard } from './serveis/ServeiDashboard.js';
import { ServeiEmpreses } from './serveis/ServeiEmpreses.js';
import { ServeiRas } from './serveis/ServeiRas.js';
import { ServeiAssistencia } from './serveis/ServeiAssistencia.js';
import { ServeiXat } from './serveis/ServeiXat.js';

// UI
import { UiNotificacions } from './ui/UiNotificacions.js';
/** @type {number|null} ID de l'alumne seleccionat a la pestanya RA's (professor) */
import { UiPerfil } from './ui/UiPerfil.js';
import { UiInici } from './ui/UiInici.js';
import { UiAssistencia } from './ui/UiAssistencia.js';
import { UiRas } from './ui/UiRas.js';
import { UiEmpreses } from './ui/UiEmpreses.js';

export class App {
    constructor() {
        // Serveis
        this.auth = new ServeiAuth();
        this.dashboard = new ServeiDashboard();
        this.empreses = new ServeiEmpreses();
        this.ras = new ServeiRas();
        this.assistencia = new ServeiAssistencia();
        this.xat = new ServeiXat();

        // UI
        this.uiPerfil = new UiPerfil(this.dashboard);
        this.uiInici = new UiInici(this.dashboard);
        this.uiAssistencia = new UiAssistencia(this.assistencia, this.ras);
        this.uiRas = new UiRas(this.ras);
        this.uiEmpreses = new UiEmpreses();

        // Estat
        this.usuariActual = null;
        this.alumneRasSeleccionat = null;
        this.alumneAssistenciaSeleccionat = null;
        this.jornadesProfessorat = [];
        this.contextEdicioJornada = 'alumne';
    }

    /** Punt d'entrada de l'aplicació. */
    async iniciar() {
        this._vincularEvents();

        if (this.auth.teToken()) {
            await this._comprovarSessio();
        } else {
            this._mostrarLogin();
        }
    }

    // ─── Autenticació ────────────────────────────────────────────────

    async _iniciarSessio() {
        const email = document.getElementById('emailInput').value;
        const contrasenya = document.getElementById('passwordInput').value;

        try {
            const dades = await this.auth.iniciarSessio(email, contrasenya);
            this.usuariActual = dades.user;
            this._mostrarDashboard();
        } catch (error) {
            UiNotificacions.mostrar('Error al iniciar sessió', 'error');
        }
    }

    async _comprovarSessio() {
        try {
            this.usuariActual = await this.auth.comprovarSessio();
            this._mostrarDashboard();
        } catch {
            this._tancarSessio();
        }
    }

    _tancarSessio() {
        this.auth.tancarSessio();
        this.usuariActual = null;
        this.alumneAssistenciaSeleccionat = null;
        this.jornadesProfessorat = [];
        this.contextEdicioJornada = 'alumne';
        this.dashboard.reiniciar();
        this.assistencia.reiniciar();
        this.ras.reiniciar();
        this.xat.aturarPolling();

        this.uiInici.actualitzarProgresHores([]);
        this.uiInici.renderPerRol(null);
        this.uiPerfil.actualitzar(null);
        this.uiPerfil.renderInsightsPerRol(null);
        this.uiPerfil.renderAccionsRapides(null, () => {});

        this._mostrarLogin();
    }

    // ─── Navegació Login / Dashboard ─────────────────────────────────

    _mostrarLogin() {
        const login = document.getElementById('loginContainer');
        const dashboard = document.getElementById('dashboard');
        login.style.display = 'flex';
        login.classList.remove('d-none');
        dashboard.style.display = 'none';
        dashboard.classList.add('d-none');
    }

    _mostrarDashboard() {
        const login = document.getElementById('loginContainer');
        const dashboard = document.getElementById('dashboard');
        login.style.display = 'none';
        login.classList.add('d-none');
        dashboard.style.display = 'flex';
        dashboard.classList.remove('d-none');

        this.dashboard.reiniciar();

        // Actualitzar capçalera
        const nom = this.usuariActual.name;
        let etiquetaRol = obtenirEtiquetaRol(this.usuariActual.role);
        if (this.usuariActual.role === 'professor' && this.usuariActual.professor?.curs) {
            etiquetaRol += ` · ${this.usuariActual.professor.curs}`;
        }
        assignarText('userName', nom);
        document.querySelectorAll('.nomUsuari').forEach(el => { el.textContent = nom; });
        assignarText('userRole', etiquetaRol);
        assignarText('userNameHeader', nom);
        assignarText('userRoleHeader', etiquetaRol);

        // Inicialitzar panells
        this.uiInici.actualitzarProgresHores([]);
        this._actualitzarPanellsPerRol();
        this.uiPerfil.renderAccionsRapides(this.usuariActual, (p) => this._canviarIRestaurarPestanya(p));
        this.uiPerfil.actualitzar(this.usuariActual);

        // Carregar dades
        this._carregarJornades();
        this._carregarResumDashboard();

        // Restaurar pestanya activa
        const pestanyaActiva = localStorage.getItem('activeTab') || 'home';
        this._restaurarPestanya(pestanyaActiva);

        // Polling de xat
        this.xat.iniciarPolling((total) => this._actualitzarBadgeXat(total));
    }

    // ─── Pestanyes ──────────────────────────────────────────────────

    _canviarPestanya(nom) {
        localStorage.setItem('activeTab', nom);

        // Tancar menú mòbil si està obert
        const navElement = document.getElementById('dashboardTabsNav');
        const esMobil = window.matchMedia('(max-width: 767.98px)').matches;
        if (navElement && esMobil && navElement.classList.contains('show')) {
            bootstrap.Collapse.getOrCreateInstance(navElement).hide();
        }

        // Accions específiques per pestanya
        if (nom === 'chat') this._recarregarIframeXat();
        if (nom === 'ras') this._carregarRas();
        if (nom === 'companies') this._carregarEmpreses();
        if (nom === 'support') this._inicialitzarAssistencia();
    }

    _restaurarPestanya(nom) {
        const mapa = {
            home: 'home-tab',
            chat: 'chat-tab',
            support: 'support-tab',
            companies: 'companies-tab',
            ras: 'ras-tab',
            profile: 'profile-tab',
        };

        const tabId = mapa[nom];
        if (!tabId) return;

        const element = document.getElementById(tabId);
        if (!element) return;

        const tab = new bootstrap.Tab(element);
        tab.show();

        // Accions post-restauració
        if (nom === 'chat') setTimeout(() => this._recarregarIframeXat(), 100);
        if (nom === 'companies') setTimeout(() => this._carregarEmpreses(), 100);
        if (nom === 'ras') setTimeout(() => this._carregarRas(), 100);
        if (nom === 'support') setTimeout(() => this._inicialitzarAssistencia(), 100);
    }

    _canviarIRestaurarPestanya(nom) {
        this._canviarPestanya(nom);
        this._restaurarPestanya(nom);
    }

    // ─── Dashboard ──────────────────────────────────────────────────

    async _carregarResumDashboard() {
        await this.dashboard.carregar();
        this._actualitzarPanellsPerRol();
        this.uiPerfil.renderAccionsRapides(this.usuariActual, (p) => this._canviarIRestaurarPestanya(p));
        this.uiPerfil.actualitzar(this.usuariActual, this.assistencia.jornades);
    }

    _actualitzarPanellsPerRol() {
        this.uiInici.renderPerRol(this.usuariActual, this.assistencia.jornades);
        this.uiPerfil.renderInsightsPerRol(this.usuariActual);
    }

    // ─── Empreses ───────────────────────────────────────────────────

    async _carregarEmpreses() {
        const contenidor = document.getElementById('empresesContainer');
        // Només carrega si encara no s'han carregat
        if (this.empreses.totes.length > 0) return;

        try {
            const empreses = await this.empreses.carregar();
            this.uiEmpreses.renderLlista(empreses);
        } catch (error) {
            console.error('Error carregant empreses:', error);
            if (contenidor) contenidor.innerHTML = '<p>Error carregant les empreses.</p>';
        }
    }

    _filtrarEmpreses() {
        const text = document.getElementById('searchEmpreses')?.value || '';
        const filtrades = this.empreses.filtrar(text);
        this.uiEmpreses.renderLlista(filtrades);
    }

    // ─── RA's ───────────────────────────────────────────────────────

    async _carregarRas() {
        const contenidor = document.getElementById('rasContainer');
        if (contenidor) contenidor.innerHTML = '<p class="text-center text-muted">Carregant RA\'s...</p>';

        try {
            const [moduls] = await Promise.all([
                this.ras.carregarModuls(),
                this.ras.assegurarHistoric(),
            ]);
            this.uiRas.renderLlista(moduls);

            // Si és professor, carregar selector d'alumnes
            if (this.usuariActual?.role === 'professor') {
                this._carregarAlumnesRas();
            }
        } catch (error) {
            console.error('Error carregant RA\'s:', error);
            if (contenidor) contenidor.innerHTML = '<p class="text-center text-danger">Error carregant les RA\'s.</p>';
        }
    }

    async _carregarAlumnesRas() {
        try {
            const alumnes = await this.ras.carregarAlumnesAssignats();
            this.uiRas.renderSelectorAlumnes(alumnes, (alumneId) => this._carregarRasAlumne(alumneId));
        } catch (error) {
            console.error('Error carregant alumnes per RA:', error);
        }
    }

    async _carregarRasAlumne(alumneId) {
        this.alumneRasSeleccionat = alumneId;
        const contenidor = document.getElementById('rasAlumneContainer');
        if (contenidor) contenidor.innerHTML = '<p class="text-center text-muted">Carregant RA\'s de l\'alumne...</p>';

        try {
            const dades = await this.ras.carregarRasAlumne(alumneId);
            this.uiRas.renderRasAlumne(dades, {
                onAfegir: (aId, raId) => this._afegirRaAlumne(aId, raId),
                onTreure: (aId, raId) => this._treureRaAlumne(aId, raId),
            });
        } catch (error) {
            console.error('Error carregant RA\'s alumne:', error);
            if (contenidor) contenidor.innerHTML = '<p class="text-center text-danger">Error carregant les RA\'s de l\'alumne.</p>';
        }
    }

    async _afegirRaAlumne(alumneId, raId) {
        try {
            const { resposta, dades } = await this.ras.afegirRaAlumne(alumneId, raId);
            if (resposta.ok) {
                UiNotificacions.mostrar('RA afegida correctament', 'success');
                this._carregarRasAlumne(alumneId);
            } else {
                UiNotificacions.mostrar(dades.error || 'Error afegint RA', 'error');
            }
        } catch (error) {
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    async _treureRaAlumne(alumneId, raId) {
        if (!confirm('Estàs segur que vols treure aquesta RA de l\'alumne?')) return;
        try {
            const resposta = await this.ras.treureRaAlumne(alumneId, raId);
            if (resposta.ok) {
                UiNotificacions.mostrar('RA treta correctament', 'success');
                this._carregarRasAlumne(alumneId);
            } else {
                UiNotificacions.mostrar('Error treient RA', 'error');
            }
        } catch (error) {
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    _filtrarRas() {
        const text = document.getElementById('searchRas')?.value || '';
        const filtrats = this.ras.filtrar(text);
        this.uiRas.renderLlista(filtrats);
    }

    // ─── Assistència ────────────────────────────────────────────────

    async _inicialitzarAssistencia() {
        if (!this.usuariActual) return;

        this.uiAssistencia.comprovarAcces(this.usuariActual);

        if (this.usuariActual.role === 'alumne') {
            await Promise.all([
                this._carregarRasAssistencia(),
                this._carregarJornades(),
            ]);
            return;
        }

        if (this.usuariActual.role === 'professor') {
            await this._carregarAssistenciaProfessorat();
        }
    }

    async _carregarAssistenciaProfessorat() {
        try {
            const alumnes = await this.assistencia.carregarAlumnesAssignatsProfessor();
            this.uiAssistencia.renderSelectorAlumnesProfessorat(
                alumnes,
                (alumneId) => this._carregarJornadesProfessoratAlumne(alumneId),
                this.alumneAssistenciaSeleccionat
            );
        } catch (error) {
            console.error('Error carregant alumnes d\'assistencia:', error);
            this.uiAssistencia.renderErrorProfessorat('No s\'han pogut carregar els alumnes assignats.');
        }
    }

    async _carregarJornadesProfessoratAlumne(alumneId) {
        this.alumneAssistenciaSeleccionat = alumneId;
        this.uiAssistencia.renderCarregantJornadesProfessorat();

        try {
            const dades = await this.assistencia.carregarJornadesAlumneProfessor(alumneId);
            this.jornadesProfessorat = Array.isArray(dades.jornades) ? dades.jornades : [];
            this.uiAssistencia.renderTargetesJornadesProfessorat(dades.alumne, this.jornadesProfessorat, {
                onEditar: (id) => this._editarJornadaProfessorat(id),
                onEliminar: (id) => this._eliminarJornadaProfessorat(id),
            });
        } catch (error) {
            console.error('Error carregant jornades de l\'alumne:', error);
            this.jornadesProfessorat = [];
            this.uiAssistencia.renderErrorProfessorat('No s\'han pogut carregar les jornades de l\'alumne seleccionat.');
        }
    }

    async _carregarRasAssistencia() {
        const contenidor = document.getElementById('raCheckboxesContainer');
        if (contenidor) contenidor.innerHTML = '<p class="text-center text-muted mb-0">Carregant RA\'s...</p>';

        try {
            await this.ras.carregarModuls();
            this.uiRas.renderCheckboxes('raCheckboxesContainer', [], 'raSelectionInfo');
            const input = document.getElementById('searchRaJornada');
            if (input) input.value = '';
            this.uiRas.filtrarCheckboxes('searchRaJornada', 'raCheckboxesContainer', 'raSearchNoResults');
        } catch (error) {
            console.error('Error carregant RA per assistència:', error);
            if (contenidor) contenidor.innerHTML = '<p class="text-center text-danger mb-0">No s\'han pogut carregar els RA.</p>';
        }
    }

    async _carregarJornades() {
        try {
            const jornades = await this.assistencia.carregar();
            this.ras.actualitzarHistoric(jornades);
            this.uiInici.actualitzarProgresHores(jornades);
            this.uiPerfil.actualitzar(this.usuariActual, jornades);
            this._actualitzarPanellsPerRol();
            this.uiAssistencia.renderLlistat(jornades, {
                onEditar: (id) => this._editarJornada(id),
                onEliminar: (id) => this._eliminarJornada(id),
            });
        } catch (error) {
            console.error('Error carregant jornades:', error);
            this.assistencia.reiniciar();
            this.ras.actualitzarHistoric([]);
            this.uiInici.actualitzarProgresHores([]);
            this.uiPerfil.actualitzar(this.usuariActual);
            this._actualitzarPanellsPerRol();
            const llistat = document.getElementById('llistatJornades');
            if (llistat) llistat.innerHTML = '<p class="text-danger">Error carregant les jornades.</p>';
        }
    }

    async _guardarJornada() {
        const data = document.getElementById('dataJornada').value;
        const horaEntrada = document.getElementById('horaEntradaManual').value;
        const horaSortida = document.getElementById('horaSortidaManual').value;
        const activitats = document.getElementById('activitatsTextarea').value.trim();
        const raIds = this.uiRas.obtenirSeleccionats('raCheckboxesContainer');

        if (!data || !horaEntrada) {
            UiNotificacions.mostrar('Has d\'introduir almenys la data i l\'hora d\'entrada', 'warning');
            return;
        }

        try {
            const { resposta, dades } = await this.assistencia.crear({
                data,
                hora_entrada: horaEntrada + ':00',
                hora_sortida: horaSortida ? horaSortida + ':00' : null,
                activitats: activitats || null,
                ra_ids: raIds,
            });

            if (resposta.ok) {
                UiNotificacions.mostrar('Jornada guardada correctament', 'success');
                // Netejar formulari
                document.getElementById('horaEntradaManual').value = '';
                document.getElementById('horaSortidaManual').value = '';
                document.getElementById('activitatsTextarea').value = '';
                this.uiRas.netejarSeleccio('raCheckboxesContainer', 'raSelectionInfo');
                const inputCerca = document.getElementById('searchRaJornada');
                if (inputCerca) inputCerca.value = '';
                this.uiRas.filtrarCheckboxes('searchRaJornada', 'raCheckboxesContainer', 'raSearchNoResults');
                document.getElementById('dataJornada').value = new Date().toISOString().split('T')[0];

                this._carregarJornades();
                this._carregarResumDashboard();
            } else {
                UiNotificacions.mostrar(dades.error || 'Error en guardar la jornada', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    async _editarJornada(id) {
        const jornada = this.assistencia.cercarPerId(id);
        if (!jornada) {
            UiNotificacions.mostrar('No s\'ha pogut obrir la jornada seleccionada', 'error');
            return;
        }
        this.contextEdicioJornada = 'alumne';
        await this._obrirModalEdicioJornada(jornada);
    }

    async _editarJornadaProfessorat(id) {
        const jornada = this.jornadesProfessorat.find(j => Number(j.id) === Number(id));
        if (!jornada) {
            UiNotificacions.mostrar('No s\'ha pogut obrir la jornada seleccionada', 'error');
            return;
        }
        this.contextEdicioJornada = 'professor';
        await this._obrirModalEdicioJornada(jornada);
    }

    async _obrirModalEdicioJornada(jornada) {
        if (!jornada) return;

        try {
            await this.ras.carregarModuls();
        } catch {
            UiNotificacions.mostrar('No s\'han pogut carregar els RA', 'error');
            return;
        }

        document.getElementById('editJornadaId').value = jornada.id;
        document.getElementById('editDataJornada').value = new Date(jornada.data).toLocaleDateString('ca-ES');
        document.getElementById('editHoraEntrada').value = jornada.hora_entrada;
        document.getElementById('editHoraSortida').value = jornada.hora_sortida ? jornada.hora_sortida.substring(0, 5) : '';
        document.getElementById('editActivitatsTextarea').value = jornada.activitats || '';

        const raSeleccionats = Array.isArray(jornada.ras) ? jornada.ras.map(ra => ra.id) : [];
        this.uiRas.renderCheckboxes('editRaCheckboxesContainer', raSeleccionats, 'editRaSelectionInfo');
        const inputCerca = document.getElementById('editSearchRaJornada');
        if (inputCerca) inputCerca.value = '';
        this.uiRas.filtrarCheckboxes('editSearchRaJornada', 'editRaCheckboxesContainer', 'editRaSearchNoResults');

        const modal = new bootstrap.Modal(document.getElementById('editarJornadaModal'));
        modal.show();
    }

    async _guardarEdicio() {
        const id = document.getElementById('editJornadaId').value;
        const horaSortida = document.getElementById('editHoraSortida').value;
        const activitats = document.getElementById('editActivitatsTextarea').value.trim();
        const raIds = this.uiRas.obtenirSeleccionats('editRaCheckboxesContainer');

        try {
            const peticio = this.contextEdicioJornada === 'professor'
                ? this.assistencia.actualitzarProfessor(id, {
                    hora_sortida: horaSortida ? horaSortida + ':00' : null,
                    activitats: activitats || null,
                    ra_ids: raIds,
                })
                : this.assistencia.actualitzar(id, {
                    hora_sortida: horaSortida ? horaSortida + ':00' : null,
                    activitats: activitats || null,
                    ra_ids: raIds,
                });

            const { resposta, dades } = await peticio;
            if (resposta.ok) {
                UiNotificacions.mostrar('Jornada actualitzada correctament', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarJornadaModal'));
                modal.hide();
                if (this.contextEdicioJornada === 'professor' && this.alumneAssistenciaSeleccionat) {
                    await this._carregarJornadesProfessoratAlumne(this.alumneAssistenciaSeleccionat);
                } else {
                    this._carregarJornades();
                    this._carregarResumDashboard();
                }
            } else {
                UiNotificacions.mostrar(dades.error || 'Error en actualitzar la jornada', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    async _eliminarJornada(id) {
        if (!confirm('Estàs segur que vols eliminar aquesta jornada?')) return;

        try {
            const resposta = await this.assistencia.eliminar(id);
            if (resposta.ok) {
                UiNotificacions.mostrar('Jornada eliminada correctament', 'success');
                this._carregarJornades();
                this._carregarResumDashboard();
            } else {
                UiNotificacions.mostrar('Error en eliminar la jornada', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    async _eliminarJornadaProfessorat(id) {
        if (!confirm('Estàs segur que vols eliminar aquesta jornada de l\'alumne?')) return;

        try {
            const resposta = await this.assistencia.eliminarProfessor(id);
            if (resposta.ok) {
                UiNotificacions.mostrar('Jornada eliminada correctament', 'success');
                if (this.alumneAssistenciaSeleccionat) {
                    await this._carregarJornadesProfessoratAlumne(this.alumneAssistenciaSeleccionat);
                }
            } else {
                UiNotificacions.mostrar('Error en eliminar la jornada', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            UiNotificacions.mostrar('Error de connexió', 'error');
        }
    }

    // ─── Xat ────────────────────────────────────────────────────────

    _recarregarIframeXat() {
        const iframe = document.getElementById('chatFrame');
        if (iframe) iframe.src = iframe.src;
    }

    _actualitzarBadgeXat(total) {
        const badge = document.getElementById('chatUnreadBadge');
        if (!badge) return;
        if (total > 0) {
            badge.textContent = total;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }

    // ─── Utilitats ──────────────────────────────────────────────────

    _setHoraActual(inputId) {
        const ara = new Date();
        const hores = ara.getHours().toString().padStart(2, '0');
        const minuts = ara.getMinutes().toString().padStart(2, '0');
        document.getElementById(inputId).value = `${hores}:${minuts}`;
    }

    // ─── Vincular events del DOM ────────────────────────────────────

    _vincularEvents() {
        // Formulari login
        const formLogin = document.querySelector('#loginContainer form');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this._iniciarSessio();
            });
        }

        // Botó logout
        const btnLogout = document.getElementById('logoutBtn');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this._tancarSessio());
        }

        // Pestanyes
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', () => {
                const mapa = {
                    'home-tab': 'home',
                    'chat-tab': 'chat',
                    'support-tab': 'support',
                    'companies-tab': 'companies',
                    'ras-tab': 'ras',
                    'profile-tab': 'profile',
                };
                const nom = mapa[tab.id];
                if (nom) this._canviarPestanya(nom);
            });
        });

        // Botó registrar jornada (des d'inici)
        const btnRegistrar = document.querySelector('.btn-registrar-jornada');
        if (btnRegistrar) {
            btnRegistrar.addEventListener('click', () => this._canviarIRestaurarPestanya('support'));
        }

        // Botó guardar jornada
        const btnGuardar = document.getElementById('btnGuardarJornada');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => this._guardarJornada());
        }

        // Botó guardar edició
        const btnGuardarEdicio = document.querySelector('#editarJornadaModal .btn-dark');
        if (btnGuardarEdicio) {
            btnGuardarEdicio.addEventListener('click', () => this._guardarEdicio());
        }

        // Botons hora actual
        document.querySelectorAll('[data-hora-actual]').forEach(btn => {
            btn.addEventListener('click', () => this._setHoraActual(btn.dataset.horaActual));
        });

        // Cerca empreses
        const inputCercaEmpreses = document.getElementById('searchEmpreses');
        if (inputCercaEmpreses) {
            inputCercaEmpreses.addEventListener('input', () => this._filtrarEmpreses());
        }

        // Cerca RA's (pestanya)
        const inputCercaRas = document.getElementById('searchRas');
        if (inputCercaRas) {
            inputCercaRas.addEventListener('input', () => this._filtrarRas());
        }

        // Cerca RA's (formulari jornada)
        const inputCercaRaJornada = document.getElementById('searchRaJornada');
        if (inputCercaRaJornada) {
            inputCercaRaJornada.addEventListener('input', () => {
                this.uiRas.filtrarCheckboxes('searchRaJornada', 'raCheckboxesContainer', 'raSearchNoResults');
            });
        }

        // Cerca RA's (modal edició)
        const inputCercaRaEdicio = document.getElementById('editSearchRaJornada');
        if (inputCercaRaEdicio) {
            inputCercaRaEdicio.addEventListener('input', () => {
                this.uiRas.filtrarCheckboxes('editSearchRaJornada', 'editRaCheckboxesContainer', 'editRaSearchNoResults');
            });
        }
    }
}
