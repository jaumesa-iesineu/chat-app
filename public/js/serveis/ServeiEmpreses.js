/**
 * Servei per carregar i filtrar empreses.
 */
import { ServeiApi } from './ServeiApi.js';

export class ServeiEmpreses extends ServeiApi {
    /** @type {Array} Totes les empreses carregades. */
    totes = [];

    /**
     * Carrega totes les empreses des de l'API.
     * @returns {Promise<Array>}
     */
    async carregar() {
        this.totes = await this.get('/empreses');
        return this.totes;
    }

    /**
     * Filtra les empreses per un text de cerca.
     * @param {string} textCerca
     * @returns {Array}
     */
    filtrar(textCerca) {
        const cerca = textCerca.toLowerCase();
        return this.totes.filter(empresa => {
            const titol = (empresa.title || '').toLowerCase();
            const descripcio = (empresa.description || '').toLowerCase();
            const ubicacio = (empresa.location || '').toLowerCase();
            const any = empresa.created_at
                ? new Date(empresa.created_at).getFullYear().toString()
                : '';

            return titol.includes(cerca)
                || descripcio.includes(cerca)
                || ubicacio.includes(cerca)
                || any.includes(cerca);
        });
    }
}
