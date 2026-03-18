/**
 * Servei per gestionar el comptador de missatges no llegits del xat.
 */
import { ServeiApi } from './ServeiApi.js';

export class ServeiXat extends ServeiApi {
    /** @type {number|null} ID de l'interval de polling. */
    _intervalId = null;

    /** Interval de polling en mil·lisegons. */
    static INTERVAL_MS = 7000;

    /**
     * Consulta el total de missatges no llegits.
     * @returns {Promise<number>}
     */
    async obtenirNoLlegits() {
        try {
            const dades = await this.get('/conversations');
            const converses = dades.conversations || [];
            return converses.reduce((suma, c) => suma + (c.unread_count || 0), 0);
        } catch {
            return 0;
        }
    }

    /**
     * Inicia el polling periòdic de missatges no llegits.
     * @param {function(number): void} callback - Funció cridada amb el total de no llegits.
     */
    iniciarPolling(callback) {
        this.aturarPolling();

        const comprovar = async () => {
            const total = await this.obtenirNoLlegits();
            callback(total);
        };

        comprovar();
        this._intervalId = setInterval(comprovar, ServeiXat.INTERVAL_MS);
    }

    /** Atura el polling periòdic. */
    aturarPolling() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
}
