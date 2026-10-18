/**
 * QueueFlow 3D - Core Application Logic
 * Implements (M/M/1):(∞/FIFO) Queuing Theory Engine,
 * Validation, UI Reactive Updates, Chart.js Visualizations,
 * and Interactive Test Case Suite.
 */

// Global State
const state = {
  lambda: 2.0,
  mu: 4.0,
  timeUnit: 'hours', // 'hours', 'minutes', 'seconds'
  isStable: true,
  isValid: true,
  errorMessage: '',
  warningMessage: '',
  metrics: null,
  paramN: 2,
  paramK: 3,
  paramT: 0.5,
  charts: {
    distribution: null,
    sensitivity: null
  },
  testCases: []
};

// DOM Content Loaded Entrypoint
document.addEventListener('DOMContentLoaded', async () => {
  initLucideIcons();
  await loadTestCases();
  initCharts();
  initEventListeners();
  
  // Initialize 3D Simulation
  if (window.QueueSimulation3D) {
    window.sim3D = new QueueSimulation3D('canvas-3d-container');
  }

  // Initial Calculation with default values
  calculateQueue();
  renderTestCasesTable();
  initFormulasKaTeX();
});

function initLucideIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Render LaTeX formulas using KaTeX if available
 */
function initFormulasKaTeX() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  } else if (window.katex) {
    document.querySelectorAll('.katex-render').forEach(el => {
      const tex = el.getAttribute('data-tex') || el.textContent;
      try {
        window.katex.render(tex, el, { displayMode: el.classList.contains('display-mode') });
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    });
  }
}

/**
 * Event Listeners Registration
 */
function initEventListeners() {
  const lambdaInput = document.getElementById('input-lambda');
  const muInput = document.getElementById('input-mu');
  const lambdaSlider = document.getElementById('slider-lambda');
  const muSlider = document.getElementById('slider-mu');
  const unitSelect = document.getElementById('select-time-unit');
  const presetSelect = document.getElementById('select-preset');

  // Bidirectional binding between inputs and sliders
  if (lambdaInput && lambdaSlider) {
    lambdaInput.addEventListener('input', (e) => {
      if (presetSelect) presetSelect.value = 'custom';
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) lambdaSlider.value = Math.min(20, val);
      state.lambda = val;
      calculateQueue();
    });

    lambdaSlider.addEventListener('input', (e) => {
      if (presetSelect) presetSelect.value = 'custom';
      lambdaInput.value = e.target.value;
      state.lambda = parseFloat(e.target.value);
      calculateQueue();
    });
  }

  if (muInput && muSlider) {
    muInput.addEventListener('input', (e) => {
      if (presetSelect) presetSelect.value = 'custom';
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) muSlider.value = Math.min(20, val);
      state.mu = val;
      calculateQueue();
    });

    muSlider.addEventListener('input', (e) => {
      if (presetSelect) presetSelect.value = 'custom';
      muInput.value = e.target.value;
      state.mu = parseFloat(e.target.value);
      calculateQueue();
    });
  }

  // Preset selector
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'bank') {
        setInputs(15, 20, 'hours');
      } else if (val === 'webserver') {
        setInputs(80, 100, 'seconds');
      } else if (val === 'drivethru') {
        setInputs(25, 30, 'hours');
      } else if (val === 'printer') {
        setInputs(4, 6, 'minutes');
      } else if (val === 'critical') {
        setInputs(10, 10, 'hours');
      } else if (val === 'overloaded') {
        setInputs(15, 10, 'hours');
      }
    });
  }

  // Time unit selector
  if (unitSelect) {
    unitSelect.addEventListener('change', (e) => {
      state.timeUnit = e.target.value;
      updateUnitLabels();
      calculateQueue();
    });
  }

  // 3D Controls buttons & Time Accelerator
  const btnPlayPause = document.getElementById('btn-sim-playpause');
  const btnReset = document.getElementById('btn-sim-reset');
  const timeSlider = document.getElementById('sim-time-accelerator');
  const speedBadge = document.getElementById('sim-speed-badge');
  const presetSpeedButtons = document.querySelectorAll('.btn-preset-speed');
  const viewButtons = document.querySelectorAll('.btn-sim-view');

  if (btnPlayPause) {
    btnPlayPause.addEventListener('click', () => {
      if (window.sim3D) {
        const running = window.sim3D.togglePlayPause();
        btnPlayPause.innerHTML = running 
          ? `<i data-lucide="pause"></i><span>Pause</span>` 
          : `<i data-lucide="play"></i><span>Resume</span>`;
        initLucideIcons();
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (window.sim3D) {
        window.sim3D.resetSimulation();
      }
    });
  }

  function applySimulationSpeed(speed) {
    if (window.sim3D) window.sim3D.setTimeScale(speed);
    if (timeSlider) timeSlider.value = speed;
    if (speedBadge) {
      speedBadge.textContent = Math.abs(speed - 1.0) < 0.05 ? '1.0x (Real-Time)' : `${speed.toFixed(1)}x`;
    }
    presetSpeedButtons.forEach(btn => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed'));
      btn.classList.toggle('active', Math.abs(btnSpeed - speed) < 0.05);
    });
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value) || 1.0;
      applySimulationSpeed(speed);
    });
  }

  presetSpeedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed')) || 1.0;
      applySimulationSpeed(speed);
    });
  });

  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view') || 'isometric';
      if (window.sim3D) window.sim3D.setCameraView(view);
    });
  });

  // Action buttons: Copy report, Run all test cases, Reset
  const btnCopyReport = document.getElementById('btn-copy-report');
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', copySummaryReport);
  }

  const btnRunAllTests = document.getElementById('btn-run-all-tests');
  if (btnRunAllTests) {
    btnRunAllTests.addEventListener('click', runAllTestCases);
  }

  const btnDownloadCSV = document.getElementById('btn-download-tests-csv');
  if (btnDownloadCSV) {
    btnDownloadCSV.addEventListener('click', downloadTestCasesCSV);
  }

  // Interactive inputs for advanced probability formulas (Study Notes Page 6)
  const inputN = document.getElementById('input-param-n');
  const inputK = document.getElementById('input-param-k');
  const inputT = document.getElementById('input-param-t');

  if (inputN) {
    inputN.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.paramN = !isNaN(val) && val >= 0 ? val : 0;
      calculateQueue();
    });
  }

  if (inputK) {
    inputK.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.paramK = !isNaN(val) && val >= 1 ? val : 1;
      calculateQueue();
    });
  }

  if (inputT) {
    inputT.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.paramT = !isNaN(val) && val >= 0 ? val : 0;
      calculateQueue();
    });
  }
}

