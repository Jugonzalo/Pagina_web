// ============================================================
// UTILIDADES DE FORMATO — Kinetic Labs
// ============================================================
// Funciones pequeñas de ayuda para formatear datos antes de
// mostrarlos en la interfaz.
// ============================================================

/**
 * Mapea el status del robot a una clase CSS correspondiente.
 * La clase CSS define el color del indicador de estado en el sidebar.
 *
 * @param {string} status - Estado del robot ('LISTO', 'EN MOVIMIENTO', etc.)
 * @returns {string}      - Nombre de la clase CSS a aplicar
 *
 * Las clases están definidas en +page.svelte (estilos globales):
 *   .status-ready   → puntico verde (listo)
 *   .status-active  → puntico azul parpadeante (en movimiento)
 *   .status-warning → puntico ámbar (detenido)
 *   .status-error   → puntico rojo (error crítico)
 */
export function statusClass(status) {
  const map = {
    'LISTO':         'status-ready',
    'EN MOVIMIENTO': 'status-active',
    'DETENIDO':      'status-warning',
    'ERROR':         'status-error'
  };
  // Si el status no está en el mapa, se retorna la clase por defecto
  return map[status] ?? 'status-ready';
}

/**
 * Retorna la hora actual como string con formato HH:MM:SS.
 * Usa el locale chileno (formato 24h) para consistencia con el log.
 *
 * @returns {string} - Hora actual, ej: "14:32:07"
 */
export function nowTime() {
  return new Date().toLocaleTimeString('es-CL', { hour12: false });
}
