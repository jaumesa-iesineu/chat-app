/**
 * Funcions d'ajuda generals reutilitzables.
 */

/**
 * Escapa caràcters HTML perillosos per evitar injeccions XSS.
 * @param {*} valor - Valor a escapar.
 * @returns {string}
 */
export function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Assigna text a un element pel seu ID (si existeix).
 * @param {string} id - ID de l'element.
 * @param {string} valor - Text a assignar.
 */
export function assignarText(id, valor) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = valor;
    }
}
