<script>
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
  </nav>

  <!-- Selector de modo de conexión -->
  <div class="conn-mode-section">
    <div class="conn-mode-label">FUENTE DE DATOS</div>

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

    <div class="conn-status-row">
      {#if connectionMode === 'offline'}
        <span class="conn-dot conn-dot--offline"></span>
        <span class="conn-status-text">SIMULACIÓN LOCAL</span>
      {:else if connectivityStatus === 'verificando'}
        <span class="conn-dot conn-dot--checking"></span>
        <span class="conn-status-text">VERIFICANDO...</span>
      {:else if connectivityStatus === 'conectado'}
        <span class="conn-dot conn-dot--online"></span>
        <span class="conn-status-text">API CONECTADA</span>
      {:else}
        <span class="conn-dot conn-dot--offline"></span>
        <span class="conn-status-text">
          {connectionMode === 'auto' ? 'SIM. (sin API)' : 'SIN CONEXIÓN'}
        </span>
      {/if}
    </div>
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
  .conn-status-text {
    font-size: 0.58rem;
    letter-spacing: 0.05em;
    color: var(--on-surface-variant);
    font-weight: 600;
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
