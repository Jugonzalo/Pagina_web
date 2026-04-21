<!-- ============================================================
     VISTA: Controles Manuales
     ============================================================
     Permite controlar el robot manualmente mediante sliders.
     Dos modos disponibles:
       - Tracción directa: controla cada oruga independientemente
       - Vectorial: define rumbo (heading) y empuje (thrust)

     Los botones de envío y emergencia usan las funciones
     de src/lib/api/control.js
     ============================================================ -->
<script>
  import { ROBOT_ID } from '$lib/config/constants';
  import { controlMode, thrustL, thrustR, heading, thrust } from '$lib/stores/robot';
  import { sendControl, emergencyStop } from '$lib/api/control';

  /**
   * Construye el payload según el modo de control activo
   * y lo envía a sendControl().
   */
  function handleSendControl() {
    // El payload varía según el modo seleccionado
    const payload = $controlMode === 'traccion'
      ? { mode: 'traccion', thrustL: $thrustL, thrustR: $thrustR }
      : { mode: 'vectorial', heading: $heading, thrust: $thrust };

    sendControl(payload);
  }

  /**
   * Llama a emergencyStop pasando los stores de thrust
   * como objeto para que la función pueda resetearlos.
   */
  function handleEmergencyStop() {
    emergencyStop({ thrustL, thrustR, thrust });
  }
</script>

