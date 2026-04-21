<!-- ============================================================
     VISTA: Datos de Telemetría
     ============================================================
     Muestra en tiempo real los datos del robot:
       - Dos gauges (velocímetros) para Motor L y Motor R
       - Grid de métricas secundarias (pos, yaw, angular vel)
       - Dos mini-gráficos de historial (velocidad y aceleración)

     Esta vista solo LEE stores; no los modifica.
     Los datos llegan del loop de updateTelemetry() en +page.svelte.
     ============================================================ -->
<script>
  import { ROBOT_ID } from '$lib/config/constants';
  import { telemetry, speedHistory, accelHistory } from '$lib/stores/robot';
  import GaugeChart from '$lib/components/ui/GaugeChart.svelte';
  import SparkChart from '$lib/components/ui/SparkChart.svelte';
</script>

<section class="view" id="view-datos">

  <!-- Encabezado -->
  <header class="view-header">
    <h1 class="view-title">
      {ROBOT_ID} <span class="view-title-sub">| Datos</span>
    </h1>
    <div class="live-badge">● STREAM ACTIVO</div>
  </header>

  <!-- ── GAUGES DE VELOCIDAD ───────────────────────────────────
       Dos velocímetros side-by-side para Motor L y Motor R.
       GaugeChart recibe el valor en tiempo real desde el store
       y ECharts anima la aguja automáticamente.
  ─────────────────────────────────────────────────────────── -->
  <div class="gauges-row">

    <!-- Velocímetro Motor Izquierdo -->
    <div class="gauge-card">
      <div class="gauge-card-label">MOTOR IZQUIERDO · V_R1</div>
      <GaugeChart
        value={$telemetry.motorL}
        maxVal={10}
        label="MOTOR L"
        unit="RPM"
      />
    </div>

    <!-- Velocímetro Motor Derecho -->
    <div class="gauge-card">
      <div class="gauge-card-label">MOTOR DERECHO · V_R2</div>
      <GaugeChart
        value={$telemetry.motorR}
        maxVal={10}
        label="MOTOR R"
        unit="RPM"
      />
    </div>

  </div><!-- /gauges-row -->

  <!-- ── MÉTRICAS SECUNDARIAS ──────────────────────────────────
       Velocidad angular, dirección y posición en cards más
       compactas, ya que los gauges ya dominan la sección.
  ─────────────────────────────────────────────────────────── -->
  <div class="metrics-grid">

    <!-- Velocidad angular (rad/s) -->
    <div class="metric-card">
      <div class="metric-label">VELOCIDAD ANGULAR</div>
      <div class="metric-value secondary">{$telemetry.angularVel.toFixed(3)}</div>
      <div class="metric-unit">ω · rad/s</div>
      <!-- Barra: 0.3 rad/s = 100% -->
      <div class="metric-bar secondary">
        <div class="metric-bar-fill secondary" style="width: {Math.min(100, Math.abs($telemetry.angularVel) / 0.3 * 100)}%"></div>
      </div>
    </div>

    <!-- Orientación / Yaw (grados) -->
    <div class="metric-card">
      <div class="metric-label">DIRECCIÓN (YAW)</div>
      <div class="metric-value tertiary">{$telemetry.yaw.toFixed(1)}</div>
      <div class="metric-unit">θ · grados</div>
      <!-- Barra: 360° = 100% -->
      <div class="metric-bar tertiary">
        <div class="metric-bar-fill tertiary" style="width: {$telemetry.yaw / 360 * 100}%"></div>
      </div>
    </div>

    <!-- Posición global X e Y (metros) — ocupa 2 columnas -->
    <div class="metric-card metric-card--wide">
      <div class="metric-label">POSICIÓN GLOBAL (X-Y)</div>
      <div class="coords-row">
        <div class="coord-block">
          <span class="coord-axis">X</span>
          <span class="metric-value primary mono">{$telemetry.posX.toFixed(2)}</span>
          <span class="coord-unit">m</span>
        </div>
        <div class="coord-separator">—</div>
        <div class="coord-block">
          <span class="coord-axis">Y</span>
          <span class="metric-value primary mono">{$telemetry.posY.toFixed(2)}</span>
          <span class="coord-unit">m</span>
        </div>
      </div>
    </div>

  </div><!-- /metrics-grid -->

  <!-- ── GRÁFICOS DE HISTORIAL ─────────────────────────────────
       SparkChart: mini-gráfico SVG reutilizable.
       gradId debe ser único por instancia para que los gradientes
       SVG no se "contaminen" entre sí.
  ─────────────────────────────────────────────────────────── -->
  <div class="charts-row">

    <!-- Velocidad promedio vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">VELOCIDAD vs TIEMPO</div>
      <SparkChart
        data={$speedHistory}
        color="var(--primary)"
        maxVal={10}
        gradId="speedGrad"
      />
    </div>

    <!-- Aceleración estimada vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">ACELERACIÓN vs TIEMPO</div>
      <SparkChart
        data={$accelHistory}
        color="var(--secondary)"
        maxVal={0.5}
        gradId="accelGrad"
      />
    </div>

  </div><!-- /charts-row -->

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
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* ── GAUGES ──────────────────────────────────────────────── */
  /* Fila de dos velocímetros, uno al lado del otro */
  .gauges-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  /* Card contenedora de cada gauge */
  .gauge-card {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem 0.5rem;
    border-left: 2px solid var(--primary-container);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: background 0.2s;
  }
  .gauge-card:hover { background: var(--surface-high); }

  /* Etiqueta sobre el gauge */
  .gauge-card-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
    align-self: flex-start;
    margin-bottom: 0.25rem;
  }

  /* ── MÉTRICAS ────────────────────────────────────────────── */
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

  /* Bloque de coordenadas X-Y */
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

  /* ── GRÁFICOS ────────────────────────────────────────────── */
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
</style>
