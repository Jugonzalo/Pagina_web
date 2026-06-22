<script>
  /** @type {any} */
  export let currentMission;
  /** @type {any} */
  export let robotMapPos;
  /** @type {any[]} */
  export let activityLog;
  /** @type {string} */
  export let newMissionTarget;
  /** @type {string} */
  export let newMissionPriority;
  /** @type {() => void} */
  export let assignMission;
  /** @type {any} */
  export let telemetry = { posX: 0, posY: 0 };

  // Define nodes in the maze
  const nodes = [
    // Row 4 (y = 120 cm)
    { label: "04", x: 0, y: 120, col: 0, row: 4, id: "ID 8", idX: 0, idY: -25, anchor: "middle" },
    { label: "14", x: 30, y: 120, col: 1, row: 4, id: null },
    { label: "24", x: 60, y: 120, col: 2, row: 4, id: "ID 9", idX: 0, idY: -25, anchor: "middle" },
    { label: "44", x: 120, y: 120, col: 4, row: 4, id: "ID 12", idX: 0, idY: -25, anchor: "middle" },
    { label: "54", x: 150, y: 120, col: 5, row: 4, id: "ID 13", idX: 0, idY: -25, anchor: "middle" },

    // Row 3 (y = 90 cm)
    { label: "03", x: 0, y: 90, col: 0, row: 3, id: "ID 7", idX: 0, idY: -25, anchor: "middle" },
    { label: "13", x: 30, y: 90, col: 1, row: 3, id: "ID 6", idX: 0, idY: -25, anchor: "middle" },
    { label: "23", x: 60, y: 90, col: 2, row: 3, id: "ID 10", idX: -25, idY: 20, anchor: "end" },
    { label: "33", x: 90, y: 90, col: 3, row: 3, id: null },
    { label: "43", x: 120, y: 90, col: 4, row: 3, id: "ID 11", idX: 25, idY: 20, anchor: "start" },
    { label: "53", x: 150, y: 90, col: 5, row: 3, id: null },

    // Row 2 (y = 60 cm)
    { label: "02", x: 0, y: 60, col: 0, row: 2, id: "ID 0", idX: 0, idY: -25, anchor: "middle" },
    { label: "12", x: 30, y: 60, col: 1, row: 2, id: null },
    { label: "22", x: 60, y: 60, col: 2, row: 2, id: "ID 3", idX: -22, idY: -20, anchor: "end" },
    { label: "32", x: 90, y: 60, col: 3, row: 2, id: "ID 2", idX: 22, idY: -20, anchor: "start" },
    { label: "42", x: 120, y: 60, col: 4, row: 2, id: "ID 16", idX: 22, idY: -20, anchor: "start" },
    { label: "52", x: 150, y: 60, col: 5, row: 2, id: null },

    // Row 1 (y = 30 cm)
    { label: "01", x: 0, y: 30, col: 0, row: 1, id: null },
    { label: "11", x: 30, y: 30, col: 1, row: 1, id: "ID 5", idX: -22, idY: 20, anchor: "end" },
    { label: "21", x: 60, y: 30, col: 2, row: 1, id: "ID 4", idX: 22, idY: 20, anchor: "start" },
    { label: "31", x: 90, y: 30, col: 3, row: 1, id: null },
    { label: "41", x: 120, y: 30, col: 4, row: 1, id: null },
    { label: "51", x: 150, y: 30, col: 5, row: 1, id: null },

    // Row 0 (y = 0 cm)
    { label: "00", x: 0, y: 0, col: 0, row: 0, id: null },
    { label: "10", x: 30, y: 0, col: 1, row: 0, id: null },
    { label: "20", x: 60, y: 0, col: 2, row: 0, id: null },
    { label: "30", x: 90, y: 0, col: 3, row: 0, id: "ID 1", idX: 0, idY: -25, anchor: "middle" },
    { label: "40", x: 120, y: 0, col: 4, row: 0, id: "ID 15", idX: 22, idY: -20, anchor: "start" },
    { label: "50", x: 150, y: 0, col: 5, row: 0, id: "ID 14", idX: 22, idY: -20, anchor: "start" },
  ];

  // Define edges with their style (thick or thin)
  const edges = [
    // Horizontal edges
    { from: "00", to: "10", type: "thick" },
    { from: "10", to: "20", type: "thick" },
    { from: "20", to: "30", type: "thick" },
    { from: "40", to: "50", type: "thin" },
    { from: "11", to: "21", type: "thick" },
    { from: "22", to: "32", type: "thick" },
    { from: "03", to: "13", type: "thick" },
    { from: "23", to: "33", type: "thick" },
    { from: "33", to: "43", type: "thick" },
    { from: "04", to: "14", type: "thick" },
    { from: "14", to: "24", type: "thick" },
    { from: "44", to: "54", type: "thick" },

    // Vertical edges
    { from: "00", to: "01", type: "thick" },
    { from: "01", to: "02", type: "thick" },
    { from: "03", to: "04", type: "thick" },
    { from: "11", to: "12", type: "thick" },
    { from: "12", to: "13", type: "thick" },
    { from: "21", to: "22", type: "thick" },
    { from: "23", to: "24", type: "thick" },
    { from: "30", to: "31", type: "thick" },
    { from: "31", to: "32", type: "thick" },
    { from: "40", to: "41", type: "thin" },
    { from: "41", to: "42", type: "thin" },
    { from: "43", to: "44", type: "thick" },
    { from: "51", to: "52", type: "thick" },
    { from: "52", to: "53", type: "thick" },
    { from: "53", to: "54", type: "thick" },
  ];

  // Map node col/row to SVG canvas coordinates
  /**
   * @param {{col: number, row: number}} node
   */
  function getSvgCoords(node) {
    const startX = 80;
    const startY = 430;
    const stepX = 90;
    const stepY = 90;
    return {
      cx: startX + node.col * stepX,
      cy: startY - node.row * stepY
    };
  }

  // Pre-calculate SVG coordinates for all nodes
  const svgNodes = nodes.map(node => {
    const coords = getSvgCoords(node);
    return {
      ...node,
      cx: coords.cx,
      cy: coords.cy
    };
  });

  // Find node by label helper
  /**
   * @param {string} label
   */
  function findSvgNode(label) {
    return svgNodes.find(n => n.label === label);
  }

  // Find closest node to robot x, y coordinates
  /**
   * @param {number} x
   * @param {number} y
   */
  function getRobotNode(x, y) {
    if (x === undefined || y === undefined) return null;
    const rx = x;
    const ry = y;

    let minDistance = Infinity;
    let closestNode = null;

    for (const node of nodes) {
      const dist = Math.hypot(node.x - rx, node.y - ry);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }
    
    // Map closestNode to svgNode to get cx, cy
    if (closestNode) {
      return findSvgNode(closestNode.label);
    }
    return null;
  }

  // Reactive value for the robot's current node
  $: robotNode = (telemetry && telemetry.posX !== undefined && telemetry.posY !== undefined)
    ? getRobotNode(telemetry.posX, telemetry.posY)
    : findSvgNode("00") || null;
