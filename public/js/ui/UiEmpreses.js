/**
 * Renderitza la pestanya d'empreses.
 */
import { escaparHtml } from '../utilitats/Helpers.js';

export class UiEmpreses {
    /**
     * Renderitza la llista d'empreses.
     * @param {Array} empreses
     */
    renderLlista(empreses) {
        const contenidor = document.getElementById('empresesContainer');
        if (!contenidor) return;

        if (empreses.length === 0) {
            contenidor.innerHTML = '<div class="col-12"><div class="alert alert-info text-center" role="alert">No s\'han trobat empreses.</div></div>';
            return;
        }

        contenidor.innerHTML = empreses.map(empresa => `
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div class="card h-100 shadow-sm border-0">
                    ${empresa.logo ? `<img src="${empresa.logo_url}" alt="${escaparHtml(empresa.title)}" class="card-img-top">` : ''}
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-semibold text-dark mb-3">${escaparHtml(empresa.title)}</h5>
                        ${empresa.description ? `<p class="card-text text-muted small mb-3 flex-grow-1">${escaparHtml(empresa.description)}</p>` : ''}
                        ${empresa.location ? `<p class="card-text text-muted small mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-geo-alt-fill me-1" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>${escaparHtml(empresa.location)}</p>` : ''}
                    </div>
                    <div class="card-footer bg-white border-0 pt-0 pb-3 px-3">
                        <a href="empresa-detalls.html?id=${empresa.id}" class="btn btn-primary w-100">Veure Detalls</a>
                    </div>
                </div>
            </div>
        `).join('');
    }
}
