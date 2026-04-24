// ============================================================
// FIREBASE — Inicialización y exportación de servicios
// ============================================================
// Este archivo inicializa Firebase UNA SOLA VEZ y exporta
// los objetos de servicio para usar en toda la app.
//
// Para agregar un nuevo servicio (Firestore, Auth, Storage…)
// simplemente importarlo aquí y exportarlo.
// ============================================================

import { initializeApp }  from 'firebase/app';
import { getDatabase }    from 'firebase/database';
import { getAnalytics }   from 'firebase/analytics';

// ── CONFIGURACIÓN DEL PROYECTO ───────────────────────────────
// Estos valores los encontrás en Firebase Console →
// Configuración del proyecto → SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyCutgJmyEmB8EyjYv6VuqT62HgJogDQ-b4",
  authDomain: "project-yalent.firebaseapp.com",
  databaseURL: "https://project-yalent-default-rtdb.firebaseio.com",
  projectId: "project-yalent",
  storageBucket: "project-yalent.firebasestorage.app",
  messagingSenderId: "574913104837",
  appId: "1:574913104837:web:f330dd9191412ae7a159ac",
  measurementId: "G-TKWN2DWVS8"
};
// ── INICIALIZACIÓN ───────────────────────────────────────────
const app = initializeApp(firebaseConfig);

/**
 * Instancia de Realtime Database.
 * Usala con ref(), set(), get(), onValue(), etc.
 */
export const db = getDatabase(app);

/**
 * Instancia de Google Analytics (GA4).
 * Usala con logEvent() para registrar acciones del usuario.
 */
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


// ============================================================
// GUÍA DE LECTURA Y ESCRITURA — REALTIME DATABASE
// ============================================================
// Importá `db` desde este archivo en el componente donde lo
// necesites y luego usá las funciones de firebase/database.
//
// IMPORTACIONES NECESARIAS (en el archivo que las use):
// ─────────────────────────────────────────────────────────────
// import { db } from '$lib/firebase';
// import {
//   ref,        // Crea una referencia a un nodo de la DB
//   set,        // Escribe (sobreescribe) un valor en un nodo
//   get,        // Lee el valor de un nodo UNA sola vez
//   update,     // Actualiza campos específicos sin sobreescribir
//   push,       // Agrega un nuevo elemento con ID autogenerado
//   remove,     // Elimina un nodo
//   onValue,    // Escucha cambios en TIEMPO REAL (suscripción)
//   off,        // Cancela una suscripción activa
// } from 'firebase/database';
// ─────────────────────────────────────────────────────────────


// ── 1. LEER DATOS (una sola vez) ─────────────────────────────
//
// Úsalo cuando solo necesitás el valor actual, sin escuchar
// cambios continuos. Por ejemplo, al cargar la página.
//
// const snapshot = await get(ref(db, 'robot/telemetry'));
// if (snapshot.exists()) {
//   const data = snapshot.val();
//   // data = { motorL: 5.2, motorR: 4.8, yaw: 90.0, ... }
// }


// ── 2. ESCUCHAR EN TIEMPO REAL ───────────────────────────────
//
// Úsalo para datos que cambian frecuentemente (telemetría).
// El callback se dispara cada vez que el valor cambia en la DB.
// Guardá el "unsubscribe" para cancelar la escucha en onDestroy.
//
// const telemetryRef = ref(db, 'robot/telemetry');
// const unsubscribe = onValue(telemetryRef, (snapshot) => {
//   const data = snapshot.val();
//   if (data) {
//     telemetry.motorL     = data.motorL;
//     telemetry.motorR     = data.motorR;
//     telemetry.angularVel = data.angularVel;
//     telemetry.yaw        = data.yaw;
//     telemetry.posX       = data.posX;
//     telemetry.posY       = data.posY;
//     telemetry.status     = data.status;
//   }
// });
//
// // En onDestroy del componente Svelte:
// onDestroy(() => {
//   off(telemetryRef);  // Cancela la suscripción
// });


// ── 3. ESCRIBIR DATOS (set — sobreescribe el nodo) ───────────
//
// Úsalo cuando querés reemplazar TODOS los campos de un nodo.
// Ejemplo: guardar un comando de control completo.
//
// await set(ref(db, 'robot/control'), {
//   mode:    'traccion',
//   thrustL: 75,
//   thrustR: 75,
// });


// ── 4. ACTUALIZAR CAMPOS ESPECÍFICOS ─────────────────────────
//
// Úsalo cuando querés cambiar solo algunos campos sin tocar
// los demás. Es más seguro que set() para datos compartidos.
//
// await update(ref(db, 'robot/control'), {
//   thrustL: 50,  // Solo cambia thrustL
// });


// ── 5. AGREGAR ENTRADA AL LOG (push) ─────────────────────────
//
// push() genera un ID único ordenado por tiempo.
// Ideal para registros de actividad o historial de misiones.
//
// await push(ref(db, 'robot/activityLog'), {
//   time: new Date().toLocaleTimeString('es-CL', { hour12: false }),
//   msg:  'Misión MSN-2041 iniciada',
// });


// ── 6. ELIMINAR UN NODO ──────────────────────────────────────
//
// await remove(ref(db, 'robot/control'));


// ============================================================
// ESTRUCTURA SUGERIDA DE NODOS EN LA BASE DE DATOS
// ============================================================
// Podés organizar tu DB así (ajustá según tus necesidades):
//
// robot/
//   telemetry/
//     motorL:      5.20
//     motorR:      4.80
//     angularVel:  0.120
//     yaw:         90.0
//     posX:        12.00
//     posY:        8.00
//     status:      "EN MOVIMIENTO"
//
//   control/
//     mode:        "traccion"
//     thrustL:     75
//     thrustR:     75
//     heading:     0
//     thrust:      0
//
//   mission/
//     current/
//       id:          "MSN-2041"
//       description: "Reabastecimiento — Estante C-12"
//       status:      "EN PROGRESO"
//       progress:    62
//
//   activityLog/
//     <push_id_1>/
//       time: "21:14:03"
//       msg:  "Misión MSN-2041 iniciada"
//     <push_id_2>/
//       time: "21:13:51"
//       msg:  "Robot en zona de carga C"