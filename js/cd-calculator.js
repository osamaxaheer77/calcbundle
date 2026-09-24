'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cd-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const COMPOUND_N = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, continuously: null };

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }

  function periodicMonthlyRate(ratePct, compoundKey) {
    let effAnnual;
    if (compoundKey === 'continuously') effAnnual = Math.exp(ratePct / 100) - 1;
    else effAnnual = Math.pow(1 + ratePct / 100 / COMPOUND_N[compoundKey], COMPOUND_N[compoundKey]) - 1;
    return Math.pow(1 + effAnnual, 1 / 12) - 1;
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
    const initialDeposit = num('cd-initial', 0);
    const ratePct = num('cd-rate', 0);
    const compoundKey = el('cd-compound').value;
    const years = num('cd-years', 0);
    const months = num('cd-months', 0);
    const taxPct = num('cd-tax', 0);

    const totalMonths = Math.round(years * 12 + months);
    if (!(initialDeposit > 0) || totalMonths <= 0) {
      el('cd-result').innerHTML = '<p class="tool-result is-error">Enter an initial deposit and deposit length.</p>';
      return;
    }

    const monthlyRate = periodicMonthlyRate(ratePct, compoundKey);

    let balance = initialDeposit;
    const yearRows = [];
    let yearInterest = 0;
    let totalInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const grossInterest = balance * monthlyRate;
      const netInterest = grossInterest * (1 - taxPct / 100);
      balance += netInterest;
      yearInterest += netInterest;
      totalInterest += netInterest;
      if (m % 12 === 0 || m === totalMonths) {
        yearRows.push({ year: yearRows.length + 1, deposit: yearRows.length === 0 ? initialDeposit : 0, interest: yearInterest, balance });
        yearInterest = 0;
      }
    }

    const endBalance = balance;

    el('cd-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">End Balance</div>
        <div class="value">${currency(endBalance)}</div>
      </div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: initialDeposit, color: 'var(--accent)', label: 'Initial Deposit' }, { value: totalInterest, color: '#10b981', label: 'Interest' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Initial Deposit</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Year</th><th>Deposit</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
    yearRows.forEach((r) => { tableHtml += `<tr><td>${r.year}</td><td>${currency(r.deposit)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`; });
    tableHtml += '</tbody></table>';
    el('cd-table-wrap').innerHTML = tableHtml;
    el('cd-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
