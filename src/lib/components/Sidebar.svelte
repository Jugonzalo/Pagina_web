<!-- ============================================================
     COMPONENTE: Sidebar
     ============================================================
     Barra lateral fija de la izquierda.
     Contiene:
       1. Logo de la aplicación
       2. Identificador del robot activo
       3. Navegación principal (Datos / Controles / Bodega)
       4. Selector de modo de conexión (Offline / Auto / Online)
       5. Indicador de estado del robot en el footer
     ============================================================ -->
<script>
  import { ROBOT_ID, ACTIVE_PROTOCOL } from '$lib/config/constants';
  import { activeView, connectionMode, connectivityStatus, telemetry } from '$lib/stores/robot';
  import { setConnectionMode } from '$lib/api/telemetry';
  import { statusClass } from '$lib/utils/format';
</script>

<aside class="sidebar">

  <!-- ── 1. LOGO ──────────────────────────────────────────── -->
  <div class="sidebar-logo">
    <span class="logo-icon">⬡</span>
    <span class="logo-text">KINETIC<br>LABS</span>
  </div>

  <!-- ── 2. IDENTIFICADOR DEL ROBOT ───────────────────────── -->
  <div class="robot-id">
    <div class="robot-id-label">UNIDAD ACTIVA</div>
    <div class="robot-id-value">{ROBOT_ID}</div>
    <div class="robot-id-protocol">{ACTIVE_PROTOCOL}</div>
  </div>

  <!-- ── 3. NAVEGACIÓN PRINCIPAL ──────────────────────────── -->
  <!--
    Cada botón cambia el store activeView, lo que hace que
    +page.svelte muestre la vista correspondiente.
  -->
  <nav class="sidebar-nav">
    <button
      id="btn-nav-datos"
      class="nav-item {$activeView === 'datos' ? 'nav-item--active' : ''}"
      on:click={() => activeView.set('datos')}
    >
      <span class="nav-icon">⬡</span>
      <span class="nav-label">DATOS</span>
    </button>

    <button
      id="btn-nav-controles"
      class="nav-item {$activeView === 'controles' ? 'nav-item--active' : ''}"
      on:click={() => activeView.set('controles')}
    >
      <span class="nav-icon">⚙</span>
      <span class="nav-label">CONTROLES</span>
    </button>

    <button
      id="btn-nav-bodega"
      class="nav-item {$activeView === 'bodega' ? 'nav-item--active' : ''}"
      on:click={() => activeView.set('bodega')}
    >
      <span class="nav-icon">▦</span>
      <span class="nav-label">BODEGA</span>
    </button>
  </nav>

  <!-- ── 4. SELECTOR DE MODO DE CONEXIÓN ──────────────────── -->
  <!--
    Permite elegir entre:
      offline → siempre simulación local
      auto    → intenta API, fallback a simulación
      online  → siempre API real
  -->
  <div class="conn-mode-section">
    <div class="conn-mode-label">FUENTE DE DATOS</div>

    <!-- Tres botones: uno por modo -->
    <div class="conn-mode-buttons">
      <button
        id="btn-mode-offline"
        class="conn-btn {$connectionMode === 'offline' ? 'conn-btn--active offline' : ''}"
        title="Sin API. Usa simulación local siempre."
        on:click={() => setConnectionMode('offline')}
      >
        OFFLINE
      </button>

      <button
        id="btn-mode-auto"
        class="conn-btn {$connectionMode === 'auto' ? 'conn-btn--active auto' : ''}"
        title="Intenta la API; si falla usa simulación."
        on:click={() => setConnectionMode('auto')}
      >
        AUTO
      </button>

      <button
        id="btn-mode-online"
        class="conn-btn {$connectionMode === 'online' ? 'conn-btn--active online' : ''}"
        title="Siempre usa la API real."
        on:click={() => setConnectionMode('online')}
      >
        ONLINE
      </button>
    </div>

    <!-- Indicador de estado de conectividad real -->
    <div class="conn-status-row">
      {#if $connectionMode === 'offline'}
        <!-- Modo offline intencional: indicador gris -->
        <span class="conn-dot conn-dot--offline"></span>
        <span class="conn-status-text">SIMULACIÓN LOCAL</span>

      {:else if $connectivityStatus === 'verificando'}
        <!-- Comprobando la API por primera vez -->
        <span class="conn-dot conn-dot--checking"></span>
        <span class="conn-status-text">VERIFICANDO...</span>

      {:else if $connectivityStatus === 'conectado'}
        <!-- API disponible y respondiendo -->
        <span class="conn-dot conn-dot--online"></span>
        <span class="conn-status-text">API CONECTADA</span>

      {:else}
        <!-- API no disponible: en AUTO cae a simulación -->
        <span class="conn-dot conn-dot--offline"></span>
        <span class="conn-status-text">
          {$connectionMode === 'auto' ? 'SIM. (sin API)' : 'SIN CONEXIÓN'}
        </span>
      {/if}
    </div>
  </div>

  <!-- ── 5. FOOTER: ESTADO GLOBAL DEL ROBOT ───────────────── -->
  <div class="sidebar-footer">
    <span class="status-dot {statusClass($telemetry.status)}"></span>
    <span class="status-text">{$telemetry.status}</span>
  </div>

</aside>

<style>
  /* ── SIDEBAR ─────────────────────────────────────────────── */
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

  /* ── LOGO ────────────────────────────────────────────────── */
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

  /* ── ID DEL ROBOT ────────────────────────────────────────── */
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

  /* ── NAVEGACIÓN ──────────────────────────────────────────── */
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0 0.75rem;
    flex: 1; /* Ocupa el espacio sobrante y empuja el footer hacia abajo */
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

  /* ── SELECTOR DE MODO DE CONEXIÓN ────────────────────────── */
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

  /* Estado activo por modo (colores diferentes para cada uno) */
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

  /* Fila del indicador de estado */
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

  /* ── FOOTER ──────────────────────────────────────────────── */
  .sidebar-footer {
    padding: 0.75rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  /* Las clases de color de status son globales (definidas en +page.svelte) */
  :global(.status-dot.status-ready)   { background: var(--secondary); }
  :global(.status-dot.status-active)  { background: var(--primary); animation: pulse 1.2s infinite; }
  :global(.status-dot.status-warning) { background: var(--tertiary); }
  :global(.status-dot.status-error)   { background: var(--error); }
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
