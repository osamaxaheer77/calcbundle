'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('sav-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  const COMPOUND_N = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365 };

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
    const initialDeposit = num('sav-initial', 0);
    const annualContribBase = num('sav-annual', 0);
    const annualInc = num('sav-annual-increase', 0) / 100;
    const monthlyContribBase = num('sav-monthly', 0);
    const monthlyInc = num('sav-monthly-increase', 0) / 100;
    const ratePct = num('sav-rate', 0);
    const compoundKey = el('sav-compound').value;
    const years = Math.round(num('sav-years', 0));
    const taxPct = num('sav-tax', 0);

    if (years <= 0) {
      el('sav-result').innerHTML = '<p class="tool-result is-error">Enter the number of years to save.</p>';
      return;
    }

    const monthlyRate = periodicMonthlyRate(ratePct, compoundKey);

    let balance = initialDeposit;
    let totalContrib = 0, totalInterest = 0;
    const yearRows = [];

    for (let y = 1; y <= years; y++) {
      const annualContribYear = annualContribBase * Math.pow(1 + annualInc, y - 1);
      const monthlyContribYear = monthlyContribBase * Math.pow(1 + monthlyInc, y - 1);
      let yearDeposit = (y === 1 ? initialDeposit : 0);
      let yearInterest = 0;

      for (let m = 1; m <= 12; m++) {
        balance += monthlyContribYear;
        yearDeposit += monthlyContribYear;
        const grossInterest = balance * monthlyRate;
        const netInterest = grossInterest * (1 - taxPct / 100);
        balance += netInterest;
        yearInterest += netInterest;
        if (m === 12) {
          balance += annualContribYear;
          yearDeposit += annualContribYear;
        }
      }

      totalContrib += yearDeposit - (y === 1 ? initialDeposit : 0);
      totalInterest += yearInterest;
      yearRows.push({ year: y, deposit: yearDeposit, interest: yearInterest, balance });
    }

    const endBalance = balance;

    el('sav-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">End Balance</div>
        <div class="value">${currency(endBalance)}</div>
      </div>
      <div class="stat-row"><span>Initial Deposit</span><strong>${currency0(initialDeposit)}</strong></div>
      <div class="stat-row"><span>Total Contributions</span><strong>${currency0(totalContrib)}</strong></div>
      <div class="stat-row"><span>Total Interest Earned</span><strong>${currency0(totalInterest)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: initialDeposit, color: 'var(--accent)', label: 'Initial Deposit' }, { value: totalContrib, color: '#f59e0b', label: 'Contributions' }, { value: totalInterest, color: '#10b981', label: 'Interest' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Initial Deposit</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Contributions</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Year</th><th>Deposit</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
    yearRows.forEach((r) => { tableHtml += `<tr><td>${r.year}</td><td>${currency(r.deposit)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`; });
    tableHtml += '</tbody></table>';
    el('sav-table-wrap').innerHTML = tableHtml;
    el('sav-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
