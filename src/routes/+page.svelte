<script>
  import Sidebar from '$lib/components/Sidebar.svelte';
  import DatosView from '$lib/components/DatosView.svelte';
  import ControlesView from '$lib/components/ControlesView.svelte';
  import BodegaView from '$lib/components/BodegaView.svelte';

  // ── Firebase ─────────────────────────────────────────────────
  import {
    ref, set, get, update, push, remove, onValue, off,
  } from 'firebase/database';
  import { db } from '$lib/firebase';

  // ── MQTT ─────────────────────────────────────────────────────
  import {
    mqttTopics,
    connectMQTT, disconnectMQTT,
    subscribeTopic, unsubscribeTopic,
    publishMQTT, getMqttClient,
  } from '$lib/mqtt.js';
  import { dataSource, mqttBrokerUrl, mqttStatus } from '$lib/dataSource.js';

  import { onDestroy } from 'svelte';
  import { get as storeGet } from 'svelte/store';

  // ============================================================
  // CONSTANTES DE TEXTO
  // ============================================================

  const ROBOT_ID        = 'Yalent';
  const ACTIVE_PROTOCOL = 'PROTOCOLO EMERGENTE';

  // ── RUTAS FIREBASE ───────────────────────────────────────────
  const FB = {
    telemetria: {
      v_der:           'Telemetria/v_derecha',
      v_izq:           'Telemetria/v_izquierda',
      v_total:         'Telemetria/v_total',
      teta:            'Telemetria/teta',
      omega:           'Telemetria/v_angular',
      x:               'Telemetria/x_pos',
      y:               'Telemetria/y_pos',
      d_pared_der:     'Telemetria/d_pared_derecha',
      d_pared_izq:     'Telemetria/d_pared_izquierda',
      d_pared_trasera: 'Telemetria/d_pared_trasera',
      pilas:           'Telemetria/pilas',
    },
    estados: {
      conexion_esp:      'Estados/python_a_esp',
      conexion_firebase: 'Estados/firebase_a_python',
      modo_control:      'Estados/tipo_control',
      flag_pos:          'Estados/flag_pos',
      flag_obstaculo:    'Estados/flag_obstaculo',
      ejecutando:        'Estados/ejecutando',
      grabar:            'Estados/estado_grabacion',
      reinicio:          'Estados/reinicio_esp',
    },
    comandos: {
      duty_der:    'Comandos/duty_der',
      duty_izq:    'Comandos/duty_izq',
      teta_ref:    'Comandos/teta_ref',
      v_der_ref:   'Comandos/v_der_ref',
      v_izq_ref:   'Comandos/v_izq_ref',
      w_ref:       'Comandos/w_ref',
      v_total_ref: 'Comandos/v_total_ref',
      x_ref:       'Comandos/x_ref',
      y_ref:       'Comandos/y_ref',
    },
  };

  // ============================================================
  // ESTADO DE NAVEGACIÓN
  // ============================================================

  let activeView = 'datos';

  // ============================================================
  // FUENTE DE DATOS — store reactivo
  // ============================================================

  let currentSource = 'firebase';
  let brokerUrl     = 'ws://localhost:9001';

  const unsubSource = dataSource.subscribe(v => { currentSource = v; });
  const unsubBroker = mqttBrokerUrl.subscribe(v => { brokerUrl = v; });

  // ============================================================
  // DATOS DE TELEMETRÍA
  // ============================================================

  let telemetry = {
    motorL:              0.00,
    motorR:              0.00,
    angularVel:          0.000,
    yaw:                 0.0,
    posX:                0.00,
    posY:                0.00,
    v_total:             0.00,
    dist_pared_der:      0.00,
    dist_pared_izq:      0.00,
    dist_pared_trasera:  0.00,
    pilas:               0,
    status:              'LISTO',
  };

  /** @type {number[]} */
  let speedHistory = [];
  /** @type {number[]} */
  let accelHistory = [];

  // ============================================================
  // ESTADO DE BODEGA
  // ============================================================

  let robotMapPos = { col: 3, row: 2 };

  let currentMission = {
    id:          'MSN-2041',
    description: 'Reabastecimiento — Estante C-12',
    status:      'EN PROGRESO',
    progress:    62,
  };

  let activityLog = [
    { time: '21:14:03', msg: 'Misión MSN-2041 iniciada'         },
    { time: '21:13:51', msg: 'Robot en zona de carga C'         },
    { time: '21:13:30', msg: 'Trayectoria recalculada'          },
    { time: '21:12:08', msg: 'Batería al 87%'                   },
    { time: '21:11:45', msg: 'Evitación de obstáculo detectada' },
  ];

  let newMissionTarget   = '';
  let newMissionPriority = 'MEDIA';

  // ============================================================
  // ESTADO DE CONTROLES MANUALES
  // ============================================================

  let thrustL       = 0;
  let thrustR       = 0;
  let heading       = 0;
  let thrust        = 0;
  let comando_v_der = 0;
  let comando_v_izq = 0;
  let comando_w = 0;   
  let controlMode   = 'traccion';
  let v_total_ref   = 0;
  let teta_ref      = 0;

  // ============================================================
  // ESTADO DE CONEXIÓN
  // ============================================================

  let connectionMode     = 'auto';
  let connectivityStatus = 'desconectado';

  /** @param {string} mode */
  function setConnectionMode(mode) {
    connectionMode     = mode;
    connectivityStatus = mode === 'offline' ? 'desconectado' : 'verificando';
  }

  // ============================================================
  // SUSCRIPCIÓN FIREBASE
  // ============================================================

  const telemetriaRef = ref(db, 'Telemetria');

  /** @type {(() => void) | null} */
  let firebaseUnsub = null;

  function startFirebase() {
    if (firebaseUnsub) return;
    firebaseUnsub = onValue(telemetriaRef, (snapshot) => {
      const d = snapshot.val();
      if (!d) return;
      telemetry.motorR             = d.v_derecha         ?? 0;
      telemetry.motorL             = d.v_izquierda       ?? 0;
      telemetry.v_total            = d.v_total           ?? 0;
      telemetry.yaw                = d.teta              ?? 0;
      telemetry.angularVel         = d.v_angular         ?? 0;
      telemetry.posX               = d.x_pos             ?? 0;
      telemetry.posY               = d.y_pos             ?? 0;
      telemetry.dist_pared_der     = d.d_pared_derecha   ?? 0;
      telemetry.dist_pared_izq     = d.d_pared_izquierda ?? 0;
      telemetry.dist_pared_trasera = d.d_pared_trasera   ?? 0;
      telemetry.pilas              = d.pilas             ?? 0;
      telemetry = telemetry;
    });
  }

  function stopFirebase() {
    if (firebaseUnsub) {
      firebaseUnsub();
      firebaseUnsub = null;
    }
  }

  // ============================================================
  // SUSCRIPCIÓN MQTT
  // ============================================================

  function startMQTT() {
    mqttStatus.set('connecting');
    const client = connectMQTT(brokerUrl);

    client.on('connect', () => {
      mqttStatus.set('connected');
      const T = mqttTopics.telemetria;
      subscribeTopic(T.v_der,           v => { telemetry.motorR             = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.v_izq,           v => { telemetry.motorL             = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.v_total,         v => { telemetry.v_total            = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.teta,            v => { telemetry.yaw                = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.omega,           v => { telemetry.angularVel         = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.x,               v => { telemetry.posX               = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.y,               v => { telemetry.posY               = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.d_pared_der,     v => { telemetry.dist_pared_der     = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.d_pared_izq,     v => { telemetry.dist_pared_izq     = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.d_pared_trasera, v => { telemetry.dist_pared_trasera = parseFloat(v) || 0; telemetry = telemetry; });
      subscribeTopic(T.pilas,           v => { telemetry.pilas              = parseFloat(v) || 0; telemetry = telemetry; });
    });

    client.on('error', (err) => {
      console.error('[MQTT]', err);
      mqttStatus.set('error');
    });

    client.on('close', () => {
      if (storeGet(mqttStatus) !== 'disconnected') mqttStatus.set('disconnected');
    });
  }

  function stopMQTT() {
    mqttStatus.set('disconnected');
    disconnectMQTT();
  }

  // ============================================================
  // CAMBIO DE FUENTE
  // ============================================================

  const unsubDataSource = dataSource.subscribe((source) => {
    if (source === 'firebase') {
      stopMQTT();
      startFirebase();
    } else {
      stopFirebase();
      startMQTT();
    }
  });

  startFirebase();

  // ============================================================
  // COMANDOS DE ESCRITURA — según la fuente activa
  // ============================================================

  /**
   * @param {{ firebase: string, mqtt: string }} paths
   * @param {string | number} value
   */
  function writeValue(paths, value) {
    if (currentSource === 'firebase') {
      set(ref(db, paths.firebase), value);
    } else {
      publishMQTT(paths.mqtt, value);
    }
  }

  function sendControl() {
    if (controlMode === 'Duty') {
      writeValue({ firebase: FB.comandos.duty_izq,  mqtt: mqttTopics.comandos.duty_izq  }, Math.floor(thrustL * 2.55));
      writeValue({ firebase: FB.comandos.duty_der,  mqtt: mqttTopics.comandos.duty_der  }, Math.floor(thrustR * 2.55));
      writeValue({ firebase: FB.comandos.teta_ref,  mqtt: mqttTopics.comandos.teta_ref  }, Math.floor(heading));
    } else if (controlMode === 'Vel') {
      writeValue({ firebase: FB.comandos.teta_ref,  mqtt: mqttTopics.comandos.teta_ref  }, Math.floor(heading));
      writeValue({ firebase: FB.comandos.v_izq_ref, mqtt: mqttTopics.comandos.v_izq_ref }, comando_v_izq);
      writeValue({ firebase: FB.comandos.v_der_ref, mqtt: mqttTopics.comandos.v_der_ref }, comando_v_der);
      writeValue({ firebase: FB.comandos.w_ref, mqtt: mqttTopics.comandos.w_ref }, comando_w);
    } else if (controlMode === 'VTeta') {
      writeValue({ firebase: FB.comandos.v_total_ref, mqtt: mqttTopics.comandos.v_total_ref }, v_total_ref);
      writeValue({ firebase: FB.comandos.teta_ref,    mqtt: mqttTopics.comandos.teta_ref    }, Math.floor(teta_ref));
    }
  }

  function syncThrustToWheels() {
    comando_v_izq = thrust;
    comando_v_der = thrust;
    sendControl();
  }

  function assignMission() {
    if (!newMissionTarget.trim()) return;
    newMissionTarget = '';
  }

  function emergencyStop() {
    thrustL       = 0;
    thrustR       = 0;
    thrust        = 0;
    comando_v_izq = 0;
    comando_v_der = 0;
    comando_w     = 0;
    v_total_ref   = 0;
    teta_ref      = 0;
    telemetry.status = 'DETENIDO';
    sendControl();
  }

  // ============================================================
  // GRABACIÓN
  // ============================================================

  let grabando = false;

  function toggleGrabar() {
    grabando = !grabando;
    writeValue(
      { firebase: FB.estados.grabar, mqtt: 'robot/estados/grabar' },
      grabando ? 1 : 0
    );
  }

  // ============================================================
  // GAMEPAD — Control con gatillos Xbox
  // ============================================================

  let gamepadIndex     = -1;
  let gamepadConnected = false;
  /** @type {number} */
  let gamepadLoopId;

  /**
   * Mapea el valor del gatillo (0–1) a duty cycle con 3 valores discretos:
   *   0           → 0   (sin presión)
   *   0  < t ≤ 0.5 → 33  (1/3 máximo)
   *   0.5 < t ≤ 0.9 → 67  (2/3 máximo)
   *   0.9 < t ≤ 1   → 100 (máximo)
   * @param {number} trigger
   */
  function mapTriggerDuty(trigger) {
    if (trigger <= 0)    return 0;
    if (trigger <= 0.5)  return 33;
    if (trigger <= 0.9)  return 67;
    return 100;
  }

  /**
   * Mapea el valor del gatillo (0–1) a velocidad (cm/s) con 3 valores discretos:
   *   0           → 0          (sin presión)
   *   0  < t ≤ 0.5 → MAX_VEL/3   (~33 cm/s)
   *   0.5 < t ≤ 0.9 → MAX_VEL*2/3 (~67 cm/s)
   *   0.9 < t ≤ 1   → MAX_VEL     (100 cm/s)
   * @param {number} trigger
   */
  function mapTriggerVel(trigger) {
    const MAX_VEL = 100;
    if (trigger <= 0)    return 0;
    if (trigger <= 0.5)  return Math.round(MAX_VEL / 3);
    if (trigger <= 0.9)  return Math.round(MAX_VEL * 2 / 3);
    return MAX_VEL;
  }

  /**
   * Mapea el valor del gatillo (0–1) a velocidad total (cm/s) con 3 valores discretos:
   *   0           → 0          (sin presión)
   *   0  < t ≤ 0.5 → MAX_VEL/3   (~23 cm/s)
   *   0.5 < t ≤ 0.9 → MAX_VEL*2/3 (~47 cm/s)
   *   0.9 < t ≤ 1   → MAX_VEL     (70 cm/s)
   * @param {number} trigger
   */
  function mapTriggerVTotal(trigger) {
    const MAX_VEL = 70;
    if (trigger <= 0)    return 0;
    if (trigger <= 0.5)  return Math.round(MAX_VEL / 3);
    if (trigger <= 0.9)  return Math.round(MAX_VEL * 2 / 3);
    return MAX_VEL;
  }

  /**
   * Convierte la posición del stick (x, y en [-1,1]) a ángulo horario desde
   * Norte (0°=arriba, 90°=derecha), redondeado al múltiplo de 30° más cercano.
   * Devuelve null si el stick está dentro de la zona muerta.
   * @param {number} x  - axes[0]
   * @param {number} y  - axes[1]
   * @returns {number | null}
   */
  function mapStickAngle(x, y) {
    const DEADZONE = 0.25;          // radio mínimo para considerar input
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude < DEADZONE) return null;
    // atan2(x, -y) → ángulo horario desde Norte
    let deg = Math.atan2(x, -y) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    // Redondear al múltiplo de 30° más cercano
    return Math.round(deg / 30) * 30 % 360;
  }

  function gamepadLoop() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[gamepadIndex];
    if (gp) {
      const lt = gp.buttons[6]?.value ?? 0;
      const rt = gp.buttons[7]?.value ?? 0;
      if (controlMode === 'Duty') {
        const newL = mapTriggerDuty(lt);
        const newR = mapTriggerDuty(rt);
        if (newL !== thrustL || newR !== thrustR) {
          thrustL = newL;
          thrustR = newR;
          sendControl();
        }
      } else if (controlMode === 'Vel') {
        const newL = mapTriggerVel(lt);
        const newR = mapTriggerVel(rt);
        if (newL !== comando_v_izq || newR !== comando_v_der) {
          comando_v_izq = newL;
          comando_v_der = newR;
          sendControl();
        }
      } else if (controlMode === 'VTeta') {
        // RT → velocidad positiva / LT → velocidad negativa
        const posV =  mapTriggerVTotal(rt);
        const negV = -mapTriggerVTotal(lt);
        const newV = posV + negV;
        if (newV !== v_total_ref) {
          v_total_ref = newV;
          sendControl();
        }
        // Stick izquierdo → ángulo θ ref (pasos de 30°)
        const lx = gp.axes[0] ?? 0;
        const ly = gp.axes[1] ?? 0;
        const newAngle = mapStickAngle(lx, ly);
        if (newAngle !== null && newAngle !== teta_ref) {
          teta_ref = newAngle;
          heading  = newAngle;
          sendControl();
        }
      }
    }
    gamepadLoopId = requestAnimationFrame(gamepadLoop);
  }

  /** @param {GamepadEvent} e */
  function onGamepadConnected(e) {
    gamepadIndex     = e.gamepad.index;
    gamepadConnected = true;
    console.log('Gamepad conectado:', e.gamepad.id);
    gamepadLoop();
  }

  /** @param {GamepadEvent} e */
  function onGamepadDisconnected(e) {
    if (e.gamepad.index === gamepadIndex) {
      cancelAnimationFrame(gamepadLoopId);
      gamepadIndex     = -1;
      gamepadConnected = false;
      thrustL       = 0;
      thrustR       = 0;
      comando_v_izq = 0;
      comando_v_der = 0;
      v_total_ref   = 0;
      sendControl();
    }
  }

  // Solo registrar eventos en el browser, nunca en el servidor
  if (typeof window !== 'undefined') {
    window.addEventListener('gamepadconnected',    onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  onDestroy(() => {
    stopFirebase();
    stopMQTT();
    unsubSource();
    unsubBroker();
    unsubDataSource();
    if (typeof window !== 'undefined') {
      cancelAnimationFrame(gamepadLoopId);
      window.removeEventListener('gamepadconnected',    onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    }
  });
</script>

<div class="app">

  <!-- ── BARRA LATERAL ─────────────────────────────────────── -->
  <Sidebar
    bind:activeView
    bind:connectionMode
    {connectivityStatus}
    telemetryStatus={telemetry.status}
    {ROBOT_ID}
    {ACTIVE_PROTOCOL}
    {setConnectionMode}
    {grabando}
    onToggleGrabar={toggleGrabar}
  />

  <!-- ── PANEL PRINCIPAL ───────────────────────────────────── -->
  <main class="main-panel">
    {#if activeView === 'datos'}
      <DatosView
        {ROBOT_ID}
        {telemetry}
        {speedHistory}
        {accelHistory}
      />
    {:else if activeView === 'controles'}
      <ControlesView
        {ROBOT_ID}
        bind:thrustL
        bind:thrustR
        bind:heading
        bind:thrust
        bind:controlMode
        bind:comando_v_der
        bind:comando_v_izq
        bind:comando_w
        bind:v_total_ref
        bind:teta_ref
        {gamepadConnected}
        {sendControl}
        {emergencyStop}
        {syncThrustToWheels}
      />
    {:else if activeView === 'bodega'}
      <BodegaView
        {robotMapPos}
        {currentMission}
        {activityLog}
        bind:newMissionTarget
        bind:newMissionPriority
        {assignMission}
        {telemetry}
      />
    {/if}
  </main>

</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--on-surface);
    min-height: 100vh;
  }

  :global(:root) {
    --bg:                  #11131c;
    --surface:             #11131c;
    --surface-low:         #191b24;
    --surface-mid:         #1d1f29;
    --surface-high:        #282933;
    --surface-highest:     #32343e;
    --surface-bright:      #373943;

    --on-surface:          #e1e1ef;
    --on-surface-variant:  #c2c6d7;
    --outline-variant:     #424655;

    --primary:             #b0c6ff;
    --primary-container:   #558dff;
    --secondary:           #7dffa2;
    --secondary-container: #05e777;
    --tertiary:            #f7be00;
    --tertiary-container:  #b58a00;
    --error:               #ffb4ab;
    --error-container:     #93000a;

    --font-mono: 'Roboto Mono', 'Courier New', monospace;

    --radius-sm:   0.125rem;
    --radius-md:   0.375rem;
    --radius-lg:   0.75rem;
  }

  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
  }

  .main-panel {
    flex: 1;
    overflow-y: auto;
    background: var(--surface);
    scrollbar-width: thin;
    scrollbar-color: var(--surface-bright) transparent;
  }

  :global(.view) { padding: 2rem 2.5rem; }

  :global(.view-header) {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(66, 70, 85, 0.3);
    padding-bottom: 1rem;
  }
  :global(.view-title) {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--on-surface);
    letter-spacing: 0.03em;
  }
  :global(.view-title-sub) { color: var(--on-surface-variant); font-weight: 400; }
</style>