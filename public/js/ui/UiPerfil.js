/**
 * Renderitza la informació del perfil de l'usuari.
 */
import { assignarText } from '../utilitats/Helpers.js';
import {
    formatarHores,
    obtenirInicials,
    obtenirEtiquetaRol,
    formatarPercentatge,
    formatarDataCurta,
    ROLS_AMB_SEGUIMENT,
} from '../utilitats/Formatadors.js';
import { escaparHtml } from '../utilitats/Helpers.js';

export class UiPerfil {
    /**
     * @param {import('../serveis/ServeiDashboard.js').ServeiDashboard} serveiDashboard
     */
    constructor(serveiDashboard) {
        this.serveiDashboard = serveiDashboard;
    }

    /**
     * Actualitza tota la informació del perfil.
     * @param {object} usuari - L'usuari actual.
     * @param {Array} jornadesLocals - Jornades locals com a fallback.
     */
    actualitzar(usuari, jornadesLocals = []) {
        if (!usuari) return;

        const rol = String(usuari.role || '').toLowerCase();
        const nom = usuari.name || 'Usuari';
        const correu = usuari.email || 'No disponible';
        const etiquetaRol = obtenirEtiquetaRol(usuari.role);
        const resumPropi = this.serveiDashboard.obtenirResumPropi(jornadesLocals);
        const hores = Number(resumPropi.hours_done || 0);
        const objectiu = this.serveiDashboard.obtenirObjectiuHores();
        const percentatge = Math.min((hores / objectiu) * 100, 100);

        const textContext = {
            alumne: 'Consulta el teu progrés de jornades i objectius formatius.',
            professor: 'Supervisa el progrés dels alumnes i detecta incidències.',
            empresari: 'Controla les hores i l\'estat dels alumnes assignats a l\'empresa.',
        }[rol] || 'Gestiona la teva activitat i comunicació dins el portal.';

        // Capçalera del perfil
        assignarText('profileUserInitials', obtenirInicials(nom));
        assignarText('profileUserName', nom);
        assignarText('profileRoleHint', textContext);
        assignarText('profileUserRole', etiquetaRol);
        assignarText('profileUserState', 'Sessió activa');

        // Informació del compte
        assignarText('profileInfoName', nom);
        assignarText('profileInfoEmail', correu);
        assignarText('profileInfoRole', etiquetaRol);
        assignarText('profileInfoStatus', 'Actiu');

        // Info específica del rol
        const profileRoleExtra = document.getElementById('profileRoleExtra');
        if (profileRoleExtra) {
            if (rol === 'professor' && usuari.professor?.curs) {
                profileRoleExtra.innerHTML = `<span class="badge bg-primary-subtle text-primary-emphasis">${escaparHtml(usuari.professor.curs)}</span>`;
            } else if (rol === 'alumne' && usuari.alumne?.numero_seguretat_social) {
                profileRoleExtra.innerHTML = `<small class="text-muted">NSS: ${escaparHtml(usuari.alumne.numero_seguretat_social)}</small>`;
            } else {
                profileRoleExtra.innerHTML = '';
            }
        }

        // KPI: professors/empresaris veuen dades agregades dels alumnes
        if (ROLS_AMB_SEGUIMENT.has(rol)) {
            const resumAlumnes = this.serveiDashboard.obtenirResumAlumnes();
            const horesAlumnes = Number(resumAlumnes.total_hours_done || 0);
            const assignats = Number(resumAlumnes.total_assigned || 0);
            const progresAlumnes = Number(resumAlumnes.average_progress_percentage || 0);

            assignarText('profileTotalJornades', String(assignats));
            document.querySelector('#profileTotalJornades + .profile-kpi-label')?.replaceChildren(document.createTextNode('Alumnes'));
            assignarText('profileHoresTotals', `${formatarHores(horesAlumnes)}h`);
            document.querySelector('#profileHoresTotals + .profile-kpi-label')?.replaceChildren(document.createTextNode('Hores alumnes'));
            assignarText('profileJornadesCompletes', String(Number(resumAlumnes.active_recently || 0)));
            document.querySelector('#profileJornadesCompletes + .profile-kpi-label')?.replaceChildren(document.createTextNode('Actius setmana'));
            assignarText('profileJornadesPendents', String(Number(resumAlumnes.with_pending_jornades || 0)));
            document.querySelector('#profileJornadesPendents + .profile-kpi-label')?.replaceChildren(document.createTextNode('Amb jornades pendents'));
            assignarText('profileObjectiuPercent', `${Math.round(progresAlumnes)}%`);
            assignarText('profileProgressText', `Mitjana progrés alumnes`);

            const barra = document.getElementById('profileProgressBar');
            if (barra) {
                barra.style.width = `${progresAlumnes}%`;
                barra.parentElement?.setAttribute('aria-valuenow', progresAlumnes.toFixed(1));
            }
        } else {
            assignarText('profileTotalJornades', String(Number(resumPropi.total_jornades || 0)));
            assignarText('profileHoresTotals', `${formatarHores(hores)}h`);
            assignarText('profileJornadesCompletes', String(Number(resumPropi.completed_jornades || 0)));
            assignarText('profileJornadesPendents', String(Number(resumPropi.pending_jornades || 0)));
            assignarText('profileObjectiuPercent', `${Math.round(percentatge)}%`);
            assignarText('profileProgressText', `${formatarHores(hores)} / ${objectiu}H`);
        }

        // Barra de progrés
        const barra = document.getElementById('profileProgressBar');
        if (barra) {
            barra.style.width = `${percentatge}%`;
            barra.parentElement?.setAttribute('aria-valuenow', Math.min(hores, objectiu).toFixed(1));
        }
    }

