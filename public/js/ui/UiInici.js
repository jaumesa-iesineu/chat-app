/**
 * Renderitza el panell d'inici segons el rol de l'usuari.
 * - Alumnes: perfil + progrés d'hores + botó registrar jornada.
 * - Professors/empresaris: seguiment d'alumnes amb taula.
 */
import { escaparHtml } from '../utilitats/Helpers.js';
import {
    formatarHores,
    formatarDataCurta,
    formatarPercentatge,
    ROLS_AMB_SEGUIMENT,
    calcularHoresRealitzades,
} from '../utilitats/Formatadors.js';

export class UiInici {
    /**
     * @param {import('../serveis/ServeiDashboard.js').ServeiDashboard} serveiDashboard
     */
    constructor(serveiDashboard) {
        this.serveiDashboard = serveiDashboard;
    }

    /**
     * Actualitza la barra de progrés d'hores (visible per alumnes).
     * @param {Array} jornades
     */
    actualitzarProgresHores(jornades) {
        const barra = document.getElementById('horesProgressBar');
        const text = document.getElementById('horesProgressText');
        if (!barra || !text) return;

        const hores = calcularHoresRealitzades(jornades);
        const objectiu = this.serveiDashboard.obtenirObjectiuHores();
        const percentatge = Math.min((hores / objectiu) * 100, 100);

        barra.style.width = `${percentatge}%`;
        barra.parentElement?.setAttribute('aria-valuenow', Math.min(hores, objectiu).toFixed(1));
        text.textContent = `${formatarHores(hores)} / ${objectiu}H`;

        this._actualitzarProgresRa();
    }

    /**
     * Actualitza la barra de progrés de RA (visible per alumnes).
     */
    _actualitzarProgresRa() {
        const barraRa = document.getElementById('raProgressBar');
        const textRa = document.getElementById('raProgressText');
        if (!barraRa || !textRa) return;

        const resum = this.serveiDashboard.resum;
        const totalRas = Number(resum?.total_ras || 0);
        const raFets = Number(resum?.own_summary?.total_ras_unics || 0);
        const percentatgeRa = totalRas > 0 ? Math.min((raFets / totalRas) * 100, 100) : 0;

        barraRa.style.width = `${percentatgeRa}%`;
        barraRa.parentElement?.setAttribute('aria-valuemax', totalRas);
        barraRa.parentElement?.setAttribute('aria-valuenow', raFets);
        textRa.textContent = `${raFets} / ${totalRas} RA`;
    }

    /**
     * Renderitza el panell d'inici segons el rol.
     * @param {object} usuari
     * @param {Array} jornadesLocals
     */
    renderPerRol(usuari, jornadesLocals = []) {
        const panellAlumne = document.getElementById('homeStudentContent');
        const panellRol = document.getElementById('homeRoleContent');
        if (!panellAlumne || !panellRol || !usuari) return;

        const rol = String(usuari.role || '').toLowerCase();

        if (!ROLS_AMB_SEGUIMENT.has(rol)) {
            panellAlumne.classList.remove('d-none');
            panellRol.classList.add('d-none');
            panellRol.innerHTML = '';
            return;
        }

        panellAlumne.classList.add('d-none');
        panellRol.classList.remove('d-none');

        if (!this.serveiDashboard.carregat) {
            panellRol.innerHTML = `
                <div class="card gov-card shadow-sm border-0">
                    <div class="card-body p-4 p-md-5">
                        <p class="text-muted mb-0">Carregant resum de seguiment...</p>
                    </div>
                </div>
            `;
            return;
        }

        if (!this.serveiDashboard.resum) {
            panellRol.innerHTML = `
                <div class="card gov-card-secondary shadow-sm border-0">
                    <div class="card-body p-4 p-md-5">
                        <p class="mb-0 text-muted">No s'ha pogut carregar el resum d'alumnes ara mateix.</p>
                    </div>
                </div>
            `;
            return;
        }

        const resumPropi = this.serveiDashboard.obtenirResumPropi(jornadesLocals);
        const resumAlumnes = this.serveiDashboard.obtenirResumAlumnes();
        const alumnes = this.serveiDashboard.obtenirAlumnesAssignats();

        const textRol = rol === 'professor' ? 'Seguiment docent' : 'Seguiment empresa';
        const textContext = rol === 'professor'
            ? 'Controla l\'activitat dels alumnes assignats i detecta pendents.'
            : 'Visualitza l\'estat dels alumnes que tens assignats a l\'empresa.';

        const taulaAlumnes = this._renderTaulaAlumnes(alumnes);

        panellRol.innerHTML = `
            <div class="card gov-card shadow-sm border-0 mb-4">
                <div class="card-body p-4 p-md-5">
                    <h2 class="fs-5 text-dark text-uppercase fw-semibold mb-2" style="letter-spacing: 0.5px;">${textRol}</h2>
                    <p class="text-muted mb-0">${textContext}</p>
                </div>
            </div>
            <div class="row g-3 g-md-4">
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card gov-card-secondary bg-light border-0 h-100">
                        <div class="card-body p-3 p-md-4">
                            <label class="text-muted text-uppercase small fw-bold d-block mb-2" style="letter-spacing: 0.8px; font-size: 0.6875rem;">Hores pròpies</label>
                            <span class="d-block fs-5 text-dark fw-medium">${formatarHores(Number(resumPropi.hours_done || 0))}h</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card gov-card-secondary bg-light border-0 h-100">
                        <div class="card-body p-3 p-md-4">
                            <label class="text-muted text-uppercase small fw-bold d-block mb-2" style="letter-spacing: 0.8px; font-size: 0.6875rem;">Alumnes assignats</label>
                            <span class="d-block fs-5 text-dark fw-medium">${Number(resumAlumnes.total_assigned || 0)}</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card gov-card-secondary bg-light border-0 h-100">
                        <div class="card-body p-3 p-md-4">
                            <label class="text-muted text-uppercase small fw-bold d-block mb-2" style="letter-spacing: 0.8px; font-size: 0.6875rem;">Actius setmana</label>
                            <span class="d-block fs-5 text-dark fw-medium">${Number(resumAlumnes.active_recently || 0)}</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card gov-card-secondary bg-light border-0 h-100">
                        <div class="card-body p-3 p-md-4">
                            <label class="text-muted text-uppercase small fw-bold d-block mb-2" style="letter-spacing: 0.8px; font-size: 0.6875rem;">Amb jornades pendents</label>
                            <span class="d-block fs-5 text-dark fw-medium">${Number(resumAlumnes.with_pending_jornades || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card gov-card shadow-sm border-0 mt-4">
                <div class="card-body p-4 p-md-5">
                    <h3 class="fs-5 text-dark text-uppercase fw-semibold pb-3 mb-4 border-bottom" style="letter-spacing: 0.5px;">Alumnes assignats</h3>
                    ${taulaAlumnes}
                </div>
            </div>
        `;
    }

