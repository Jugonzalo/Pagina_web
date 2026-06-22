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
  /** @type {() => void} */
  export let syncThrustToWheels;
  /** @type {number} */
  export let comando_w;
  /** @type {number} */
  export let v_total_ref = 0;
  /** @type {number} */
  export let teta_ref = 0;

  // ── Brújula interactiva ─────────────────────────────────
  /** @type {SVGSVGElement | null} */
  let compassEl = null;
  let isDraggingCompass = false;

  /**
   * Calcula el ángulo (0-360, sentido horario desde Norte)
   * a partir de un evento de puntero sobre el SVG de la brújula.
   * @param {PointerEvent} e
   */
  function angleFromPointer(e) {
    if (!compassEl) return;
    const rect = compassEl.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // atan2 da ángulo desde el eje X; lo rotamos para que 0° sea Norte (arriba)
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }

  function onCompassPointerDown(e) {
    isDraggingCompass = true;
    compassEl?.setPointerCapture(e.pointerId);
    const a = angleFromPointer(e);
    if (a !== undefined) { teta_ref = a; heading = a; sendControl(); }
  }

  function onCompassPointerMove(e) {
    if (!isDraggingCompass) return;
    const a = angleFromPointer(e);
    if (a !== undefined) { teta_ref = a; heading = a; sendControl(); }
  }

  function onCompassPointerUp(e) {
    isDraggingCompass = false;
    compassEl?.releasePointerCapture(e.pointerId);
  }

  // Convierte grados a coordenadas X,Y del extremo de la aguja (r = radio)
  function needleXY(deg, r) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: 100 + Math.cos(rad) * r, y: 100 + Math.sin(rad) * r };
  }

  // Marcas de los cardinales
  const cardinals = [
    { label: 'N', deg: 0   },
    { label: 'E', deg: 90  },
    { label: 'S', deg: 180 },
    { label: 'O', deg: 270 },
  ];

  function sendVTetaControl() {
    heading = teta_ref;
    sendControl();
  }

  // ── Geometría reactiva de la brújula ───────────────────────
  $: needleTip  = needleXY(teta_ref, 72);
  $: needleTail = needleXY((teta_ref + 180) % 360, 20);
  $: arrowA     = needleXY(teta_ref - 10, 63);
  $: arrowB     = needleXY(teta_ref + 10, 63);

  // Sector iluminado (arco desde Norte hasta teta_ref)
  $: sectorStartRad = -Math.PI / 2;
  $: sectorEndRad   = (teta_ref - 90) * Math.PI / 180;
  $: sectorR        = 72;
  $: sectorX1       = 100 + Math.cos(sectorStartRad) * sectorR;
  $: sectorY1       = 100 + Math.sin(sectorStartRad) * sectorR;
  $: sectorX2       = 100 + Math.cos(sectorEndRad)   * sectorR;
  $: sectorY2       = 100 + Math.sin(sectorEndRad)   * sectorR;
  $: sectorLargeArc = teta_ref > 180 ? 1 : 0;

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
      id="btn-mode-VTeta"
      class="mode-btn {controlMode === 'VTeta' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode = 'VTeta'}
    >
      MODO 3: V_ref y teta_ref
    </button>
    <button
      id="btn-mode_Pos"
      class="mode-btn {controlMode === 'Pos' ? 'mode-btn--active' : ''}"
      on:click={() => controlMode = 'Pos'}
    >
      MODO 4: Coordenadas
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
        <div class="slider-value-display {comando_v_izq >= 0 ? 'positive' : 'negative'}">{comando_v_izq > 0 ? '+' : ''}{comando_v_izq} cm/s</div>
        <input
          id="slider-left"
          type="range"
          min="-100"
          max="100"
          step="5"
          bind:value={comando_v_izq}
          on:input={sendControl}
          class="control-slider"
        />
      </div>

      <div class="slider-group">
        <label for="slider-der_velocidad" class="slider-label">RUEDA DERECHA</label>
        <div class="slider-value-display {comando_v_der >= 0 ? 'positive' : 'negative'}">{comando_v_der > 0 ? '+' : ''}{comando_v_der} cm/s</div>
        <input
          id="slider-left"
          type="range"
          min="-100"
          max="100"
          step="5"
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
          min="-100"
          max="100"
          step="5"
          bind:value={thrust}
          on:input={syncThrustToWheels}
          class="control-slider"
        />
      </div>
      <div class="slider-group">
  <label for="slider-angular-velocity" class="slider-label">VELOCIDAD ANGULAR (ω ref)</label>
  <div class="slider-value-display {comando_w >= 0 ? 'positive' : 'negative'}">
    {comando_w > 0 ? '+' : ''}{comando_w} rad/s
  </div>
  <input
    id="slider-angular-velocity"
    type="range"
    min="-2"
    max="2"
    step="0.1"
    bind:value={comando_w}
    on:input={sendControl}
    class="control-slider tertiary"
  />
