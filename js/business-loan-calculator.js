'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('bl-form');
  if (!form) return;

  const GREEN = '#10b981';
  const AMBER = '#f59e0b';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Times per year. A year counts as 365.25 days for daily interest and daily payments.
  const COMPOUND = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365.25 };
  const COMPOUND_WORD = { semiannually: 'semi-annually', quarterly: 'quarterly', semimonthly: 'semi-monthly', biweekly: 'biweekly', weekly: 'weekly', daily: 'daily', continuously: 'continuously' };
  const PAYBACK = {
    daily: { p: 365.25, word: 'day' }, weekly: { p: 52, word: 'week' }, biweekly: { p: 26, word: 'two weeks' }, halfmonth: { p: 24, word: 'half month' },
    month: { p: 12, word: 'month' }, quarter: { p: 4, word: 'quarter' }, halfyear: { p: 2, word: '6 months' }, year: { p: 1, word: 'year' },
  };

  let sim = null;
  let view = 'year';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('bl-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('bl-results-section').hidden = true;
    sim = null;
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

  // Solve for the periodic rate j at which `cash` today equals `pay` per period for n periods plus a
  // final lump sum `lump` after n periods.
  function periodicIrr(cash, pay, n, lump) {
    const value = (j) => (j === 0 ? pay * n + lump : (pay * (1 - Math.pow(1 + j, -n))) / j + lump * Math.pow(1 + j, -n));
    if (value(0) <= cash) return 0;
    let lo = 0, hi = 1;
    while (value(hi) > cash && hi < 1e6) hi *= 2;
    for (let k = 0; k < 300; k++) { const m = (lo + hi) / 2; if (value(m) > cash) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  // Turn a periodic rate into the "real rate" quoted on the loan's own compounding basis.
  function realRate(j, perYear, compKey) {
    const effective = Math.pow(1 + j, perYear) - 1;
    if (compKey === 'continuously') return effective * 100;
    const c = COMPOUND[compKey];
    return c * (Math.pow(1 + effective, 1 / c) - 1) * 100;
  }
  const rateLabel = (compKey) => (compKey === 'annually' ? 'Real rate (APY)' : compKey === 'monthly' ? 'Real rate (APR)' : `Real rate, compound ${COMPOUND_WORD[compKey]}`);

  function calculate() {
    const amount = num('bl-amount'), rate = num('bl-rate');
    const compKey = el('bl-compound').value;
    const years = num('bl-years'), months = num('bl-months');
    const mode = el('bl-payback').value;
    const origPct = num('bl-orig'), docFee = num('bl-doc'), otherFee = num('bl-other');

    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the loan amount.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the loan term in years and months.');
    const term = years + months / 12;
    if (term <= 0 || term > 50) return showError('Enter a loan term between 1 month and 50 years.');
    if ([origPct, docFee, otherFee].some((v) => !Number.isFinite(v) || v < 0)) return showError('Enter the fees as numbers, 0 or more.');
    if (origPct > 100) return showError('The origination fee cannot be more than 100% of the loan.');

    const orig = (amount * origPct) / 100;
    const fees = orig + docFee + otherFee;
    if (fees >= amount) return showError('The fees must be less than the loan amount.');
    const cash = amount - fees;
    const r = rate / 100;
    const c = COMPOUND[compKey];
    const yearGrowth = compKey === 'continuously' ? Math.exp(r) : Math.pow(1 + r / c, c);
    const stat = (l, v, col) => `<div class="stat-row"><span>${l}</span><strong${col ? ` style="color:${col}"` : ''}>${v}</strong></div>`;
    const summary = (label, value, sub) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
    const donut = (principal, interest) =>
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: principal, color: 'var(--accent)' }, { value: interest, color: GREEN }, { value: fees, color: AMBER }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span>` +
      (fees > 0 ? `<span class="legend-item"><span class="legend-dot" style="background:${AMBER}"></span>Fees</span>` : '') + '</div></div>';
    const feeRows = (interest) => stat('Interest', money(interest), GREEN) + (fees > 0 ? stat('Fees', money(fees)) + stat('Interest + fees', money(interest + fees)) : '');

    if (mode === 'end') {
      const due = amount * Math.pow(yearGrowth, term);
      const interest = due - amount;
      const j = Math.pow(due / cash, 1 / (term * 12)) - 1;
      sim = { kind: 'end', rows: growthRows(amount, yearGrowth, term) };
      el('bl-result').innerHTML =
        summary('Pay back at maturity', money(due), `One payment after ${yearsText(term)}`) +
        feeRows(interest) +
        (fees > 0 ? stat(rateLabel(compKey), realRate(j, 12, compKey).toFixed(3) + '%') : '') + donut(amount, interest);
      el('bl-schedule-title').textContent = 'Growth Schedule';
      el('bl-toggle').style.display = 'none';
      renderSchedule();
      el('bl-results-section').hidden = false;
      return;
    }

    if (mode === 'interest') {
      const i = compKey === 'continuously' ? Math.exp(r / 12) - 1 : Math.pow(1 + r / c, c / 12) - 1;
      const pay = amount * i;
      const n = term * 12;
      const interest = pay * n;
      const j = periodicIrr(cash, pay, n, amount);
      sim = null;
      el('bl-result').innerHTML =
        summary('Interest every month', money(pay), `Then repay ${money(amount)} at the end of the loan`) +
        feeRows(interest) +
        (fees > 0 ? stat(rateLabel(compKey), realRate(j, 12, compKey).toFixed(3) + '%') : '') + donut(amount, interest);
      el('bl-results-section').hidden = true;
      return;
    }

    const pb = PAYBACK[mode];
    const p = pb.p;
    const n = term * p;
    const i = compKey === 'continuously' ? Math.exp(r / p) - 1 : Math.pow(1 + r / c, c / p) - 1;
    const payment = i === 0 ? amount / n : (amount * i) / (1 - Math.pow(1 + i, -n));
    const rows = [];
    let bal = amount;
    const full = Math.floor(n + 1e-9);
    for (let k = 1; k <= full; k++) {
      const interest = bal * i;
      let principal = payment - interest;
      if (k === full && n - full < 1e-4) principal = bal;
      const end = bal - principal;
      rows.push({ k, begin: bal, interest, principal, pay: principal + interest, end: Math.abs(end) < 0.005 ? 0 : end });
      bal = Math.abs(end) < 0.005 ? 0 : end;
    }
    if (n - full > 1e-4 && bal > 0.005) {
      const interest = bal * (Math.pow(1 + i, n - full) - 1);
      rows.push({ k: full + 1, begin: bal, interest, principal: bal, pay: bal + interest, end: 0, last: true });
    }
    const total = rows.reduce((s, x) => s + x.pay, 0);
    const interestTotal = total - amount;
    const j = periodicIrr(cash, payment, n, 0);
    sim = { kind: 'amortized', rows, p };
    el('bl-result').innerHTML =
      summary(`Payback every ${pb.word}`, money(payment), `${rows.length.toLocaleString('en-US')} payments over ${yearsText(term)}`) +
      stat(`Total of ${rows.length.toLocaleString('en-US')} loan payments`, money(total)) +
      feeRows(interestTotal) +
      (fees > 0 ? stat(rateLabel(compKey), realRate(j, p, compKey).toFixed(3) + '%') : '') + donut(amount, interestTotal);
    el('bl-schedule-title').textContent = 'Amortization Schedule';
    el('bl-toggle').style.display = '';
    renderSchedule();
    el('bl-results-section').hidden = false;
  }

  const yearsText = (t) => { const v = Math.round(t * 100) / 100; return `${v} ${v === 1 ? 'year' : 'years'}`; };

  function growthRows(start, factor, term) {
    const rows = [];
    let bal = start;
    const whole = Math.floor(term + 1e-9);
    for (let y = 1; y <= whole; y++) { const end = bal * factor; rows.push({ label: y, begin: bal, interest: end - bal, end }); bal = end; }
    const frac = term - whole;
    if (frac > 1e-4) { const end = bal * Math.pow(factor, frac); rows.push({ label: `${whole + 1} (partial)`, begin: bal, interest: end - bal, end }); }
    return rows;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (sim.kind === 'end') {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Balance</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => { html += `<tr><td>${r.label}</td><td>${money(r.begin)}</td><td>${money(r.interest)}</td><td>${money(r.end)}</td></tr>`; });
    } else if (view === 'each') {
      html = '<table class="schedule-table"><thead><tr><th>Payment</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => { html += `<tr><td>${r.k}${r.last ? ' (last)' : ''}</td><td>${money(r.begin)}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      const years = Math.ceil(sim.rows.length / sim.p - 1e-9);
      for (let y = 1; y <= years; y++) {
        const part = sim.rows.filter((r) => Math.ceil(r.k / sim.p - 1e-9) === y);
        if (!part.length) continue;
        html += `<tr><td>${y}</td><td>${money(part[0].begin)}</td><td>${money(part.reduce((s, r) => s + r.interest, 0))}</td><td>${money(part.reduce((s, r) => s + r.principal, 0))}</td><td>${money(part[part.length - 1].end)}</td></tr>`;
      }
    }
    el('bl-table-wrap').innerHTML = html + '</tbody></table>';
  }

  function setView(v) {
    view = v;
    el('bl-toggle-year').classList.toggle('active', v === 'year');
    el('bl-toggle-each').classList.toggle('active', v === 'each');
    renderSchedule();
  }

  el('bl-toggle-year').addEventListener('click', () => setView('year'));
  el('bl-toggle-each').addEventListener('click', () => setView('each'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