    /**
     * Renderitza els insights per rol (seguiment d'alumnes) al perfil.
     * @param {object} usuari
     */
    renderInsightsPerRol(usuari) {
        const contenidor = document.getElementById('profileRoleInsights');
        if (!contenidor || !usuari) return;

        const rol = String(usuari.role || '').toLowerCase();
        if (!ROLS_AMB_SEGUIMENT.has(rol)) {
            contenidor.innerHTML = '';
            return;
        }

        if (!this.serveiDashboard.carregat) {
            contenidor.innerHTML = '<small class="text-muted d-block mt-2">Carregant seguiment d\'alumnes...</small>';
            return;
        }

        if (!this.serveiDashboard.resum) {
            contenidor.innerHTML = '<small class="text-muted d-block mt-2">No s\'ha pogut carregar el seguiment d\'alumnes.</small>';
            return;
        }

        const resumAlumnes = this.serveiDashboard.obtenirResumAlumnes();
        const alumnes = this.serveiDashboard.obtenirAlumnesAssignats();
        const totalRas = Number(this.serveiDashboard.resum?.total_ras || 0);

        const llistaAlumnes = alumnes.length === 0
            ? '<p class="small text-muted mb-0">No hi ha alumnes per mostrar.</p>'
            : alumnes.map(alumne => {
                const pendents = Number(alumne?.summary?.pending_jornades || 0);
                const raFets = Number(alumne?.summary?.total_ras_unics || 0);
                return `
                    <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div>
                            <div class="small fw-semibold text-dark">${escaparHtml(alumne.name || '-')}</div>
                            <div class="small text-muted">${escaparHtml(alumne.empresa_name || 'Sense empresa')}</div>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-info-subtle text-info-emphasis me-1">${raFets} / ${totalRas} RA</span>
                            <span class="badge ${pendents > 0 ? 'bg-danger-subtle text-danger-emphasis' : 'bg-success-subtle text-success-emphasis'}">
                                ${pendents} jornades pendents
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

        contenidor.innerHTML = `
            <div class="card border-0 bg-light mt-3">
                <div class="card-body p-3">
                    <div class="row g-3 mb-2">
                        <div class="col-6">
                            <small class="text-uppercase fw-semibold text-muted d-block" style="letter-spacing: 0.4px;">Mitjana progrés</small>
                            <span class="fw-semibold text-dark">${formatarPercentatge(resumAlumnes.average_progress_percentage)}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-uppercase fw-semibold text-muted d-block" style="letter-spacing: 0.4px;">Jornada oberta avui</small>
                            <span class="fw-semibold text-dark">${Number(resumAlumnes.with_open_shift_today || 0)}</span>
                        </div>
                    </div>
                    <small class="text-uppercase fw-semibold text-muted d-block mb-2" style="letter-spacing: 0.4px;">Alumnes</small>
                    ${llistaAlumnes}
                </div>
            </div>
        `;
    }

    /**
     * Renderitza les accions ràpides del perfil segons el rol.
     * @param {object} usuari
     * @param {function} canviarPestanya - Funció per canviar de pestanya.
     */
    renderAccionsRapides(usuari, canviarPestanya) {
        const contenidor = document.getElementById('profileQuickActions');
        if (!contenidor || !usuari) return;

        const rol = String(usuari.role || '').toLowerCase();

        const botons = {
            alumne: [
                { text: 'Registrar jornada', classe: 'btn-dark', pestanya: 'support' },
                { text: 'Veure RA\'s', classe: 'btn-outline-dark', pestanya: 'ras' },
                { text: 'Obrir xat', classe: 'btn-outline-secondary', pestanya: 'chat' },
            ],
            professor: [
                { text: 'Veure seguiment', classe: 'btn-dark', pestanya: 'home' },
                { text: 'Revisar assistència', classe: 'btn-outline-dark', pestanya: 'support' },
                { text: 'Obrir xat', classe: 'btn-outline-secondary', pestanya: 'chat' },
            ],
            empresari: [
                { text: 'Veure alumnes', classe: 'btn-dark', pestanya: 'home' },
                { text: 'Empreses', classe: 'btn-outline-dark', pestanya: 'companies' },
                { text: 'Obrir xat', classe: 'btn-outline-secondary', pestanya: 'chat' },
            ],
        };

        const llistaBotons = botons[rol] || [
            { text: 'Inici', classe: 'btn-dark', pestanya: 'home' },
            { text: 'Veure RA\'s', classe: 'btn-outline-dark', pestanya: 'ras' },
            { text: 'Obrir xat', classe: 'btn-outline-secondary', pestanya: 'chat' },
        ];

        contenidor.innerHTML = llistaBotons.map(b =>
            `<button type="button" class="btn ${b.classe} text-uppercase fw-semibold" data-pestanya="${b.pestanya}">${b.text}</button>`
        ).join('');

        contenidor.querySelectorAll('[data-pestanya]').forEach(btn => {
            btn.addEventListener('click', () => canviarPestanya(btn.dataset.pestanya));
        });
    }
}
