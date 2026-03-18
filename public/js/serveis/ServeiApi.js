/**
 * Classe base per fer peticions HTTP autenticades a l'API.
 * Tots els serveis que necessiten accedir a l'API hereten d'aquesta classe.
 */
export class ServeiApi {
    /** @type {string} URL base de l'API */
    static URL_BASE = '/api';

    /**
     * Obté el token d'autenticació emmagatzemat.
     * @returns {string|null}
     */
    obtenirToken() {
        return localStorage.getItem('token');
    }

    /**
     * Construeix les capçaleres per una petició autenticada.
     * @param {boolean} ambCos - Si la petició inclou un cos JSON.
     * @returns {HeadersInit}
     */
    construirCapcaleres(ambCos = false) {
        const capcaleres = {
            'Authorization': `Bearer ${this.obtenirToken()}`,
            'Accept': 'application/json',
        };
        if (ambCos) {
            capcaleres['Content-Type'] = 'application/json';
        }
        return capcaleres;
    }

    /**
     * Fa una petició GET a l'API.
     * @param {string} ruta - Ruta relativa (ex: '/empreses').
     * @returns {Promise<any>}
     */
    async get(ruta) {
        const resposta = await fetch(`${ServeiApi.URL_BASE}${ruta}`, {
            headers: this.construirCapcaleres(),
        });
        if (!resposta.ok) {
            throw new Error(`Error GET ${ruta}: ${resposta.status}`);
        }
        return resposta.json();
    }

    /**
     * Fa una petició POST a l'API.
     * @param {string} ruta
     * @param {object} dades
     * @returns {Promise<{resposta: Response, dades: any}>}
     */
    async post(ruta, dades) {
        const resposta = await fetch(`${ServeiApi.URL_BASE}${ruta}`, {
            method: 'POST',
            headers: this.construirCapcaleres(true),
            body: JSON.stringify(dades),
        });
        const cos = await resposta.json();
        return { resposta, dades: cos };
    }

    /**
     * Fa una petició PUT a l'API.
     * @param {string} ruta
     * @param {object} dades
     * @returns {Promise<{resposta: Response, dades: any}>}
     */
    async put(ruta, dades) {
        const resposta = await fetch(`${ServeiApi.URL_BASE}${ruta}`, {
            method: 'PUT',
            headers: this.construirCapcaleres(true),
            body: JSON.stringify(dades),
        });
        const cos = await resposta.json();
        return { resposta, dades: cos };
    }

    /**
     * Fa una petició DELETE a l'API.
     * @param {string} ruta
     * @returns {Promise<Response>}
     */
    async delete(ruta) {
        const resposta = await fetch(`${ServeiApi.URL_BASE}${ruta}`, {
            method: 'DELETE',
            headers: this.construirCapcaleres(),
        });
        return resposta;
    }
}
