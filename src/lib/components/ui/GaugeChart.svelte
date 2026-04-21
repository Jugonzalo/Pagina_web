<!-- ============================================================
     COMPONENTE: GaugeChart (Velocímetro ECharts)
     ============================================================
     Renderiza un velocímetro de tipo "gauge-stage" usando la
     librería Apache ECharts.

     "gauge-stage" significa que el arco del gauge tiene zonas
     de color diferentes según el rango del valor:
       Verde  (0–60%)   → operación normal
       Ámbar  (60–80%)  → zona de advertencia
       Rojo   (80–100%) → zona crítica

     PROPS:
       value    → número actual a mostrar (0 a maxVal)
       maxVal   → valor máximo de la escala (ej: 10 para RPM)
       label    → texto que aparece bajo el número (ej: "MOTOR L")
       unit     → unidad de medida (ej: "RPM")

     CÓMO FUNCIONA (ciclo de vida):
       1. onMount → se crea la instancia de ECharts sobre el <div>
       2. $: (reactivo) → cada vez que `value` cambia, se llama
          a chart.setOption() con el nuevo dato → ECharts anima
          la aguja automáticamente
       3. onDestroy → se destruye la instancia para liberar memoria

     NOTA IMPORTANTE sobre ECharts en Svelte/SvelteKit:
       - ECharts necesita un elemento DOM real para inicializarse.
         Por eso la inicialización va dentro de `onMount` y NO
         en el nivel superior del script.
       - `chart.setOption` es muy eficiente: ECharts hace "diff"
         interno y solo re-renderiza lo que cambió.
     ============================================================ -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import * as echarts from 'echarts';

  /** Valor actual a mostrar en el gauge (0 a maxVal) */
  export let value = 0;

  /** Valor máximo de la escala del gauge */
  export let maxVal = 10;

  /** Etiqueta descriptiva mostrada abajo del número */
  export let label = 'VELOCIDAD';

  /** Unidad de medida mostrada junto al número */
  export let unit = 'RPM';

  // Referencia al elemento DOM donde se montará ECharts
  let container;

  // Instancia de ECharts (se crea en onMount)
  let chart;

  // ── Función que construye el objeto de opciones de ECharts ──
  // Separarlo en una función nos permite reutilizarlo tanto en
  // la inicialización como en las actualizaciones reactivas.
  function buildOption(val) {
    // Normalizamos el valor entre 0 y 100 para que ECharts
    // interprete correctamente las zonas de color (axisLine.lineStyle.color).
    // ECharts usa el rango 0–1 internamente para las zonas.
    const normalized = Math.min(val / maxVal, 1);

    return {
      // Sin márgenes extra alrededor del gráfico
      series: [
        {
          type: 'gauge',

          // Ángulo de inicio y fin del arco (en grados, sentido horario desde el eje Y)
          startAngle: 205,
          endAngle:   -25,

          // Rango numérico de la escala
          min: 0,
          max: maxVal,

          // Grosor del arco como fracción del radio
          radius: '88%',

          // Centro del gauge dentro del viewBox
          center: ['50%', '55%'],

          // ── Arco principal (fondo gris) ──────────────────────
          // El arco se divide en zonas de color.
          // Cada par [porcentaje, color] define el color hasta ese % del arco.
          axisLine: {
            lineStyle: {
              width: 14,
              color: [
                [0.6, '#7dffa2'],   // 0–60%: verde (operación normal)
                [0.8, '#f7be00'],   // 60–80%: ámbar (advertencia)
                [1,   '#ffb4ab']    // 80–100%: rojo (zona crítica)
              ]
            }
          },

          // ── Separadores (ticks) del arco ─────────────────────
          axisTick: {
            distance: -18,       // Hacia adentro del arco
            length: 6,
            lineStyle: { color: '#fff', width: 1 }
          },

          // ── Etiquetas numéricas de la escala ─────────────────
          splitLine: {
            distance: -22,
            length: 12,
            lineStyle: { color: '#fff', width: 2 }
          },

          axisLabel: {
            color: 'auto',        // Hereda el color de la zona del arco
            distance: 26,
            fontSize: 10,
            fontFamily: "'Roboto Mono', monospace"
          },

          // ── Puntero (aguja) ───────────────────────────────────
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z', // Triángulo personalizado
            length: '12%',
            width: 20,
            offsetCenter: [0, '-60%'],  // Lo empuja hacia arriba (cerca del centro)
            itemStyle: {
              // El color de la aguja coincide con la zona actual
              color: 'auto'
            }
          },

          // ── Detalle central: número grande ───────────────────
          detail: {
            valueAnimation: true,   // Anima el número cuando cambia
            formatter: (v) => `{value|${v.toFixed(2)}}\n{unit|${unit}}`,
            rich: {
              value: {
                fontSize: 28,
                fontWeight: 700,
                fontFamily: "'Roboto Mono', monospace",
                color: '#e1e1ef',
                lineHeight: 36
              },
              unit: {
                fontSize: 10,
                color: '#c2c6d7',
                letterSpacing: 2,
                lineHeight: 20
              }
            },
            offsetCenter: [0, '20%']
          },

          // ── Título (etiqueta descriptiva) ─────────────────────
          title: {
            text: label,
            color: '#c2c6d7',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 2,
            offsetCenter: [0, '45%']
          },

          // ── Datos actuales ────────────────────────────────────
          // ECharts recibe `value` directamente; la animación es automática
          data: [{ value: val, name: label }],

          // Animación suave al actualizar el valor
          animation:        true,
          animationDuration: 500,
          animationEasing:  'cubicOut'
        }
      ],

      // Fondo transparente para que coincida con el diseño del dashboard
      backgroundColor: 'transparent'
    };
  }

  // ── Ciclo de vida ─────────────────────────────────────────────

  onMount(() => {
    // Inicializar ECharts sobre el elemento DOM.
    // IMPORTANTE: esto DEBE estar en onMount porque necesitamos
    // que el elemento <div> ya exista en el DOM real del navegador.
    chart = echarts.init(container, null, { renderer: 'svg' });

    // Cargar la configuración inicial
    chart.setOption(buildOption(value));

    // Hacer que el chart sea responsive: se redibuja si cambia
    // el tamaño del contenedor (por ejemplo, al redimensionar la ventana)
    const resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(container);

    // Guardar referencia para limpiar en onDestroy
    return () => resizeObserver.disconnect();
  });

  // ── Actualización reactiva ────────────────────────────────────
  // Este bloque se ejecuta automáticamente cada vez que `value` cambia.
  // "chart" existe solo después de onMount, por eso el guard `chart &&`.
  $: if (chart && value !== undefined) {
    // setOption hace un merge inteligente: solo actualiza `data`,
    // no re-renderiza todo el gauge desde cero.
    chart.setOption({ series: [{ data: [{ value, name: label }] }] });
  }

  onDestroy(() => {
    // Liberar la memoria de ECharts al desmontar el componente.
    // Sin esto, si el usuario navega entre vistas varias veces,
    // se acumularían instancias de ECharts sin usar.
    chart?.dispose();
  });
</script>

<!--
  El <div> es el "lienzo" donde ECharts dibuja el SVG.
  Debe tener dimensiones explícitas (width y height) para que
  ECharts pueda calcular el tamaño del gráfico correctamente.
-->
<div bind:this={container} class="gauge-container"></div>

<style>
  .gauge-container {
    width: 100%;
    height: 220px; /* Altura fija para que ECharts tenga espacio para dibujar */
  }
</style>
