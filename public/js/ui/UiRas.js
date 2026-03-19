/**
 * Renderitza la pestanya de RA's i els checkboxes de RA dins formularis.
 */
import { escaparHtml } from '../utilitats/Helpers.js';
import { formatarDataCurta } from '../utilitats/Formatadors.js';

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
     * Renderitza el selector d'alumnes per al professor.
     * @param {Array} alumnes
     * @param {function} onSeleccionar - Callback quan es selecciona un alumne.
     */
    renderSelectorAlumnes(alumnes, onSeleccionar) {
        const contenidor = document.getElementById('rasProfessorPanel');
        if (!contenidor) return;

        contenidor.classList.remove('d-none');

        contenidor.innerHTML = `
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-body p-3 p-md-4">
                    <label for="selectAlumneRas" class="form-label fw-semibold text-dark text-uppercase small" style="letter-spacing: 0.5px;">Selecciona un alumne per gestionar les seves RA's</label>
                    <select id="selectAlumneRas" class="form-select form-select-lg">
                        <option value="">-- Tria un alumne --</option>
                        ${alumnes.map(a => `<option value="${a.id}">${escaparHtml(a.name)} (${escaparHtml(a.email)})</option>`).join('')}
                    </select>
                </div>
            </div>
            <div id="rasAlumneContainer"></div>
        `;

        const select = document.getElementById('selectAlumneRas');
        select.addEventListener('change', () => {
            const id = Number(select.value);
            if (id) onSeleccionar(id);
            else document.getElementById('rasAlumneContainer').innerHTML = '';
        });
    }

    /**
     * Renderitza les RA's d'un alumne amb info de jornades i botons per afegir/treure.
     * @param {object} dades - { alumne, moduls }
     * @param {object} callbacks - { onAfegir(alumneId, raId), onTreure(alumneId, raId) }
     */
    renderRasAlumne(dades, callbacks) {
        const contenidor = document.getElementById('rasAlumneContainer');
        if (!contenidor) return;

        const { alumne, moduls } = dades;

        const totalRas = moduls.reduce((acc, m) => acc + m.ras.length, 0);
        const completades = moduls.reduce((acc, m) => acc + m.ras.filter(r => r.completat).length, 0);

        contenidor.innerHTML = `
            <div class="card gov-card shadow-sm border-0 mb-4">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h3 class="fs-5 fw-semibold text-dark mb-1">${escaparHtml(alumne.name)}</h3>
                            <span class="text-muted small">${escaparHtml(alumne.email)}</span>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-primary-subtle text-primary-emphasis fs-6">${completades} / ${totalRas} RA</span>
                        </div>
                    </div>
                </div>
            </div>
            ${moduls.map(modul => `
                <div class="card shadow-sm border-0 mb-3">
                    <div class="card-header bg-white border-bottom py-3">
                        <span class="badge bg-primary me-2">${escaparHtml(modul.codi)}</span>
                        <span class="fw-semibold text-dark">${escaparHtml(modul.modul)}</span>
                    </div>
                    <ul class="list-group list-group-flush">
                        ${modul.ras.map(ra => this._renderRaAlumne(ra, alumne.id)).join('')}
                    </ul>
                </div>
            `).join('')}
        `;

        // Vincular events als botons
        contenidor.querySelectorAll('.btn-afegir-ra').forEach(btn => {
            btn.addEventListener('click', () => callbacks.onAfegir(Number(btn.dataset.alumneId), Number(btn.dataset.raId)));
        });
        contenidor.querySelectorAll('.btn-treure-ra').forEach(btn => {
            btn.addEventListener('click', () => callbacks.onTreure(Number(btn.dataset.alumneId), Number(btn.dataset.raId)));
        });
    }

    /**
     * Renderitza una RA individual dins la vista d'alumne.
     */
    _renderRaAlumne(ra, alumneId) {
        const jornadesHtml = ra.jornades.length > 0
            ? ra.jornades.map(j => `
                <div class="small text-muted ms-4 mt-1 border-start border-2 ps-2">
                    <span class="fw-semibold">${escaparHtml(formatarDataCurta(j.data))}</span>
                    ${j.activitats ? ` — ${escaparHtml(j.activitats.length > 100 ? j.activitats.substring(0, 100) + '...' : j.activitats)}` : ''}
                </div>
            `).join('')
            : '';

        if (ra.completat) {
            return `
                <li class="list-group-item px-4 py-3 bg-success-subtle">
                    <div class="d-flex align-items-start gap-3">
                        <span class="ra-history-checkbox ra-history-checkbox-marked" aria-hidden="true"></span>
                        <div class="flex-grow-1">
                            <p class="mb-0 text-dark">${escaparHtml(ra.ra)}</p>
                            ${ra.descripcio ? `<p class="mb-0 mt-1 small text-muted">${escaparHtml(ra.descripcio)}</p>` : ''}
                            ${jornadesHtml}
                        </div>
                        <button class="btn btn-sm btn-outline-danger btn-treure-ra" data-alumne-id="${alumneId}" data-ra-id="${ra.id}" title="Treure RA">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                            </svg>
                        </button>
                    </div>
                </li>
            `;
        }

        return `
            <li class="list-group-item px-4 py-3">
                <div class="d-flex align-items-start gap-3">
                    <span class="ra-history-checkbox" aria-hidden="true"></span>
                    <div class="flex-grow-1">
                        <p class="mb-0 text-dark">${escaparHtml(ra.ra)}</p>
                        ${ra.descripcio ? `<p class="mb-0 mt-1 small text-muted">${escaparHtml(ra.descripcio)}</p>` : ''}
                    </div>
                    <button class="btn btn-sm btn-outline-success btn-afegir-ra" data-alumne-id="${alumneId}" data-ra-id="${ra.id}" title="Afegir RA">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                        </svg>
                    </button>
                </div>
            </li>
        `;
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
