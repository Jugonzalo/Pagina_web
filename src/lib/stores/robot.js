// ============================================================
// STORES GLOBALES DEL ROBOT — Kinetic Labs
// ============================================================
// En Svelte, un "store" es un objeto reactivo que puede ser
// leído y escrito desde cualquier componente.
//
// writable(valor)  → store que se puede leer Y escribir
// derived(stores, fn) → store calculado automáticamente
//                       a partir de otros stores
//
// Para usar un store en un componente Svelte:
//   import { telemetry } from '$lib/stores/robot';
//   $telemetry.motorL  →  accede al valor reactivo
// ============================================================
import { writable, derived } from 'svelte/store';

// ── NAVEGACIÓN ───────────────────────────────────────────────

/**
 * Vista activa del panel principal.
 * Valores posibles: 'datos' | 'controles' | 'bodega'
 */
export const activeView = writable('datos');

// ── MODO DE CONEXIÓN ─────────────────────────────────────────

/**
 * Modo de fuente de datos:
 *   'offline' → siempre usa datos simulados (sin llamadas de red)
 *   'online'  → siempre usa la API real (falla visible si no hay servidor)
 *   'auto'    → intenta la API; si falla o tarda, cae a simulación
 */
export const connectionMode = writable('auto');

/**
 * Estado detectado en tiempo real de la conexión con la API.
 * Solo es relevante cuando connectionMode === 'auto'.
 *   'verificando'  → comprobando si la API responde
 *   'conectado'    → API respondió correctamente
 *   'desconectado' → API no disponible, usando simulación
 */
export const connectivityStatus = writable('verificando');

/**
 * Store derivado: true si los datos actuales vienen de la API real.
 * Se recalcula automáticamente cuando cambian connectionMode o connectivityStatus.
 */
export const isUsingRealData = derived(
  [connectionMode, connectivityStatus],
  ([$mode, $status]) =>
    $mode === 'online' || ($mode === 'auto' && $status === 'conectado')
);

// ── TELEMETRÍA DEL ROBOT ─────────────────────────────────────

/**
 * Datos de sensores y odometría del robot.
 * Se actualiza cada TELEMETRY_INTERVAL_MS desde la API o simulación.
 */
export const telemetry = writable({
  motorL:     0.00,    // Velocidad motor izquierdo (RPM)
  motorR:     0.00,    // Velocidad motor derecho (RPM)
  angularVel: 0.000,   // Velocidad angular (rad/s)
  yaw:        0.0,     // Ángulo de orientación (grados)
  posX:       0.00,    // Posición global X (metros)
  posY:       0.00,    // Posición global Y (metros)
  status:     'LISTO'  // 'LISTO' | 'EN MOVIMIENTO' | 'DETENIDO' | 'ERROR'
});

/**
 * Historial de velocidad promedio para el gráfico sparkline.
 * Cada elemento es un número (promedio de motorL y motorR).
 */
export const speedHistory = writable([]);

/**
 * Historial de aceleración estimada para el gráfico sparkline.
 * Cada elemento es un número (variación simulada por ahora).
 */
export const accelHistory = writable([]);

// ── CONTROLES MANUALES ────────────────────────────────────────

/** Modo de control activo: 'traccion' | 'vectorial' */
export const controlMode = writable('traccion');

/** Potencia de la oruga izquierda (-100 a 100) */
export const thrustL = writable(0);

/** Potencia de la oruga derecha (-100 a 100) */
export const thrustR = writable(0);

/** Rumbo objetivo en modo vectorial (0-360°) */
export const heading = writable(0);

/** Empuje en modo vectorial (0-100) */
export const thrust = writable(0);

// ── ESTADO DE BODEGA ─────────────────────────────────────────

/** Posición del robot en la cuadrícula del mapa de bodega */
export const robotMapPos = writable({ col: 3, row: 2 });

/** Misión actualmente asignada al robot */
export const currentMission = writable({
  id:          'MSN-2041',
  description: 'Reabastecimiento — Estante C-12',
  status:      'EN PROGRESO',  // 'PENDIENTE' | 'EN PROGRESO' | 'COMPLETADA' | 'FALLIDA'
  progress:    62              // Porcentaje (0–100)
});

/** Registro cronológico de eventos de la bodega */
export const activityLog = writable([
  { time: '21:14:03', msg: 'Misión MSN-2041 iniciada'          },
  { time: '21:13:51', msg: 'Robot en zona de carga C'          },
  { time: '21:13:30', msg: 'Trayectoria recalculada'           },
  { time: '21:12:08', msg: 'Batería al 87%'                    },
  { time: '21:11:45', msg: 'Evitación de obstáculo detectada'  }
]);
