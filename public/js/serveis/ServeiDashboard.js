/**
 * Servei per obtenir el resum del dashboard.
 */
import { ServeiApi } from './ServeiApi.js';
import {
    OBJECTIU_HORES_DEFECTE,
    calcularResumJornades,
    calcularHoresRealitzades,
} from '../utilitats/Formatadors.js';

export class ServeiDashboard extends ServeiApi {
    /** @type {object|null} Dades del resum carregat. */
    resum = null;

    /** @type {boolean} Indica si ja s'ha intentat carregar. */
    carregat = false;

    /**
     * Carrega el resum del dashboard des de l'API.
     * @returns {Promise<object|null>}
     */
    async carregar() {
        try {
            this.resum = await this.get('/dashboard/summary');
            this.carregat = true;
            return this.resum;
        } catch (error) {
            console.error('Error carregant resum de dashboard:', error);
            this.resum = null;
            this.carregat = true;
            return null;
        }
    }

    /** Reinicia l'estat. */
    reiniciar() {
        this.resum = null;
        this.carregat = false;
    }

    /**
     * Retorna l'objectiu d'hores (del servidor o per defecte).
     * @returns {number}
     */
    obtenirObjectiuHores() {
        const objectiu = Number(this.resum?.objective_hours);
        return (Number.isFinite(objectiu) && objectiu > 0) ? objectiu : OBJECTIU_HORES_DEFECTE;
    }

    /**
     * Retorna el resum propi de l'usuari.
     * Si no hi ha dades del servidor, calcula localment.
     * @param {Array} jornadesLocals - Jornades locals com a fallback.
     * @returns {object}
     */
    obtenirResumPropi(jornadesLocals = []) {
        if (this.resum?.own_summary && typeof this.resum.own_summary === 'object') {
            return this.resum.own_summary;
        }

        const resumLocal = calcularResumJornades(jornadesLocals);
        const hores = calcularHoresRealitzades(jornadesLocals);
        const objectiu = this.obtenirObjectiuHores();
        const percentatge = Math.min((hores / objectiu) * 100, 100);

        return {
            total_jornades: resumLocal.total,
            completed_jornades: resumLocal.completes,
            pending_jornades: resumLocal.pendents,
            hours_done: Math.round(hores * 10) / 10,
            hours_remaining: Math.max(0, Math.round((objectiu - hores) * 10) / 10),
            progress_percentage: Math.round(percentatge * 10) / 10,
            last_jornada_date: null,
        };
    }

    /**
     * Retorna el resum global dels alumnes assignats.
     * @returns {object}
     */
    obtenirResumAlumnes() {
        if (this.resum?.students_summary && typeof this.resum.students_summary === 'object') {
            return this.resum.students_summary;
        }
        return {
            total_assigned: 0,
            active_recently: 0,
            with_pending_jornades: 0,
            completed_target: 0,
            with_open_shift_today: 0,
            average_progress_percentage: 0,
            total_hours_done: 0,
            total_hours_remaining: 0,
        };
    }

    /**
     * Retorna la llista d'alumnes assignats.
     * @returns {Array}
     */
    obtenirAlumnesAssignats() {
        if (!this.resum || !Array.isArray(this.resum.assigned_students)) return [];
        return this.resum.assigned_students;
    }
}