</div>
    </div>
  </div>
  {/if}

  <!-- ── Controles V_ref + teta_ref ─────────────────────── -->
  {#if controlMode === 'VTeta'}
  <div class="control-panel">
    <div class="control-panel-title">CONTROL DE V TOTAL REF + ÁNGULO REF</div>

    <!-- ── Velocidad total ── -->
    <div class="vteta-section">
      <div class="vteta-row-header">
        <span class="slider-label">VELOCIDAD TOTAL — V<sub>ref</sub></span>
        <span class="vteta-val {v_total_ref >= 0 ? 'positive' : 'negative'}">
          {v_total_ref > 0 ? '+' : ''}{v_total_ref.toFixed(0)} <span class="vteta-unit">cm/s</span>
        </span>
      </div>

      <!-- Barra de indicador de velocidad -->
      <div class="vel-bar-wrap">
        <div class="vel-bar-track">
          <div
            class="vel-bar-fill {v_total_ref >= 0 ? 'fill-pos' : 'fill-neg'}"
            style="
              width:  {Math.abs(v_total_ref) / 70 * 50}%;
              left:   {v_total_ref >= 0 ? '50%' : (50 - Math.abs(v_total_ref) / 70 * 50) + '%'};
            "
          ></div>
          <div class="vel-bar-center"></div>
        </div>
      </div>

      <input
        id="slider-v-total-ref"
        type="range"
        min="-70"
        max="70"
        step="1"
        bind:value={v_total_ref}
        on:input={sendVTetaControl}
        class="control-slider vteta-slider"
      />
      <div class="speed-ticks">
        <span>-70 cm/s</span><span>0</span><span>+70 cm/s</span>
      </div>
    </div>

    <!-- ── Separador ── -->
    <div class="vteta-divider"></div>

    <!-- ── Ángulo de referencia ── -->
    <div class="vteta-section">
      <div class="vteta-row-header">
        <span class="slider-label">ÁNGULO REF — θ<sub>ref</sub></span>
        <span class="vteta-val positive">{teta_ref}°</span>
      </div>

      <!-- Brújula centrada -->
      <div class="vteta-compass-wrap">
        <svg
          bind:this={compassEl}
          class="compass-svg"
          viewBox="0 0 200 200"
          role="img"
          aria-label="Brújula: ángulo de referencia {teta_ref}°"
          on:pointerdown={onCompassPointerDown}
          on:pointermove={onCompassPointerMove}
          on:pointerup={onCompassPointerUp}
          on:pointercancel={onCompassPointerUp}
          style="cursor:crosshair;user-select:none;touch-action:none"
        >
          <!-- Fondo -->
          <circle cx="100" cy="100" r="96" fill="#14161f" stroke="#32343e" stroke-width="1.5"/>
          <!-- Anillo de escala -->
          <circle cx="100" cy="100" r="86" fill="none" stroke="#252730" stroke-width="0.5" stroke-dasharray="3 3"/>

          <!-- Marcas cada 30° (mayores) -->
          {#each Array.from({length: 12}, (_, i) => i * 30) as deg}
            {@const rad = (deg - 90) * Math.PI / 180}
            {@const x1 = 100 + Math.cos(rad) * 80}
            {@const y1 = 100 + Math.sin(rad) * 80}
            {@const x2 = 100 + Math.cos(rad) * 88}
            {@const y2 = 100 + Math.sin(rad) * 88}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5a5e72" stroke-width="2"/>
          {/each}

          <!-- Marcas cada 10° (menores) -->
          {#each Array.from({length: 36}, (_, i) => i * 10) as deg}
            {#if deg % 30 !== 0}
              {@const rad = (deg - 90) * Math.PI / 180}
              {@const x1 = 100 + Math.cos(rad) * 84}
              {@const y1 = 100 + Math.sin(rad) * 84}
              {@const x2 = 100 + Math.cos(rad) * 88}
              {@const y2 = 100 + Math.sin(rad) * 88}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#383b4a" stroke-width="1"/>
            {/if}
          {/each}

          <!-- Sector iluminado -->
          {#if teta_ref > 0 && teta_ref < 360}
            <path
              d="M 100 100 L {sectorX1} {sectorY1} A {sectorR} {sectorR} 0 {sectorLargeArc} 1 {sectorX2} {sectorY2} Z"
              fill="rgba(176,198,255,0.07)"
              stroke="none"
            />
          {/if}

          <!-- Aguja: glow sutil -->
          <line x1="100" y1="100" x2={needleTip.x} y2={needleTip.y}
            stroke="#b0c6ff" stroke-width="8" stroke-linecap="round" opacity="0.08"/>

          <!-- Aguja: cola -->
          <line x1="100" y1="100" x2={needleTail.x} y2={needleTail.y}
            stroke="#3a3d50" stroke-width="3" stroke-linecap="round"/>

          <!-- Aguja: cuerpo -->
          <line x1="100" y1="100" x2={needleTip.x} y2={needleTip.y}
            stroke="#b0c6ff" stroke-width="3.5" stroke-linecap="round"/>

          <!-- Aguja: punta de flecha -->
          <polygon
            points="{needleTip.x},{needleTip.y} {arrowA.x},{arrowA.y} {arrowB.x},{arrowB.y}"
            fill="#b0c6ff"
          />

          <!-- Centro -->
          <circle cx="100" cy="100" r="6" fill="#b0c6ff" opacity="0.9"/>
          <circle cx="100" cy="100" r="3.5" fill="#11131c"/>

          <!-- Etiquetas cardinales -->
          {#each cardinals as c}
            {@const rad = (c.deg - 90) * Math.PI / 180}
            {@const lx  = 100 + Math.cos(rad) * 71}
            {@const ly  = 100 + Math.sin(rad) * 71}
            <text
              x={lx} y={ly}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="13"
              font-weight="700"
              font-family="Inter, system-ui, sans-serif"
              fill={c.label === 'N' ? '#f7be00' : '#8a8ea8'}
            >{c.label}</text>
          {/each}
        </svg>
      </div>

      <!-- Slider de ángulo -->
      <input
        id="slider-teta-ref"
        type="range"
        min="0"
        max="360"
        step="1"
        bind:value={teta_ref}
        on:input={() => { heading = teta_ref; sendControl(); }}
        class="control-slider tertiary vteta-slider"
      />
      <div class="speed-ticks">
        <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>360°</span>
      </div>
      <div class="compass-hint">Clic/arrastra la brújula · slider · o stick izquierdo del mando</div>
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

  /* ── Modo V_ref + teta_ref ──────────────────────────────── */
  .vteta-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .vteta-row-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .vteta-val {
    font-size: 3rem;
    font-weight: 700;
    font-family: var(--font-mono);
    line-height: 1;
  }
  .vteta-val.positive { color: var(--primary); }
  .vteta-val.negative { color: var(--error); }
  .vteta-unit {
    font-size: 1.3rem;
    font-weight: 400;
    opacity: 0.6;
  }
  /* barra de velocidad bicolor */
  .vel-bar-wrap { padding: 0.15rem 0 0.3rem; }
  .vel-bar-track {
    position: relative;
    height: 6px;
    background: var(--surface-bright);
    border-radius: 3px;
    overflow: hidden;
  }
  .vel-bar-fill {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 3px;
    transition: width 0.08s, left 0.08s;
  }
  .vel-bar-fill.fill-pos { background: var(--primary); }
  .vel-bar-fill.fill-neg { background: var(--error); }
  .vel-bar-center {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: calc(100% + 2px);
    background: var(--outline-variant);
  }
  .vteta-slider { margin: 0; }
  .vteta-divider {
    border: none;
    border-top: 1px solid var(--outline-variant);
    opacity: 0.35;
    margin: 1rem 0;
  }
  .vteta-compass-wrap {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }
  .compass-svg {
    width: 280px;
    height: 280px;
    flex-shrink: 0;
    border-radius: 50%;
    box-shadow:
      0 0 0 1px rgba(66,70,85,0.7),
      0 0 28px rgba(176,198,255,0.06);
    transition: box-shadow 0.2s;
  }
  .compass-svg:active {
    box-shadow:
      0 0 0 1px rgba(176,198,255,0.35),
      0 0 32px rgba(176,198,255,0.18);
  }
  .compass-hint {
    font-size: 0.72rem;
    color: var(--on-surface-variant);
    letter-spacing: 0.04em;
    text-align: center;
    text-transform: uppercase;
    opacity: 0.65;
    margin-top: 0.35rem;
  }
  .speed-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--on-surface-variant);
    font-family: var(--font-mono);
    opacity: 0.7;
  }

  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .slider-label {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
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