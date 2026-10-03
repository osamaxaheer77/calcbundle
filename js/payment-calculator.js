'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pm-form');
  if (!form) return;

  const GREEN = '#10b981';
  const MAX_MONTHS = 1200;
  const money = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let sim = null;
  let view = 'annual';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('pm-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('pm-results-section').hidden = true;
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

  // Pay `payment` at the end of each month. The last payment is whatever remains plus its interest.
  function schedule(principal, monthlyRate, payment) {
    const rows = [];
    let bal = principal;
    for (let k = 1; k <= MAX_MONTHS + 1 && bal > 0.005; k++) {
      const interest = bal * monthlyRate;
      let pay = payment;
      if (bal + interest <= payment + 0.005) pay = bal + interest;
      const end = bal + interest - pay;
      rows.push({ k, begin: bal, interest, principal: pay - interest, pay, end: end < 0.005 ? 0 : end });
      bal = end < 0.005 ? 0 : end;
    }
    return rows;
  }

  function toYears(rows) {
    const out = [];
    for (let y = 0; y * 12 < rows.length; y++) {
      const part = rows.slice(y * 12, y * 12 + 12);
      out.push({
        year: y + 1,
        interest: part.reduce((s, r) => s + r.interest, 0),
        principal: part.reduce((s, r) => s + r.principal, 0),
        end: part[part.length - 1].end,
      });
    }
    return out;
  }

  function lineChart(annual, principal) {
    const W = 480, H = 240, pl = 58, pr = 12, pt = 12, pb = 40;
    const pts = [{ x: 0, bal: principal, int: 0, paid: 0 }];
    let cumInt = 0, cumPaid = 0;
    annual.forEach((r) => { cumInt += r.interest; cumPaid += r.interest + r.principal; pts.push({ x: r.year, bal: r.end, int: cumInt, paid: cumPaid }); });
    const maxX = pts[pts.length - 1].x || 1;
    const maxV = Math.max(1, ...pts.map((p) => Math.max(p.bal, p.int, p.paid)));
    const x = (v) => pl + (v / maxX) * (W - pl - pr);
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    const path = (key) => pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    const short = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K');
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const v = (maxV / 4) * g;
      grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>${short(v)}</text>`;
    }
    const step = Math.max(1, Math.ceil(maxX / 8));
    let ticks = '';
    for (let t = 0; t <= maxX; t += step) ticks += `<text x="${x(t)}" y="${H - 22}" text-anchor="middle" ${txt}>${t}</text>`;
    const dot = (color) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`;
    const legend = '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">' +
      `<span>${dot('var(--accent)')}Balance</span><span>${dot(GREEN)}Interest paid so far</span><span>${dot('#f59e0b')}Total paid so far</span></div>`;
    return '<div style="max-width:640px;margin:0 auto;">' + legend +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Loan balance, interest and payments by year">${grid}` +
      `<path d="${path('paid')}" fill="none" stroke="#f59e0b" stroke-width="2.5"></path><path d="${path('int')}" fill="none" stroke="${GREEN}" stroke-width="2.5"></path><path d="${path('bal')}" fill="none" stroke="var(--accent)" stroke-width="2.5"></path>${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Year</text></svg></div>`;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'annual') {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.annual.forEach((r) => { html += `<tr><td>${r.year}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => {
        html += `<tr><td>${r.k}</td><td>${money(r.interest)}</td><td>${money(r.principal)}</td><td>${money(r.end)}</td></tr>`;
        if (r.k % 12 === 0 && r.k < sim.rows.length) html += `<tr><td colspan="4" style="text-align:center;font-weight:600;">End of year ${r.k / 12}</td></tr>`;
      });
    }
    el('pm-schedule-body').innerHTML = html + '</tbody></table>';
  }

  function show(principal, rows, lead) {
    const total = rows.reduce((s, r) => s + r.pay, 0);
    const interest = total - principal;
    sim = { rows, annual: toYears(rows) };
    el('pm-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${lead.label}</div><div class="value">${lead.value}</div><div class="label" style="margin-top:6px;">${lead.sub}</div></div>` +
      `<div class="stat-row"><span>Total of ${rows.length.toLocaleString('en-US')} payments</span><strong>${money(total)}</strong></div>` +
      `<div class="stat-row"><span>Loan amount</span><strong>${money(principal)}</strong></div>` +
      `<div class="stat-row"><span>Total interest</span><strong style="color:${GREEN}">${money(interest)}</strong></div>` +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: principal, color: 'var(--accent)' }, { value: interest, color: GREEN }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest</span></div></div>`;
    el('pm-chart').innerHTML = lineChart(sim.annual, principal);
    renderSchedule();
    el('pm-results-section').hidden = false;
  }

  const yearsMonths = (months) => {
    const y = Math.floor(months / 12 + 1e-9);
    const m = months - y * 12;
    const parts = [];
    if (y) parts.push(`${y} ${y === 1 ? 'year' : 'years'}`);
    if (m > 0.005 || !y) parts.push(`${Number.isInteger(Math.round(m * 100) / 100) ? Math.round(m) : m.toFixed(2)} ${Math.abs(m - 1) < 0.005 ? 'month' : 'months'}`);
    return parts.join(' ');
  };

  function calculate() {
    const mode = el('pm-mode').value;
    const principal = num('pm-amount');
    const rate = num('pm-rate');
    if (!Number.isFinite(principal) || principal <= 0) return showError('Enter the loan amount.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    const i = rate / 100 / 12;

    if (mode === 'term') {
      const years = num('pm-years');
      if (!Number.isFinite(years) || years <= 0 || years > 100) return showError('Enter a loan term between 1 month and 100 years.');
      const n = Math.round(years * 12);
      if (n < 1) return showError('The loan term must be at least one month.');
      const payment = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
      const rows = schedule(principal, i, payment);
      show(principal, rows, { label: 'Monthly Payment', value: money(payment), sub: `Pay this every month for ${yearsMonths(n)} to pay off the debt` });
    } else {
      const payment = num('pm-pay');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the monthly payment you can make.');
      if (payment <= principal * i + 1e-9) {
        el('pm-result').innerHTML = `<p class="tool-result is-error">A payment of ${money(payment)} a month does not cover the interest on this loan, so the balance would never fall. You need to pay more than ${money(principal * i)} a month.</p>`;
        el('pm-results-section').hidden = true;
        sim = null;
        return;
      }
      const nper = i === 0 ? principal / payment : Math.log(payment / (payment - principal * i)) / Math.log(1 + i);
      if (nper > MAX_MONTHS) return showError('At that payment the loan would take more than 100 years to pay off. Try a larger payment.');
      const rows = schedule(principal, i, payment);
      show(principal, rows, { label: 'Time to Pay Off', value: yearsMonths(Math.round(nper * 100) / 100), sub: `Paying ${money(payment)} every month, ${rows.length.toLocaleString('en-US')} payments in all` });
    }
  }

  function applyMode() {
    const mode = el('pm-mode').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = !n.dataset.modes.split(' ').includes(mode); });
  }

  function setView(v) {
    view = v;
    el('pm-toggle-annual').classList.toggle('active', v === 'annual');
    el('pm-toggle-monthly').classList.toggle('active', v === 'monthly');
    renderSchedule();
  }

  el('pm-mode').addEventListener('change', () => { applyMode(); calculate(); });
  el('pm-toggle-annual').addEventListener('click', () => setView('annual'));
  el('pm-toggle-monthly').addEventListener('click', () => setView('monthly'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