    /**
     * Genera la taula HTML dels alumnes assignats.
     * @param {Array} alumnes
     * @returns {string}
     */
    _renderTaulaAlumnes(alumnes) {
        if (alumnes.length === 0) {
            return '<div class="alert alert-info mb-0">No tens alumnes assignats en aquest moment.</div>';
        }

        const files = alumnes.map(alumne => {
            const resum = alumne.summary || {};
            const estat = this._obtenirEstatAlumne(alumne);
            const contractes = Array.isArray(alumne.assigned_contracts)
                ? alumne.assigned_contracts.join(' · ')
                : '';

            return `
                <tr>
                    <td>
                        <div class="fw-semibold text-dark">${escaparHtml(alumne.name || '-')}</div>
                        <div class="small text-muted">${escaparHtml(alumne.email || '-')}</div>
                        ${contractes ? `<div class="small text-muted">${escaparHtml(contractes)}</div>` : ''}
                    </td>
                    <td>${escaparHtml(alumne.empresa_name || '-')}</td>
                    <td class="fw-semibold">${formatarHores(Number(resum.hours_done || 0))}h</td>
                    <td>${formatarHores(Number(resum.hours_remaining || 0))}h</td>
                    <td>${Number(resum.total_ras_unics || 0)} / ${Number(this.serveiDashboard.resum?.total_ras || 0)}</td>
                    <td>${Number(resum.pending_jornades || 0)}</td>
                    <td><span class="badge ${estat.classe}">${estat.text}</span></td>
                </tr>
            `;
        }).join('');

        return `
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Alumne</th>
                            <th>Empresa</th>
                            <th>Hores</th>
                            <th>Restants</th>
                            <th>RA fets</th>
                            <th>Pendents</th>
                            <th>Estat</th>
                        </tr>
                    </thead>
                    <tbody>${files}</tbody>
                </table>
            </div>
        `;
    }

    /**
     * Determina l'etiqueta d'estat d'un alumne.
     * @param {object} alumne
     * @returns {{ text: string, classe: string }}
     */
    _obtenirEstatAlumne(alumne) {
        const resum = alumne?.summary || {};

        if (resum.has_open_shift_today) {
            return { text: 'Jornada oberta avui', classe: 'bg-warning text-dark' };
        }
        if ((resum.pending_jornades || 0) > 0) {
            return { text: 'Jornades pendents', classe: 'bg-danger-subtle text-danger-emphasis' };
        }
        if (resum.is_active_recently) {
            return { text: 'Actiu aquesta setmana', classe: 'bg-success-subtle text-success-emphasis' };
        }
        return { text: 'Sense activitat recent', classe: 'bg-secondary-subtle text-secondary-emphasis' };
    }
}
