'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('int-form');
  if (!form) return;

  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  const COMPOUND_N = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365 };

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
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

  function simulate(initial, annualContrib, monthlyContrib, due, monthlyRate, taxPct, totalMonths) {
    let balance = initial;
    const months = [];
    for (let m = 1; m <= totalMonths; m++) {
      let deposit = monthlyContrib;
      if (due && m % 12 === 1) deposit += annualContrib;
      if (!due && m % 12 === 0) deposit += annualContrib;

      let interest;
      if (due) {
        balance += deposit;
        interest = balance * monthlyRate * (1 - taxPct / 100);
        balance += interest;
      } else {
        interest = balance * monthlyRate * (1 - taxPct / 100);
        balance += interest + deposit;
      }
      const displayDeposit = m === 1 ? deposit + initial : deposit;
      months.push({ month: m, deposit, displayDeposit, interest, balance });
    }
    return months;
  }

  function toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || i % 12 === 0) { bucket = { year: years.length + 1, deposit: 0, interest: 0, balance: 0 }; years.push(bucket); }
      bucket.deposit += m.displayDeposit;
      bucket.interest += m.interest;
      bucket.balance = m.balance;
    });
    return years;
  }

  let lastMonths = null;
  let scheduleView = 'annual';

  function renderSchedule() {
    let html;
    if (scheduleView === 'annual') {
      const rows = toAnnualSchedule(lastMonths);
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Deposit</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => { html += `<tr><td>${r.year}</td><td>${currency(r.deposit)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`; });
      html += '</tbody></table>';
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Deposit</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
      lastMonths.forEach((m) => {
        html += `<tr><td>${m.month}</td><td>${currency(m.displayDeposit)}</td><td>${currency(m.interest)}</td><td>${currency(m.balance)}</td></tr>`;
        if (m.month % 12 === 0) html += `<tr><td colspan="4" style="text-align:center;font-size:12px;color:var(--text-muted, #888);">End of year ${m.month / 12}</td></tr>`;
      });
      html += '</tbody></table>';
    }
    el('int-table-wrap').innerHTML = html;
  }

  function calculate() {
    const initial = num('int-initial', 0);
    const annualContrib = num('int-annual', 0);
    const monthlyContrib = num('int-monthly', 0);
    const due = form.querySelector('input[name="int-timing"]:checked').value === 'beginning';
    const ratePct = num('int-rate', 0);
    const compoundKey = el('int-compound').value;
    const years = Math.round(num('int-years', 0));
    const extraMonths = Math.round(num('int-months', 0));
    const taxPct = num('int-tax', 0);
    const inflationPct = num('int-inflation', 0);

    const totalMonths = years * 12 + extraMonths;
    if (totalMonths <= 0) {
      el('int-result').innerHTML = '<p class="tool-result is-error">Enter an investment length.</p>';
      return;
    }

    const monthlyRate = periodicMonthlyRate(ratePct, compoundKey);
    const months = simulate(initial, annualContrib, monthlyContrib, due, monthlyRate, taxPct, totalMonths);

    const endBalance = months[months.length - 1].balance;
    const totalContrib = months.reduce((s, m) => s + m.deposit, 0);
    const totalInterest = months.reduce((s, m) => s + m.interest, 0);
    const totalPrincipal = initial + totalContrib;

    const initialOnlyMonths = simulate(initial, 0, 0, due, monthlyRate, taxPct, totalMonths);
    const interestOfInitial = initialOnlyMonths[initialOnlyMonths.length - 1].balance - initial;
    const interestOfContrib = totalInterest - interestOfInitial;

    const buyingPower = endBalance / Math.pow(1 + inflationPct / 100, totalMonths / 12);

    el('int-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Ending Balance</div>
        <div class="value">${currency(endBalance)}</div>
      </div>
      <div class="stat-row"><span>Total Principal</span><strong>${currency0(totalPrincipal)}</strong></div>
      <div class="stat-row"><span>Total Contributions</span><strong>${currency0(totalContrib)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(totalInterest)}</strong></div>
      <div class="stat-row"><span>Interest of Initial Investment</span><strong>${currency(interestOfInitial)}</strong></div>
      <div class="stat-row"><span>Interest of the Contributions</span><strong>${currency(interestOfContrib)}</strong></div>
      ${inflationPct > 0 ? `<div class="stat-row"><span>Buying Power After Inflation</span><strong>${currency(buyingPower)}</strong></div>` : ''}
      <div class="donut-wrap" style="margin-top:16px;">
        ${donutChart([{ value: initial, color: 'var(--accent)' }, { value: totalContrib, color: '#f59e0b' }, { value: Math.max(totalInterest, 0), color: '#10b981' }])}
        <div class="donut-legend">
          <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Initial investment</span>
          <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Contributions</span>
          <span class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Interest</span>
        </div>
      </div>
    `;

    lastMonths = months;
    renderSchedule();
    el('int-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  el('int-schedule-annual').addEventListener('click', () => {
    scheduleView = 'annual';
    el('int-schedule-annual').classList.add('active');
    el('int-schedule-monthly').classList.remove('active');
    if (lastMonths) renderSchedule();
  });
  el('int-schedule-monthly').addEventListener('click', () => {
    scheduleView = 'monthly';
    el('int-schedule-monthly').classList.add('active');
    el('int-schedule-annual').classList.remove('active');
    if (lastMonths) renderSchedule();
  });

  calculate();
})();
