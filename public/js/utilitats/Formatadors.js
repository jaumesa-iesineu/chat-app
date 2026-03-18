/**
 * Funcions de formatació de dades (hores, dates, percentatges, etc.).
 */

/** Objectiu d'hores per defecte. */
export const OBJECTIU_HORES_DEFECTE = 200;

/** Rols que tenen seguiment d'alumnes. */
export const ROLS_AMB_SEGUIMENT = new Set(['professor', 'empresari']);

/**
 * Converteix una cadena d'hora (HH:MM o HH:MM:SS) a minuts totals.
 * @param {string|null} hora
 * @returns {number|null}
 */
export function horaAMinuts(hora) {
    if (typeof hora !== 'string') return null;
    const parts = hora.split(':').map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return null;
    const [hores, minuts, segons = 0] = parts;
    return (hores * 60) + minuts + (segons / 60);
}

/**
 * Calcula les hores totals realitzades a partir d'una llista de jornades.
 * @param {Array} jornades
 * @returns {number}
 */
export function calcularHoresRealitzades(jornades) {
    if (!Array.isArray(jornades)) return 0;

    const minutsTotals = jornades.reduce((acum, jornada) => {
        const entrada = horaAMinuts(jornada?.hora_entrada);
        const sortida = horaAMinuts(jornada?.hora_sortida);
        if (entrada === null || sortida === null) return acum;
        const durada = sortida - entrada;
        return durada > 0 ? acum + durada : acum;
    }, 0);

    return minutsTotals / 60;
}

/**
 * Formata un nombre d'hores a text localitzat en català.
 * @param {number} hores
 * @returns {string}
 */
export function formatarHores(hores) {
    const arrodonides = Math.round(hores * 10) / 10;
    if (Number.isInteger(arrodonides)) return String(arrodonides);
    return arrodonides.toLocaleString('ca-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

/**
 * Obté les inicials d'un nom (màxim 2 lletres).
 * @param {string} nom
 * @returns {string}
 */
export function obtenirInicials(nom) {
    if (typeof nom !== 'string') return '--';
    const paraules = nom.trim().split(/\s+/).filter(Boolean);
    if (paraules.length === 0) return '--';
    return paraules.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
}

/**
 * Formata una data per mostrar a l'usuari.
 * @param {string|null} data
 * @returns {string}
 */
export function formatarData(data) {
    if (!data) return 'No disponible';
    const obj = new Date(data);
    if (Number.isNaN(obj.getTime())) return 'No disponible';
    return obj.toLocaleDateString('ca-ES');
}

/**
 * Formata una data de forma curta.
 * @param {string|null} data
 * @returns {string}
 */
export function formatarDataCurta(data) {
    if (!data) return '-';
    const obj = new Date(data);
    if (Number.isNaN(obj.getTime())) return '-';
    return obj.toLocaleDateString('ca-ES');
}

/**
 * Formata un percentatge.
 * @param {number} valor
 * @returns {string}
 */
export function formatarPercentatge(valor) {
    const p = Number(valor);
    if (!Number.isFinite(p)) return '0%';
    return `${Math.round(p)}%`;
}

/**
 * Retorna l'etiqueta llegible d'un rol.
 * @param {string} rol
 * @returns {string}
 */
export function obtenirEtiquetaRol(rol) {
    const normalitzat = String(rol || '').toLowerCase();
    const mapa = { alumne: 'Alumne', professor: 'Professor', empresari: 'Empresa' };
    if (mapa[normalitzat]) return mapa[normalitzat];
    if (!normalitzat) return 'No definit';
    return normalitzat.charAt(0).toUpperCase() + normalitzat.slice(1);
}

/**
 * Calcula el resum (completes/pendents) d'una llista de jornades.
 * @param {Array} jornades
 * @returns {{ total: number, completes: number, pendents: number }}
 */
export function calcularResumJornades(jornades) {
    const valides = Array.isArray(jornades) ? jornades : [];
    let completes = 0;
    let pendents = 0;

    for (const jornada of valides) {
        const teSortida = Boolean(jornada?.hora_sortida);
        const teActivitats = typeof jornada?.activitats === 'string'
            ? jornada.activitats.trim().length > 0
            : Boolean(jornada?.activitats);
        const teRas = Array.isArray(jornada?.ras) && jornada.ras.length > 0;

        if (teSortida && teActivitats && teRas) {
            completes++;
        } else {
            pendents++;
        }
    }

    return { total: valides.length, completes, pendents };
}