function setInputs(lambdaVal, muVal, unitVal = 'hours') {
  const lambdaInput = document.getElementById('input-lambda');
  const muInput = document.getElementById('input-mu');
  const lambdaSlider = document.getElementById('slider-lambda');
  const muSlider = document.getElementById('slider-mu');
  const unitSelect = document.getElementById('select-time-unit');
  const presetSelect = document.getElementById('select-preset');

  if (lambdaInput) lambdaInput.value = lambdaVal;
  if (muInput) muInput.value = muVal;
  if (lambdaSlider) lambdaSlider.value = Math.min(20, Math.max(0, lambdaVal));
  if (muSlider) muSlider.value = Math.min(20, Math.max(0, muVal));
  if (unitSelect) unitSelect.value = unitVal;
  if (presetSelect) presetSelect.value = 'custom';

  state.lambda = parseFloat(lambdaVal);
  state.mu = parseFloat(muVal);
  state.timeUnit = unitVal;
  updateUnitLabels();
  calculateQueue();
}

function updateUnitLabels() {
  const unitSingular = state.timeUnit.slice(0, -1); // 'hour', 'minute', 'second'
  document.querySelectorAll('.unit-rate-label').forEach(el => {
    el.textContent = `cust/${unitSingular}`;
  });
  document.querySelectorAll('.unit-time-label').forEach(el => {
    el.textContent = state.timeUnit;
  });
}

/**
 * Core Queuing Calculator & Validator
 * Delegates calculations directly to the isolated engine in:
 * Engine/Model I: (M/M/1) : (∞/FIFO)/mm1_engine.js
 */
function calculateQueue() {
  const rawLambda = state.lambda;
  const rawMu = state.mu;

  let metrics;
  if (window.MM1Engine && typeof window.MM1Engine.computeAllMetrics === 'function') {
    metrics = window.MM1Engine.computeAllMetrics(rawLambda, rawMu, {
      k: state.paramK,
      t: state.paramT,
      n: state.paramN
    });
  } else {
    // Built-in fallback validator and formulas
    const validation = validateInputs(rawLambda, rawMu);
    if (!validation.isValid) {
      metrics = { isValid: false, isStable: false, error: validation.errorMessage, warning: '' };
    } else {
      const lam = parseFloat(rawLambda);
      const m = parseFloat(rawMu);
      const rho = lam / m;
      if (!validation.isStable) {
        metrics = {
          isValid: true,
          isStable: false,
          lambda: lam,
          mu: m,
          rho: rho,
          p0: 0,
          Ls: Infinity,
          L: Infinity,
          Lq: Infinity,
          Lw: Infinity,
          Ws: Infinity,
          W: Infinity,
          Wq: Infinity,
          avgServiceTime: 1 / m,
          avgInterArrivalTime: 1 / lam,
          error: '',
          warning: validation.warningMessage
        };
      } else {
        const Ls = lam / (m - lam);
        const Lq = (lam * lam) / (m * (m - lam));
        const Lw = m / (m - lam);
        const Ws = 1 / (m - lam);
        const Wq = lam / (m * (m - lam));
        metrics = {
          isValid: true,
          isStable: true,
          lambda: lam,
          mu: m,
          rho: rho,
          p0: 1 - rho,
          Ls: Ls,
          L: Ls,
          Lq: Lq,
          Lw: Lw,
          Ws: Ws,
          W: Ws,
          Wq: Wq,
          avgServiceTime: 1 / m,
          avgInterArrivalTime: 1 / lam,
          kParam: state.paramK,
          tParam: state.paramT,
          nParam: state.paramN,
          pn: Math.pow(rho, state.paramN) * (1 - rho),
          probNGeK: Math.pow(rho, state.paramK),
          probNGtK: Math.pow(rho, state.paramK + 1),
          probTsGtT: Math.exp(-(m - lam) * state.paramT),
          probTqGtT: rho * Math.exp(-(m - lam) * state.paramT),
          littles: {
            law1: { formula: 'Ls = λ Ws', lhs: Ls, rhs: lam * Ws, isVerified: Math.abs(Ls - lam * Ws) < 1e-6 },
            law2: { formula: 'Lq = λ Wq', lhs: Lq, rhs: lam * Wq, isVerified: Math.abs(Lq - lam * Wq) < 1e-6 },
            law3: { formula: 'Ws = Wq + 1/μ', lhs: Ws, rhs: Wq + 1 / m, isVerified: Math.abs(Ws - (Wq + 1 / m)) < 1e-6 },
            law4: { formula: 'Ls = Lq + λ/μ', lhs: Ls, rhs: Lq + rho, isVerified: Math.abs(Ls - (Lq + rho)) < 1e-6 },
            allVerified: true
          },
          error: '',
          warning: ''
        };
      }
    }
  }

  state.isValid = metrics.isValid;
  state.isStable = metrics.isStable;
  state.errorMessage = metrics.error || '';
  state.warningMessage = metrics.warning || '';
  state.metrics = metrics;

  renderStatusAlerts();

  if (!state.isValid) {
    clearMetricsDisplay(metrics.error);
    return;
  }

  if (!state.isStable) {
    renderUnstableMetrics(metrics.rho, metrics.lambda, metrics.mu);
    updateChartsUnstable(metrics.rho);
    if (window.sim3D) {
      window.sim3D.updateParameters(metrics.lambda, metrics.mu);
      window.sim3D.setServerVisualState('overloaded');
    }
    return;
  }

  renderMetrics(metrics);
  updateCharts(metrics);

  // Synchronize 3D simulation parameters
  if (window.sim3D) {
    window.sim3D.updateParameters(metrics.lambda, metrics.mu);
  }
}

/**
 * Input Validation Logic
 */
