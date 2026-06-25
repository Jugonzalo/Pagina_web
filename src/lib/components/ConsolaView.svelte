<script>
  /** @type {string} */
  export let ROBOT_ID;

  // ── Telemetría (lecturas del ESP) ──────────────────────────
  /** @type {{ motorL: number, motorR: number, yaw: number, v_total: number, posX: number, posY: number }} */
  export let telemetry;

  // ── Comandos enviados ──────────────────────────────────────
  /** @type {number} */ export let duty_der    = 0;
  /** @type {number} */ export let duty_izq    = 0;
  /** @type {number} */ export let teta_ref    = 0;
  /** @type {number} */ export let v_der_ref   = 0;
  /** @type {number} */ export let v_izq_ref   = 0;
  /** @type {number} */ export let v_total_ref = 0;
  /** @type {number} */ export let x_ref       = 0;
  /** @type {number} */ export let y_ref       = 0;

  /** @type {'firebase' | 'mqtt'} */
  export let activeSource = 'firebase';

  // ── Helpers de formato ─────────────────────────────────────
  /** @param {number} v @param {number} [d] */
  function fmt(v, d = 1) {
    return typeof v === 'number' ? v.toFixed(d) : '0.0';
  }

  function fmtInt(v) {
    return typeof v === 'number' ? String(Math.round(v)) : '0';
  }
</script>

<section class="view" id="view-consola">
  <header class="view-header">
    <h1 class="view-title">{ROBOT_ID} <span class="view-title-sub">| Consola de Datos Crudos</span></h1>
    <span class="source-badge">{activeSource === 'firebase' ? '🔥 FIREBASE' : '📡 MQTT'}</span>
  </header>

  <div class="consola-grid">
    <!-- BLOQUE ENVIO DE COMANDO -->
    <div class="metric-card">
      <div class="metric-label">ENVÍO DE COMANDO</div>
      <div class="data-list">
        <div class="data-row"><span class="data-key">duty_der:</span> <span class="data-val">{fmtInt(duty_der)}</span></div>
        <div class="data-row"><span class="data-key">duty_izq:</span> <span class="data-val">{fmtInt(duty_izq)}</span></div>
        <div class="data-row"><span class="data-key">teta_ref:</span> <span class="data-val">{fmt(teta_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_der_ref:</span> <span class="data-val">{fmt(v_der_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_izq_ref:</span> <span class="data-val">{fmt(v_izq_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_total_ref:</span> <span class="data-val">{fmt(v_total_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">x_ref:</span> <span class="data-val">{fmt(x_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">y_ref:</span> <span class="data-val">{fmt(y_ref, 1)}</span></div>
      </div>
    </div>

    <!-- BLOQUE LECTURA ESP -->
    <div class="metric-card">
      <div class="metric-label">LECTURA ESP</div>
      <div class="data-list">
        <div class="data-row"><span class="data-key">duty_der:</span> <span class="data-val">{fmtInt(duty_der)}</span></div>
        <div class="data-row"><span class="data-key">duty_izq:</span> <span class="data-val">{fmtInt(duty_izq)}</span></div>
        <div class="data-row"><span class="data-key">teta:</span> <span class="data-val">{fmt(telemetry.yaw, 1)}</span></div>
        <div class="data-row"><span class="data-key">teta_ref:</span> <span class="data-val">{fmt(teta_ref, 1)}</span></div>
        
        <div class="data-divider"></div>
        
        <div class="data-row"><span class="data-key">v_der:</span> <span class="data-val">{fmt(telemetry.motorR, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_izq:</span> <span class="data-val">{fmt(telemetry.motorL, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_der_ref:</span> <span class="data-val">{fmt(v_der_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_izq_ref:</span> <span class="data-val">{fmt(v_izq_ref, 1)}</span></div>
        
        <div class="data-divider"></div>
        
        <div class="data-row"><span class="data-key">v_total:</span> <span class="data-val">{fmt(telemetry.v_total, 1)}</span></div>
        <div class="data-row"><span class="data-key">v_total_ref:</span> <span class="data-val">{fmt(v_total_ref, 1)}</span></div>
        
        <div class="data-divider"></div>
        
        <div class="data-row"><span class="data-key">x_pos:</span> <span class="data-val">{fmt(telemetry.posX, 1)}</span></div>
        <div class="data-row"><span class="data-key">y_pos:</span> <span class="data-val">{fmt(telemetry.posY, 1)}</span></div>
        <div class="data-row"><span class="data-key">x_ref:</span> <span class="data-val">{fmt(x_ref, 1)}</span></div>
        <div class="data-row"><span class="data-key">y_ref:</span> <span class="data-val">{fmt(y_ref, 1)}</span></div>
      </div>
    </div>
  </div>
</section>

<style>
  .source-badge {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--tertiary);
    border: 1px solid var(--tertiary);
    border-radius: var(--radius-sm);
    padding: 0.2rem 0.6rem;
  }

  .consola-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    align-items: start;
  }

  /* ── TARJETA BASE ────────────────────────────────────────── */
  .metric-card {
    background: var(--surface-mid);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    border-left: 2px solid var(--primary-container);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: background 0.2s;
  }
  
  .metric-card:hover { 
    background: var(--surface-high); 
  }

  .metric-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--on-surface-variant);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .data-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    padding: 0.2rem 0;
  }

  .data-key {
    color: var(--on-surface-variant);
  }

  .data-val {
    color: var(--primary);
    font-weight: 600;
  }

  .data-divider {
    height: 1px;
    background: var(--outline-variant);
    opacity: 0.3;
    margin: 0.25rem 0;
  }
</style>
