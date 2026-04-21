// ============================================================
// API — TELEMETRÍA — Kinetic Labs
// ============================================================
// Este módulo es el único lugar que "sabe" cómo obtener datos
// de telemetría, ya sea desde la API real o desde simulación.
//
// Principio: el componente NO sabe de dónde vienen los datos;
// solo llama a updateTelemetry() y el store se actualiza solo.
// ============================================================
import { get } from 'svelte/store';
import { API_BASE_URL, API_TIMEOUT_MS, MAX_HISTORY_POINTS } from '$lib/config/constants';
import {
  telemetry,
  speedHistory,
  accelHistory,
  connectionMode,
  connectivityStatus
} from '$lib/stores/robot';

// ── SIMULACIÓN (Offline) ──────────────────────────────────────

/**
 * Rellena el store `telemetry` con valores simulados usando
 * funciones trigonométricas para que parezcan movimientos reales.
 *
 * Se llama cuando:
 *   - connectionMode === 'offline'
 *   - modo AUTO y la API no responde
 */
function applySimulatedTelemetry() {
  const t = Date.now(); // Marca de tiempo actual como "semilla" de la simulación

  telemetry.set({
    motorL:     +(Math.sin(t / 1000) * 2.5  + 5).toFixed(2),   // oscila entre 2.5 y 7.5 RPM
    motorR:     +(Math.cos(t / 1200) * 2.5  + 5).toFixed(2),   // desfasado respecto a L
    angularVel: +(Math.sin(t / 800)  * 0.05 + 0.12).toFixed(3),// pequeña oscilación
    yaw:        +((t / 100) % 360).toFixed(1),                  // gira 360° continuamente
    posX:       +(Math.sin(t / 3000) * 5 + 12).toFixed(2),      // círculo lento X
    posY:       +(Math.cos(t / 3000) * 5 +  8).toFixed(2),      // círculo lento Y
    status:     'EN MOVIMIENTO'
  });
}

// ── API REAL (Online) ─────────────────────────────────────────

/**
 * Obtiene telemetría desde la API REST del robot.
 *
 * TODO: Ajustá el endpoint y la estructura del JSON según tu backend.
 * Respuesta esperada del servidor:
 * {
 *   motorL: number, motorR: number, angularVel: number,
 *   yaw: number, posX: number, posY: number,
 *   status: 'LISTO' | 'EN MOVIMIENTO' | 'DETENIDO' | 'ERROR'
 * }
 *
 * @returns {Promise<boolean>} true si la llamada fue exitosa, false si falló
 */
async function fetchTelemetryFromAPI() {
  try {
    // AbortController permite cancelar el fetch si supera el timeout
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch(`${API_BASE_URL}/api/telemetry`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Actualizar el store con los datos recibidos
    telemetry.set({
      motorL:     +data.motorL,
      motorR:     +data.motorR,
      angularVel: +data.angularVel,
      yaw:        +data.yaw,
      posX:       +data.posX,
      posY:       +data.posY,
      status:     data.status ?? 'LISTO'
    });

    return true; // Éxito
  } catch (err) {
    // No lanzamos el error; el caller decide qué hacer con false
    console.warn('[API] Telemetría no disponible:', err.message);
    return false;
  }
}

// ── LOOP PRINCIPAL ────────────────────────────────────────────

/**
 * Tick de actualización ejecutado cada TELEMETRY_INTERVAL_MS.
 *
 * Lógica de fuente de datos según el modo:
 *   - 'offline' → siempre simulación
 *   - 'online'  → siempre API (sin fallback)
 *   - 'auto'    → API con fallback automático a simulación
 *
 * Después de actualizar telemetría, también actualiza los
 * historiales de velocidad y aceleración para los gráficos.
 */
export async function updateTelemetry() {
  const mode = get(connectionMode); // Leer valor actual del store
  let apiOk  = false;

  // Intentar la API si el modo lo requiere
  if (mode === 'online' || mode === 'auto') {
    apiOk = await fetchTelemetryFromAPI();
  }

  // Si la API falló o estamos en offline → usar simulación
  if (!apiOk) {
    applySimulatedTelemetry();
  }

  // Actualizar indicador de conectividad en el sidebar
  if (mode === 'offline') {
    connectivityStatus.set('desconectado'); // Desconexión intencional
  } else {
    connectivityStatus.set(apiOk ? 'conectado' : 'desconectado');
  }

  // Actualizar historial de velocidad promedio (para el sparkline)
  const currentTelemetry  = get(telemetry);
  const avgSpeed = (Math.abs(currentTelemetry.motorL) + Math.abs(currentTelemetry.motorR)) / 2;

  speedHistory.update(hist =>
    [...hist.slice(-(MAX_HISTORY_POINTS - 1)), avgSpeed]
  );

  // Actualizar historial de aceleración (simulada por ahora)
  accelHistory.update(hist =>
    [...hist.slice(-(MAX_HISTORY_POINTS - 1)), +(Math.random() * 0.4 - 0.2).toFixed(3)]
  );
}

/**
 * Cambia el modo de conexión y fuerza una actualización inmediata,
 * para que el UI refleje el cambio sin esperar el próximo tick.
 *
 * @param {'offline'|'online'|'auto'} mode - Nuevo modo de conexión
 */
export function setConnectionMode(mode) {
  connectionMode.set(mode);

  // Mostrar 'verificando' mientras se hace el primer tick (excepto en offline)
  connectivityStatus.set(mode !== 'offline' ? 'verificando' : 'desconectado');

  // Forzar actualización inmediata
  updateTelemetry();
}
