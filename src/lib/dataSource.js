// ============================================================
// DATA SOURCE STORE — Fuente de datos activa
// ============================================================
// Importá `dataSource` para saber si se leen datos desde
// 'firebase' o 'mqtt'. Es un store Svelte writable simple.
// ============================================================

import { writable } from 'svelte/store';

/**
 * Fuente de datos activa: 'firebase' | 'mqtt'
 * @type {import('svelte/store').Writable<'firebase' | 'mqtt'>}
 */
export const dataSource = writable('firebase');

/**
 * URL del broker MQTT — usa automáticamente el host que sirve la página,
 * así funciona tanto en localhost como desde otros dispositivos de la red.
 * @type {import('svelte/store').Writable<string>}
 */
const defaultBrokerHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const mqttBrokerUrl = writable(`ws://${defaultBrokerHost}:9001`);

/**
 * Estado de conexión MQTT: 'disconnected' | 'connecting' | 'connected' | 'error'
 * @type {import('svelte/store').Writable<string>}
 */
export const mqttStatus = writable('disconnected');
