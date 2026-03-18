/**
 * Servei d'autenticació: login, logout i verificació de sessió.
 */
import { ServeiApi } from './ServeiApi.js';

export class ServeiAuth extends ServeiApi {
    /**
     * Inicia sessió amb correu i contrasenya.
     * @param {string} email
     * @param {string} contrasenya
     * @returns {Promise<{token: string, user: object}>}
     */
    async iniciarSessio(email, contrasenya) {
        const resposta = await fetch(`${ServeiApi.URL_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: contrasenya }),
        });

        const dades = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dades.message || 'Error al iniciar sessió');
        }

        localStorage.setItem('token', dades.token);
        localStorage.setItem('user', JSON.stringify(dades.user));
        return dades;
    }

    /**
     * Comprova si la sessió actual és vàlida.
     * @returns {Promise<object>} L'usuari actual.
     */
    async comprovarSessio() {
        const dades = await this.get('/me');
        return dades.user;
    }

    /**
     * Tanca la sessió actual.
     */
    tancarSessio() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    /**
     * Retorna si hi ha un token emmagatzemat.
     * @returns {boolean}
     */
    teToken() {
        return Boolean(this.obtenirToken());
    }
}