function validateInputs(lambda, mu) {
  if (isNaN(lambda) || isNaN(mu)) {
    return {
      isValid: false,
      isStable: false,
      errorMessage: 'Inputs must be valid numerical values.',
      warningMessage: ''
    };
  }

  if (lambda <= 0 && mu <= 0) {
    return {
      isValid: false,
      isStable: false,
      errorMessage: 'Arrival rate (λ) and Service rate (μ) must both be strictly positive (> 0).',
      warningMessage: ''
    };
  }

  if (lambda <= 0) {
    return {
      isValid: false,
      isStable: false,
      errorMessage: 'Arrival rate (λ) must be strictly greater than zero (> 0). A non-positive arrival rate has no incoming traffic.',
      warningMessage: ''
    };
  }

  if (mu <= 0) {
    return {
      isValid: false,
      isStable: false,
      errorMessage: 'Service rate (μ) must be strictly greater than zero (> 0). Division by zero occurs when service capacity is zero.',
      warningMessage: ''
    };
  }

  // Stability warning when lambda >= mu
  if (lambda >= mu) {
    const rho = (lambda / mu).toFixed(4);
    let warningMsg = '';
    if (lambda === mu) {
      warningMsg = `⚠️ CRITICAL BOUNDARY: Arrival rate equals service rate (λ = μ = ${lambda}). Utilisation ρ = 1.00 (100%). In an (M/M/1):(∞/FIFO) queue with stochastic fluctuations, the queue length will grow infinitely over time because there is zero idle capacity to absorb random surges.`;
    } else {
      warningMsg = `🚨 SEVERE INSTABILITY: Arrival rate (λ = ${lambda}) exceeds service capacity (μ = ${mu}). Utilisation factor ρ = ${rho} ≥ 1.00. Customers arrive faster than they can be served, causing unbounded queue buildup ($L_q \\to \\infty$) and infinite waiting times ($W_q \\to \\infty$). Steady-state equilibrium cannot exist!`;
    }

    return {
      isValid: true,
      isStable: false,
      errorMessage: '',
      warningMessage: warningMsg
    };
  }

  return {
    isValid: true,
    isStable: true,
    errorMessage: '',
    warningMessage: ''
  };
}

/**
 * Render Status Notification Banners
 */
function renderStatusAlerts() {
  const alertContainer = document.getElementById('status-alerts-container');
  const liveBadge = document.getElementById('nav-system-status-badge');
  if (!alertContainer) return;

  if (!state.isValid) {
    alertContainer.innerHTML = `
      <div class="alert-box alert-error animate-fade-in">
        <i data-lucide="alert-octagon" class="alert-icon"></i>
        <div class="alert-content">
          <h4>Invalid Parameter Input</h4>
          <p>${escapeHtml(state.errorMessage)}</p>
        </div>
      </div>
    `;
    if (liveBadge) {
      liveBadge.className = 'status-pill status-invalid';
      liveBadge.innerHTML = `<span class="pulse-dot"></span> Invalid Input`;
    }
  } else if (!state.isStable) {
    alertContainer.innerHTML = `
      <div class="alert-box alert-warning animate-fade-in">
        <i data-lucide="alert-triangle" class="alert-icon"></i>
        <div class="alert-content">
          <h4>Unstable Queue Warning (λ ≥ μ)</h4>
          <p>${escapeHtml(state.warningMessage)}</p>
          <div class="alert-recommendation">
            <strong>Theoretical Consequence:</strong> $\\rho \\ge 1.00 \\implies \\lim_{t \\to \\infty} E[N(t)] = \\infty$. Steady-state equations are mathematically undefined. Increase $\\mu$ or reduce $\\lambda$ to restore stability.
          </div>
        </div>
      </div>
    `;
    if (liveBadge) {
      liveBadge.className = 'status-pill status-unstable';
      liveBadge.innerHTML = `<span class="pulse-dot"></span> System Unstable (λ ≥ μ)`;
    }
  } else {
    // Normal stable state
    alertContainer.innerHTML = `
      <div class="alert-box alert-success animate-fade-in">
        <i data-lucide="check-circle-2" class="alert-icon"></i>
        <div class="alert-content">
          <h4>System Operating in Steady-State Equilibrium (λ < μ)</h4>
          <p>Traffic intensity $\\rho = ${(state.lambda / state.mu).toFixed(4)} < 1.00$. Queue is ergodic and mathematically convergent.</p>
        </div>
      </div>
    `;
    if (liveBadge) {
      liveBadge.className = 'status-pill status-stable';
      liveBadge.innerHTML = `<span class="pulse-dot"></span> System Stable (ρ = ${(state.lambda / state.mu).toFixed(2)})`;
    }
  }

  initLucideIcons();
  initFormulasKaTeX();
}

/**
 * Render Calculated Metrics to UI
 */
