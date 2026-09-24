'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('si-form');
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

  let solveFor = 'balance';

  function calculate() {
    const rateMode = form.querySelector('input[name="si-rate-mode"]:checked').value; // year|month
    const termMode = form.querySelector('input[name="si-term-mode"]:checked').value; // years|months

    let principal = num('si-principal', 0);
    let ratePct = num('si-rate', 0);
    let term = num('si-term', 0);
    let endBalance = num('si-balance', 0);

    // Normalize rate to per-year and term to years for the core formula.
    const rateAnnual = rateMode === 'month' ? ratePct * 12 : ratePct;
    const termYears = termMode === 'months' ? term / 12 : term;

    let interest, resultLabel, resultValue;

    if (solveFor === 'balance') {
      interest = principal * (rateAnnual / 100) * termYears;
      endBalance = principal + interest;
      resultLabel = 'End Balance'; resultValue = currency(endBalance);
    } else if (solveFor === 'principal') {
      principal = endBalance / (1 + (rateAnnual / 100) * termYears);
      interest = endBalance - principal;
      resultLabel = 'Principal'; resultValue = currency(principal);
    } else if (solveFor === 'term') {
      const r = rateAnnual / 100;
      const tYears = r > 0 ? (endBalance / principal - 1) / r : 0;
      interest = endBalance - principal;
      const displayTerm = termMode === 'months' ? tYears * 12 : tYears;
      resultLabel = 'Term'; resultValue = displayTerm.toFixed(3) + (termMode === 'months' ? ' months' : ' years');
    } else {
      const rAnnual = termYears > 0 ? (endBalance / principal - 1) / termYears : 0;
      interest = endBalance - principal;
      const displayRate = rateMode === 'month' ? rAnnual / 12 : rAnnual;
      resultLabel = 'Interest Rate'; resultValue = (displayRate * 100).toFixed(4) + '%' + (rateMode === 'month' ? '/month' : '/year');
    }

    el('si-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${resultLabel}</div>
        <div class="value">${resultValue}</div>
      </div>
      <div class="stat-row"><span>End Balance</span><strong>${currency(endBalance)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(interest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: principal, color: 'var(--accent)', label: 'Principal' }, { value: interest, color: '#10b981', label: 'Interest' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;
  }

  function updateFieldVisibility() {
    el('si-balance-field').hidden = solveFor === 'balance';
    el('si-principal-field').hidden = solveFor === 'principal';
    el('si-term-field').hidden = solveFor === 'term';
    el('si-rate-field').hidden = solveFor === 'rate';
  }

  form.querySelectorAll('input[name="si-tab"]').forEach((r) => {
    r.addEventListener('change', () => { solveFor = r.value; updateFieldVisibility(); calculate(); });
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateFieldVisibility();
  calculate();
})();
