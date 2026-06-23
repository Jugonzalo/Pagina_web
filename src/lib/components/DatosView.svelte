<script>
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';
  import { Chart, registerables } from 'chart.js';

  // Registrar todos los módulos de Chart.js (scatter, line, etc.)
  Chart.register(...registerables);

  // ============================================================
  // PROPS
  // ============================================================
  /** @type {string} */
  export let ROBOT_ID;
  /** @type {any} */
  export let telemetry;
  // Nota: speedHistory y accelHistory ya no se usan aquí;
  // el componente gestiona su propio historial internamente.
  /** @type {number[]} */
  export let speedHistory = [];
  /** @type {number[]} */
  export let accelHistory = [];

  // ============================================================
  // VARIABLES DE CONFIGURACIÓN — FÁCILES DE AJUSTAR
  // ============================================================

  // --- Velocímetros de ruedas (ECharts) ---
  const GAUGE_WHEEL_MIN      = -120;  // Valor mínimo de los velocímetros de rueda (cm/s)
  const GAUGE_WHEEL_MAX      =  120;  // Valor máximo de los velocímetros de rueda (cm/s)

  // --- Velocímetro velocidad angular (ECharts) ---
  const GAUGE_OMEGA_MIN      = -2;    // Valor mínimo del velocímetro de velocidad angular (rad/s)
  const GAUGE_OMEGA_MAX      =  2;    // Valor máximo del velocímetro de velocidad angular (rad/s)

  // --- Velocímetro velocidad total (ECharts) ---
  const GAUGE_VTOTAL_MIN     =  0;    // Valor mínimo del velocímetro de velocidad total (cm/s)
  const GAUGE_VTOTAL_MAX     =  50;   // Valor máximo del velocímetro de velocidad total (cm/s)

  // --- Gráfico scatter de coordenadas (Chart.js) ---
  const SCATTER_X_MIN        = -10;   // Eje X mínimo del scatter (cm)
  const SCATTER_X_MAX        =  160;  // Eje X máximo del scatter (cm)
  const SCATTER_Y_MIN        = -10;   // Eje Y mínimo del scatter (cm)
  const SCATTER_Y_MAX        =  130;  // Eje Y máximo del scatter (cm)
  const SCATTER_MAX_POINTS   = 200;   // Máximo de puntos históricos en el scatter

  // --- Gráficos de velocidad vs tiempo (Chart.js line) ---
  const LINE_SPEED_Y_MIN     = -120;  // Eje Y mínimo en gráficos de velocidad (cm/s)
  const LINE_SPEED_Y_MAX     =  120;  // Eje Y máximo en gráficos de velocidad (cm/s)
  const LINE_VTOTAL_Y_MIN    =  0;    // Eje Y mínimo en gráfico de velocidad total (cm/s)
  const LINE_VTOTAL_Y_MAX    =  50;   // Eje Y máximo en gráfico de velocidad total (cm/s)
  const LINE_MAX_POINTS      = 60;    // Número máximo de puntos en línea de tiempo
  const LINE_TIME_INTERVAL_MS = 500;  // Intervalo de muestreo en ms para los gráficos de línea

  // --- Medidores de distancia de pared ---
  const WALL_DIST_MAX        = 100;   // Distancia máxima representable (cm)
  const WALL_DIST_WARN_PCT   = 30;    // % por debajo del cual se vuelve amarillo
  const WALL_DIST_DANGER_PCT = 15;    // % por debajo del cual se vuelve rojo

  // ============================================================
  // REFERENCIAS A CONTENEDORES DOM (ECharts)
  // ============================================================
  let chartContainerL;       // Contenedor gauge motor izquierdo
  let chartContainerR;       // Contenedor gauge motor derecho
  let chartContainerOmega;   // Contenedor gauge velocidad angular
  let chartContainerVtotal;  // Contenedor gauge velocidad total

  // Instancias de ECharts
  let chartL;
  let chartR;
  let chartOmega;
  let chartVtotal;

  // ============================================================
  // REFERENCIAS A CONTENEDORES DOM (Chart.js)
  // ============================================================
  let canvasScatter;      // Scatter: trayectoria cartesiana
  let canvasLineL;        // Line: velocidad rueda izquierda vs tiempo
  let canvasLineR;        // Line: velocidad rueda derecha vs tiempo
  let canvasLineVtotal;   // Line: velocidad total vs tiempo

  // Instancias de Chart.js
  let chartjsScatter;
  let chartjsLineL;
  let chartjsLineR;
  let chartjsLineVtotal;

  // ============================================================
  // HISTORIAL DE PUNTOS PARA CHART.JS
  // ============================================================

  // Puntos de trayectoria (scatter)
  /** @type {{ x: number, y: number }[]} */
  let scatterPoints = [];

  // Historial de velocidad por rueda y total (line charts)
  /** @type {number[]} */
  let historyMotorL   = [];
  /** @type {number[]} */
  let historyMotorR   = [];
  /** @type {number[]} */
  let historyVtotal   = [];
  /** @type {string[]} */
  let historyLabels   = [];  // Etiquetas de tiempo compartidas

  // Intervalo de muestreo para los line charts
  let samplingInterval;

  // ============================================================
  // FUNCIÓN AUXILIAR: OPCIÓN DE GAUGE (ECharts)
  // ============================================================

  /**
   * Genera la opción de configuración para un gauge ECharts.
   * @param {number} value  - Valor actual
   * @param {number} min    - Valor mínimo
   * @param {number} max    - Valor máximo
   * @param {number} decimals - Número de decimales a mostrar
   */
  function getGaugeOption(value, min, max, decimals = 2) {
    return {
      series: [
        {
          type: 'gauge',
          min,
          max,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.3, '#67e0e3'],
                [0.7, '#37a2da'],
                [1,   '#fd666d']
              ]
            }
          },
          pointer: {
            itemStyle: { color: 'auto' }
          },
          axisTick: {
            distance: -10,
            length: 4,
            lineStyle: { color: '#fff', width: 1 }
          },
          splitLine: {
            distance: -10,
            length: 10,
            lineStyle: { color: '#fff', width: 2 }
          },
          axisLabel: {
            color: 'inherit',
            distance: 15,
            fontSize: 10
          },
          detail: {
            valueAnimation: true,
            formatter: `{value}`,
            color: 'inherit',
            fontSize: 16,
            offsetCenter: [0, '65%']
          },
          data: [{ value: parseFloat(value.toFixed(decimals)) }]
        }
      ]
    };
  }

  // ============================================================
  // FUNCIÓN AUXILIAR: HORA ACTUAL (etiqueta para line charts)
  // ============================================================
  function nowLabel() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
  }

  // ============================================================
  // FUNCIÓN AUXILIAR: COLOR BARRA DISTANCIA DE PARED
  // Retorna un color CSS según qué tan cerca está la pared (0 = peligro).
  // ============================================================
  /**
   * @param {number} value    - Valor actual de distancia
   * @param {number} maxVal   - Valor máximo de la barra
   */
  function wallBarColor(value, maxVal) {
    const pct = (value / maxVal) * 100;
    if (pct <= WALL_DIST_DANGER_PCT) return '#fd666d';   // Rojo: muy cerca
    if (pct <= WALL_DIST_WARN_PCT)   return '#f7be00';   // Amarillo: precaución
    return '#37a2da';                                     // Azul: seguro
  }

  // ============================================================
  // INICIALIZACIÓN DE ECHARTS
  // ============================================================
  function initECharts() {
    // Gauge motor izquierdo
    chartL = echarts.init(chartContainerL);
    chartL.setOption(getGaugeOption(telemetry.motorL, GAUGE_WHEEL_MIN, GAUGE_WHEEL_MAX));

    // Gauge motor derecho
    chartR = echarts.init(chartContainerR);
    chartR.setOption(getGaugeOption(telemetry.motorR, GAUGE_WHEEL_MIN, GAUGE_WHEEL_MAX));

    // Gauge velocidad angular
    chartOmega = echarts.init(chartContainerOmega);
    chartOmega.setOption(getGaugeOption(telemetry.angularVel, GAUGE_OMEGA_MIN, GAUGE_OMEGA_MAX, 3));

    // Gauge velocidad total
    chartVtotal = echarts.init(chartContainerVtotal);
    chartVtotal.setOption(getGaugeOption(telemetry.v_total, GAUGE_VTOTAL_MIN, GAUGE_VTOTAL_MAX));
  }

  // ============================================================
  // INICIALIZACIÓN DE CHART.JS — SCATTER TRAYECTORIA
  // ============================================================
  function initScatterChart() {
    chartjsScatter = new Chart(canvasScatter, {
      type: 'scatter',
      data: {
        datasets: [
          {
            // Trayectoria histórica (puntos grises)
            label: 'Trayectoria',
            data: scatterPoints,
            backgroundColor: 'rgba(176, 198, 255, 0.35)',
            pointRadius: 2,
            pointHoverRadius: 4,
          },
          {
            // Posición actual (punto grande resaltado)
            label: 'Posición actual',
            data: [{ x: telemetry.posX, y: telemetry.posY }],
            backgroundColor: '#7dffa2',
            pointRadius: 8,
            pointHoverRadius: 10,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },  // Sin animación para tiempo real
        plugins: {
          legend: {
            labels: { color: '#c2c6d7', font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `(${ctx.parsed.x.toFixed(1)}, ${ctx.parsed.y.toFixed(1)}) cm`
            }
          }
        },
        scales: {
          x: {
            min: SCATTER_X_MIN,
            max: SCATTER_X_MAX,
            title: { display: true, text: 'X (cm)', color: '#c2c6d7', font: { size: 10 } },
            grid:   { color: 'rgba(66,70,85,0.4)' },
            ticks:  { color: '#c2c6d7', font: { size: 9 } }
          },
          y: {
            min: SCATTER_Y_MIN,
            max: SCATTER_Y_MAX,
            title: { display: true, text: 'Y (cm)', color: '#c2c6d7', font: { size: 10 } },
            grid:   { color: 'rgba(66,70,85,0.4)' },
            ticks:  { color: '#c2c6d7', font: { size: 9 } }
          }
        }
      }
    });
  }

  // ============================================================
  // FUNCIÓN AUXILIAR: CREAR UN LINE CHART (Chart.js)
  // ============================================================
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string} label        - Etiqueta de la serie
   * @param {string} color        - Color de la línea (hex)
   * @param {number} yMin
   * @param {number} yMax
   */
  function createLineChart(canvas, label, color, yMin, yMax) {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: color,
          backgroundColor: color + '22',  // Color con transparencia para el área
          borderWidth: 2,
          pointRadius: 0,      // Sin puntos para mejor rendimiento en tiempo real
          fill: true,
          tension: 0.3,        // Suavizado de curva
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: { labels: { color: '#c2c6d7', font: { size: 10 } } }
        },
        scales: {
          x: {
            ticks: {
              color: '#c2c6d7',
              font: { size: 8 },
              maxTicksLimit: 6,   // Mostrar máximo 6 etiquetas de tiempo
              maxRotation: 0
            },
            grid: { color: 'rgba(66,70,85,0.4)' }
          },
          y: {
            min: yMin,
            max: yMax,
            grid:  { color: 'rgba(66,70,85,0.4)' },
            ticks: { color: '#c2c6d7', font: { size: 9 } }
          }
        }
      }
    });
  }

  // ============================================================
  // INICIALIZACIÓN DE CHART.JS — LINE CHARTS VELOCIDAD VS TIEMPO
  // ============================================================
  function initLineCharts() {
    chartjsLineL = createLineChart(
      canvasLineL,
      'Velocidad Motor L (cm/s)',
      '#b0c6ff',   // Color azul-primario
      LINE_SPEED_Y_MIN,
      LINE_SPEED_Y_MAX
    );

    chartjsLineR = createLineChart(
      canvasLineR,
      'Velocidad Motor R (cm/s)',
      '#558dff',   // Color azul más intenso
      LINE_SPEED_Y_MIN,
      LINE_SPEED_Y_MAX
    );

    chartjsLineVtotal = createLineChart(
      canvasLineVtotal,
      'Velocidad Total (cm/s)',
      '#7dffa2',   // Color verde-secundario
      LINE_VTOTAL_Y_MIN,
      LINE_VTOTAL_Y_MAX
    );
  }

  // ============================================================
  // MUESTREO PERIÓDICO PARA LINE CHARTS
  // Agrega un punto nuevo cada LINE_TIME_INTERVAL_MS milisegundos.
  // ============================================================
  function startSampling() {
    samplingInterval = setInterval(() => {
      const label = nowLabel();

      // Agregar etiqueta de tiempo y limitar al máximo de puntos
      historyLabels = [...historyLabels, label].slice(-LINE_MAX_POINTS);
      historyMotorL = [...historyMotorL, telemetry.motorL].slice(-LINE_MAX_POINTS);
      historyMotorR = [...historyMotorR, telemetry.motorR].slice(-LINE_MAX_POINTS);
      historyVtotal = [...historyVtotal, telemetry.v_total].slice(-LINE_MAX_POINTS);

      // Actualizar datos en Chart.js
      if (chartjsLineL) {
        chartjsLineL.data.labels   = historyLabels;
        chartjsLineL.data.datasets[0].data = historyMotorL;
        chartjsLineL.update('none');  // 'none' evita animación
      }
      if (chartjsLineR) {
        chartjsLineR.data.labels   = historyLabels;
        chartjsLineR.data.datasets[0].data = historyMotorR;
        chartjsLineR.update('none');
      }
      if (chartjsLineVtotal) {
        chartjsLineVtotal.data.labels   = historyLabels;
        chartjsLineVtotal.data.datasets[0].data = historyVtotal;
        chartjsLineVtotal.update('none');
      }
    }, LINE_TIME_INTERVAL_MS);
  }

  // ============================================================
  // onMount — INICIALIZAR TODO
  // ============================================================
  onMount(() => {
    initECharts();
    initScatterChart();
    initLineCharts();
    startSampling();

    // Redimensionar todos los charts cuando cambia el tamaño de ventana
    const handleResize = () => {
      chartL?.resize();
      chartR?.resize();
      chartOmega?.resize();
      chartVtotal?.resize();
      chartjsScatter?.resize();
      chartjsLineL?.resize();
      chartjsLineR?.resize();
      chartjsLineVtotal?.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup al destruir el componente
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(samplingInterval);
      chartL?.dispose();
      chartR?.dispose();
      chartOmega?.dispose();
      chartVtotal?.dispose();
      chartjsScatter?.destroy();
      chartjsLineL?.destroy();
      chartjsLineR?.destroy();
      chartjsLineVtotal?.destroy();
    };
  });

  onDestroy(() => {
    clearInterval(samplingInterval);
  });

  // ============================================================
  // REACTIVIDAD — ACTUALIZAR GAUGES ECHARTS
  // ============================================================

  // Gauge motor izquierdo
  $: if (chartL && telemetry) {
    chartL.setOption({ series: [{ data: [{ value: parseFloat(telemetry.motorL.toFixed(2)) }] }] });
  }
  // Gauge motor derecho
  $: if (chartR && telemetry) {
    chartR.setOption({ series: [{ data: [{ value: parseFloat(telemetry.motorR.toFixed(2)) }] }] });
  }
  // Gauge velocidad angular
  $: if (chartOmega && telemetry) {
    chartOmega.setOption({ series: [{ data: [{ value: parseFloat(telemetry.angularVel.toFixed(3)) }] }] });
  }
  // Gauge velocidad total
  $: if (chartVtotal && telemetry) {
    chartVtotal.setOption({ series: [{ data: [{ value: parseFloat(telemetry.v_total.toFixed(2)) }] }] });
  }

  // ============================================================
  // REACTIVIDAD — ACTUALIZAR SCATTER CHART (posición)
  // ============================================================
  $: if (chartjsScatter && telemetry) {
    // Agregar punto nuevo a la trayectoria histórica
    scatterPoints = [...scatterPoints, { x: telemetry.posX, y: telemetry.posY }]
                    .slice(-SCATTER_MAX_POINTS);

    // Actualizar dataset de trayectoria y posición actual
    chartjsScatter.data.datasets[0].data = scatterPoints;
    chartjsScatter.data.datasets[1].data = [{ x: telemetry.posX, y: telemetry.posY }];
    chartjsScatter.update('none');
  }

  // ============================================================
  // REACTIVIDAD — ÁNGULO DE LA BRÚJULA
  // El SVG rota según el yaw del robot (en grados).
  // ============================================================
  $: compassRotation = -(telemetry?.yaw ?? 0);  // Negativo para que Norte apunte en la dirección correcta
