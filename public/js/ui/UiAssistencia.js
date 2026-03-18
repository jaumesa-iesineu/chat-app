/**
 * Renderitza la pestanya d'assistència: formulari de jornades i llistat.
 */
import { escaparHtml } from '../utilitats/Helpers.js';

export class UiAssistencia {
    /**
     * @param {import('../serveis/ServeiAssistencia.js').ServeiAssistencia} serveiAssistencia
     * @param {import('../serveis/ServeiRas.js').ServeiRas} serveiRas
     */
    constructor(serveiAssistencia, serveiRas) {
        this.serveiAssistencia = serveiAssistencia;
        this.serveiRas = serveiRas;
    }

    /**
     * Mostra o amaga el contingut d'assistència segons el rol.
     * @param {object} usuari
     */
    comprovarAcces(usuari) {
        const contingutAlumne = document.getElementById('alumneAssistenciaContent');
        const missatgeNoAlumne = document.getElementById('noAlumneMessage');

        if (usuari && usuari.role === 'alumne') {
            contingutAlumne.style.display = 'block';
            missatgeNoAlumne.style.display = 'none';
            document.getElementById('dataJornada').value = new Date().toISOString().split('T')[0];
        } else {
            contingutAlumne.style.display = 'none';
            missatgeNoAlumne.style.display = 'block';
        }
    }

    /**
     * Renderitza el llistat de jornades.
     * @param {Array} jornades
     * @param {object} callbacks - { onEditar, onEliminar }
     */
    renderLlistat(jornades, callbacks) {
        const contenidor = document.getElementById('llistatJornades');
        if (!contenidor) return;

        if (jornades.length === 0) {
            contenidor.innerHTML = '<p class="text-center text-muted">Encara no has registrat cap jornada.</p>';
            return;
        }

        const files = jornades.map(jornada => {
            const dataFormatada = new Date(jornada.data).toLocaleDateString('ca-ES');
            const activitats = jornada.activitats
                ? jornada.activitats.substring(0, 50) + (jornada.activitats.length > 50 ? '...' : '')
                : '-';
            const totalRas = Array.isArray(jornada.ras) ? jornada.ras.length : 0;
            const teDescripcio = jornada.activitats && jornada.activitats.trim() !== '';
            const teRas = totalRas > 0;

            const { text: estatText, classe: estatClasse, editable } = this._obtenirEstat(jornada, teDescripcio, teRas);

            return `
                <tr ${editable ? 'class="table-warning"' : ''}>
                    <td class="fw-semibold">${escaparHtml(dataFormatada)}</td>
                    <td>${escaparHtml(jornada.hora_entrada)}</td>
                    <td>${jornada.hora_sortida ? escaparHtml(jornada.hora_sortida) : '<span class="text-muted">-</span>'}</td>
                    <td><small>${escaparHtml(activitats)}</small></td>
                    <td><small>${totalRas > 0 ? `${totalRas} RA` : '-'}</small></td>
                    <td><span class="${estatClasse}">${estatText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 btn-editar-jornada" data-id="${jornada.id}" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar-jornada" data-id="${jornada.id}" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        contenidor.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Data</th>
                            <th>Entrada</th>
                            <th>Sortida</th>
                            <th>Activitats</th>
                            <th>RA</th>
                            <th>Estat</th>
                            <th>Accions</th>
                        </tr>
                    </thead>
                    <tbody>${files}</tbody>
                </table>
            </div>
        `;

        // Vincular events als botons
        contenidor.querySelectorAll('.btn-editar-jornada').forEach(btn => {
            btn.addEventListener('click', () => callbacks.onEditar(Number(btn.dataset.id)));
        });
        contenidor.querySelectorAll('.btn-eliminar-jornada').forEach(btn => {
            btn.addEventListener('click', () => callbacks.onEliminar(Number(btn.dataset.id)));
        });
    }

    /**
     * Determina l'estat d'una jornada.
     * @returns {{ text: string, classe: string, editable: boolean }}
     */
    _obtenirEstat(jornada, teDescripcio, teRas) {
        if (!jornada.hora_sortida) {
            return { text: 'Sense sortida', classe: 'badge bg-warning text-dark', editable: true };
        }
        if (teDescripcio && teRas) {
            return { text: 'Completada', classe: 'badge bg-success', editable: false };
        }
        if (!teDescripcio && !teRas) {
            return { text: 'Falten RA i descripció', classe: 'badge bg-info text-white', editable: true };
        }
        if (!teRas) {
            return { text: 'Falten RA', classe: 'badge bg-info text-white', editable: true };
        }
        return { text: 'Falta descripció', classe: 'badge bg-info text-white', editable: true };
    }
}
