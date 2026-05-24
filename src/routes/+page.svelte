<script>
  import Sidebar from '$lib/components/Sidebar.svelte';
  import DatosView from '$lib/components/DatosView.svelte';
  import ControlesView from '$lib/components/ControlesView.svelte';
  import BodegaView from '$lib/components/BodegaView.svelte';
  import {
  ref,        // Crea una referencia a un nodo de la DB
  set,        // Escribe (sobreescribe) un valor en un nodo
  get,        // Lee el valor de un nodo UNA sola vez
  update,     // Actualiza campos específicos sin sobreescribir
  push,       // Agrega un nuevo elemento con ID autogenerado
  remove,     // Elimina un nodo
  onValue,    // Escucha cambios en TIEMPO REAL (suscripción)
  off,          // Cancela una suscripción activa
 }from 'firebase/database';
 import { db } from '$lib/firebase';
 import { onDestroy } from 'svelte';


  // ============================================================
  // CONSTANTES DE TEXTO
  // ============================================================

  const ROBOT_ID       = 'Yalent';
  const ACTIVE_PROTOCOL = 'PROTOCOLO EMERGENTE';

// ── TELEMETRÍA (lectura) ─────────────────────────────────────
const RUTA_V_DER           = 'Telemetria/v_derecha';
const RUTA_V_IZQ           = 'Telemetria/v_izquierda';
const RUTA_V_TOTAL         = 'Telemetria/v_total';
const RUTA_TETA            = 'Telemetria/teta';
const RUTA_OMEGA           = 'Telemetria/v_angular';
const RUTA_X               = 'Telemetria/x_pos';
const RUTA_Y               = 'Telemetria/y_pos';
const RUTA_D_PARED_DER     = 'Telemetria/d_pared_derecha';
const RUTA_D_PARED_IZQ     = 'Telemetria/d_pared_izquierda';
const RUTA_D_PARED_TRASERA = 'Telemetria/d_pared_trasera';
const RUTA_PILAS           = 'Telemetria/pilas';

// ── ESTADOS (lectura) ────────────────────────────────────────
const RUTA_CONEXION_ESP     = 'Estados/python_a_esp';
const RUTA_CONEXION_FB      = 'Estados/firebase_a_python';
const RUTA_MODO_CONTROL     = 'Estados/tipo_control';
const RUTA_FLAG_POS         = 'Estados/flag_pos';
const RUTA_FLAG_OBSTACULO   = 'Estados/flag_obstaculo';
const RUTA_EJECUTANDO       = 'Estados/ejecutando';
const RUTA_GRABAR           = 'Estados/estado_grabacion';
const RUTA_REINICIO         = 'Estados/reinicio_esp';

// ── COMANDOS (escritura) ─────────────────────────────────────
const RUTA_DUTY_DER   = 'Comandos/duty_der';
const RUTA_DUTY_IZQ   = 'Comandos/duty_izq';
const RUTA_TETA_REF   = 'Comandos/teta_ref';
const RUTA_V_DER_REF  = 'Comandos/v_der_ref';
const RUTA_V_IZQ_REF  = 'Comandos/v_izq_ref';
const RUTA_V_TOTAL_REF = 'Comandos/v_total_ref';
const RUTA_X_REF      = 'Comandos/x_ref';
const RUTA_Y_REF      = 'Comandos/y_ref';
  

  // ============================================================
  // ESTADO DE NAVEGACIÓN
  // ============================================================

  /** Vista activa: 'datos' | 'controles' | 'bodega' */
  let activeView = 'datos';

  // ============================================================
  // DATOS DE TELEMETRÍA (valores iniciales — actualizar desde backend)
  // ============================================================

  let telemetry = {       // estps datpos se deben actualizar desde el firebase
    motorL:      0.00,
    motorR:      0.00,
    angularVel:  0.000,
    yaw:         0.0,
    posX:        0.00,
    posY:        0.00,
    v_total:      0.00,
    dist_pared_der: 0.00,
    dist_pared_izq: 0.00,
    dist_pared_trasera: 0.00,
    status:      'LISTO'
  };


  // aca tiene pinta que puedo ir añadiendo datos al historial por si quiero grabar aqui

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
    progress:    62
  };

  let activityLog = [
    { time: '21:14:03', msg: 'Misión MSN-2041 iniciada'         },
    { time: '21:13:51', msg: 'Robot en zona de carga C'         },
    { time: '21:13:30', msg: 'Trayectoria recalculada'          },
    { time: '21:12:08', msg: 'Batería al 87%'                   },
    { time: '21:11:45', msg: 'Evitación de obstáculo detectada' }
  ];

  let newMissionTarget   = '';
  let newMissionPriority = 'MEDIA';

  // ============================================================
  // ESTADO DE CONTROLES MANUALES
  // ============================================================

  let thrustL     = 0;  // duty izquierda    
  let thrustR     = 0;  // duty derecha
  let heading     = 0;  // angulo 
  let thrust      = 0;  // velocidad lineal
  let comando_v_der = 0; 
  let comando_v_izq = 0;
  let controlMode = 'traccion';    // forma del control



  // ============================================================
  // ESTADO DE CONEXIÓN (solo visual — lógica en el backend)
  // ============================================================

  let connectionMode     = 'auto';
  let connectivityStatus = 'desconectado';

  // ============================================================
  // HANDLERS — conectar al backend según el proyecto
  // ============================================================

  function setConnectionMode(mode) {   // seleccionador de modo de coneccion
    connectionMode     = mode;
    connectivityStatus = mode === 'offline' ? 'desconectado' : 'verificando';
  }

  function sendControl() {    // boton de enviar comando
    // TODO: enviar payload al backend
    // o sea actualizar los datos que se muestran en la interfaz y cargarlo al firebase
    if (controlMode === 'Duty') {
    set(ref(db, RUTA_DUTY_IZQ  ), Math.floor(thrustL * 2.55));
    set(ref(db, RUTA_DUTY_DER ), Math.floor(thrustR * 2.55));
    set(ref(db, RUTA_TETA_REF), Math.floor(heading));
  } if (controlMode === 'Vel')  {
    set(ref(db, RUTA_TETA_REF), Math.floor(heading));
    set(ref(db, RUTA_V_IZQ_REF ), comando_v_izq);
    set(ref(db, RUTA_V_DER_REF), comando_v_der);
  }
}
  function syncThrustToWheels() {
    comando_v_izq = thrust;
    comando_v_der = thrust;
    sendControl();
  }

  function assignMission() {   // boton de asignar mision
    if (!newMissionTarget.trim()) return;
    newMissionTarget = '';
  }

  function emergencyStop() {   // boton de parada de emergencia
    thrustL = 0;
    thrustR = 0;
    thrust  = 0;
    comando_v_izq = 0;
    comando_v_der = 0;

    telemetry.status = 'DETENIDO';
    sendControl();
  }

  // leer datos cada 0.3 segundos
  // mientras no tenga lectura de sensores pondre esto.
  