</script>

<!-- ============================================================
     VISTA DE DATOS
     ============================================================ -->
<section class="view" id="view-datos">

  <!-- Encabezado -->
  <header class="view-header">
    <h1 class="view-title">{ROBOT_ID} <span class="view-title-sub">| Datos</span></h1>
    <div class="live-badge">● STREAM ACTIVO</div>
  </header>

  <!-- ══════════════════════════════════════════════════════════
       FILA 1: VELOCÍMETROS DE RUEDAS + ANGULAR + TOTAL
       ══════════════════════════════════════════════════════════ -->
  <div class="section-title">Velocidades</div>
  <div class="gauges-row">

    <!-- Gauge Motor Izquierdo -->
    <div class="metric-card gauge-card">
      <div class="metric-label">MOTOR IZQUIERDO (cm/s)</div>
      <!-- Contenedor ECharts -->
      <div bind:this={chartContainerL} class="gauge-container"></div>
      <!-- Valor numérico exacto debajo del gauge -->
      <div class="gauge-value">{telemetry.motorL.toFixed(1)} <span class="gauge-unit">cm/s</span></div>
    </div>

    <!-- Gauge Motor Derecho -->
    <div class="metric-card gauge-card">
      <div class="metric-label">MOTOR DERECHO (cm/s)</div>
      <div bind:this={chartContainerR} class="gauge-container"></div>
      <div class="gauge-value">{telemetry.motorR.toFixed(1)} <span class="gauge-unit">cm/s</span></div>
    </div>

    <!-- Gauge Velocidad Angular -->
    <div class="metric-card gauge-card">
      <div class="metric-label">VELOCIDAD ANGULAR (rad/s)</div>
      <div bind:this={chartContainerOmega} class="gauge-container"></div>
      <div class="gauge-value">{telemetry.angularVel.toFixed(4)} <span class="gauge-unit">rad/s</span></div>
    </div>

    <!-- Gauge Velocidad Total -->
    <div class="metric-card gauge-card">
      <div class="metric-label">VELOCIDAD TOTAL (cm/s)</div>
      <div bind:this={chartContainerVtotal} class="gauge-container"></div>
      <div class="gauge-value">{telemetry.v_total.toFixed(1)} <span class="gauge-unit">cm/s</span></div>
    </div>

  </div><!-- /gauges-row -->

  <!-- ══════════════════════════════════════════════════════════
       FILA 2: BRÚJULA (DIRECCIÓN)
       ══════════════════════════════════════════════════════════ -->
  <div class="section-title">Orientación</div>
  <div class="compass-row">

    <!-- BRÚJULA — Dirección angular (Yaw) -->
    <div class="metric-card compass-card">
      <div class="metric-label">DIRECCIÓN ANGULAR (YAW)</div>

      <!-- SVG de la brújula: el grupo interno rota según el yaw -->
      <div class="compass-wrapper">
        <svg class="compass-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Círculo exterior de fondo -->
          <circle cx="60" cy="60" r="56" fill="#1d1f29" stroke="#424655" stroke-width="1.5"/>

          <!-- Marcas cardinales fijas -->
          <text x="60" y="12"  text-anchor="middle" fill="#e1e1ef" font-size="9" font-weight="700">N</text>
          <text x="112" y="64" text-anchor="middle" fill="#c2c6d7" font-size="9">E</text>
          <text x="60" y="115" text-anchor="middle" fill="#c2c6d7" font-size="9">S</text>
          <text x="8"  y="64"  text-anchor="middle" fill="#c2c6d7" font-size="9">O</text>

          <!-- Marcas de grados cada 30° (fijas) -->
          {#each [0,30,60,90,120,150,180,210,240,270,300,330] as deg}
            <line
              x1={60 + 48 * Math.sin(deg * Math.PI / 180)}
              y1={60 - 48 * Math.cos(deg * Math.PI / 180)}
              x2={60 + 53 * Math.sin(deg * Math.PI / 180)}
              y2={60 - 53 * Math.cos(deg * Math.PI / 180)}
              stroke="#424655" stroke-width="1.5"
            />
          {/each}

          <!-- Grupo que rota: aguja de la brújula -->
          <g transform="rotate({compassRotation}, 60, 60)">
            <!-- Flecha Norte (roja) — única punta -->
            <polygon points="60,14 56,60 60,54 64,60" fill="#fd666d"/>
            <!-- Centro -->
            <circle cx="60" cy="60" r="4" fill="#e1e1ef" stroke="#424655" stroke-width="1"/>
          </g>
        </svg>
      </div>

      <!-- Valor numérico exacto del ángulo -->
      <div class="gauge-value">{telemetry.yaw.toFixed(1)}° <span class="gauge-unit">yaw</span></div>
    </div>

  </div><!-- /compass-row -->

  <!-- ══════════════════════════════════════════════════════════
       FILA 3: GRÁFICOS VELOCIDAD VS TIEMPO (Chart.js Line)
       ══════════════════════════════════════════════════════════ -->
  <div class="section-title">Velocidad vs Tiempo</div>
  <div class="line-charts-row">

    <!-- Motor izquierdo vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">MOTOR IZQUIERDO vs TIEMPO</div>
      <div class="line-chart-container">
        <canvas bind:this={canvasLineL}></canvas>
      </div>
    </div>

    <!-- Motor derecho vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">MOTOR DERECHO vs TIEMPO</div>
      <div class="line-chart-container">
        <canvas bind:this={canvasLineR}></canvas>
      </div>
    </div>

    <!-- Velocidad total vs tiempo -->
    <div class="chart-card">
      <div class="chart-title">VELOCIDAD TOTAL vs TIEMPO</div>
      <div class="line-chart-container">
        <canvas bind:this={canvasLineVtotal}></canvas>
      </div>
    </div>

  </div><!-- /line-charts-row -->

  <!-- ══════════════════════════════════════════════════════════
       FILA 4: DISTANCIAS DE PARED
       La barra se llena de izquierda a derecha; a medida que el
       valor baja (más cerca de la pared), la barra se vuelve roja.
       ══════════════════════════════════════════════════════════ -->
  <div class="section-title">Distancias de Pared</div>
  <div class="walls-row">

    <!-- Pared Izquierda -->
    <div class="metric-card wall-card">
      <div class="metric-label">PARED IZQUIERDA</div>
      <div class="wall-value">
        {telemetry.dist_pared_izq.toFixed(1)}
        <span class="wall-unit">cm</span>
      </div>
      <!-- Barra de distancia: el color cambia según proximidad -->
      <div class="wall-bar-track">
        <div
          class="wall-bar-fill"
          style="
            width: {Math.min(100, (telemetry.dist_pared_izq / WALL_DIST_MAX) * 100).toFixed(1)}%;
            background: {wallBarColor(telemetry.dist_pared_izq, WALL_DIST_MAX)};
          "
        ></div>
      </div>
      <!-- Indicadores de escala mín/máx -->
      <div class="wall-scale">
        <span>0 cm</span>
        <span>{WALL_DIST_MAX} cm</span>
      </div>
    </div>

    <!-- Pared Derecha -->
    <div class="metric-card wall-card">
      <div class="metric-label">PARED DERECHA</div>
      <div class="wall-value">
        {telemetry.dist_pared_der.toFixed(1)}
        <span class="wall-unit">cm</span>
      </div>
      <div class="wall-bar-track">
        <div
          class="wall-bar-fill"
          style="
            width: {Math.min(100, (telemetry.dist_pared_der / WALL_DIST_MAX) * 100).toFixed(1)}%;
            background: {wallBarColor(telemetry.dist_pared_der, WALL_DIST_MAX)};
          "
        ></div>
      </div>
      <div class="wall-scale">
        <span>0 cm</span>
        <span>{WALL_DIST_MAX} cm</span>
      </div>
    </div>

    <!-- Pared Trasera -->
    <div class="metric-card wall-card">
      <div class="metric-label">PARED TRASERA</div>
      <div class="wall-value">
        {telemetry.dist_pared_trasera.toFixed(1)}
        <span class="wall-unit">cm</span>
      </div>
      <div class="wall-bar-track">
        <div
          class="wall-bar-fill"
          style="
            width: {Math.min(100, (telemetry.dist_pared_trasera / WALL_DIST_MAX) * 100).toFixed(1)}%;
            background: {wallBarColor(telemetry.dist_pared_trasera, WALL_DIST_MAX)};
          "
        ></div>
      </div>
      <div class="wall-scale">
        <span>0 cm</span>
        <span>{WALL_DIST_MAX} cm</span>
      </div>
    </div>

  </div><!-- /walls-row -->

  <!-- ══════════════════════════════════════════════════════════
       FILA 5: POSICIÓN CARTESIANA (X-Y) — GRILLA / SCATTER
       ══════════════════════════════════════════════════════════ -->
  <div class="section-title">Posición Cartesiana (X-Y)</div>
  <div class="coords-full-card metric-card">

    <!-- Valores numéricos actuales -->
    <div class="coords-row">
      <div class="coord-block">
        <span class="coord-axis">X</span>
        <span class="metric-value primary mono">{telemetry.posX.toFixed(1)}</span>
        <span class="coord-unit">cm</span>
      </div>
      <div class="coord-separator">—</div>
      <div class="coord-block">
        <span class="coord-axis">Y</span>
        <span class="metric-value primary mono">{telemetry.posY.toFixed(1)}</span>
        <span class="coord-unit">cm</span>
      </div>
    </div>

    <!-- Scatter chart trayectoria (Chart.js) -->
    <div class="scatter-container">
      <canvas bind:this={canvasScatter}></canvas>
    </div>

  </div><!-- /coords-full-card -->

</section>

<!-- ============================================================
     ESTILOS
     ============================================================ -->
<style>
  /* Badge de stream activo */
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

  /* Título de sección intermedia */
  .section-title {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
    margin: 1.5rem 0 0.75rem 0;
    padding-left: 0.25rem;
    border-left: 3px solid var(--primary-container);
    padding-left: 0.5rem;
  }

  /* ── TARJETA BASE ────────────────────────────────────────── */
  .metric-card {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    border-left: 2px solid var(--primary-container);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: background 0.2s;
  }
  .metric-card:hover { background: var(--surface-high); }

  .metric-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }

  /* ── FILA DE GAUGES ─────────────────────────────────────── */
  .gauges-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  /* Tarjeta con gauge ECharts */
  .gauge-card {
    padding-bottom: 0.5rem;
    align-items: center;
    text-align: center;
  }
  /* Contenedor del canvas ECharts — altura fija para que el gauge se renderice bien */
  .gauge-container {
    width: 100%;
    height: 170px;
  }
  /* Valor numérico exacto que aparece debajo del gauge */
  .gauge-value {
    font-size: 1.4rem;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--primary);
    letter-spacing: 0.04em;
  }
  .gauge-unit {
    font-size: 0.65rem;
    color: var(--on-surface-variant);
    font-weight: 400;
    margin-left: 0.2rem;
  }

  /* ── FILA BRÚJULA (sola, centrada) ────────────────── */
  .compass-row {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  .compass-row .compass-card {
    width: 260px;
  }

  /* Tarjeta de la brújula */
  .compass-card {
    align-items: center;
    text-align: center;
  }
  .compass-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.5rem 0;
  }
  /* SVG de la brújula */
  .compass-svg {
    width: 140px;
    height: 140px;
    filter: drop-shadow(0 0 8px rgba(176, 198, 255, 0.3));
  }

  /* Tarjeta de coordenadas + scatter */
  .coords-card {
    gap: 0.75rem;
  }
  .coords-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.25rem;
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

  .metric-value { font-size: 1.8rem; font-weight: 700; line-height: 1; font-family: var(--font-mono); }
  .metric-value.primary { color: var(--primary); }
  .metric-value.mono    { font-family: var(--font-mono); }

  /* Contenedor del scatter chart — ocupa todo el ancho */
  .coords-full-card {
    margin-bottom: 1.5rem;
    gap: 0.75rem;
  }
  .scatter-container {
    flex: 1;
    min-height: 320px;
    position: relative;
  }
  .scatter-container canvas {
    width: 100% !important;
    height: 100% !important;
  }

  /* ── FILA DE LINE CHARTS VELOCIDAD VS TIEMPO ────────────── */
  .line-charts-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  /* Tarjeta de gráfico genérica */
  .chart-card {
    background: var(--surface-high);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
  }
  .chart-title {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
  }
  /* Contenedor del canvas del line chart */
  .line-chart-container {
    height: 160px;
    position: relative;
  }
  .line-chart-container canvas {
    width: 100% !important;
    height: 100% !important;
  }

  /* ── FILA DE DISTANCIAS DE PARED ────────────────────────── */
  .walls-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .wall-card {
    border-left-color: var(--secondary-container);
  }

  /* Valor numérico de la distancia */
  .wall-value {
    font-size: 1.8rem;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--on-surface);
    line-height: 1;
    margin: 0.25rem 0;
  }
  .wall-unit {
    font-size: 0.7rem;
    color: var(--on-surface-variant);
    font-weight: 400;
    margin-left: 0.2rem;
  }

  /* Pista de la barra de distancia */
  .wall-bar-track {
    height: 14px;
    background: var(--surface-bright);
    border-radius: 7px;
    overflow: hidden;
    margin: 0.5rem 0 0.25rem 0;
  }
  /* Relleno de la barra — el color lo define el style inline */
  .wall-bar-fill {
    height: 100%;
    border-radius: 7px;
    transition: width 0.4s ease, background 0.4s ease;
  }

  /* Escala mín/máx debajo de la barra */
  .wall-scale {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--on-surface-variant);
    letter-spacing: 0.03em;
  }

  /* Animación del badge de stream activo */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* ── RESPONSIVE — pantallas más pequeñas ────────────────── */
  @media (max-width: 1200px) {
    .gauges-row         { grid-template-columns: repeat(2, 1fr); }
    .orient-pos-row     { grid-template-columns: 1fr; }
    .line-charts-row    { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .gauges-row         { grid-template-columns: 1fr 1fr; }
    .line-charts-row    { grid-template-columns: 1fr; }
    .walls-row          { grid-template-columns: 1fr; }
  }
</style>
