'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ln-form');
  if (!form) return;

  const GREEN = '#10b981';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Times per year. A year is counted as 365.25 days for daily interest and daily payments.
  const COMPOUND = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365.25 };
  const PAYBACK = {
    daily: { p: 365.25, word: 'Day', plural: 'days' }, weekly: { p: 52, word: 'Week', plural: 'weeks' }, biweekly: { p: 26, word: 'Two Weeks', plural: 'two-week periods' },
    halfmonth: { p: 24, word: 'Half Month', plural: 'half-months' }, month: { p: 12, word: 'Month', plural: 'months' }, quarter: { p: 4, word: 'Quarter', plural: 'quarters' },
    halfyear: { p: 2, word: '6 Months', plural: 'half-years' }, year: { p: 1, word: 'Year', plural: 'years' },
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
    el('ln-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('ln-results-section').hidden = true;
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

  // Growth factor over one year for the chosen compounding.
  function yearFactor(ratePct, compoundKey) {
    const r = ratePct / 100;
    return compoundKey === 'continuously' ? Math.exp(r) : Math.pow(1 + r / COMPOUND[compoundKey], COMPOUND[compoundKey]);
  }

  function readTerm(yearsId, monthsId) {
    const y = num(yearsId), m = num(monthsId);
    if (!Number.isFinite(y) || !Number.isFinite(m) || y < 0 || m < 0) return NaN;
    return y + m / 12;
  }

  const yearsText = (t) => { const v = Math.round(t * 100) / 100; return `${v} ${v === 1 ? 'year' : 'years'}`; };
  const summary = (label, value, sub) =>
    `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const stat = (l, v, c) => `<div class="stat-row"><span>${l}</span><strong${c ? ` style="color:${c}"` : ''}>${v}</strong></div>`;
  const donut = (principal, interest, pLabel) =>
    `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: principal, color: 'var(--accent)' }, { value: interest, color: GREEN }])}` +
    `<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>${pLabel}</span>` +
    `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;

  // ---------- Mode 1: amortized loan ----------
  function calcAmortized() {
    const amount = num('ln-amount');
    const term = readTerm('ln-years', 'ln-months');
    const rate = num('ln-rate');
    const compKey = el('ln-compound').value;
    const pb = PAYBACK[el('ln-payback').value];
    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the loan amount.');
    if (!Number.isFinite(term) || term <= 0 || term > 100) return showError('Enter a loan term between 1 month and 100 years.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');

    const p = pb.p;
    const nPay = term * p;
    const r = rate / 100;
    const i = compKey === 'continuously' ? Math.exp(r / p) - 1 : Math.pow(1 + r / COMPOUND[compKey], COMPOUND[compKey] / p) - 1;
    const payment = i === 0 ? amount / nPay : (amount * i) / (1 - Math.pow(1 + i, -nPay));

    const rows = [];
    let bal = amount;
    const full = Math.floor(nPay + 1e-9);
    for (let k = 1; k <= full; k++) {
      const interest = bal * i;
      let principal = payment - interest;
      if (k === full && nPay - full < 1e-4) principal = bal;
      const end = bal - principal;
      rows.push({ k, begin: bal, interest, principal, pay: principal + interest, end: Math.abs(end) < 0.005 ? 0 : end });
      bal = Math.abs(end) < 0.005 ? 0 : end;
    }
    const frac = nPay - full;
    if (frac > 1e-4 && bal > 0.005) {
      // The term does not divide evenly into payments, so the last payment is smaller.
      const interest = bal * (Math.pow(1 + i, frac) - 1);
      rows.push({ k: full + 1, begin: bal, interest, principal: bal, pay: bal + interest, end: 0, partial: true });
    }
    const total = rows.reduce((s, x) => s + x.pay, 0);
    const interestTotal = total - amount;

    sim = { rows, p, kind: 'amortized' };
    el('ln-result').innerHTML =
      summary(`Payment Every ${pb.word}`, money(payment), `${rows.length.toLocaleString('en-US')} payments over ${yearsText(term)}`) +
      stat(`Total of ${rows.length.toLocaleString('en-US')} payments`, money(total)) +
      stat('Total interest', money(interestTotal), GREEN) +
      donut(amount, interestTotal, 'Principal') +
      (frac > 1e-4 ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The term is not a whole number of payments, so the final payment is smaller than the others.</p>' : '');
    el('ln-schedule-title').textContent = 'Amortization Schedule';
    el('ln-toggle').style.display = '';
    el('ln-toggle-year').textContent = 'By year';
    el('ln-toggle-each').textContent = 'Each payment';
    renderSchedule();
    el('ln-results-section').hidden = false;
  }

  function renderSchedule() {
    if (!sim) return;
    const head = (first) => `<table class="schedule-table"><thead><tr><th>${first}</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>`;
    let html;
    if (sim.kind === 'amortized') {
      if (view === 'each') {
        html = head('Payment');
        sim.rows.forEach((r) => {
          html += `<tr><td>${r.k}${r.partial ? ' (last)' : ''}</td><td>${money(r.begin)}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`;
        });
      } else {
        html = head('Year');
        const years = Math.ceil(sim.rows.length / sim.p - 1e-9);
        for (let y = 1; y <= years; y++) {
          const part = sim.rows.filter((r) => Math.ceil(r.k / sim.p - 1e-9) === y);
          if (!part.length) continue;
          html += `<tr><td>${y}</td><td>${money(part[0].begin)}</td><td>${money(part.reduce((s, r) => s + r.interest, 0))}</td><td>${money(part.reduce((s, r) => s + r.principal, 0))}</td><td>${money(part[part.length - 1].end)}</td></tr>`;
        }
      }
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Balance</th><th>Interest</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => { html += `<tr><td>${r.label}</td><td>${money(r.begin)}</td><td>${money(r.interest)}</td><td>${money(r.end)}</td></tr>`; });
    }
    el('ln-table-wrap').innerHTML = html + '</tbody></table>';
  }

  // Year-by-year growth of a single lump sum, with a part-year row at the end.
  function growthRows(start, factor, term) {
    const rows = [];
    let bal = start;
    const whole = Math.floor(term + 1e-9);
    for (let y = 1; y <= whole; y++) { const end = bal * factor; rows.push({ label: y, begin: bal, interest: end - bal, end }); bal = end; }
    const frac = term - whole;
    if (frac > 1e-4) { const end = bal * Math.pow(factor, frac); rows.push({ label: `${whole + 1} (partial)`, begin: bal, interest: end - bal, end }); }
    return rows;
  }

  // ---------- Mode 2: deferred payment loan ----------
  function calcDeferred() {
    const amount = num('ln-amount');
    const term = readTerm('ln-years', 'ln-months');
    const rate = num('ln-rate');
    const compKey = el('ln-compound').value;
    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the loan amount.');
    if (!Number.isFinite(term) || term <= 0 || term > 100) return showError('Enter a loan term between 1 month and 100 years.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    const factor = yearFactor(rate, compKey);
    const due = amount * Math.pow(factor, term);
    sim = { rows: growthRows(amount, factor, term), kind: 'deferred' };
    el('ln-result').innerHTML =
      summary('Amount Due at Loan Maturity', money(due), `After ${yearsText(term)}, with nothing paid until then`) +
      stat('Loan amount', money(amount)) +
      stat('Total interest', money(due - amount), GREEN) +
      donut(amount, due - amount, 'Principal');
    el('ln-schedule-title').textContent = 'Growth Schedule';
    el('ln-toggle').style.display = 'none';
    renderSchedule();
    el('ln-results-section').hidden = false;
  }

  // ---------- Mode 3: bond ----------
  function calcBond() {
    const face = num('ln-amount');
    const term = readTerm('ln-years', 'ln-months');
    const rate = num('ln-rate');
    const compKey = el('ln-compound').value;
    if (!Number.isFinite(face) || face <= 0) return showError('Enter the amount due at maturity.');
    if (!Number.isFinite(term) || term <= 0 || term > 100) return showError('Enter a term between 1 month and 100 years.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    const factor = yearFactor(rate, compKey);
    const start = face / Math.pow(factor, term);
    sim = { rows: growthRows(start, factor, term), kind: 'bond' };
    el('ln-result').innerHTML =
      summary('Amount Received When the Loan Starts', money(start), `To owe ${money(face)} after ${yearsText(term)}`) +
      stat('Amount due at maturity', money(face)) +
      stat('Total interest', money(face - start), GREEN) +
      donut(start, face - start, 'Amount received');
    el('ln-schedule-title').textContent = 'Growth Schedule';
    el('ln-toggle').style.display = 'none';
    renderSchedule();
    el('ln-results-section').hidden = false;
  }

  function applyMode() {
    const mode = el('ln-mode').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = !n.dataset.modes.split(' ').includes(mode); });
    el('ln-amount-label').textContent = mode === '3' ? 'Predetermined Due Amount ($)' : 'Loan Amount ($)';
  }

  function calculate() {
    const mode = el('ln-mode').value;
    if (mode === '1') calcAmortized(); else if (mode === '2') calcDeferred(); else calcBond();
  }

  function setView(v) {
    view = v;
    el('ln-toggle-year').classList.toggle('active', v === 'year');
    el('ln-toggle-each').classList.toggle('active', v === 'each');
    renderSchedule();
  }

  el('ln-mode').addEventListener('change', () => {
    el('ln-compound').value = el('ln-mode').value === '1' ? 'monthly' : 'annually';
    applyMode();
    calculate();
  });
  el('ln-toggle-year').addEventListener('click', () => setView('year'));
  el('ln-toggle-each').addEventListener('click', () => setView('each'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
