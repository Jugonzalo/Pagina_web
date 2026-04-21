// ============================================================
// CONSTANTES DE CONFIGURACIÓN — Kinetic Labs
// ============================================================
// Este archivo centraliza TODOS los valores de configuración.
// Si necesitás cambiar la URL de la API, el nombre del robot,
// o los intervalos de actualización, editá solo este archivo.
// ============================================================

// ── IDENTIDAD DEL ROBOT ──────────────────────────────────────

/** Nombre del robot mostrado en la interfaz */
export const ROBOT_ID = 'Yalent';

/** Nombre del protocolo activo (aparece bajo el ID del robot) */
export const ACTIVE_PROTOCOL = 'PROTOCOLO EMERGENTE';

// ── RED Y API ────────────────────────────────────────────────

/**
 * URL base de la API REST del robot.
 * Ejemplo de producción: 'http://192.168.1.50:8080'
 * En desarrollo apunta a localhost.
 */
export const API_BASE_URL = 'http://localhost:8080';

/**
 * Tiempo máximo en ms que se espera respuesta de la API.
 * Si la API demora más, se considera caída y se usa simulación.
 */
export const API_TIMEOUT_MS = 3000;

// ── TELEMETRÍA ───────────────────────────────────────────────

/** Intervalo en ms entre cada actualización de telemetría */
export const TELEMETRY_INTERVAL_MS = 800;

/**
 * Máximo de puntos guardados en el historial de los gráficos.
 * Más puntos → gráfico más detallado pero más pesado.
 */
export const MAX_HISTORY_POINTS = 20;
