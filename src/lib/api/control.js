// ============================================================
// API — CONTROL DEL ROBOT — Kinetic Labs
// ============================================================
// Funciones para enviar comandos de control al robot y para
// gestionar la asignación de misiones.
//
// Cada función sabe si debe enviar a la red (online/auto)
// o solo actuar localmente (offline).
// ============================================================
import { get } from 'svelte/store';
import { API_BASE_URL } from '$lib/config/constants';
import { connectionMode, telemetry, activityLog } from '$lib/stores/robot';
import { nowTime } from '$lib/utils/format';

// ── CONTROL DE MOVIMIENTO ─────────────────────────────────────

/**
 * Envía un comando de control al robot.
 *
 * En modo OFFLINE: solo registra en consola (sin llamada de red).
 * En modo ONLINE/AUTO: hace POST a la API del robot.
 *
 * Endpoint esperado: POST /api/control
 * Body JSON:
 *   Modo tracción:  { mode: 'traccion', thrustL: number, thrustR: number }
 *   Modo vectorial: { mode: 'vectorial', heading: number, thrust: number }
 *
 * @param {object} payload - Los datos a enviar al robot
 */
export async function sendControl(payload) {
  const mode = get(connectionMode);

  if (mode === 'offline') {
    // En modo offline, no hay servidor; solo simulamos localmente
    console.log('[CONTROL OFFLINE] Comando no enviado (modo offline):', payload);
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/control`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('[CONTROL] Comando enviado correctamente:', payload);
  } catch (err) {
    // En modo AUTO el error no bloquea la UI, solo se advierte en consola
    console.warn('[CONTROL] Error al enviar comando:', err.message);
  }
}

/**
 * Detiene el robot de emergencia.
 * Resetea todos los valores de control y marca el estado como DETENIDO.
 *
 * En producción: también haría POST /api/control/stop
 *
 * @param {object} controls - Objeto con los stores de thrustL, thrustR, thrust
 *   (recibidos como parámetro para no crear dependencias circulares)
 */
export function emergencyStop(controls) {
  const { thrustL, thrustR, thrust } = controls;

  // Resetear todos los controles a cero
  thrustL.set(0);
  thrustR.set(0);
  thrust.set(0);

  // Marcar el robot como DETENIDO
  telemetry.update(t => ({ ...t, status: 'DETENIDO' }));

  // Agregar entrada al log de actividad
  activityLog.update(log => [
    { time: nowTime(), msg: '⚠ PARADA DE EMERGENCIA ACTIVADA' },
    ...log.slice(0, 9) // Mantener máximo 10 entradas en el log
  ]);

  console.warn('[EMERGENCIA] Parada de emergencia activada.');
}

// ── MISIONES ─────────────────────────────────────────────────

/**
 * Asigna una nueva misión al robot.
 * Genera un ID aleatorio, actualiza currentMission y agrega
 * una entrada al log de actividad.
 *
 * En producción: haría POST /api/mission con { target, priority }
 *
 * @param {string} target   - Destino u objetivo de la misión
 * @param {string} priority - Nivel de prioridad: 'BAJA' | 'MEDIA' | 'ALTA'
 * @param {object} stores   - Stores de currentMission y activityLog
 */
export function assignMission(target, priority, { currentMission, activityLog: log }) {
  if (!target.trim()) return; // No asignar si el destino está vacío

  // Generar ID aleatorio de 4 dígitos
  const newId = `MSN-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Registrar la asignación en el log
  log.update(entries => [
    { time: nowTime(), msg: `Misión ${newId} asignada → ${target} [${priority}]` },
    ...entries.slice(0, 9) // Mantener máximo 10 entradas
  ]);

  // Actualizar la misión actual
  currentMission.set({
    id:          newId,
    description: target,
    status:      'PENDIENTE',
    progress:    0
  });
}
