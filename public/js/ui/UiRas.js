/**
 * Renderitza la pestanya de RA's i els checkboxes de RA dins formularis.
 */
import { escaparHtml } from '../utilitats/Helpers.js';

export class UiRas {
    /**
     * @param {import('../serveis/ServeiRas.js').ServeiRas} serveiRas
     */
    constructor(serveiRas) {
        this.serveiRas = serveiRas;
    }

    /**
     * Renderitza la llista completa de RA's a la pestanya.
     * @param {Array} moduls
     */
    renderLlista(moduls) {
        const contenidor = document.getElementById('rasContainer');
        if (!contenidor) return;

        if (moduls.length === 0) {
            contenidor.innerHTML = '<div class="alert alert-info text-center">No s\'han trobat RA\'s.</div>';
            return;
        }

        contenidor.innerHTML = moduls.map(modul => `
            <div class="card shadow-sm border-0 mb-3">
                <div class="card-header bg-white border-bottom py-3">
                    <span class="badge bg-primary me-2">${escaparHtml(modul.codi)}</span>
                    <span class="fw-semibold text-dark">${escaparHtml(modul.modul)}</span>
                </div>
                <ul class="list-group list-group-flush">
                    ${modul.ras.map(ra => {
                        const marcat = this.serveiRas.marcatsHistoric.has(Number(ra.id));
                        const classe = marcat
                            ? 'ra-history-checkbox ra-history-checkbox-marked'
                            : 'ra-history-checkbox';
                        return `
                            <li class="list-group-item px-4 py-3">
                                <div class="d-flex align-items-start gap-3">
                                    <span class="${classe}" aria-hidden="true"></span>
                                    <div>
                                        <p class="mb-0 text-dark">${escaparHtml(ra.ra)}</p>
                                        ${ra.descripcio ? `<p class="mb-0 mt-1 small text-muted">${escaparHtml(ra.descripcio)}</p>` : ''}
                                    </div>
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `).join('');
    }

    /**
     * Renderitza els checkboxes de RA dins un contenidor de formulari.
     * @param {string} contenidorId - ID del contenidor.
     * @param {number[]} seleccionats - IDs dels RA seleccionats.
     * @param {string|null} infoId - ID de l'element comptador.
     */
    renderCheckboxes(contenidorId, seleccionats = [], infoId = null) {
        const contenidor = document.getElementById(contenidorId);
        if (!contenidor) return;

        const seleccionatsSet = new Set(seleccionats.map(id => Number(id)));

        if (this.serveiRas.moduls.length === 0) {
            contenidor.innerHTML = '<p class="text-center text-muted mb-0">No hi ha RA disponibles.</p>';
            if (infoId) this.actualitzarComptador(contenidorId, infoId);
            return;
        }

        contenidor.innerHTML = this.serveiRas.moduls.map(modul => `
            <div class="mb-3 ra-module-group">
                <div class="small text-uppercase fw-semibold text-muted mb-2" style="letter-spacing: 0.4px;">
                    ${escaparHtml(modul.codi)} · ${escaparHtml(modul.modul)}
                </div>
                ${modul.ras.map(ra => {
                    const marcat = seleccionatsSet.has(Number(ra.id)) ? 'checked' : '';
                    const checkboxId = `${contenidorId}-ra-${ra.id}`;
                    const cercaText = `${ra.ra} ${ra.descripcio || ''} ${modul.modul} ${modul.codi}`.toLowerCase();
                    return `
                        <div class="form-check mb-2 ra-option" data-ra-search="${escaparHtml(cercaText)}">
                            <input class="form-check-input" type="checkbox" value="${ra.id}" id="${checkboxId}" ${marcat}
                                data-contenidor="${contenidorId}" data-info="${infoId || ''}">
                            <label class="form-check-label small text-dark" for="${checkboxId}">
                                ${escaparHtml(ra.ra)}
                            </label>
                            ${ra.descripcio ? `<div class="small text-muted ms-4">${escaparHtml(ra.descripcio)}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');

        // Vincular events de canvi per actualitzar el comptador
        contenidor.addEventListener('change', (event) => {
            if (event.target.matches('input.form-check-input')) {
                const cId = event.target.dataset.contenidor;
                const iId = event.target.dataset.info;
                if (cId && iId) this.actualitzarComptador(cId, iId);
            }
        });

        if (infoId) this.actualitzarComptador(contenidorId, infoId);
    }

    /**
     * Filtra les opcions de RA dins un contenidor de checkboxes.
     * @param {string} inputCercaId
     * @param {string} contenidorId
     * @param {string|null} noResultatsId
     */
    filtrarCheckboxes(inputCercaId, contenidorId, noResultatsId = null) {
        const input = document.getElementById(inputCercaId);
        const contenidor = document.getElementById(contenidorId);
        const noResultats = noResultatsId ? document.getElementById(noResultatsId) : null;
        if (!input || !contenidor) return;

        const cerca = input.value.trim().toLowerCase();
        let hiHaVisibles = false;

        contenidor.querySelectorAll('.ra-module-group').forEach(grup => {
            let visiblesModul = 0;
            grup.querySelectorAll('.ra-option').forEach(opcio => {
                const text = opcio.getAttribute('data-ra-search') || '';
                const visible = cerca === '' || text.includes(cerca);
                opcio.classList.toggle('d-none', !visible);
                if (visible) visiblesModul++;
            });
            grup.classList.toggle('d-none', visiblesModul === 0);
            if (visiblesModul > 0) hiHaVisibles = true;
        });

        if (noResultats) {
            noResultats.classList.toggle('d-none', hiHaVisibles || cerca === '');
        }
    }

    /**
     * Obté els IDs dels RA seleccionats dins un contenidor.
     * @param {string} contenidorId
     * @returns {number[]}
     */
    obtenirSeleccionats(contenidorId) {
        const contenidor = document.getElementById(contenidorId);
        if (!contenidor) return [];
        return Array.from(contenidor.querySelectorAll('input.form-check-input:checked'))
            .map(input => Number(input.value));
    }

    /**
     * Actualitza el text del comptador de RA seleccionats.
     * @param {string} contenidorId
     * @param {string} infoId
     */
    actualitzarComptador(contenidorId, infoId) {
        if (!infoId) return;
        const element = document.getElementById(infoId);
        if (!element) return;
        const total = this.obtenirSeleccionats(contenidorId).length;
        element.textContent = `${total} RA seleccionat${total === 1 ? '' : 's'}`;
    }

    /**
     * Neteja la selecció de RA dins un contenidor.
     * @param {string} contenidorId
     * @param {string} infoId
     */
    netejarSeleccio(contenidorId, infoId) {
        const contenidor = document.getElementById(contenidorId);
        if (!contenidor) return;
        contenidor.querySelectorAll('input.form-check-input:checked').forEach(cb => {
            cb.checked = false;
        });
        this.actualitzarComptador(contenidorId, infoId);
    }
}