</script>

<section class="view" id="view-bodega">

  <header class="view-header">
    <h1 class="view-title">ESTADO DE BODEGA</h1>
    <div class="mission-id-badge">MISIÓN: {currentMission.id}</div>
  </header>

  <div class="bodega-grid">

    <!-- Columna izquierda: Mapa + Misión actual -->
    <div class="bodega-col">

      <!-- Mapa esquemático de la bodega -->
      <div class="map-card">
        <div class="card-title">MAPA DE LA BODEGA (PLANIFICADOR A*)</div>
        <div class="warehouse-map-container">
          <svg viewBox="0 0 620 500" class="maze-svg" width="100%" height="100%">
            <!-- Grilla / Papel Milimetrado de Fondo -->
            <defs>
              <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(176, 198, 255, 0.05)" stroke-width="0.5" />
              </pattern>
              <!-- Filtro de resplandor (glow) para el camino y robot -->
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="red-glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <!-- Fondo de grilla -->
            <rect width="620" height="500" fill="var(--surface-low)" rx="8" />
            <rect width="620" height="500" fill="url(#grid-pattern)" rx="8" />

            <!-- Ejes y grilla principal -->
            <!-- Líneas de eje Y (horizontales) -->
            {#each [0, 1, 2, 3, 4] as rowIdx}
              {@const y = 430 - rowIdx * 90}
              <line x1="80" y1={y} x2="530" y2={y} stroke="rgba(176, 198, 255, 0.15)" stroke-width="1" />
              <!-- Etiqueta Y (distancia) -->
              <text x="45" y={y + 4} class="axis-label" text-anchor="end">{rowIdx * 30} cm</text>
            {/each}

            <!-- Líneas de eje X (verticales) -->
            {#each [0, 1, 2, 3, 4, 5] as colIdx}
              {@const x = 80 + colIdx * 90}
              <line x1={x} y1="70" x2={x} y2="430" stroke="rgba(176, 198, 255, 0.15)" stroke-width="1" />
              <!-- Etiqueta X (distancia) -->
              <text x={x} y="455" class="axis-label" text-anchor="middle">{colIdx * 30} cm</text>
            {/each}

            <!-- Etiquetas de Ejes -->
            <text x="80" y="485" class="axis-title-label" text-anchor="middle">Eje X</text>
            <text x="45" y="40" class="axis-title-label" text-anchor="end">Eje Y</text>

            <!-- Título del Planificador -->
            <text x="305" y="35" class="planner-title-label" text-anchor="middle">Planificador A*</text>

            <!-- Dibujar Conexiones (Aristas) -->
            {#each edges as edge}
              {@const fromNode = findSvgNode(edge.from)}
              {@const toNode = findSvgNode(edge.to)}
              {#if fromNode && toNode}
                <line
                  x1={fromNode.cx}
                  y1={fromNode.cy}
                  x2={toNode.cx}
                  y2={toNode.cy}
                  class="map-edge map-edge--{edge.type}"
                />
              {/if}
            {/each}

            <!-- Dibujar Nodos -->
            {#each svgNodes as node}
              <!-- Círculo del nodo -->
              <circle
                cx={node.cx}
                cy={node.cy}
                r="16"
                class="map-node-circle {robotNode?.label === node.label ? 'map-node-circle--robot' : ''}"
              />
              <!-- Texto dentro del nodo (número de celda, ej: "04") -->
              <text
                x={node.cx}
                y={node.cy + 4}
                class="map-node-text"
                text-anchor="middle"
              >
                {node.label}
              </text>

              <!-- Dibujar ID si corresponde -->
              {#if node.id}
                <text
                  x={node.cx + (node.idX ?? 0)}
                  y={node.cy + (node.idY ?? 0)}
                  class="map-node-id"
                  text-anchor={node.anchor ?? 'middle'}
                >
                  {node.id}
                </text>
              {/if}
            {/each}

            <!-- Indicador Rojo de Posición del Robot -->
            {#if robotNode}
              <!-- Halo pulsante de fondo -->
              <circle
                cx={robotNode.cx}
                cy={robotNode.cy}
                r="22"
                fill="rgba(255, 69, 58, 0.4)"
                class="robot-pulsing-halo"
                filter="url(#red-glow)"
              />
              <!-- Círculo rojo principal -->
              <circle
                cx={robotNode.cx}
                cy={robotNode.cy}
                r="8"
                fill="#ff453a"
                stroke="#ffffff"
                stroke-width="2.5"
                class="robot-active-marker"
              />
            {/if}
          </svg>
        </div>
        <!-- Leyenda del mapa -->
        <div class="map-legend">
          <span class="legend-item"><span class="robot-marker-sm" style="color: #ff453a;">●</span> Robot</span>
          <span class="legend-item"><span class="node-marker-sm">○</span> Nodos</span>
          <span class="legend-item"><span class="edge-thick-marker-sm">━</span> Principal</span>
          <span class="legend-item"><span class="edge-thin-marker-sm">╌</span> Secundario</span>
          <span class="legend-item" style="margin-left: auto;">
            Telemetría: <span style="color: var(--secondary); font-family: var(--font-mono); font-weight: bold;">
              ({telemetry?.posX?.toFixed(1) ?? '0.0'}, {telemetry?.posY?.toFixed(1) ?? '0.0'}) cm
            </span>
          </span>
        </div>
      </div>

      <!-- Misión actual -->
      <div class="mission-card">
        <div class="card-title">MISIÓN ACTUAL</div>
        <div class="mission-status-badge {currentMission.status === 'EN PROGRESO' ? 'secondary' : currentMission.status === 'COMPLETADA' ? 'success' : ''}">
          {currentMission.status}
        </div>
        <p class="mission-description">{currentMission.description}</p>
        <!-- Barra de progreso de la misión -->
        <div class="mission-progress-track">
          <div class="mission-progress-fill" style="width: {currentMission.progress}%"></div>
        </div>
        <div class="mission-progress-label">{currentMission.progress}% completado</div>
      </div>

    </div><!-- /bodega-col left -->

    <!-- Columna derecha: Log + Nueva misión -->
    <div class="bodega-col">

      <!-- Registro de actividad -->
      <div class="log-card">
        <div class="card-title">REGISTRO DE ACTIVIDAD</div>
        <ul class="activity-log">
          {#each activityLog as entry}
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

        <button
          id="btn-assign-mission"
          class="btn-primary btn-full"
          on:click={assignMission}
          disabled={!newMissionTarget.trim()}
        >
          ASIGNAR MISIÓN
        </button>
      </div>

    </div><!-- /bodega-col right -->

  </div><!-- /bodega-grid -->

</section>

<style>
  .mission-id-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--primary);
    border: 1px solid var(--primary-container);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  /* ── VISTA BODEGA ───────────────────────────────────────── */
  .bodega-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  .bodega-col { display: flex; flex-direction: column; gap: 1rem; }

  /* Tarjeta genérica de sección */
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

  /* Mapa de bodega (SVG) */
  .warehouse-map-container {
    background: var(--surface-low);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    border: 1px solid rgba(176, 198, 255, 0.05);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .maze-svg {
    max-width: 100%;
    height: auto;
    display: block;
  }
  
  /* Estilos de texto SVG */
  .axis-label {
    fill: var(--on-surface-variant);
    font-size: 10px;
    font-family: inherit;
    font-weight: 500;
    opacity: 0.85;
  }
  .axis-title-label {
    fill: var(--on-surface-variant);
    font-size: 11px;
    font-family: inherit;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .planner-title-label {
    fill: var(--on-surface);
    font-size: 14px;
    font-family: inherit;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  
  /* Estilos de aristas y nodos */
  .map-edge {
    stroke-linecap: round;
  }
  .map-edge--thick {
    stroke: #2e78d6;
    stroke-width: 6px;
  }
  .map-edge--thin {
    stroke: var(--on-surface-variant);
    stroke-width: 1.5px;
    stroke-dasharray: 4 4;
    opacity: 0.5;
  }
  
  .map-node-circle {
    fill: #1a2238;
    stroke: #2e78d6;
    stroke-width: 2.5px;
    transition: fill 0.3s, stroke 0.3s;
  }
  .map-node-circle--robot {
    stroke: #ff453a;
  }
  .map-node-text {
    fill: #ffffff;
    font-size: 11px;
    font-family: inherit;
    font-weight: 700;
  }
  .map-node-id {
    fill: var(--on-surface-variant);
    font-size: 9px;
    font-family: inherit;
    font-weight: 600;
    opacity: 0.9;
  }
  
  /* Animación del robot */
  .robot-pulsing-halo {
    animation: pulse-halo 2.5s infinite ease-in-out;
  }
  .robot-active-marker {
    filter: drop-shadow(0 0 5px rgba(255, 69, 58, 0.7));
  }
  
  @keyframes pulse-halo {
    0% {
      r: 8;
      opacity: 0.85;
    }
    70% {
      r: 25;
      opacity: 0;
    }
    100% {
      r: 25;
      opacity: 0;
    }
  }
  
  /* Leyenda */
  .map-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.65rem;
    color: var(--on-surface-variant);
    letter-spacing: 0.04em;
    align-items: center;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .node-marker-sm {
    color: #2e78d6;
    font-size: 1rem;
    line-height: 1;
  }
  .edge-thick-marker-sm {
    color: #2e78d6;
    font-weight: bold;
    font-size: 1rem;
  }
  .edge-thin-marker-sm {
    color: var(--on-surface-variant);
    font-size: 1rem;
    opacity: 0.6;
  }

  /* Tarjeta de misión */
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

  /* Log de actividad */
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

  /* Formulario nueva misión */
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
