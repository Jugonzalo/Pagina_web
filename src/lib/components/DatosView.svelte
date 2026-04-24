<script>
  /** @type {string} */
  export let ROBOT_ID;
  /** @type {any} */
  export let telemetry;
  /** @type {number[]} */
  export let speedHistory;
  /** @type {number[]} */
  export let accelHistory;

  /**
   * @param {number[]} data
   * @param {number} width
   * @param {number} height
   * @param {number} [maxVal=10]
   */
  function buildSparkPath(data, width, height, maxVal = 10) {
    if (data.length < 2) return '';
    const step = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * step;
        const y = height - (Math.max(0, v) / maxVal) * height;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }
</script>

<section class="view" id="view-datos">
  <!-- Encabezado de sección -->
  <header class="view-header">
    <h1 class="view-title">{ROBOT_ID} <span class="view-title-sub">| Datos</span></h1>
    <div class="live-badge">● STREAM ACTIVO</div>
  </header>

  <!-- Fila de métricas principales -->
  <div class="metrics-grid">
    <!-- Velocidad Motor Izquierdo -->
    <div class="metric-card">
      <div class="metric-label">VELOCIDAD MOTOR L</div>
      <div class="metric-value primary">{telemetry.motorL.toFixed(2)}</div>
      <div class="metric-unit">V_R1 · RPM</div>
      <div class="metric-bar">
        <div class="metric-bar-fill" style="width: {Math.min(100, telemetry.motorL / 10 * 100)}%"></div>
      </div>
    </div>

    <!-- Velocidad Motor Derecho -->
    <div class="metric-card">
      <div class="metric-label">VELOCIDAD MOTOR R</div>
      <div class="metric-value primary">{telemetry.motorR.toFixed(2)}</div>
      <div class="metric-unit">V_R2 · RPM</div>
      <div class="metric-bar">
        <div class="metric-bar-fill" style="width: {Math.min(100, telemetry.motorR / 10 * 100)}%"></div>
      </div>
    </div>

    <!-- Velocidad Angular -->
    <div class="metric-card">
      <div class="metric-label">VELOCIDAD ANGULAR</div>
      <div class="metric-value secondary">{telemetry.angularVel.toFixed(3)}</div>
      <div class="metric-unit">ω · rad/s</div>
      <div class="metric-bar secondary">
        <div class="metric-bar-fill secondary" style="width: {Math.min(100, Math.abs(telemetry.angularVel) / 0.3 * 100)}%"></div>
      </div>
    </div>

    <!-- Dirección / Yaw -->
    <div class="metric-card">
      <div class="metric-label">DIRECCIÓN (YAW)</div>
      <div class="metric-value tertiary">{telemetry.yaw.toFixed(1)}</div>
      <div class="metric-unit">θ · grados</div>
      <div class="metric-bar tertiary">
        <div class="metric-bar-fill tertiary" style="width: {telemetry.yaw / 360 * 100}%"></div>
      </div>
    </div>

    <!-- Posición Global X-Y -->
    <div class="metric-card metric-card--wide">
      <div class="metric-label">POSICIÓN GLOBAL (X-Y)</div>
      <div class="coords-row">
        <div class="coord-block">
          <span class="coord-axis">X</span>
          <span class="metric-value primary mono">{telemetry.posX.toFixed(2)}</span>
          <span class="coord-unit">m</span>
        </div>
        <div class="coord-separator">—</div>
        <div class="coord-block">
          <span class="coord-axis">Y</span>
          <span class="metric-value primary mono">{telemetry.posY.toFixed(2)}</span>
          <span class="coord-unit">m</span>
        </div>
      </div>
    </div>
  </div><!-- /metrics-grid -->

  <!-- Fila de gráficos -->
  <div class="charts-row">
    <!-- Gráfico velocidad vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">VELOCIDAD vs TIEMPO</div>
      <svg class="chart-svg" viewBox="0 0 280 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--primary)"     stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--primary)"     stop-opacity="0"/>
          </linearGradient>
        </defs>
        {#if speedHistory.length > 1}
          <path
            d="{buildSparkPath(speedHistory, 280, 80)} L 280 80 L 0 80 Z"
            fill="url(#speedGrad)"
          />
          <path
            d="{buildSparkPath(speedHistory, 280, 80)}"
            fill="none"
            stroke="var(--primary)"
            stroke-width="2"
            stroke-linejoin="round"
          />
        {/if}
      </svg>
    </div>

    <!-- Gráfico aceleración vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">ACELERACIÓN vs TIEMPO</div>
      <svg class="chart-svg" viewBox="0 0 280 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="accelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--secondary)"   stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--secondary)"   stop-opacity="0"/>
          </linearGradient>
        </defs>
        {#if accelHistory.length > 1}
          <path
            d="{buildSparkPath(accelHistory, 280, 80, 0.5)} L 280 80 L 0 80 Z"
            fill="url(#accelGrad)"
          />
          <path
            d="{buildSparkPath(accelHistory, 280, 80, 0.5)}"
            fill="none"
            stroke="var(--secondary)"
            stroke-width="2"
            stroke-linejoin="round"
          />
        {/if}
      </svg>
    </div>
  </div><!-- /charts-row -->
</section>

<style>
  /* Badges de estado en el header */
  .live-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--secondary);
    border: 1px solid var(--secondary);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
    animation: pulse 1.5s infinite;
  }

  /* ── VISTA DATOS: MÉTRICAS ──────────────────────────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    border-left: 2px solid var(--primary-container);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    transition: background 0.2s;
  }
  .metric-card:hover { background: var(--surface-high); }
  .metric-card--wide { grid-column: span 2; }

  .metric-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }
  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    font-family: var(--font-mono);
  }
  .metric-value.primary   { color: var(--primary); }
  .metric-value.secondary { color: var(--secondary); }
  .metric-value.tertiary  { color: var(--tertiary); }
  .metric-value.mono      { font-family: var(--font-mono); }

  .metric-unit {
    font-size: 0.65rem;
    color: var(--on-surface-variant);
    letter-spacing: 0.04em;
  }

  /* Barra de progreso de métrica */
  .metric-bar {
    height: 3px;
    background: var(--surface-bright);
    border-radius: 2px;
    margin-top: 0.5rem;
    overflow: hidden;
  }
  .metric-bar-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: width 0.5s ease;
  }
  .metric-bar.secondary .metric-bar-fill,
  .metric-bar-fill.secondary { background: var(--secondary); }
  .metric-bar.tertiary .metric-bar-fill,
  .metric-bar-fill.tertiary  { background: var(--tertiary); }

  /* Coordenadas X-Y */
  .coords-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }
  .coord-block { display: flex; align-items: baseline; gap: 0.5rem; }
  .coord-axis {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--on-surface-variant);
    letter-spacing: 0.05em;
  }
  .coord-unit { font-size: 0.7rem; color: var(--on-surface-variant); margin-left: 0.2rem; }
  .coord-separator { color: var(--outline-variant); font-size: 1.2rem; }

  /* ── VISTA DATOS: GRÁFICOS ──────────────────────────────── */
  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .chart-card {
    background: var(--surface-high);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    backdrop-filter: blur(12px);
  }
  .chart-title {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    margin-bottom: 0.75rem;
  }
  .chart-svg {
    width: 100%;
    height: 80px;
    display: block;
    overflow: visible;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
</style>
