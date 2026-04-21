<!-- ============================================================
     VISTA: Estado de Bodega
     ============================================================
     Muestra la información del almacén y las misiones:
       - Mapa esquemático de la bodega (cuadrícula 6×4)
       - Tarjeta de misión actual con barra de progreso
       - Registro de actividad (log cronológico)
       - Formulario para asignar nueva misión
     ============================================================ -->
<script>
  import { currentMission, activityLog, robotMapPos } from '$lib/stores/robot';
  import { assignMission } from '$lib/api/control';

  /** Destino de la nueva misión ingresado en el formulario */
  let newMissionTarget = '';

  /** Prioridad de la nueva misión seleccionada en el select */
  let newMissionPriority = 'MEDIA'; // 'BAJA' | 'MEDIA' | 'ALTA'

  /**
   * Se ejecuta al presionar "Asignar misión".
   * Llama a assignMission() y limpia el formulario si fue exitoso.
   */
  function handleAssignMission() {
    if (!newMissionTarget.trim()) return;

    assignMission(newMissionTarget, newMissionPriority, {
      currentMission,
      activityLog
    });

    // Limpiar el campo de destino después de asignar
    newMissionTarget = '';
  }
</script>

<section class="view" id="view-bodega">

  <!-- Encabezado -->
  <header class="view-header">
    <h1 class="view-title">ESTADO DE BODEGA</h1>
    <div class="mission-id-badge">MISIÓN: {$currentMission.id}</div>
  </header>

  <!-- ── GRILLA DE COLUMNAS ─────────────────────────────────── -->
  <div class="bodega-grid">

    <!-- ── COLUMNA IZQUIERDA: Mapa + Misión actual ───────── -->
    <div class="bodega-col">

      <!-- Mapa esquemático de la bodega -->
      <!--
        Cuadrícula de 6 columnas × 4 filas.
        Las columnas 1 y 4 son estantes (fondo más oscuro).
        La celda del robot se marca con el ícono ◈.
      -->
      <div class="map-card">
        <div class="card-title">MAPA ESQUEMÁTICO</div>
        <div class="warehouse-map">
          {#each Array(4) as _, row}
            {#each Array(6) as _, col}
              <div
                class="map-cell
                  {$robotMapPos.col === col && $robotMapPos.row === row ? 'map-cell--robot' : ''}
                  {(col === 1 || col === 4) ? 'map-cell--shelf' : ''}
                "
              >
                {#if $robotMapPos.col === col && $robotMapPos.row === row}
                  <!-- Posición actual del robot -->
                  <span class="robot-marker">◈</span>
                {:else if (col === 1 || col === 4)}
                  <!-- Estante de almacenamiento -->
                  <span class="shelf-marker">▪</span>
                {/if}
              </div>
            {/each}
          {/each}
        </div>

        <!-- Leyenda del mapa -->
        <div class="map-legend">
          <span class="legend-item"><span class="robot-marker-sm">◈</span> Robot</span>
          <span class="legend-item"><span class="shelf-marker-sm">▪</span> Estante</span>
        </div>
      </div>

      <!-- Misión actual -->
      <div class="mission-card">
        <div class="card-title">MISIÓN ACTUAL</div>

        <!-- Badge de estado con color según el estado -->
        <div class="mission-status-badge {$currentMission.status === 'EN PROGRESO' ? 'secondary' : $currentMission.status === 'COMPLETADA' ? 'success' : ''}">
          {$currentMission.status}
        </div>

        <p class="mission-description">{$currentMission.description}</p>

        <!-- Barra de progreso de la misión -->
        <div class="mission-progress-track">
          <div class="mission-progress-fill" style="width: {$currentMission.progress}%"></div>
        </div>
        <div class="mission-progress-label">{$currentMission.progress}% completado</div>
      </div>

    </div><!-- /bodega-col left -->

    <!-- ── COLUMNA DERECHA: Log + Nueva misión ──── -->
    <div class="bodega-col">

      <!-- Registro de actividad -->
      <!--
        Lista de eventos cronológicos del robot y la bodega.
        Se actualiza cada vez que ocurre algo relevante
        (misión asignada, parada de emergencia, etc.)
      -->
      <div class="log-card">
        <div class="card-title">REGISTRO DE ACTIVIDAD</div>
        <ul class="activity-log">
          {#each $activityLog as entry}
            <li class="log-entry">
              <span class="log-time">{entry.time}</span>
              <span class="log-msg">{entry.msg}</span>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Formulario de nueva misión -->
      <div class="new-mission-card">
        <div class="card-title">ASIGNACIÓN DE OBJETIVOS</div>

        <div class="form-group">
          <label for="input-mission-target" class="form-label">DESTINO / OBJETIVO</label>
          <input
            id="input-mission-target"
            type="text"
            class="form-input"
            placeholder="Ej: Estante A-03"
            bind:value={newMissionTarget}
          />
        </div>

        <div class="form-group">
          <label for="select-priority" class="form-label">PRIORIDAD</label>
          <select id="select-priority" class="form-input" bind:value={newMissionPriority}>
            <option value="BAJA">BAJA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="ALTA">ALTA</option>
          </select>
        </div>

        <!-- Botón deshabilitado si no hay destino ingresado -->
        <button
          id="btn-assign-mission"
          class="btn-primary btn-full"
          on:click={handleAssignMission}
          disabled={!newMissionTarget.trim()}
        >
          ASIGNAR MISIÓN
        </button>
      </div>

    </div><!-- /bodega-col right -->

  </div><!-- /bodega-grid -->

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
  .mission-id-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--primary);
    border: 1px solid var(--primary-container);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  /* ── LAYOUT DE BODEGA ────────────────────────────────────── */
  .bodega-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  .bodega-col { display: flex; flex-direction: column; gap: 1rem; }

  /* ── TARJETAS GENÉRICAS ──────────────────────────────────── */
  .map-card, .mission-card, .log-card, .new-mission-card {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1.25rem;
  }
  .card-title {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  /* ── MAPA DE BODEGA ──────────────────────────────────────── */
  .warehouse-map {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 4px;
    background: var(--surface-low);
    padding: 0.75rem;
    border-radius: var(--radius-sm);
  }
  .map-cell {
    aspect-ratio: 1;
    border-radius: 2px;
    background: var(--surface-high);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    transition: background 0.3s;
  }
  .map-cell--robot { background: rgba(176, 198, 255, 0.15); }
  .map-cell--shelf { background: var(--surface-bright); }
  .robot-marker    { color: var(--primary); font-size: 1rem; }
  .shelf-marker    { color: var(--on-surface-variant); font-size: 0.5rem; }

  .map-legend {
    display: flex;
    gap: 1.25rem;
    margin-top: 0.75rem;
    font-size: 0.6rem;
    color: var(--on-surface-variant);
    letter-spacing: 0.04em;
  }
  .legend-item { display: flex; align-items: center; gap: 0.35rem; }
  .robot-marker-sm { color: var(--primary); }
  .shelf-marker-sm  { color: var(--on-surface-variant); }

  /* ── MISIÓN ACTUAL ───────────────────────────────────────── */
  .mission-status-badge {
    display: inline-block;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    padding: 0.2rem 0.6rem;
    border-radius: var(--radius-sm);
    background: var(--surface-high);
    color: var(--on-surface-variant);
    margin-bottom: 0.75rem;
  }
  .mission-status-badge.secondary { background: rgba(125, 255, 162, 0.1); color: var(--secondary); }
  .mission-status-badge.success   { background: rgba(125, 255, 162, 0.2); color: var(--secondary); }

  .mission-description {
    font-size: 0.85rem;
    color: var(--on-surface);
    margin-bottom: 1rem;
  }
  .mission-progress-track {
    height: 4px;
    background: var(--surface-bright);
    border-radius: 2px;
    overflow: hidden;
  }
  .mission-progress-fill {
    height: 100%;
    background: var(--secondary);
    border-radius: 2px;
    transition: width 0.6s ease;
  }
  .mission-progress-label {
    font-size: 0.6rem;
    color: var(--secondary);
    margin-top: 0.4rem;
    letter-spacing: 0.04em;
  }

  /* ── LOG DE ACTIVIDAD ────────────────────────────────────── */
  .activity-log {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--surface-bright) transparent;
  }
  .log-entry {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
    font-size: 0.75rem;
    border-bottom: 1px solid rgba(66, 70, 85, 0.2);
    padding-bottom: 0.4rem;
  }
  .log-time {
    color: var(--tertiary);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    white-space: nowrap;
    opacity: 0.8;
  }
  .log-msg { color: var(--on-surface-variant); }

  /* ── FORMULARIO ──────────────────────────────────────────── */
  .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.9rem; }
  .form-label {
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    color: var(--on-surface-variant);
    text-transform: uppercase;
  }
  .form-input {
    background: var(--surface-high);
    border: 1px solid rgba(66, 70, 85, 0.5);
    border-radius: var(--radius-sm);
    color: var(--on-surface);
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(176, 198, 255, 0.1);
  }
  .form-input option { background: var(--surface-high); }

  /* ── BOTÓN ───────────────────────────────────────────────── */
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
</style>
