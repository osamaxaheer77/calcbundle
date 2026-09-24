'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('sd-form');
  if (!form) return;

  const CONFIDENCE_LEVELS = [
    { label: '68.3%', z: 1 },
    { label: '90%', z: 1.645 },
    { label: '95%', z: 1.960 },
    { label: '99%', z: 2.576 },
    { label: '99.9%', z: 3.291 },
    { label: '99.99%', z: 3.891 },
    { label: '99.999%', z: 4.417 },
    { label: '99.9999%', z: 4.892 },
  ];

  function fmt(n, dp = 4) {
    return n.toLocaleString('en-US', { maximumFractionDigits: dp });
  }

  function calculate() {
    const raw = el('sd-numbers').value;
    const values = raw.split(/[,\s]+/).map((s) => s.trim()).filter((s) => s !== '').map(Number);

    if (values.length === 0 || values.some((v) => !Number.isFinite(v))) {
      el('sd-result').innerHTML = '<p class="tool-result is-error">Enter a list of numbers separated by commas.</p>';
      return;
    }
    const type = form.querySelector('input[name="sd-type"]:checked').value;
    if (type === 's' && values.length < 2) {
      el('sd-result').innerHTML = '<p class="tool-result is-error">Sample standard deviation requires at least 2 values.</p>';
      return;
    }

    const n = values.length;
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const sumSqDiff = values.reduce((s, v) => s + (v - mean) * (v - mean), 0);
    const divisor = type === 'p' ? n : n - 1;
    const variance = sumSqDiff / divisor;
    const stdDev = Math.sqrt(variance);
    const sem = stdDev / Math.sqrt(n);

    const rows = CONFIDENCE_LEVELS.map((c) => {
      const margin = c.z * sem;
      const pct = mean !== 0 ? (margin / Math.abs(mean) * 100).toFixed(2) : '—';
      return `<div class="stat-row"><span>${c.label}${c.z !== 1 ? ` (${c.z}&sigma;<sub>x&#772;</sub>)` : ''}</span><strong>${fmt(mean, 4)} &plusmn; ${fmt(margin, 4)} (&plusmn;${pct}%)</strong></div>`;
    }).join('');

    el('sd-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${type === 'p' ? 'Population' : 'Sample'} Standard Deviation, &sigma;</div>
        <div class="value">${fmt(stdDev)}</div>
      </div>
      <div class="stat-row"><span>Count, N</span><strong>${n}</strong></div>
      <div class="stat-row"><span>Sum, &Sigma;x</span><strong>${fmt(sum)}</strong></div>
      <div class="stat-row"><span>Mean, &mu;</span><strong>${fmt(mean)}</strong></div>
      <div class="stat-row"><span>Variance, &sigma;&sup2;</span><strong>${fmt(variance)}</strong></div>
      <div class="stat-row"><span>Standard Error of the Mean</span><strong>${fmt(sem)}</strong></div>
    `;

    el('sd-margin-wrap').innerHTML = `<div class="calc-simple-list" style="columns:1;">${rows}</div>`;
    el('sd-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input[name="sd-type"]').forEach((r) => r.addEventListener('change', calculate));
  calculate();
})();