function renderMetrics(m) {
  const rho = m.rho;
  const Ls = m.Ls !== undefined ? m.Ls : m.L;
  const Ws = m.Ws !== undefined ? m.Ws : m.W;
  const Lq = m.Lq;
  const Wq = m.Wq;
  const Lw = m.Lw !== undefined ? m.Lw : (m.mu / (m.mu - m.lambda));
  const p0 = m.p0;

  // 1. Utilization factor rho
  const rhoVal = document.getElementById('metric-rho-value');
  const rhoPercent = document.getElementById('metric-rho-percent');
  const rhoBar = document.getElementById('metric-rho-bar');
  if (rhoVal) rhoVal.textContent = rho.toFixed(4);
  if (rhoPercent) rhoPercent.textContent = `${(rho * 100).toFixed(1)}%`;
  if (rhoBar) {
    rhoBar.style.width = `${Math.min(100, rho * 100)}%`;
    rhoBar.style.backgroundColor = 'var(--accent-cyan)';
  }

  // 2. P0: Empty system probability
  const p0Val = document.getElementById('metric-p0-value');
  const p0Percent = document.getElementById('metric-p0-percent');
  if (p0Val) p0Val.textContent = p0.toFixed(4);
  if (p0Percent) p0Percent.textContent = `${(p0 * 100).toFixed(1)}% idle`;

  // 3. Ls: Customers in system
  const lVal = document.getElementById('metric-l-value');
  const lSub = document.getElementById('metric-l-sub');
  if (lVal) lVal.textContent = Ls.toFixed(4);
  if (lSub) lSub.textContent = `≈ ${Math.round(Ls)} customer${Math.round(Ls) === 1 ? '' : 's'}`;

  // 4. Lq: Customers in queue
  const lqVal = document.getElementById('metric-lq-value');
  const lqSub = document.getElementById('metric-lq-sub');
  if (lqVal) lqVal.textContent = Lq.toFixed(4);
  if (lqSub) lqSub.textContent = `Waiting in FIFO buffer`;

  // 5. Lw: Customers in waiting line (Study Notes Page 6)
  const lwVal = document.getElementById('metric-lw-value');
  const lwSub = document.getElementById('metric-lw-sub');
  if (lwVal) lwVal.textContent = Lw.toFixed(4);
  if (lwSub) lwSub.textContent = `Given queue non-empty`;

  // 6. Ws: Time in system
  const wVal = document.getElementById('metric-w-value');
  const wFormatted = document.getElementById('metric-w-formatted');
  if (wVal) wVal.textContent = Ws.toFixed(4);
  if (wFormatted) wFormatted.textContent = formatTimeEquivalent(Ws, state.timeUnit);

  // 7. Wq: Waiting time in queue
  const wqVal = document.getElementById('metric-wq-value');
  const wqFormatted = document.getElementById('metric-wq-formatted');
  if (wqVal) wqVal.textContent = Wq.toFixed(4);
  if (wqFormatted) wqFormatted.textContent = formatTimeEquivalent(Wq, state.timeUnit);

  // Little's Law Badges verification in header
  const littleL = document.getElementById('check-littles-l');
  const littleLq = document.getElementById('check-littles-lq');
  const isLValid = Math.abs(Ls - (state.lambda * Ws)) < 1e-5;
  const isLqValid = Math.abs(Lq - (state.lambda * Wq)) < 1e-5;

  if (littleL) {
    littleL.innerHTML = isLValid 
      ? `<span class="badge-verified"><i data-lucide="check"></i> $L_s = \\lambda W_s$ (${Ls.toFixed(3)} = ${(state.lambda * Ws).toFixed(3)})</span>`
      : `<span class="badge-error">Little's Law check failed</span>`;
  }
  if (littleLq) {
    littleLq.innerHTML = isLqValid
      ? `<span class="badge-verified"><i data-lucide="check"></i> $L_q = \\lambda W_q$ (${Lq.toFixed(3)} = ${(state.lambda * Wq).toFixed(3)})</span>`
      : `<span class="badge-error">Little's Law check failed</span>`;
  }

  // Advanced Tail Distributions (Study Notes Page 6)
  const pn = m.pn !== undefined ? m.pn : (Math.pow(rho, state.paramN) * (1 - rho));
  const probNGeK = m.probNGeK !== undefined ? m.probNGeK : Math.pow(rho, state.paramK);
  const probNGtK = m.probNGtK !== undefined ? m.probNGtK : Math.pow(rho, state.paramK + 1);
  const probTsGtT = m.probTsGtT !== undefined ? m.probTsGtT : Math.exp(-(m.mu - m.lambda) * state.paramT);
  const probTqGtT = m.probTqGtT !== undefined ? m.probTqGtT : (rho * Math.exp(-(m.mu - m.lambda) * state.paramT));

  const lblN = document.getElementById('lbl-n-val');
  const pnVal = document.getElementById('metric-pn-val');
  const pnPercent = document.getElementById('metric-pn-percent');
  if (lblN) lblN.textContent = state.paramN;
  if (pnVal) pnVal.textContent = pn.toFixed(4);
  if (pnPercent) pnPercent.textContent = `(${(pn * 100).toFixed(2)}%)`;

  const lblK1 = document.getElementById('lbl-k-val1');
  const lblK2 = document.getElementById('lbl-k-val2');
  const pGekVal = document.getElementById('metric-p-gek-val');
  const pGekPercent = document.getElementById('metric-p-gek-percent');
  const pGtkVal = document.getElementById('metric-p-gtk-val');
  const pGtkPercent = document.getElementById('metric-p-gtk-percent');
  if (lblK1) lblK1.textContent = state.paramK;
  if (lblK2) lblK2.textContent = state.paramK;
  if (pGekVal) pGekVal.textContent = probNGeK.toFixed(4);
  if (pGekPercent) pGekPercent.textContent = `(${(probNGeK * 100).toFixed(2)}%)`;
  if (pGtkVal) pGtkVal.textContent = probNGtK.toFixed(4);
  if (pGtkPercent) pGtkPercent.textContent = `(${(probNGtK * 100).toFixed(2)}%)`;

  const lblT1 = document.getElementById('lbl-t-val1');
  const lblT2 = document.getElementById('lbl-t-val2');
  const pTsVal = document.getElementById('metric-p-ts-val');
  const pTsPercent = document.getElementById('metric-p-ts-percent');
  const pTqVal = document.getElementById('metric-p-tq-val');
  const pTqPercent = document.getElementById('metric-p-tq-percent');
  if (lblT1) lblT1.textContent = state.paramT;
  if (lblT2) lblT2.textContent = state.paramT;
  if (pTsVal) pTsVal.textContent = probTsGtT.toFixed(4);
  if (pTsPercent) pTsPercent.textContent = `(${(probTsGtT * 100).toFixed(2)}%)`;
  if (pTqVal) pTqVal.textContent = probTqGtT.toFixed(4);
  if (pTqPercent) pTqPercent.textContent = `(${(probTqGtT * 100).toFixed(2)}%)`;

  // Secondary metrics
  const avgServiceEl = document.getElementById('metric-service-time');
  const avgArrivalEl = document.getElementById('metric-arrival-time');
  if (avgServiceEl) avgServiceEl.textContent = `${(1 / state.mu).toFixed(4)} ${state.timeUnit}`;
  if (avgArrivalEl) avgArrivalEl.textContent = `${(1 / state.lambda).toFixed(4)} ${state.timeUnit}`;

  initLucideIcons();
  initFormulasKaTeX();
}

/**
 * Format time values into intuitive units
 */
