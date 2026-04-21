<!-- ============================================================
     COMPONENTE: SparkChart
     ============================================================
     Mini-gráfico de línea (sparkline) reutilizable.
     Muestra el historial de un valor numérico a lo largo del
     tiempo usando un <path> SVG con área de relleno sombreada.

     USO:
       <SparkChart data={speedHistory} color="var(--primary)" maxVal={10} />

     PROPS:
       data    → array de números a graficar
       color   → color CSS de la línea y el relleno (usa una CSS var)
       maxVal  → valor máximo esperado, para escalar el eje Y
       gradId  → id único para el <linearGradient> SVG (evitar colisiones)
     ============================================================ -->
<script>
  import { buildSparkPath } from '$lib/utils/chart';

  /**
   * Array de valores numéricos a renderizar.
   * Cada elemento es un punto en el eje Y del gráfico.
   * @type {number[]}
   */
  export let data = [];

  /**
   * Color CSS de la línea y el área de relleno.
   * Usar variables CSS del sistema de diseño. Ej: "var(--primary)"
   * @type {string}
   */
  export let color = 'var(--primary)';

  /**
   * Valor máximo para escalar el eje Y.
   * Un dato igual a maxVal llega al tope del gráfico.
   * @type {number}
   */
  export let maxVal = 10;

  /**
   * ID único para el gradiente SVG.
   * Importante: si hay dos SparkChart en la misma página con el mismo ID,
   * los gradientes se pisarán. Pasá un ID diferente a cada instancia.
   * @type {string}
   */
  export let gradId = 'sparkGrad';

  // Dimensiones internas del SVG (en unidades del viewBox)
  const W = 280;
  const H = 80;

  // Calcular el path reactivamente cada vez que `data` cambia
  $: linePath = buildSparkPath(data, W, H, maxVal);
  // El área de relleno cierra el contorno hasta la base del SVG
  $: areaPath = data.length > 1 ? `${linePath} L ${W} ${H} L 0 ${H} Z` : '';
</script>

<svg
  class="spark-svg"
  viewBox="0 0 {W} {H}"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <!-- Gradiente vertical: opaco arriba → transparente abajo -->
  <defs>
    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color={color} stop-opacity="0.3" />
      <stop offset="100%" stop-color={color} stop-opacity="0"   />
    </linearGradient>
  </defs>

  {#if data.length > 1}
    <!-- Área sombreada bajo la curva -->
    <path d={areaPath} fill="url(#{gradId})" />

    <!-- Línea de datos principal -->
    <path
      d={linePath}
      fill="none"
      stroke={color}
      stroke-width="2"
      stroke-linejoin="round"
    />
  {/if}
</svg>

<style>
  /* Full-width dentro del contenedor padre */
  .spark-svg {
    width: 100%;
    height: 80px;
    display: block;
    overflow: visible;
  }
</style>
