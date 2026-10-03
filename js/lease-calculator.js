'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ls-form');
  if (!form) return;

  const GREEN = '#10b981';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('ls-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
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

  // Payment that leaves the residual value owing at the end of the lease.
  const paymentFor = (value, residual, i, n) => (i === 0 ? (value - residual) / n : ((value - residual / Math.pow(1 + i, n)) * i) / (1 - Math.pow(1 + i, -n)));

  function calculate() {
    const mode = el('ls-mode').value;
    const value = num('ls-value'), residual = num('ls-residual');
    const years = num('ls-years'), months = num('ls-months');
    if (!Number.isFinite(value) || value <= 0) return showError('Enter the asset value.');
    if (!Number.isFinite(residual) || residual < 0) return showError('Enter the residual value, 0 or more.');
    if (residual >= value) return showError('The residual value must be less than the asset value.');
    if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the lease term in years and months.');
    const n = Math.round(years * 12 + months);
    if (n < 1 || n > 600) return showError('Enter a lease term between 1 month and 50 years.');

    let payment, annual;
    if (mode === 'rate') {
      const rate = num('ls-rate');
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
      annual = rate;
      payment = paymentFor(value, residual, rate / 1200, n);
    } else {
      payment = num('ls-payment');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the monthly payment.');
      if (payment * n + residual < value - 1e-9) return showError('Those payments and the residual value add up to less than the asset value, which would mean a negative interest rate. Try a larger payment.');
      // Find the monthly rate where the payments and residual value are worth exactly the asset value today.
      const worth = (i) => (i === 0 ? payment * n + residual : (payment * (1 - Math.pow(1 + i, -n))) / i + residual * Math.pow(1 + i, -n));
      let lo = 0, hi = 1;
      while (worth(hi) > value && hi < 1e6) hi *= 2;
      for (let k = 0; k < 300; k++) { const m = (lo + hi) / 2; if (worth(m) > value) lo = m; else hi = m; }
      annual = ((lo + hi) / 2) * 1200;
    }
    const total = payment * n;
    const interest = total + residual - value;
    const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
    el('ls-result').innerHTML =
      (mode === 'rate'
        ? `<div class="summary-payment-box"><div class="label">Monthly Pay</div><div class="value">${money(payment)}</div><div class="label" style="margin-top:6px;">${n} monthly payments at ${Math.round(annual * 1000) / 1000}%</div></div>`
        : `<div class="summary-payment-box"><div class="label">Interest / Return Rate</div><div class="value">${annual.toFixed(3)}%</div><div class="label" style="margin-top:6px;">For ${money(payment)} a month over ${n} months</div></div>`) +
      stat(`Total of ${n} monthly payments`, money(total)) +
      stat('Residual value', money(residual)) +
      stat('Total interest', money(interest), GREEN) +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: value, color: 'var(--accent)' }, { value: Math.max(interest, 0), color: GREEN }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Asset value</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;
  }

  function applyMode() {
    const mode = el('ls-mode').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = n.dataset.modes !== mode; });
  }

  el('ls-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