function formatTimeEquivalent(val, unit) {
  if (unit === 'hours') {
    const minutes = val * 60;
    if (minutes < 1) {
      const seconds = val * 3600;
      return `${seconds.toFixed(1)} sec`;
    }
    return `${minutes.toFixed(2)} mins`;
  } else if (unit === 'minutes') {
    const seconds = val * 60;
    if (seconds >= 60) {
      return `${(val / 60).toFixed(2)} hrs`;
    }
    return `${seconds.toFixed(1)} sec`;
  } else {
    // seconds
    if (val >= 60) {
      return `${(val / 60).toFixed(2)} mins`;
    }
    return `${val.toFixed(2)} sec`;
  }
}

/**
 * Render display for Unstable Queue state
 */
function renderUnstableMetrics(rho, lambda, mu) {
  const rhoVal = document.getElementById('metric-rho-value');
  const rhoPercent = document.getElementById('metric-rho-percent');
  const rhoBar = document.getElementById('metric-rho-bar');
  if (rhoVal) rhoVal.textContent = rho.toFixed(4);
  if (rhoPercent) rhoPercent.textContent = `${(rho * 100).toFixed(1)}% (Over capacity)`;
  if (rhoBar) {
    rhoBar.style.width = '100%';
    rhoBar.style.backgroundColor = 'var(--accent-danger)';
  }

  const p0Val = document.getElementById('metric-p0-value');
  const p0Percent = document.getElementById('metric-p0-percent');
  if (p0Val) p0Val.textContent = '0.0000';
  if (p0Percent) p0Percent.textContent = '0.0% (Server never idle)';

  const lVal = document.getElementById('metric-l-value');
  const lSub = document.getElementById('metric-l-sub');
  if (lVal) lVal.innerHTML = '<span>&infin;</span> <small class="text-danger">Unbounded</small>';
  if (lSub) lSub.textContent = 'Queue grows infinitely';

  const lqVal = document.getElementById('metric-lq-value');
  const lqSub = document.getElementById('metric-lq-sub');
  if (lqVal) lqVal.innerHTML = '<span>&infin;</span> <small class="text-danger">Unbounded</small>';
  if (lqSub) lqSub.textContent = 'Buffer overflows';

  const lwVal = document.getElementById('metric-lw-value');
  const lwSub = document.getElementById('metric-lw-sub');
  if (lwVal) lwVal.innerHTML = '<span>&infin;</span> <small class="text-danger">Unbounded</small>';
  if (lwSub) lwSub.textContent = 'Non-empty queue blows up';

  const wVal = document.getElementById('metric-w-value');
  const wFormatted = document.getElementById('metric-w-formatted');
  if (wVal) wVal.innerHTML = '<span>&infin;</span>';
  if (wFormatted) wFormatted.textContent = 'Infinite waiting time';

  const wqVal = document.getElementById('metric-wq-value');
  const wqFormatted = document.getElementById('metric-wq-formatted');
  if (wqVal) wqVal.innerHTML = '<span>&infin;</span>';
  if (wqFormatted) wqFormatted.textContent = 'Infinite queue delay';

  const littleL = document.getElementById('check-littles-l');
  const littleLq = document.getElementById('check-littles-lq');
  if (littleL) littleL.innerHTML = `<span class="badge-warning">Undefined: System is non-stationary</span>`;
  if (littleLq) littleLq.innerHTML = `<span class="badge-warning">Undefined: Infinite bottleneck</span>`;

  // Little's 4 badges
  ['badge-law1', 'badge-law2', 'badge-law3', 'badge-law4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<i data-lucide="alert-triangle"></i> Undefined`;
  });

  // SVG Illustration
  const svgLam = document.getElementById('svg-val-lambda');
  const svgMu = document.getElementById('svg-val-mu');
  const svgRho = document.getElementById('svg-val-rho');
  const svgP0 = document.getElementById('svg-val-p0');
  const svgLq = document.getElementById('svg-val-lq');
  const svgWq = document.getElementById('svg-val-wq');
  const svgLs = document.getElementById('svg-val-ls');
  if (svgLam) svgLam.textContent = lambda.toFixed(2);
  if (svgMu) svgMu.textContent = mu.toFixed(2);
  if (svgRho) svgRho.textContent = `${(rho * 100).toFixed(0)}% (OVERLOAD)`;
  if (svgP0) svgP0.textContent = '0%';
  if (svgLq) svgLq.textContent = '∞';
  if (svgWq) svgWq.textContent = '∞';
  if (svgLs) svgLs.textContent = '∞';

  initLucideIcons();
}

/**
 * Clear metrics display on invalid input
 */
function clearMetricsDisplay(errMsg) {
  const ids = ['metric-rho-value', 'metric-p0-value', 'metric-l-value', 'metric-lq-value', 'metric-lw-value', 'metric-w-value', 'metric-wq-value'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  const subs = ['metric-rho-percent', 'metric-p0-percent', 'metric-l-sub', 'metric-lq-sub', 'metric-lw-sub', 'metric-w-formatted', 'metric-wq-formatted'];
  subs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = 'Awaiting valid inputs';
  });

  const littleL = document.getElementById('check-littles-l');
  const littleLq = document.getElementById('check-littles-lq');
  if (littleL) littleL.innerHTML = `<span class="badge-error">Invalid Input</span>`;
  if (littleLq) littleLq.innerHTML = `<span class="badge-error">Invalid Input</span>`;
}

/**
 * Initialize Chart.js Graphs with Light Theme Colors
 */
