<script>
  import { dataSource, mqttBrokerUrl, mqttStatus } from '$lib/dataSource.js';

  /** @type {string} */
  export let activeView;
  /** @type {string} */
  export let connectionMode;
  /** @type {string} */
  export let connectivityStatus;
  /** @type {string} */
  export let telemetryStatus;
  /** @type {string} */
  export let ROBOT_ID;
  /** @type {string} */
  export let ACTIVE_PROTOCOL;
  /** @type {(mode: string) => void} */
  export let setConnectionMode;
  /** @type {boolean} */
  export let grabando = false;
  /** @type {() => void} */
  export let onToggleGrabar = () => {};

  /** @param {string} status */
  function statusClass(status) {
    /** @type {Record<string, string>} */
    const map = {
      'LISTO':         'status-ready',
      'EN MOVIMIENTO': 'status-active',
      'DETENIDO':      'status-warning',
      'ERROR':         'status-error'
    };
    return map[status] ?? 'status-ready';
  }

  /** @param {'firebase' | 'mqtt'} src */
  function setDataSource(src) {
    dataSource.set(src);
  }
</script>

<aside class="sidebar">

  <!-- Logo / identidad -->
  <div class="sidebar-logo">
    <span class="logo-icon">⬡</span>
    <span class="logo-text">KINETIC<br>LABS</span>
  </div>

  <!-- Identificador del robot -->
  <div class="robot-id">
    <div class="robot-id-label">UNIDAD ACTIVA</div>
    <div class="robot-id-value">{ROBOT_ID}</div>
    <div class="robot-id-protocol">{ACTIVE_PROTOCOL}</div>
  </div>

  <!-- Navegación principal -->
  <nav class="sidebar-nav">
    <button
      id="btn-nav-datos"
      class="nav-item {activeView === 'datos' ? 'nav-item--active' : ''}"
      on:click={() => activeView = 'datos'}
    >
      <span class="nav-icon">⬡</span>
      <span class="nav-label">DATOS</span>
    </button>
    <button
      id="btn-nav-controles"
      class="nav-item {activeView === 'controles' ? 'nav-item--active' : ''}"
      on:click={() => activeView = 'controles'}
    >
      <span class="nav-icon">⚙</span>
      <span class="nav-label">CONTROLES</span>
    </button>
    <button
      id="btn-nav-bodega"
      class="nav-item {activeView === 'bodega' ? 'nav-item--active' : ''}"
      on:click={() => activeView = 'bodega'}
    >
      <span class="nav-icon">▦</span>
      <span class="nav-label">BODEGA</span>
    </button>
    <button
      id="btn-nav-consola"
      class="nav-item {activeView === 'consola' ? 'nav-item--active' : ''}"
      on:click={() => activeView = 'consola'}
    >
      <span class="nav-icon">⌨</span>
      <span class="nav-label">CONSOLA</span>
    </button>
  </nav>

  <!-- ── SELECTOR DE FUENTE DE DATOS ──────────────────── -->
  <div class="conn-mode-section">
    <div class="conn-mode-label">FUENTE DE DATOS</div>

    <!-- Firebase / MQTT -->
    <div class="source-buttons">
      <button
        id="btn-source-firebase"
        class="source-btn {$dataSource === 'firebase' ? 'source-btn--active firebase' : ''}"
        title="Leer y escribir desde Firebase Realtime Database"
        on:click={() => setDataSource('firebase')}
      >
        🔥 FIREBASE
      </button>
      <button
        id="btn-source-mqtt"
        class="source-btn {$dataSource === 'mqtt' ? 'source-btn--active mqtt' : ''}"
        title="Leer y escribir desde broker MQTT (WebSocket)"
        on:click={() => setDataSource('mqtt')}
      >
        📡 MQTT
      </button>
    </div>

    <!-- Campo de URL del broker (visible solo cuando MQTT activo) -->
    {#if $dataSource === 'mqtt'}
      <div class="broker-field">
        <label for="mqtt-broker-url" class="broker-label">BROKER URL</label>
        <input
          id="mqtt-broker-url"
          type="text"
          class="broker-input"
          bind:value={$mqttBrokerUrl}
          placeholder="ws://host:9001"
        />
      </div>

      <!-- Estado de conexión MQTT -->
      <div class="conn-status-row">
        {#if $mqttStatus === 'connecting'}
          <span class="conn-dot conn-dot--checking"></span>
          <span class="conn-status-text">CONECTANDO...</span>
        {:else if $mqttStatus === 'connected'}
          <span class="conn-dot conn-dot--online"></span>
          <span class="conn-status-text">MQTT CONECTADO</span>
        {:else if $mqttStatus === 'error'}
          <span class="conn-dot conn-dot--error"></span>
          <span class="conn-status-text">ERROR MQTT</span>
        {:else}
          <span class="conn-dot conn-dot--offline"></span>
          <span class="conn-status-text">MQTT DESCONECTADO</span>
        {/if}
      </div>
    {:else}
      <!-- Estado de conexión Firebase -->
      <div class="conn-status-row">
        {#if connectivityStatus === 'verificando'}
          <span class="conn-dot conn-dot--checking"></span>
          <span class="conn-status-text">VERIFICANDO...</span>
        {:else if connectivityStatus === 'conectado'}
          <span class="conn-dot conn-dot--online"></span>
          <span class="conn-status-text">FIREBASE OK</span>
        {:else if connectionMode === 'offline'}
          <span class="conn-dot conn-dot--offline"></span>
          <span class="conn-status-text">SIMULACIÓN LOCAL</span>
        {:else}
          <span class="conn-dot conn-dot--online"></span>
          <span class="conn-status-text">FIREBASE ACTIVO</span>
        {/if}
      </div>
    {/if}

    <!-- Modos de conexión (offline/auto/online) -->
    <div class="conn-mode-label" style="margin-top:0.5rem">MODO</div>
    <div class="conn-mode-buttons">
      <button
        id="btn-mode-offline"
        class="conn-btn {connectionMode === 'offline' ? 'conn-btn--active offline' : ''}"
        title="Sin API. Usa simulación local siempre."
        on:click={() => setConnectionMode('offline')}
      >
        OFFLINE
      </button>
      <button
        id="btn-mode-auto"
        class="conn-btn {connectionMode === 'auto' ? 'conn-btn--active auto' : ''}"
        title="Intenta la API; si falla usa simulación."
        on:click={() => setConnectionMode('auto')}
      >
        AUTO
      </button>
      <button
        id="btn-mode-online"
        class="conn-btn {connectionMode === 'online' ? 'conn-btn--active online' : ''}"
        title="Siempre usa la API real."
        on:click={() => setConnectionMode('online')}
      >
        ONLINE
      </button>
    </div>
  </div>

  <!-- ── BOTÓN GRABAR ──────────────────────────────────── -->
  <div class="rec-section">
    <div class="conn-mode-label">GRABACIÓN</div>
    <button
      id="btn-grabar"
      class="rec-btn {grabando ? 'rec-btn--on' : ''}"
      title="{grabando ? 'Detener grabación' : 'Iniciar grabación'}"
      on:click={onToggleGrabar}
    >
      <span class="rec-dot"></span>
      {grabando ? 'REC ON' : 'REC OFF'}
    </button>
  </div>

  <!-- Indicador de estado global del robot en el footer del sidebar -->
  <div class="sidebar-footer">
    <span class="status-dot {statusClass(telemetryStatus)}"></span>
    <span class="status-text">{telemetryStatus}</span>
  </div>

</aside>

<style>
  .sidebar {
    width: 200px;
    min-width: 200px;
    background: var(--surface-low);
    border-right: 1px solid rgba(66, 70, 85, 0.4);
    display: flex;
    flex-direction: column;
    padding: 1.5rem 0;
    gap: 2rem;
  }

  /* Logo */
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0 1.25rem;
  }
  .logo-icon { color: var(--primary); font-size: 1.5rem; }
  .logo-text {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--on-surface);
    line-height: 1.3;
  }

  /* Identificador del robot */
  .robot-id {
    padding: 0.75rem 1.25rem;
    border-left: 2px solid var(--secondary);
    margin-left: 1rem;
  }
  .robot-id-label {
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }
  .robot-id-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary);
    letter-spacing: 0.05em;
  }
  .robot-id-protocol {
    font-size: 0.6rem;
    color: var(--secondary);
    letter-spacing: 0.06em;
    margin-top: 0.25rem;
  }

  /* Navegación */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0 0.75rem;
    flex: 1;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--radius-md);
    border: none;
    background: transparent;
    color: var(--on-surface-variant);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    text-align: left;
    font-family: inherit;
  }
  .nav-item:hover { background: var(--surface-mid); color: var(--on-surface); }
  .nav-item--active {
    background: var(--surface-high);
    color: var(--primary);
  }
  .nav-icon { font-size: 1rem; }

  /* Selector de conexión */
  .conn-mode-section {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(66, 70, 85, 0.3);
    border-bottom: 1px solid rgba(66, 70, 85, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .conn-mode-label {
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }

  /* Selector Firebase / MQTT */
  .source-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .source-btn {
    padding: 0.35rem 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--outline-variant);
    background: transparent;
    color: var(--on-surface-variant);
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    text-align: center;
  }
  .source-btn:hover { border-color: var(--on-surface-variant); color: var(--on-surface); }
  .source-btn--active.firebase {
    background: rgba(255, 150, 50, 0.12);
    border-color: #ff9632;
    color: #ff9632;
  }
  .source-btn--active.mqtt {
    background: rgba(176, 198, 255, 0.12);
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Campo de URL del broker */
  .broker-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .broker-label {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }
  .broker-input {
    background: var(--surface-high);
    border: 1px solid var(--outline-variant);
    border-radius: var(--radius-sm);
    color: var(--on-surface);
    font-size: 0.6rem;
    font-family: var(--font-mono);
    padding: 0.3rem 0.5rem;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  .broker-input:focus { border-color: var(--primary); }

  .conn-mode-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }
  .conn-btn {
    padding: 0.3rem 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--outline-variant);
    background: transparent;
    color: var(--on-surface-variant);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    text-align: center;
  }
  .conn-btn:hover { border-color: var(--on-surface-variant); color: var(--on-surface); }
  .conn-btn--active.offline {
    background: var(--surface-highest);
    border-color: var(--on-surface-variant);
    color: var(--on-surface);
  }
  .conn-btn--active.auto {
    background: rgba(247, 190, 0, 0.12);
    border-color: var(--tertiary);
    color: var(--tertiary);
  }
  .conn-btn--active.online {
    background: rgba(125, 255, 162, 0.1);
    border-color: var(--secondary);
    color: var(--secondary);
  }

  .conn-status-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 14px;
  }
  .conn-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .conn-dot--offline  { background: var(--on-surface-variant); opacity: 0.5; }
  .conn-dot--checking { background: var(--tertiary); animation: pulse 0.8s infinite; }
  .conn-dot--online   { background: var(--secondary); animation: pulse 2s infinite; }
  .conn-dot--error    { background: var(--error); animation: pulse 0.5s infinite; }
  .conn-status-text {
    font-size: 0.58rem;
    letter-spacing: 0.05em;
    color: var(--on-surface-variant);
    font-weight: 600;
  }

  /* Sección grabar */
  .rec-section {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(66, 70, 85, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .rec-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--outline-variant);
    background: transparent;
    color: var(--on-surface-variant);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .rec-btn:hover {
    border-color: var(--error);
    color: var(--error);
  }
  .rec-btn--on {
    background: rgba(255, 180, 171, 0.12);
    border-color: var(--error);
    color: var(--error);
  }
  .rec-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .rec-btn--on .rec-dot {
    animation: pulse 0.8s infinite;
  }

  /* Footer del sidebar */
  .sidebar-footer {
    padding: 0.75rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-dot.status-ready    { background: var(--secondary); }
  .status-dot.status-active   { background: var(--primary); animation: pulse 1.2s infinite; }
  .status-dot.status-warning  { background: var(--tertiary); }
  .status-dot.status-error    { background: var(--error); }
  .status-text {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
</style>