// ── SUSCRIPCIÓN EN TIEMPO REAL ───────────────────────────────
const telemetriaRef = ref(db, 'Telemetria');

const unsubscribe = onValue(telemetriaRef, (snapshot) => {
  const d = snapshot.val();
  if (!d) return;

  telemetry.motorR            = (d.v_derecha  ?? 0) ;
  telemetry.motorL            = (d.v_izquierda ?? 0) ;
  telemetry.v_total           = d.v_total    ?? 0;
  telemetry.yaw               = d.teta       ?? 0;
  telemetry.angularVel        = d.v_angular  ?? 0;
  telemetry.posX              = d.x_pos      ?? 0;
  telemetry.posY              = d.y_pos      ?? 0;
  telemetry.dist_pared_der    = d.d_pared_derecha  ?? 0;
  telemetry.dist_pared_izq    = d.d_pared_izquierda ?? 0;
  telemetry.dist_pared_trasera = d.d_pared_trasera  ?? 0;
  telemetry.pilas             = d.pilas      ?? 0;

  // Forzar reactividad de Svelte
  telemetry = telemetry;
});

onDestroy(() => {
  unsubscribe();
});

  



  // escuchar datos reactivos
  

// // En onDestroy del componente Svelte:
// onDestroy(() => {
//   off(telemetryRef);  // Cancela la suscripción
// });

  
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
      />
    {/if}
  </main>

</div>

<style>
  /* ── TOKENS DE DISEÑO ─────────────────────────────────────
     Modifica estos valores para cambiar la paleta completa.
     ─────────────────────────────────────────────────────── */
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--on-surface);
    min-height: 100vh;
  }

  :global(:root) {
    /* Colores principales del sistema Kinetic Labs */
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

    /* Acentos */
    --primary:             #b0c6ff;  /* Azul eléctrico – datos de telemetría */
    --primary-container:   #558dff;
    --secondary:           #7dffa2;  /* Verde esmeralda – estado OK */
    --secondary-container: #05e777;
    --tertiary:            #f7be00;  /* Ámbar – advertencias */
    --tertiary-container:  #b58a00;
    --error:               #ffb4ab;  /* Rojo – errores críticos */
    --error-container:     #93000a;

    /* Tipografía */
    --font-mono: 'Roboto Mono', 'Courier New', monospace;

    /* Bordes */
    --radius-sm:   0.125rem;
    --radius-md:   0.375rem;
    --radius-lg:   0.75rem;
  }

  /* ── LAYOUT GENERAL ──────────────────────────────────────── */
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

  /* ── ESTILOS COMPARTIDOS POR VISTAS ─────────────────────── */
  :global(.view) { padding: 2rem 2.5rem; }

  /* Encabezado de vista */
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