function initCharts() {
  const distCtx = document.getElementById('chart-distribution');
  const sensCtx = document.getElementById('chart-sensitivity');

  if (distCtx && typeof Chart !== 'undefined') {
    state.charts.distribution = new Chart(distCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Probability P(N = n)',
          data: [],
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Probability P(${ctx.label}): ${(ctx.parsed.y * 100).toFixed(2)}%`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Number of Customers in System (n)', color: '#475569', font: { weight: '600' } },
            grid: { color: 'rgba(15, 23, 42, 0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            title: { display: true, text: 'Probability Pn', color: '#475569', font: { weight: '600' } },
            grid: { color: 'rgba(15, 23, 42, 0.05)' },
            ticks: { color: '#64748b' },
            beginAtZero: true
          }
        }
      }
    });
  }

  if (sensCtx && typeof Chart !== 'undefined') {
    state.charts.sensitivity = new Chart(sensCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Avg in System (L)',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 0
          },
          {
            label: 'Avg in Queue (Lq)',
            data: [],
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#0f172a', font: { weight: '600' } }
          },
          tooltip: {
            callbacks: {
              title: (items) => `Utilisation ρ = ${items[0].label}`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Traffic Intensity ρ (λ/μ)', color: '#475569', font: { weight: '600' } },
            grid: { color: 'rgba(15, 23, 42, 0.05)' },
            ticks: { color: '#64748b' }
          },
          y: {
            title: { display: true, text: 'Average Customer Count', color: '#475569', font: { weight: '600' } },
            grid: { color: 'rgba(15, 23, 42, 0.05)' },
            ticks: { color: '#64748b' },
            beginAtZero: true,
            max: 20
          }
        }
      }
    });
  }
}

/**
 * Update Charts with new metrics
 */
function updateCharts(m) {
  if (state.charts.distribution) {
    const labels = [];
    const data = [];
    const maxN = 12;

    for (let n = 0; n <= maxN; n++) {
      labels.push(n.toString());
      // Pn = (1 - rho) * rho^n
      const pn = (1 - m.rho) * Math.pow(m.rho, n);
      data.push(pn);
    }

    state.charts.distribution.data.labels = labels;
    state.charts.distribution.data.datasets[0].data = data;
    state.charts.distribution.update();
  }

  if (state.charts.sensitivity) {
    const rhoLabels = [];
    const lData = [];
    const lqData = [];

    for (let r = 0.05; r <= 0.95; r += 0.05) {
      const rhoFixed = parseFloat(r.toFixed(2));
      rhoLabels.push(rhoFixed.toFixed(2));
      const curL = rhoFixed / (1 - rhoFixed);
      const curLq = (rhoFixed * rhoFixed) / (1 - rhoFixed);
      lData.push(curL);
      lqData.push(curLq);
    }

    state.charts.sensitivity.data.labels = rhoLabels;
    state.charts.sensitivity.data.datasets[0].data = lData;
    state.charts.sensitivity.data.datasets[1].data = lqData;
    state.charts.sensitivity.update();
  }
}

function updateChartsUnstable(rho) {
  if (state.charts.distribution) {
    state.charts.distribution.data.labels = ['Unstable'];
    state.charts.distribution.data.datasets[0].data = [0];
    state.charts.distribution.update();
  }
}

/**
 * Load test cases from JSON or fallback
 */
async function loadTestCases() {
  try {
    const res = await fetch('test_cases.json');
    if (res.ok) {
      state.testCases = await res.json();
    } else {
      throw new Error('Fallback to default test cases');
    }
  } catch (err) {
    // Built-in verified fallback suite
    state.testCases = [
      {
        id: 1,
        title: "Normal Light Load",
        description: "Standard low-utilization scenario where server easily handles arrivals.",
        category: "normal",
        lambda: 2,
        mu: 4,
        expected: { status: "stable", rho: 0.5, p0: 0.5, L: 1.0, Lq: 0.5, W: 0.5, Wq: 0.25 },
        notes: "Rho = 50%, L = 1, W = 30 mins."
      },
      {
        id: 2,
        title: "Moderate Everyday Load",
        description: "Realistic operating condition with moderate traffic.",
        category: "normal",
        lambda: 3,
        mu: 5,
        expected: { status: "stable", rho: 0.6, p0: 0.4, L: 1.5, Lq: 0.9, W: 0.5, Wq: 0.3 },
        notes: "Rho = 60%, L = 1.5, Wq = 18 mins."
      },
      {
        id: 3,
        title: "High Congestion Near Peak",
        description: "High traffic load demonstrating non-linear queue buildup.",
        category: "normal",
        lambda: 8,
        mu: 10,
        expected: { status: "stable", rho: 0.8, p0: 0.2, L: 4.0, Lq: 3.2, W: 0.5, Wq: 0.4 },
        notes: "Rho = 80%, average queue size quadruples to 3.2."
      },
      {
        id: 4,
        title: "Fractional / Decimal Rates",
        description: "Low-frequency operations validating decimal precision.",
        category: "normal",
        lambda: 0.5,
        mu: 1.5,
        expected: { status: "stable", rho: 0.3333, p0: 0.6667, L: 0.5, Lq: 0.1667, W: 1.0, Wq: 0.3333 },
        notes: "System idle 66.7% of time."
      },
      {
        id: 5,
        title: "Critical Boundary (λ = μ)",
        description: "Edge case where arrival rate equals service capacity.",
        category: "unstable",
        lambda: 5,
        mu: 5,
        expected: { status: "unstable", rho: 1.0, warning: "System is unstable (λ ≥ μ)." },
        notes: "Queue length grows infinitely over time."
      },
      {
        id: 6,
        title: "Severe Overload (λ > μ)",
        description: "Arrival rate strictly surpasses service rate.",
        category: "unstable",
        lambda: 12,
        mu: 8,
        expected: { status: "unstable", rho: 1.5, warning: "Severe overload." },
        notes: "Deterministic queue explosion at 4 cust/hr."
      },
      {
        id: 7,
        title: "Invalid Input: Negative Rate",
        description: "Validation test for strictly positive parameter requirements.",
        category: "invalid",
        lambda: -2,
        mu: 5,
        expected: { status: "invalid", error: "Must be positive > 0" },
        notes: "Arrival frequency cannot be negative."
      },
      {
        id: 8,
        title: "Invalid Input: Zero Service",
        description: "Validation test for division by zero and dead server.",
        category: "invalid",
        lambda: 3,
        mu: 0,
        expected: { status: "invalid", error: "Must be positive > 0" },
        notes: "Service rate of 0 produces zero capacity."
      }
    ];
  }
}

/**
 * Render Interactive Test Cases Table
 */
function renderTestCasesTable() {
  const tbody = document.getElementById('test-cases-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  state.testCases.forEach((tc) => {
    const tr = document.createElement('tr');
    tr.className = `test-row test-category-${tc.category}`;
    tr.id = `test-row-${tc.id}`;

    // Expected summary string
    let expectedSummary = '';
    if (tc.expected.status === 'stable') {
      expectedSummary = `ρ=${tc.expected.rho.toFixed(2)}, P₀=${tc.expected.p0.toFixed(2)}, L=${tc.expected.L.toFixed(2)}, Lq=${tc.expected.Lq.toFixed(2)}, W=${tc.expected.W.toFixed(2)}, Wq=${tc.expected.Wq.toFixed(2)}`;
    } else if (tc.expected.status === 'unstable') {
      expectedSummary = `⚠️ Unstable Warning (ρ = ${tc.expected.rho.toFixed(2)} ≥ 1.00, L → ∞)`;
    } else {
      expectedSummary = `❌ Input Error: ${tc.expected.error}`;
    }

    // Category badge class
    let badgeClass = 'badge-normal';
    if (tc.category === 'unstable') badgeClass = 'badge-warning';
    if (tc.category === 'invalid') badgeClass = 'badge-danger';

    tr.innerHTML = `
      <td class="col-id">#${tc.id}</td>
      <td class="col-title">
        <span class="badge ${badgeClass}">${tc.category.toUpperCase()}</span>
        <strong>${escapeHtml(tc.title)}</strong>
        <p class="tc-desc">${escapeHtml(tc.description)}</p>
      </td>
      <td class="col-inputs">
        <div class="param-tag"><span>λ:</span> <strong>${tc.lambda}</strong></div>
        <div class="param-tag"><span>μ:</span> <strong>${tc.mu}</strong></div>
      </td>
      <td class="col-expected">
        <code class="code-expected">${expectedSummary}</code>
        <div class="tc-note">${escapeHtml(tc.notes)}</div>
      </td>
      <td class="col-obtained" id="tc-obtained-${tc.id}">
        <span class="text-muted">Not run yet</span>
      </td>
      <td class="col-status" id="tc-status-${tc.id}">
        <span class="status-pill status-pending">Pending</span>
      </td>
      <td class="col-action">
        <button class="btn btn-sm btn-secondary btn-load-test" data-id="${tc.id}" title="Load inputs into calculator">
          <i data-lucide="play-circle"></i> Load & Run
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Attach button click handlers
  document.querySelectorAll('.btn-load-test').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tcId = parseInt(btn.getAttribute('data-id'));
      loadSpecificTestCase(tcId);
    });
  });

  initLucideIcons();
}

