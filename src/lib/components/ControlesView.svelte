<script>
  /** @type {string} */
  export let ROBOT_ID;
  /** @type {number} */
  export let thrustL;
  /** @type {number} */
  export let thrustR;
  /** @type {number} */
  export let heading;
    // ---------------------------------------ACA ANDA AÑADIENDO LOS DISTINTOS COMANDOS --------------
  /** @type {number} */
  export let comando_v_der;
  /** @type {number} */
  export let comando_v_izq;
  /** @type {number} */
  export let thrust;
  /** @type {string} */
  export let controlMode;
  /** @type {() => void} */
  export let sendControl;
  /** @type {() => void} */
  export let emergencyStop;
</script>

<section class="view" id="view-controles">

  <header class="view-header">
    <h1 class="view-title">{ROBOT_ID} <span class="view-title-sub">| Controles</span></h1>
    <div class="override-badge">⚠ MODO MANUAL ACTIVO</div>
  </header>

  <!-- Selector de modo de control -->
  <div class="mode-selector">
    <button
      id="btn-mode-Duty"
      class="mode-btn {controlMode === 'Duty' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode = 'Duty'}
    >
      MODO 1: Duty
    </button>
    <button
      id="btn-mode-Vel"
      class="mode-btn {controlMode === 'Vel' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode = 'Vel'}
    >
      MODO 2: V_REF
    </button>
    <button
      id="btn-mode_Pos"
      class="mode-btn {controlMode === 'Pos' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode = 'Pos'}
    >
      MODO 3: Cordenadas
    </button>
  </div>

  <!-- Controles de Duty -->
  {#if controlMode === 'Duty'}
  <div class="control-panel">
    <div class="control-panel-title">CONTROL SEGUN DUTY CYCLE</div>

    <div class="sliders-grid">
      <!-- Slider oruga izquierda -->
      <div class="slider-group">
        <label for="slider-left" class="slider-label">RUEDA IZQUIERDA</label>
        <div class="slider-value-display {thrustL >= 0 ? 'positive' : 'negative'}">{thrustL > 0 ? '+' : ''}{thrustL}%</div>
        <input
          id="slider-left"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={thrustL}
          on:input={sendControl}
          class="control-slider"
        />
      </div>

      <div class="slider-group">
        <label for="slider-left_velocidad" class="slider-label">RUEDA DERECHA</label>
        <div class="slider-value-display {thrustR >= 0 ? 'positive' : 'negative'}">{thrustR > 0 ? '+' : ''}{thrustR}%</div>
        <input
          id="slider-left"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={thrustR}
          on:input={sendControl}
          class="control-slider"
        />
      </div>



      <!-- Slider conjunto -->
      <div class="slider-group">
        <label for="slider-thrust" class="slider-label">EMPUJE (THRUST)</label>
        <div class="slider-value-display positive">{thrust}%</div>
        <input
          id="slider-thrust"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={thrust}
          on:input={sendControl}
          class="control-slider"
        />
      </div>
    </div>
  </div>
  {/if}

  <!-- Controles Vel -->
  {#if controlMode === 'Vel'}
  <div class="control-panel">
    <div class="control-panel-title">CONTROL DE V REF</div>

    <div class="sliders-grid">
      <!-- Slider de rumbo -->
       <div class="slider-group">
        <label for="slider-left" class="slider-label">RUEDA IZQUIERDA</label>
        <div class="slider-value-display {comando_v_izq >= 0 ? 'positive' : 'negative'}">{comando_v_izq > 0 ? '+' : ''}{comando_v_izq}m/s</div>
        <input
          id="slider-left"
          type="range"
          min="-1"
          max="1"
          step="0.05"
          bind:value={comando_v_izq}
          on:input={sendControl}
          class="control-slider"
        />
      </div>

      <div class="slider-group">
        <label for="slider-left_velocidad" class="slider-label">RUEDA DERECHA</label>
        <div class="slider-value-display {comando_v_der >= 0 ? 'positive' : 'negative'}">{comando_v_der > 0 ? '+' : ''}{comando_v_der}m/s</div>
        <input
          id="slider-left"
          type="range"
          min="-1"
          max="1"
          step="0.05"
          bind:value={comando_v_der}
          on:input={sendControl}
          class="control-slider"
        />
      </div>
      <div class="slider-group">
        <label for="slider-heading" class="slider-label">RUMBO (HEADING)</label>
        <div class="slider-value-display positive">{heading}°</div>
        <input
          id="slider-heading"
          type="range"
          min="0"
          max="360"
          step="5"
          bind:value={heading}
          on:input={sendControl}
          class="control-slider tertiary"
        />
      </div>

      <!-- Slider de empuje -->
      <div class="slider-group">
        <label for="slider-thrust" class="slider-label">EMPUJE (THRUST)</label>
        <div class="slider-value-display positive">{thrust}%</div>
        <input
          id="slider-thrust"
          type="range"
          min="-1"
          max="1"
          step="0.05"
          bind:value={thrust}
          on:input={sendControl}
          class="control-slider"
        />
      </div>
    </div>
  </div>
  {/if}

  <!-- Botones de acción -->
  <div class="control-actions">
    <button id="btn-emergency-stop" class="btn-danger" on:click={emergencyStop}>
      ■ PARADA DE EMERGENCIA
    </button>
  </div>

</section>

<style>
  .override-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--tertiary);
    border: 1px solid var(--tertiary);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  /* ── VISTA CONTROLES ────────────────────────────────────── */
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

  /* Slider personalizado */
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
    width: 16px; height: 16px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }
  .control-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 4px rgba(176, 198, 255, 0.2);
  }
  .control-slider.tertiary::-webkit-slider-thumb { background: var(--tertiary); }

  .control-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  /* Botones generales */
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
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary.btn-full { width: 100%; }

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
