'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('roi-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = Math.max(seg.value, 0) / total * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  function calculate() {
    const invested = num('roi-invested', 0);
    const returned = num('roi-returned', 0);
    const mode = form.querySelector('input[name="roi-time-mode"]:checked').value;

    let years;
    if (mode === 'length') {
      years = num('roi-length', 0);
    } else {
      const from = new Date(el('roi-from').value);
      const to = new Date(el('roi-to').value);
      if (isNaN(from) || isNaN(to) || to <= from) {
        el('roi-result').innerHTML = '<p class="tool-result is-error">Enter a valid date range.</p>';
        return;
      }
      years = (to - from) / (1000 * 60 * 60 * 24 * 365);
    }

    if (!(invested > 0) || !(years > 0)) {
      el('roi-result').innerHTML = '<p class="tool-result is-error">Enter the amount invested and a positive investment time.</p>';
      return;
    }

    const gain = returned - invested;
    const roi = gain / invested * 100;
    const annualizedRoi = (Math.pow(returned / invested, 1 / years) - 1) * 100;

    el('roi-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">ROI</div>
        <div class="value">${roi.toFixed(2)}%</div>
      </div>
      <div class="stat-row"><span>Investment Gain</span><strong>${currency(gain)}</strong></div>
      <div class="stat-row"><span>Annualized ROI</span><strong>${annualizedRoi.toFixed(2)}%</strong></div>
      <div class="stat-row"><span>Investment Length</span><strong>${years.toFixed(3)} years</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: invested, color: 'var(--accent)', label: 'Invested' }, { value: Math.max(gain, 0), color: '#10b981', label: 'Profit' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Invested</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Profit</span>
        </div>
      </div>
    `;
  }

  function updateModeVisibility() {
    const mode = form.querySelector('input[name="roi-time-mode"]:checked').value;
    el('roi-length-field').hidden = mode !== 'length';
    el('roi-date-fields').hidden = mode !== 'date';
  }

  form.querySelectorAll('input[name="roi-time-mode"]').forEach((r) => r.addEventListener('change', () => { updateModeVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateModeVisibility();
  calculate();
})();