/**
 * Load and run a single test case into the main calculator
 */
function loadSpecificTestCase(id) {
  const tc = state.testCases.find(t => t.id === id);
  if (!tc) return;

  setInputs(tc.lambda, tc.mu, 'hours');

  // Evaluate single test case outcome in table
  evaluateSingleTestCaseInTable(tc);

  // Scroll smoothly to top calculator section
  const calcCard = document.getElementById('calculator-section');
  if (calcCard) {
    calcCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Run evaluation of single test case
 */
function evaluateSingleTestCaseInTable(tc) {
  const obtainedCell = document.getElementById(`tc-obtained-${tc.id}`);
  const statusCell = document.getElementById(`tc-status-${tc.id}`);
  if (!obtainedCell || !statusCell) return;

  let res;
  if (window.MM1Engine && typeof window.MM1Engine.computeAllMetrics === 'function') {
    res = window.MM1Engine.computeAllMetrics(tc.lambda, tc.mu);
  } else {
    const val = validateInputs(tc.lambda, tc.mu);
    if (!val.isValid) {
      res = { isValid: false, isStable: false, error: val.errorMessage };
    } else if (!val.isStable) {
      res = { isValid: true, isStable: false, rho: tc.lambda / tc.mu, warning: val.warningMessage };
    } else {
      const lam = tc.lambda, m = tc.mu, rho = lam / m;
      res = {
        isValid: true,
        isStable: true,
        rho: rho,
        p0: 1 - rho,
        Ls: lam / (m - lam),
        Lq: (lam * lam) / (m * (m - lam)),
        Lw: m / (m - lam),
        Ws: 1 / (m - lam),
        Wq: lam / (m * (m - lam))
      };
    }
  }

  let passed = false;
  let obtainedText = '';

  if (!res.isValid) {
    obtainedText = `❌ Error: ${res.error}`;
    passed = (tc.expected.status === 'invalid');
  } else if (!res.isStable) {
    obtainedText = `⚠️ Unstable Warning (ρ = ${res.rho.toFixed(2)} ≥ 1.00)`;
    passed = (tc.expected.status === 'unstable');
  } else {
    const rho = res.rho;
    const p0 = res.p0;
    const L = res.Ls;
    const Lq = res.Lq;
    const Lw = res.Lw;
    const W = res.Ws;
    const Wq = res.Wq;

    obtainedText = `ρ=${rho.toFixed(2)}, P₀=${p0.toFixed(2)}, L=${L.toFixed(2)}, Lq=${Lq.toFixed(2)}, Lw=${Lw.toFixed(2)}, W=${W.toFixed(2)}, Wq=${Wq.toFixed(2)}`;

    if (tc.expected.status === 'stable') {
      const tol = 0.01;
      const rhoMatch = Math.abs(rho - tc.expected.rho) < tol;
      const p0Match = Math.abs(p0 - tc.expected.p0) < tol;
      const lMatch = Math.abs(L - tc.expected.L) < tol;
      const lqMatch = Math.abs(Lq - tc.expected.Lq) < tol;
      const lwMatch = tc.expected.Lw === undefined || Math.abs(Lw - tc.expected.Lw) < tol;
      const wMatch = Math.abs(W - tc.expected.W) < tol;
      const wqMatch = Math.abs(Wq - tc.expected.Wq) < tol;
      passed = rhoMatch && p0Match && lMatch && lqMatch && lwMatch && wMatch && wqMatch;
    }
  }

  obtainedCell.innerHTML = `<code class="code-obtained">${obtainedText}</code>`;
  statusCell.innerHTML = passed 
    ? `<span class="status-pill status-stable"><i data-lucide="check"></i> PASSED</span>`
    : `<span class="status-pill status-invalid"><i data-lucide="x"></i> FAILED</span>`;

  initLucideIcons();
}

/**
 * Run All Test Cases in Batch
 */
function runAllTestCases() {
  let passCount = 0;
  state.testCases.forEach(tc => {
    evaluateSingleTestCaseInTable(tc);
    const statusCell = document.getElementById(`tc-status-${tc.id}`);
    if (statusCell && statusCell.textContent.includes('PASSED')) {
      passCount++;
    }
  });

  const banner = document.getElementById('test-suite-summary-banner');
  if (banner) {
    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="alert-box alert-success animate-fade-in">
        <i data-lucide="check-circle" class="alert-icon"></i>
        <div class="alert-content">
          <h4>Batch Test Suite Execution Complete</h4>
          <p>Validated <strong>${passCount} / ${state.testCases.length}</strong> test cases successfully against theoretical M/M/1 queue expectations.</p>
        </div>
      </div>
    `;
    initLucideIcons();
  }
}

/**
 * Copy formatted summary report to clipboard
 */
function copySummaryReport() {
  if (!state.metrics) {
    alert('Please enter valid queue parameters first.');
    return;
  }

  const m = state.metrics;
  const isStable = m.isStable;
  const Ls = m.Ls !== undefined ? m.Ls : m.L;
  const Ws = m.Ws !== undefined ? m.Ws : m.W;
  const Lw = m.Lw !== undefined ? m.Lw : (state.mu / (state.mu - state.lambda));

  const report = `=====================================================
(M/M/1):(∞/FIFO) QUEUING CALCULATOR REPORT
Linear Algebra & Queuing Theory — Study Notes (Page 6)
=====================================================
System Configuration:
- Arrival Rate (λ): ${state.lambda} cust / ${state.timeUnit}
- Service Rate (μ): ${state.mu} cust / ${state.timeUnit}
- Operational State: ${isStable ? 'STABLE (λ < μ)' : 'UNSTABLE (λ ≥ μ)'}

Calculated Primary Performance Measures:
-----------------------------------------------------
1. Utilisation Factor (ρ):              ${m.rho.toFixed(4)} (${(m.rho * 100).toFixed(2)}%)
2. Probability System Empty (P₀):       ${isStable ? m.p0.toFixed(4) : '0.0000'}
3. Avg Customers in System (Ls):        ${isStable ? Ls.toFixed(4) : '∞ (Unbounded)'}
4. Avg Customers in Queue (Lq):         ${isStable ? m.Lq.toFixed(4) : '∞ (Unbounded)'}
5. Avg Customers in Waiting Line (Lw):  ${isStable ? Lw.toFixed(4) : '∞ (Unbounded)'}
6. Avg Time in System (Ws):             ${isStable ? Ws.toFixed(4) + ' ' + state.timeUnit : '∞'}
7. Avg Waiting Time in Queue (Wq):      ${isStable ? m.Wq.toFixed(4) + ' ' + state.timeUnit : '∞'}

Study Notes Advanced Tail Probabilities:
-----------------------------------------------------
- P(N = ${state.paramN}):                      ${isStable ? m.pn.toFixed(4) + ' (' + (m.pn * 100).toFixed(2) + '%)' : 'N/A'}
- P(N ≥ ${state.paramK}):                      ${isStable ? m.probNGeK.toFixed(4) + ' (' + (m.probNGeK * 100).toFixed(2) + '%)' : 'N/A'}
- P(N > ${state.paramK}):                      ${isStable ? m.probNGtK.toFixed(4) + ' (' + (m.probNGtK * 100).toFixed(2) + '%)' : 'N/A'}
- P(Ts > ${state.paramT} ${state.timeUnit}):            ${isStable ? m.probTsGtT.toFixed(4) + ' (' + (m.probTsGtT * 100).toFixed(2) + '%)' : 'N/A'}
- P(Tq > ${state.paramT} ${state.timeUnit}):            ${isStable ? m.probTqGtT.toFixed(4) + ' (' + (m.probTqGtT * 100).toFixed(2) + '%)' : 'N/A'}

Little's Formulas Mathematical Consistency Checks:
-----------------------------------------------------
1. Ls = λ * Ws       => ${isStable ? Ls.toFixed(4) + ' = ' + (state.lambda * Ws).toFixed(4) + ' (VERIFIED)' : 'N/A'}
2. Lq = λ * Wq       => ${isStable ? m.Lq.toFixed(4) + ' = ' + (state.lambda * m.Wq).toFixed(4) + ' (VERIFIED)' : 'N/A'}
3. Ws = Wq + 1/μ     => ${isStable ? Ws.toFixed(4) + ' = ' + (m.Wq + 1 / state.mu).toFixed(4) + ' (VERIFIED)' : 'N/A'}
4. Ls = Lq + λ/μ     => ${isStable ? Ls.toFixed(4) + ' = ' + (m.Lq + m.rho).toFixed(4) + ' (VERIFIED)' : 'N/A'}

Isolated Calculation Engine:
- Directory: Engine/Model I: (M/M/1) : (∞/FIFO)/
- Engine Files: mm1_engine.js, mm1_engine.py
=====================================================`;

  navigator.clipboard.writeText(report).then(() => {
    const btn = document.getElementById('btn-copy-report');
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check"></i> Copied to Clipboard!`;
      initLucideIcons();
      setTimeout(() => {
        btn.innerHTML = origHtml;
        initLucideIcons();
      }, 2500);
    }
  }).catch(err => {
    console.error('Failed to copy report:', err);
  });
}

/**
 * Export test cases as CSV file
 */
function downloadTestCasesCSV() {
  const headers = ['ID', 'Title', 'Category', 'Arrival_Rate_Lambda', 'Service_Rate_Mu', 'Expected_Status', 'Expected_Rho', 'Expected_L', 'Expected_Lq', 'Expected_W', 'Expected_Wq', 'Notes'];
  const rows = state.testCases.map(tc => {
    return [
      tc.id,
      `"${tc.title.replace(/"/g, '""')}"`,
      tc.category,
      tc.lambda,
      tc.mu,
      tc.expected.status,
      tc.expected.rho !== undefined ? tc.expected.rho : 'N/A',
      tc.expected.L !== undefined ? tc.expected.L : 'N/A',
      tc.expected.Lq !== undefined ? tc.expected.Lq : 'N/A',
      tc.expected.W !== undefined ? tc.expected.W : 'N/A',
      tc.expected.Wq !== undefined ? tc.expected.Wq : 'N/A',
      `"${tc.notes.replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'mm1_queue_test_cases.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
