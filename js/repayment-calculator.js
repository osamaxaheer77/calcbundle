'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rp-form');
  if (!form) return;

  const GREEN = '#10b981';
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Times per year. A year counts as 365.25 days for daily interest and daily payments.
  const COMPOUND = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365.25 };
  const PAYBACK = {
    daily: { p: 365.25, word: 'day' }, weekly: { p: 52, word: 'week' }, biweekly: { p: 26, word: '2 weeks' }, halfmonth: { p: 24, word: 'half month' },
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
    el('rp-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('rp-results-section').hidden = true;
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

  // Pay `payment` at the end of each period until the balance is gone; the last payment is what remains plus interest.
  function schedule(amount, i, payment, nPeriods) {
    const rows = [];
    let bal = amount;
    const limit = Math.ceil(nPeriods - 1e-9) + 1;
    for (let k = 1; k <= limit && bal > 0.005; k++) {
      const interest = bal * i;
      let pay = payment;
      if (bal + interest <= payment + 0.005 || k >= limit) pay = bal + interest;
      const end = bal + interest - pay;
      rows.push({ k, begin: bal, interest, principal: pay - interest, pay, end: end < 0.005 ? 0 : end });
      bal = end < 0.005 ? 0 : end;
    }
    return rows;
  }

  const yearsMonths = (periods, p) => {
    const totalMonths = (periods / p) * 12;
    const y = Math.floor(totalMonths / 12 + 1e-9);
    const m = totalMonths - y * 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    if (m > 0.04 || !y) parts.push(`${m.toFixed(1)} months`);
    return parts.join(' and ');
  };

  function calculate() {
    const amount = num('rp-amount'), rate = num('rp-rate');
    const compKey = el('rp-compound').value;
    const pb = PAYBACK[el('rp-payback').value];
    const way = form.querySelector('input[name="rp-way"]:checked').value;
    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the loan balance.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');

    const p = pb.p, r = rate / 100, c = COMPOUND[compKey];
    const i = compKey === 'continuously' ? Math.exp(r / p) - 1 : Math.pow(1 + r / c, c / p) - 1;
    let payment, n;
    if (way === 't') {
      const years = num('rp-years'), months = num('rp-months');
      if (!Number.isFinite(years) || !Number.isFinite(months) || years < 0 || months < 0) return showError('Enter the repayment time in years and months.');
      const term = years + months / 12;
      if (term <= 0 || term > 100) return showError('Enter a repayment time between 1 month and 100 years.');
      n = term * p;
      payment = i === 0 ? amount / n : (amount * i) / (1 - Math.pow(1 + i, -n));
    } else {
      payment = num('rp-installment');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the installment you want to pay.');
      if (payment <= amount * i + 1e-9) return showError(`An installment of ${money(payment)} every ${pb.word} does not cover the interest, so the loan would never be paid off. Pay more than ${money(amount * i)}.`);
      n = i === 0 ? amount / payment : Math.log(payment / (payment - amount * i)) / Math.log(1 + i);
      if (n / p > 200) return showError('At that installment the loan would take more than 200 years to pay off. Try a larger installment.');
    }
    const rows = schedule(amount, i, payment, n);
    const total = rows.reduce((s, x) => s + x.pay, 0);
    const interest = total - amount;
    sim = { rows, p };

    const stat = (l, v, col) => `<div class="stat-row"><span>${l}</span><strong${col ? ` style="color:${col}"` : ''}>${v}</strong></div>`;
    el('rp-result').innerHTML =
      (way === 't'
        ? `<div class="summary-payment-box"><div class="label">Pay back every ${pb.word}</div><div class="value">${money(payment)}</div><div class="label" style="margin-top:6px;">${rows.length.toLocaleString('en-US')} payments over ${yearsMonths(n, p)}</div></div>`
        : `<div class="summary-payment-box"><div class="label">Paid off in</div><div class="value">${yearsMonths(n, p)}</div><div class="label" style="margin-top:6px;">By paying ${money(payment)} every ${pb.word}</div></div>`) +
      stat(`Total of ${rows.length.toLocaleString('en-US')} loan payments`, money(total)) +
      stat('Loan balance', money(amount)) +
      stat('Interest', money(interest), GREEN) +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: amount, color: 'var(--accent)' }, { value: interest, color: GREEN }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;
    renderSchedule();
    el('rp-results-section').hidden = false;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'each') {
      html = '<table class="schedule-table"><thead><tr><th>Payment</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => { html += `<tr><td>${r.k}</td><td>${money(r.begin)}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Balance</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      const years = Math.ceil(sim.rows.length / sim.p - 1e-9);
      for (let y = 1; y <= years; y++) {
        const part = sim.rows.filter((r) => Math.ceil(r.k / sim.p - 1e-9) === y);
        if (!part.length) continue;
        html += `<tr><td>${y}</td><td>${money(part[0].begin)}</td><td>${money(part.reduce((s, r) => s + r.interest, 0))}</td><td>${money(part.reduce((s, r) => s + r.principal, 0))}</td><td>${money(part[part.length - 1].end)}</td></tr>`;
      }
    }
    el('rp-table-wrap').innerHTML = html + '</tbody></table>';
  }

  function applyWay() {
    const way = form.querySelector('input[name="rp-way"]:checked').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = n.dataset.modes !== way; });
  }

  function setView(v) {
    view = v;
    el('rp-toggle-year').classList.toggle('active', v === 'year');
    el('rp-toggle-each').classList.toggle('active', v === 'each');
    renderSchedule();
  }

  form.querySelectorAll('input[name="rp-way"]').forEach((n) => n.addEventListener('change', () => { applyWay(); calculate(); }));
  el('rp-toggle-year').addEventListener('click', () => setView('year'));
  el('rp-toggle-each').addEventListener('click', () => setView('each'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyWay();
  calculate();
})();
