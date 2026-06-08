// ============================================================
// MQTT — Cliente y tópicos del robot
// ============================================================
// Usa mqtt.js (WebSocket) para conectarse a un broker MQTT.
// Importá `mqttClient`, `mqttTopics`, `connectMQTT` y
// `disconnectMQTT` donde los necesites.
// ============================================================

import mqtt from 'mqtt';

// ── MAPA DE TÓPICOS ──────────────────────────────────────────
export const mqttTopics = {
  telemetria: {
    v_der:              'robot/telemetria/v_der',
    v_izq:              'robot/telemetria/v_izq',
    v_total:            'robot/telemetria/v_total',
    teta:               'robot/telemetria/teta',
    omega:              'robot/telemetria/omega',
    x:                  'robot/telemetria/x',
    y:                  'robot/telemetria/y',
    d_pared_der:        'robot/telemetria/d_pared_der',
    d_pared_izq:        'robot/telemetria/d_pared_izq',
    d_pared_trasera:    'robot/telemetria/d_pared_trasera',
    distancia_recorrida:'robot/telemetria/distancia_recorrida',
    pilas:              'robot/telemetria/pilas',
  },
  estados: {
    conexion_esp:      'robot/estados/conectado_esp',
    conexion_firebase: 'robot/estados/conectado_firebase',
    modo_control:      'robot/estados/modo_control',
    flag_pos:          'robot/estados/flag_pos',
    flag_obstaculo:    'robot/estados/flag_pos',
    ejecutando:        'robot/estados/ejecutando',
    grabar:            'robot/estados/grabar',
    reinicio:          'robot/estados/reinicio',
  },
  comandos: {
    duty_der:    'robot/comandos/duty_der',
    duty_izq:    'robot/comandos/duty_izq',
    teta_ref:    'robot/comandos/teta_ref',
    v_der_ref:   'robot/comandos/v_der_ref',
    v_izq_ref:   'robot/comandos/v_izq_ref',
    v_total_ref: 'robot/comandos/v_total_ref',
    x_ref:       'robot/comandos/x_ref',
    y_ref:       'robot/comandos/y_ref',
    w_ref:       'robot/comandos/w_ref',    
  },
};

// ── ESTADO DEL CLIENTE ────────────────────────────────────────
/** @type {import('mqtt').MqttClient | null} */
let client = null;

/** @type {Map<string, (value: string) => void>} */
const topicHandlers = new Map();

/**
 * Conecta al broker MQTT via WebSocket.
 * @param {string} brokerUrl  URL del broker, ej: 'ws://192.168.1.100:9001'
 * @param {{ username?: string, password?: string }} [opts]
 * @returns {import('mqtt').MqttClient}
 */
export function connectMQTT(brokerUrl, opts = {}) {
  if (client) return client;

  client = mqtt.connect(brokerUrl, {
    username: opts.username,
    password: opts.password,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on('message', (topic, payload) => {
    const handler = topicHandlers.get(topic);
    if (handler) handler(payload.toString());
  });

  return client;
}

/**
 * Desconecta el cliente MQTT y limpia los handlers.
 */
export function disconnectMQTT() {
  if (client) {
    client.end(true);
    client = null;
    topicHandlers.clear();
  }
}

/**
 * Suscribe a un tópico y registra su callback.
 * @param {string} topic
 * @param {(value: string) => void} handler
 */
export function subscribeTopic(topic, handler) {
  if (!client) return;
  topicHandlers.set(topic, handler);
  client.subscribe(topic);
}

/**
 * Cancela la suscripción a un tópico.
 * @param {string} topic
 */
export function unsubscribeTopic(topic) {
  if (!client) return;
  client.unsubscribe(topic);
  topicHandlers.delete(topic);
}

/**
 * Publica un valor en un tópico MQTT.
 * @param {string} topic
 * @param {string | number} value
 */
export function publishMQTT(topic, value) {
  if (!client) return;
  client.publish(topic, String(value));
}

/**
 * Devuelve el cliente MQTT activo (o null si no conectado).
 * @returns {import('mqtt').MqttClient | null}
 */
export function getMqttClient() {
  return client;
}