<section class="view" id="view-controles">

  <!-- Encabezado -->
  <header class="view-header">
    <h1 class="view-title">
      {ROBOT_ID} <span class="view-title-sub">| Controles</span>
    </h1>
    <div class="override-badge">⚠ MODO MANUAL ACTIVO</div>
  </header>

  <!-- ── SELECTOR DE MODO DE CONTROL ──────────────────────── -->
  <!--
    Dos modos:
      traccion  → sliders independientes por oruga
      vectorial → slider de rumbo + slider de empuje
  -->
  <div class="mode-selector">
    <button
      id="btn-mode-traccion"
      class="mode-btn {$controlMode === 'traccion' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode.set('traccion')}
    >
      MODO 1: TRACCIÓN DIRECTA
    </button>
    <button
      id="btn-mode-vectorial"
      class="mode-btn {$controlMode === 'vectorial' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode.set('vectorial')}
    >
      MODO 2: VECTORIAL
    </button>
  </div>

  <!-- ── PANEL: TRACCIÓN DIRECTA ───────────────────────────── -->
  <!--
    Cada oruga tiene su propio slider. Los valores van de -100
    (máxima reversa) a +100 (máxima velocidad hacia adelante).
    bind:value conecta el slider directamente al store.
  -->
  {#if $controlMode === 'traccion'}
  <div class="control-panel">
    <div class="control-panel-title">CONTROL INDEPENDIENTE DE ORUGAS</div>

    <div class="sliders-grid">
      <!-- Oruga izquierda -->
      <div class="slider-group">
        <label for="slider-left" class="slider-label">ORUGA IZQUIERDA</label>
        <div class="slider-value-display {$thrustL >= 0 ? 'positive' : 'negative'}">
          {$thrustL > 0 ? '+' : ''}{$thrustL}%
        </div>
        <input
          id="slider-left"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={$thrustL}
          class="control-slider"
        />
      </div>

      <!-- Oruga derecha -->
      <div class="slider-group">
        <label for="slider-right" class="slider-label">ORUGA DERECHA</label>
        <div class="slider-value-display {$thrustR >= 0 ? 'positive' : 'negative'}">
          {$thrustR > 0 ? '+' : ''}{$thrustR}%
        </div>
        <input
          id="slider-right"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={$thrustR}
          class="control-slider"
        />
      </div>
    </div>
  </div>
  {/if}

  <!-- ── PANEL: VECTORIAL ──────────────────────────────────── -->
  <!--
    El robot recibe un ángulo de rumbo (0-360°) y un nivel de
    empuje (0-100%), y calcula internamente cómo mover cada oruga.
  -->
  {#if $controlMode === 'vectorial'}
  <div class="control-panel">
    <div class="control-panel-title">CONTROL DE RUMBO Y EMPUJE</div>

    <div class="sliders-grid">
      <!-- Rumbo (heading) -->
      <div class="slider-group">
        <label for="slider-heading" class="slider-label">RUMBO (HEADING)</label>
        <div class="slider-value-display positive">{$heading}°</div>
        <input
          id="slider-heading"
          type="range"
          min="0"
          max="360"
          step="5"
          bind:value={$heading}
          class="control-slider tertiary"
        />
      </div>

      <!-- Empuje (thrust) -->
      <div class="slider-group">
        <label for="slider-thrust" class="slider-label">EMPUJE (THRUST)</label>
        <div class="slider-value-display positive">{$thrust}%</div>
        <input
          id="slider-thrust"
          type="range"
          min="0"
          max="100"
          step="5"
          bind:value={$thrust}
          class="control-slider"
        />
      </div>
    </div>
  </div>
  {/if}

  <!-- ── BOTONES DE ACCIÓN ──────────────────────────────────── -->
  <div class="control-actions">
    <!-- Enviar el comando con los valores actuales de los sliders -->
    <button id="btn-send-control" class="btn-primary" on:click={handleSendControl}>
      ENVIAR COMANDO
    </button>

    <!-- Parada de emergencia: resetea todo inmediatamente -->
    <button id="btn-emergency-stop" class="btn-danger" on:click={handleEmergencyStop}>
      ■ PARADA DE EMERGENCIA
    </button>
  </div>

</section>

<style>
  .view { padding: 2rem 2.5rem; }

  /* ── ENCABEZADO ──────────────────────────────────────────── */
  .view-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(66, 70, 85, 0.3);
    padding-bottom: 1rem;
  }
  .view-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--on-surface);
    letter-spacing: 0.03em;
  }
  .view-title-sub { color: var(--on-surface-variant); font-weight: 400; }
  .override-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--tertiary);
    border: 1px solid var(--tertiary);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  /* ── SELECTOR DE MODO ────────────────────────────────────── */
  .mode-selector {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .mode-btn {
    padding: 0.5rem 1.25rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--outline-variant);
    background: transparent;
    color: var(--on-surface-variant);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .mode-btn:hover { border-color: var(--primary); color: var(--primary); }
  .mode-btn--active {
    background: var(--primary-container);
    border-color: var(--primary-container);
    color: var(--on-surface);
  }

  /* ── PANEL DE CONTROL ────────────────────────────────────── */
  .control-panel {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .control-panel-title {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    margin-bottom: 1.25rem;
    text-transform: uppercase;
  }
  .sliders-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

  /* ── SLIDER ──────────────────────────────────────────────── */
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .slider-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }
  .slider-value-display {
    font-size: 1.8rem;
    font-weight: 700;
    font-family: var(--font-mono);
  }
  .slider-value-display.positive { color: var(--primary); }
  .slider-value-display.negative { color: var(--error); }

  /* Slider personalizado (cross-browser) */
  .control-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--surface-bright);
    outline: none;
    cursor: pointer;
  }
  .control-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .control-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(176, 198, 255, 0.2);
  }
  /* Variante ámbar para el slider de heading */
  .control-slider.tertiary::-webkit-slider-thumb { background: var(--tertiary); }

  /* ── BOTONES ─────────────────────────────────────────────── */
  .control-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .btn-primary {
    padding: 0.7rem 1.5rem;
    background: var(--primary-container);
    color: var(--on-surface);
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: opacity 0.2s, box-shadow 0.2s;
    font-family: inherit;
  }
  .btn-primary:hover { opacity: 0.85; box-shadow: 0 0 12px rgba(176, 198, 255, 0.15); }
  .btn-danger {
    padding: 0.7rem 1.5rem;
    background: var(--error-container);
    color: var(--error);
    border: 1px solid var(--error);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background 0.2s;
    font-family: inherit;
  }
  .btn-danger:hover { background: #6e0008; }
</style>
