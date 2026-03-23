/**
 * Servei per gestionar les jornades d'assistència (CRUD).
 */
import { ServeiApi } from './ServeiApi.js';

export class ServeiAssistencia extends ServeiApi {
    /** @type {Array} Jornades actuals de l'usuari. */
    jornades = [];

    /**
     * Carrega les jornades de l'usuari des de l'API.
     * @returns {Promise<Array>}
     */
    async carregar() {
        const dades = await this.get('/jornades');
        this.jornades = Array.isArray(dades) ? dades : [];
        return this.jornades;
    }

    /**
     * Carrega els alumnes assignats al professor autenticat.
     * @returns {Promise<Array>}
     */
    async carregarAlumnesAssignatsProfessor() {
        return this.get('/ras/alumnes');
    }

    /**
     * Carrega jornades d'un alumne assignat al professor.
     * @param {number} alumneId
     * @returns {Promise<{alumne: object, jornades: Array}>}
     */
    async carregarJornadesAlumneProfessor(alumneId) {
        return this.get(`/jornades/professor/alumnes/${alumneId}`);
    }

    /**
     * Crea una nova jornada.
     * @param {object} dades - { data, hora_entrada, hora_sortida, activitats, ra_ids }
     * @returns {Promise<{resposta: Response, dades: any}>}
     */
    async crear(dades) {
        return this.post('/jornades', dades);
    }

    /**
     * Actualitza una jornada existent.
     * @param {number} id
     * @param {object} dades - { hora_sortida, activitats, ra_ids }
     * @returns {Promise<{resposta: Response, dades: any}>}
     */
    async actualitzar(id, dades) {
        return this.put(`/jornades/${id}`, dades);
    }

    /**
     * Actualitza una jornada d'un alumne (context professor).
     * @param {number} id
     * @param {object} dades
     * @returns {Promise<{resposta: Response, dades: any}>}
     */
    async actualitzarProfessor(id, dades) {
        return this.put(`/jornades/professor/${id}`, dades);
    }

    /**
     * Elimina una jornada.
     * @param {number} id
     * @returns {Promise<Response>}
     */
    async eliminar(id) {
        return this.delete(`/jornades/${id}`);
    }

    /**
     * Elimina una jornada d'un alumne (context professor).
     * @param {number} id
     * @returns {Promise<Response>}
     */
    async eliminarProfessor(id) {
        return this.delete(`/jornades/professor/${id}`);
    }

    /**
     * Cerca una jornada per ID dins les jornades carregades.
     * @param {number} id
     * @returns {object|undefined}
     */
    cercarPerId(id) {
        return this.jornades.find(j => j.id === id);
    }

    /** Reinicia l'estat. */
    reiniciar() {
        this.jornades = [];
    }
}
