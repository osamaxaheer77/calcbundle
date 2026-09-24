'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mf-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function monthlyRateFromAnnual(ratePct) {
    return Math.pow(1 + ratePct / 100, 1 / 12) - 1;
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

  function solveMonthlyIRR(flows) {
    function npv(r) {
      return flows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i), 0);
    }
    let lo = -0.5, hi = 1;
    const decreasing = npv(lo) > npv(hi);
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if ((npv(mid) > 0) === decreasing) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function calculate() {
    const initial = num('mf-initial', 0);
    const annualAdd = num('mf-annual', 0);
    const monthlyAdd = num('mf-monthly', 0);
    const returnRatePct = num('mf-return', 0);
    const years = num('mf-years', 0);
    const monthsExtra = num('mf-months', 0);
    const salesChargePct = num('mf-sales-charge', 0);
    const deferChargePct = num('mf-defer-charge', 0);
    const operatingCostPct = num('mf-operating', 0);

    const totalMonths = Math.round(years * 12 + monthsExtra);
    if (totalMonths <= 0) {
      el('mf-result').innerHTML = '<p class="tool-result is-error">Enter a holding length.</p>';
      return;
    }

    const netMonthlyRate = monthlyRateFromAnnual(returnRatePct - operatingCostPct);
    const expenseMonthlyRate = monthlyRateFromAnnual(operatingCostPct);

    let balance = initial * (1 - salesChargePct / 100);
    let salesChargePaid = initial * salesChargePct / 100;
    let totalContributions = 0;
    let totalOperatingExpense = 0;
    const cashFlows = [-initial];

    for (let m = 1; m <= totalMonths; m++) {
      balance += balance * netMonthlyRate;
      totalOperatingExpense += balance * expenseMonthlyRate;

      const netContribMonthly = monthlyAdd * (1 - salesChargePct / 100);
      balance += netContribMonthly;
      salesChargePaid += monthlyAdd * salesChargePct / 100;
      totalContributions += monthlyAdd;
      cashFlows.push(-monthlyAdd);

      if (m % 12 === 0) {
        const netAnnual = annualAdd * (1 - salesChargePct / 100);
        balance += netAnnual;
        salesChargePaid += annualAdd * salesChargePct / 100;
        totalContributions += annualAdd;
        cashFlows[cashFlows.length - 1] -= annualAdd;
      }
    }

    const deferredCharge = balance * deferChargePct / 100;
    balance -= deferredCharge;

    cashFlows[cashFlows.length - 1] += balance;

    const totalPrincipal = initial + totalContributions;
    const netReturn = balance - totalPrincipal;
    const totalCharges = salesChargePaid + totalOperatingExpense + deferredCharge;

    const monthlyIRR = solveMonthlyIRR(cashFlows);
    const annualIRR = (Math.pow(1 + monthlyIRR, 12) - 1) * 100;

    el('mf-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Ending Value</div>
        <div class="value">${currency(balance)}</div>
      </div>
      <div class="stat-row"><span>Total Principal</span><strong>${currency(totalPrincipal)}</strong></div>
      <div class="stat-row"><span>Total Contributions</span><strong>${currency(totalContributions)}</strong></div>
      <div class="stat-row"><span>Net Return</span><strong>${currency(netReturn)}</strong></div>
      <div class="stat-row"><span>Net IRR</span><strong>${annualIRR.toFixed(3)}% per year</strong></div>
      <div class="stat-row"><span>Sales Charge</span><strong>${currency(salesChargePaid)}</strong></div>
      ${deferredCharge > 0 ? `<div class="stat-row"><span>Deferred Sales Charge</span><strong>${currency(deferredCharge)}</strong></div>` : ''}
      <div class="stat-row"><span>Operating Expenses</span><strong>${currency(totalOperatingExpense)}</strong></div>
      <div class="stat-row"><span>Total Charges and Fees</span><strong>${currency(totalCharges)}</strong></div>
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: initial, color: 'var(--accent)', label: 'Initial Investment' }, { value: totalContributions, color: '#f59e0b', label: 'Contributions' }, { value: totalCharges, color: '#dc2626', label: 'Fees and Charges' }, { value: netReturn, color: '#10b981', label: 'Net Return' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Initial Investment</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Contributions</span>
          <span class="legend-item"><span class="legend-dot" style="background:#dc2626"></span>Fees and Charges</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Net Return</span>
        </div>
      </div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
