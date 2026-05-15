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


  // ============================================================
  // CONSTANTES DE TEXTO
  // ============================================================

  const ROBOT_ID       = 'Yalent';
  const ACTIVE_PROTOCOL = 'PROTOCOLO EMERGENTE';

  const RUTA_VELOCIDAD_DERECHA = "/Comandos/duty_der";
  const RUTA_VELOCIDAD_IZQUIERDA = "/Comandos/duty_izq";
  const RUTA_ANGULO = "Escritura/Angulo";
  const RUTA_ESCRITURA = "Escritura";
  const D_PARED_DERECHA = "/Telemetria/d_pared_derecha";
  const D_PARED_IZQUIERDA = "/Telemetria/d_pared_izquierda";
  const D_PARED_TRASERA = "/Telemetria/d_pared_trasera"

  

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

  let thrustL     = 0;  // control velocidad izquierda    
  let thrustR     = 0;  // control velocidad derecha
  let heading     = 0;  // angulo 
  let thrust      = 0;  // velocidad lineal
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
    if (controlMode === 'traccion') {
    set(ref(db, RUTA_VELOCIDAD_IZQUIERDA ), Math.floor(thrustL * 2.55));
    set(ref(db, RUTA_VELOCIDAD_DERECHA), Math.floor(thrustR * 2.55));
  } else {
    set(ref(db, RUTA_ANGULO), Math.floor(heading));
    set(ref(db, RUTA_VELOCIDAD_IZQUIERDA), Math.floor(thrust * 2.55));
    set(ref(db, RUTA_VELOCIDAD_DERECHA), Math.floor(thrust * 2.55));
  }
}

  function assignMission() {   // boton de asignar mision
    if (!newMissionTarget.trim()) return;
    newMissionTarget = '';
  }

  function emergencyStop() {   // boton de parada de emergencia
    thrustL = 0;
    thrustR = 0;
    thrust  = 0;
    telemetry.status = 'DETENIDO';
    sendControl();
  }

  // leer datos cada 0.3 segundos
  // mientras no tenga lectura de sensores pondre esto.
  
  setInterval(function(){
    get(ref(db, '/Telemetria/teta')).then((snapshot) => {
      telemetry.yaw = snapshot.val();
    });
    get(ref(db, '/Telemetria/v_derecha')).then((snapshot) => {
      telemetry.motorR = snapshot.val() / 2.55;
    });
    get(ref(db, '/Telemetria/v_izquierda')).then((snapshot) => {
      telemetry.motorL = snapshot.val() / 2.55;
    });


    // ------- creo que los de arriba estan conectados, los de abajo vere ------/////


    get(ref(db, '/Telemetria/v_angular')).then((snapshot) => {
      telemetry.angularVel = snapshot.val();
    });
    get(ref(db, '/Telemetria/v_total')).then((snapshot) => {
      telemetry.v_total = snapshot.val() ;
    });
    get(ref(db, '/Telemetria/x_pos')).then((snapshot) => {
      telemetry.posX = snapshot.val();
    });
    get(ref(db, '/Telemetria/y_pos')).then((snapshot) => {
      telemetry.posY = snapshot.val();
    });

    
    
  }, 300);

  



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
        {sendControl}
        {emergencyStop}
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
