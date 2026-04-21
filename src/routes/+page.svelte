<script>
  // ============================================================
  // PÁGINA PRINCIPAL — Kinetic Labs Robot Dashboard
  // ============================================================
  // Este archivo es el punto de entrada de la aplicación.
  // Su única responsabilidad es:
  //   1. Importar los sub-componentes y módulos
  //   2. Iniciar y detener el loop de telemetría
  //   3. Montar el layout (Sidebar + vistas intercambiables)
  //
  // La lógica de negocio, el estado reactivo y los estilos
  // de cada sección viven en sus propios archivos en src/lib/.
  // ============================================================
  import { onMount, onDestroy } from 'svelte';

  // ── Constantes de configuración ──────────────────────────────
  import { TELEMETRY_INTERVAL_MS } from '$lib/config/constants';

  // ── Store de navegación (para saber qué vista mostrar) ───────
  import { activeView } from '$lib/stores/robot';

  // ── Loop de telemetría ────────────────────────────────────────
  import { updateTelemetry } from '$lib/api/telemetry';

  // ── Componentes ───────────────────────────────────────────────
  import Sidebar       from '$lib/components/Sidebar.svelte';
  import ViewDatos     from '$lib/components/views/ViewDatos.svelte';
  import ViewControles from '$lib/components/views/ViewControles.svelte';
  import ViewBodega    from '$lib/components/views/ViewBodega.svelte';

  // ── Ciclo de vida ─────────────────────────────────────────────
  let telemetryTimer;

  onMount(() => {
    // Iniciar el loop: se actualiza cada TELEMETRY_INTERVAL_MS ms
    telemetryTimer = setInterval(updateTelemetry, TELEMETRY_INTERVAL_MS);
    // Primera actualización inmediata (no esperar el primer tick)
    updateTelemetry();
  });

  onDestroy(() => {
    // Limpiar el intervalo para evitar memory leaks al salir
    clearInterval(telemetryTimer);
  });
</script>

<!-- ============================================================
     LAYOUT PRINCIPAL
     Estructura: Sidebar fijo a la izquierda + Panel de vistas
     ============================================================ -->
<div class="app">

  <!-- Barra lateral: logo, navegación, modo de conexión, status -->
  <Sidebar />

  <!-- Panel principal: muestra solo la vista activa -->
  <main class="main-panel">

    <!-- Vista: Datos de telemetría en tiempo real -->
    {#if $activeView === 'datos'}
      <ViewDatos />
    {/if}

    <!-- Vista: Controles manuales del robot -->
    {#if $activeView === 'controles'}
      <ViewControles />
    {/if}

    <!-- Vista: Estado de bodega y misiones -->
    {#if $activeView === 'bodega'}
      <ViewBodega />
    {/if}

  </main>

</div>

<!-- ============================================================
     ESTILOS GLOBALES — Sistema de diseño "Kinetic Labs"
     ============================================================
     Los estilos con :global() afectan a TODOS los componentes.
     Los tokens CSS en :root son la fuente de verdad de colores,
     tipografía y bordes de toda la aplicación.

     Para cambiar la paleta completa, editá solo las variables
     dentro de :global(:root).
     ============================================================ -->
<style>
  /* ── RESET BÁSICO ────────────────────────────────────────────
     Elimina márgenes y padding por defecto del navegador.
     box-sizing: border-box hace que el padding no desborde
     los anchos definidos con CSS. */
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }

  :global(body) {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--on-surface);
    min-height: 100vh;
  }

  /* ── TOKENS DE DISEÑO ────────────────────────────────────────
     Variables CSS globales. Modificar aquí cambia toda la UI.
     Paleta: fondo oscuro azulado + acentos eléctricos. */
  :global(:root) {
    /* Superficies (de más oscura a más clara) */
    --bg:                  #11131c;
    --surface:             #11131c;
    --surface-low:         #191b24;
    --surface-mid:         #1d1f29;
    --surface-high:        #282933;
    --surface-highest:     #32343e;
    --surface-bright:      #373943;

    /* Texto */
    --on-surface:          #e1e1ef;  /* Texto principal */
    --on-surface-variant:  #c2c6d7;  /* Etiquetas y texto secundario */
    --outline-variant:     #424655;  /* Bordes sutiles */

    /* Acentos del sistema de diseño */
    --primary:             #b0c6ff;  /* Azul eléctrico — telemetría principal */
    --primary-container:   #558dff;  /* Versión más intensa del primario */
    --secondary:           #7dffa2;  /* Verde esmeralda — estado OK */
    --secondary-container: #05e777;
    --tertiary:            #f7be00;  /* Ámbar — advertencias */
    --tertiary-container:  #b58a00;
    --error:               #ffb4ab;  /* Rojo — errores críticos */
    --error-container:     #93000a;

    /* Tipografía monoespaciada (para valores de sensores) */
    --font-mono: 'Roboto Mono', 'Courier New', monospace;

    /* Radios de borde */
    --radius-sm:   0.125rem;  /* Casi cuadrado — botones, badges */
    --radius-md:   0.375rem;  /* Cards de métricas */
    --radius-lg:   0.75rem;   /* Cards grandes */
  }

  /* ── LAYOUT DE LA APP ────────────────────────────────────────
     Flexbox horizontal: sidebar fijo + panel principal flexible.
     height y overflow: hidden evitan que la app haga scroll
     a nivel de página; el scroll queda dentro de .main-panel. */
  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
  }

  /* El panel principal ocupa todo el espacio sobrante y
     permite scroll vertical interno. */
  .main-panel {
    flex: 1;
    overflow-y: auto;
    background: var(--surface);
    scrollbar-width: thin;
    scrollbar-color: var(--surface-bright) transparent;
  }
</style>
