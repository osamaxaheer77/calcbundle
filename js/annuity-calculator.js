'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('an-form');
  if (!form) return;

  const GREEN = '#10b981';
  const AMBER = '#f59e0b';
  const currency = (v) => (v < -0.005 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  let sim = null;
  let view = 'annual';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return 0;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('an-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('an-results-section').hidden = true;
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

  // Month by month: a monthly addition every month, plus the annual addition in the first
  // month of each year (annuity due) or the last month (ordinary annuity). The starting
  // principal goes in at the very start. Interest grows at the equivalent monthly rate.
  function simulate(principal, annual, monthly, atStart, ratePct, years) {
    const months = Math.round(years * 12);
    const i = Math.pow(1 + ratePct / 100, 1 / 12) - 1;
    const rows = [];
    let balance = 0;
    let cumAdd = 0, cumInt = 0;
    for (let m = 1; m <= months; m++) {
      const pos = ((m - 1) % 12) + 1;
      let add = monthly;
      if (m === 1) add += principal;
      if (atStart ? pos === 1 : pos === 12) add += annual;
      let interest;
      if (atStart) {
        balance += add;
        interest = balance * i;
        balance += interest;
      } else {
        // The starting principal is always in place from the first day.
        if (m === 1) balance += principal;
        interest = balance * i;
        balance += interest;
        balance += add - (m === 1 ? principal : 0);
      }
      cumAdd += add - (m === 1 ? principal : 0);
      cumInt += interest;
      rows.push({ m, add, interest, balance, cumAdd, cumInt });
    }
    return { rows, months, endBalance: balance, additions: cumAdd, interest: cumInt };
  }

  function toAnnual(rows) {
    const out = [];
    for (let y = 0; y * 12 < rows.length; y++) {
      const part = rows.slice(y * 12, y * 12 + 12);
      out.push({
        year: y + 1,
        add: part.reduce((s, r) => s + r.add, 0),
        interest: part.reduce((s, r) => s + r.interest, 0),
        balance: part[part.length - 1].balance,
        cumAdd: part[part.length - 1].cumAdd,
        cumInt: part[part.length - 1].cumInt,
      });
    }
    return out;
  }

  function stackedChart(annualRows, principal) {
    const W = 480, H = 240, pl = 58, pr = 10, pt = 12, pb = 40;
    const n = annualRows.length;
    const maxV = Math.max(1, ...annualRows.map((r) => principal + Math.max(0, r.cumAdd) + Math.max(0, r.cumInt)));
    const slot = (W - pl - pr) / n;
    const bw = Math.max(1, slot * 0.8);
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    const short = (v) => (v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K');
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const v = (maxV / 4) * g;
      grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>${short(v)}</text>`;
    }
    let bars = '';
    annualRows.forEach((r, k) => {
      const x = pl + slot * k + (slot - bw) / 2;
      const a = principal, b = Math.max(0, r.cumAdd), c = Math.max(0, r.cumInt);
      bars += `<rect x="${x.toFixed(2)}" y="${y(a).toFixed(2)}" width="${bw.toFixed(2)}" height="${(y(0) - y(a)).toFixed(2)}" fill="var(--accent)"></rect>` +
        `<rect x="${x.toFixed(2)}" y="${y(a + b).toFixed(2)}" width="${bw.toFixed(2)}" height="${(y(a) - y(a + b)).toFixed(2)}" fill="${AMBER}"></rect>` +
        `<rect x="${x.toFixed(2)}" y="${y(a + b + c).toFixed(2)}" width="${bw.toFixed(2)}" height="${(y(a + b) - y(a + b + c)).toFixed(2)}" fill="${GREEN}"></rect>`;
    });
    const step = n <= 12 ? 1 : n <= 30 ? 5 : n <= 60 ? 10 : 20;
    let ticks = '';
    annualRows.forEach((r, k) => {
      if (r.year % step === 0 || r.year === 1) ticks += `<text x="${pl + slot * k + slot / 2}" y="${H - 22}" text-anchor="middle" ${txt}>${r.year}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Annuity balance by year">${grid}${bars}${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Year</text></svg>`;
  }

  function renderSchedule() {
    if (!sim) return;
    let html;
    if (view === 'annual') {
      html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Addition</th><th>Return</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.annual.forEach((r) => { html += `<tr><td>${r.year}</td><td>${currency(r.add)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`; });
    } else {
      html = '<table class="schedule-table"><thead><tr><th>Month</th><th>Addition</th><th>Return</th><th>Ending Balance</th></tr></thead><tbody>';
      sim.rows.forEach((r) => {
        html += `<tr><td>${r.m}</td><td>${currency(r.add)}</td><td>${currency(r.interest)}</td><td>${currency(r.balance)}</td></tr>`;
        if (r.m % 12 === 0 && r.m < sim.rows.length) html += `<tr><td colspan="4" style="text-align:center;font-weight:600;">End of year ${r.m / 12}</td></tr>`;
      });
    }
    el('an-schedule-body').innerHTML = html + '</tbody></table>';
  }

  function calculate() {
    const principal = num('an-principal');
    const annual = num('an-annual');
    const monthly = num('an-monthly');
    const rate = num('an-rate');
    const years = num('an-years');
    const atStart = form.querySelector('input[name="an-timing"]:checked').value === 'beginning';
    if ([principal, annual, monthly].some((v) => !Number.isFinite(v) || v < 0)) return showError('Enter the starting principal and additions as numbers, 0 or more.');
    if (!Number.isFinite(rate) || rate < -50 || rate > 100) return showError('Enter an annual growth rate between -50% and 100%.');
    if (!Number.isFinite(years) || years < 1 / 12 || years > 100) return showError('Enter a number of years between 1 month (0.09) and 100.');
    if (principal + annual + monthly === 0) return showError('Enter a starting principal or an amount to add.');

    sim = simulate(principal, annual, monthly, atStart, rate, years);
    sim.annual = toAnnual(sim.rows);

    el('an-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">End Balance</div><div class="value">${currency(sim.endBalance)}</div></div>` +
      `<div class="stat-row"><span>Starting principal</span><strong>${currency(principal)}</strong></div>` +
      `<div class="stat-row"><span>Total additions</span><strong>${currency(sim.additions)}</strong></div>` +
      `<div class="stat-row"><span>Total return / interest earned</span><strong style="color:${GREEN}">${currency(sim.interest)}</strong></div>` +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: principal, color: 'var(--accent)' }, { value: sim.additions, color: AMBER }, { value: sim.interest, color: GREEN }])}` +
      '<div class="donut-legend">' +
      '<span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Starting principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${AMBER}"></span>Additions</span>` +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Return / interest</span></div></div>`;

    el('an-chart').innerHTML = stackedChart(sim.annual, principal);
    renderSchedule();
    el('an-results-section').hidden = false;
  }

  function setView(v) {
    view = v;
    el('an-schedule-annual').classList.toggle('active', v === 'annual');
    el('an-schedule-monthly').classList.toggle('active', v === 'monthly');
    renderSchedule();
  }

  el('an-schedule-annual').addEventListener('click', () => setView('annual'));
  el('an-schedule-monthly').addEventListener('click', () => setView('monthly'));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
