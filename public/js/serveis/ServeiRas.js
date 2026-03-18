/**
 * Servei per gestionar els Resultats d'Aprenentatge (RA).
 */
import { ServeiApi } from './ServeiApi.js';

export class ServeiRas extends ServeiApi {
    /** @type {Array} Tots els mòduls amb els seus RA. */
    moduls = [];

    /** @type {Set<number>} IDs dels RA marcats a l'històric de jornades. */
    marcatsHistoric = new Set();

    /** @type {boolean} Si ja s'ha carregat l'històric. */
    historicCarregat = false;

    /**
     * Carrega els mòduls i RA des de l'API (amb cache).
     * @returns {Promise<Array>}
     */
    async carregarModuls() {
        if (this.moduls.length > 0) return this.moduls;
        this.moduls = await this.get('/ras');
        if (!Array.isArray(this.moduls)) this.moduls = [];
        return this.moduls;
    }

    /**
     * Actualitza el conjunt de RA marcats a partir de jornades.
     * @param {Array} jornades
     */
    actualitzarHistoric(jornades) {
        const marcats = new Set();
        if (Array.isArray(jornades)) {
            for (const jornada of jornades) {
                if (!Array.isArray(jornada?.ras)) continue;
                for (const ra of jornada.ras) {
                    const id = Number(ra?.id);
                    if (Number.isFinite(id)) marcats.add(id);
                }
            }
        }
        this.marcatsHistoric = marcats;
        this.historicCarregat = true;
    }

    /**
     * Assegura que l'històric de RA marcats estigui carregat.
     * Si no ho està, fa una petició per obtenir les jornades.
     */
    async assegurarHistoric() {
        if (this.historicCarregat) return;
        try {
            const jornades = await this.get('/jornades');
            this.actualitzarHistoric(Array.isArray(jornades) ? jornades : []);
        } catch (error) {
            console.error('Error carregant històric de RA:', error);
            this.actualitzarHistoric([]);
        }
    }

    /**
     * Filtra els mòduls per un text de cerca.
     * @param {string} textCerca
     * @returns {Array}
     */
    filtrar(textCerca) {
        const cerca = textCerca.toLowerCase();
        return this.moduls
            .map(modul => ({
                ...modul,
                ras: modul.ras.filter(ra =>
                    ra.ra.toLowerCase().includes(cerca)
                    || (ra.descripcio || '').toLowerCase().includes(cerca)
                    || modul.modul.toLowerCase().includes(cerca)
                    || modul.codi.toLowerCase().includes(cerca)
                ),
            }))
            .filter(modul => modul.ras.length > 0);
    }

    /** Reinicia l'estat del servei. */
    reiniciar() {
        this.marcatsHistoric = new Set();
        this.historicCarregat = false;
    }
}
