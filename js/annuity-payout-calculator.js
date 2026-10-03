'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ap-form');
  if (!form) return;

  const GREEN = '#10b981';
  const currency = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const FREQ = {
    annually: { n: 1, word: 'annually', noun: 'year' },
    semiannually: { n: 2, word: 'semiannually', noun: 'half-year' },
    quarterly: { n: 4, word: 'quarterly', noun: 'quarter' },
    monthly: { n: 12, word: 'monthly', noun: 'month' },
    semimonthly: { n: 24, word: 'semimonthly', noun: 'half-month' },
    biweekly: { n: 26, word: 'biweekly', noun: 'two-week period' },
  };
  const FOREVER_YEARS = 200;

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('ap-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('ap-results-section').hidden = true;
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

  // Pay out `payment` at the end of each period until the balance is gone. The last payment is
  // whatever is left, plus that period's interest.
  function payOut(principal, ratePct, payment, perYear) {
    const i = Math.pow(1 + ratePct / 100, 1 / perYear) - 1;
    const rows = [];
    let bal = principal;
    for (let k = 1; k <= 200000 && bal > 1e-7; k++) {
      const interest = bal * i;
      let pay = payment;
      if (bal + interest <= payment + 1e-7) pay = bal + interest;
      const end = bal + interest - pay;
      rows.push({ k, begin: bal, interest, pay, end: end < 1e-7 ? 0 : end });
      bal = end < 1e-7 ? 0 : end;
    }
    return rows;
  }

  function toYears(rows, perYear) {
    const out = [];
    for (let y = 0; y * perYear < rows.length; y++) {
      const part = rows.slice(y * perYear, (y + 1) * perYear);
      out.push({
        year: y + 1,
        begin: part[0].begin,
        interest: part.reduce((s, r) => s + r.interest, 0),
        pay: part.reduce((s, r) => s + r.pay, 0),
        end: part[part.length - 1].end,
      });
    }
    return out;
  }

  function balanceChart(yearRows, principal) {
    const W = 480, H = 240, pl = 58, pr = 12, pt = 12, pb = 40;
    const pts = [{ x: 0, bal: principal, int: 0 }];
    let cum = 0;
    yearRows.forEach((r) => { cum += r.interest; pts.push({ x: r.year, bal: r.end, int: cum }); });
    const maxX = pts[pts.length - 1].x || 1;
    const maxV = Math.max(1, ...pts.map((p) => Math.max(p.bal, p.int)));
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
      `<span>${dot('var(--accent)')}Balance</span><span>${dot(GREEN)}Interest / return earned so far</span></div>`;
    return '<div style="max-width:640px;margin:0 auto;">' + legend +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Annuity balance and interest by year">${grid}` +
      `<path d="${path('bal')}" fill="none" stroke="var(--accent)" stroke-width="2.5"></path><path d="${path('int')}" fill="none" stroke="${GREEN}" stroke-width="2.5"></path>${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Year</text></svg></div>`;
  }

  function render(principal, rate, rows, perYear, freq, lead) {
    const total = rows.reduce((s, r) => s + r.pay, 0);
    const interest = total - principal;
    const yearRows = toYears(rows, perYear);

    el('ap-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${lead.label}</div><div class="value">${lead.value}</div><div class="label" style="margin-top:6px;">${lead.sub}</div></div>` +
      `<div class="stat-row"><span>Total of ${rows.length} payments</span><strong>${currency(total)}</strong></div>` +
      `<div class="stat-row"><span>Starting principal</span><strong>${currency(principal)}</strong></div>` +
      `<div class="stat-row"><span>Total interest / return</span><strong style="color:${GREEN}">${currency(interest)}</strong></div>` +
      `<div class="donut-wrap" style="margin-top:16px;">${donutChart([{ value: principal, color: 'var(--accent)' }, { value: interest, color: GREEN }])}` +
      '<div class="donut-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Starting principal</span>' +
      `<span class="legend-item"><span class="legend-dot" style="background:${GREEN}"></span>Interest / return</span></div></div>`;

    el('ap-chart').innerHTML = balanceChart(yearRows, principal);
    let html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Balance</th><th>Interest / Return</th><th>Withdrawals</th><th>Ending Balance</th></tr></thead><tbody>';
    yearRows.forEach((r) => { html += `<tr><td>${r.year}</td><td>${currency(r.begin)}</td><td>${currency(r.interest)}</td><td>${currency(r.pay)}</td><td>${currency(r.end)}</td></tr>`; });
    el('ap-table-wrap').innerHTML = html + '</tbody></table>';
    el('ap-results-section').hidden = false;
  }

  function calculate() {
    const mode = el('ap-mode').value;
    const principal = num('ap-principal');
    const rate = num('ap-rate');
    const freq = FREQ[el('ap-freq').value];
    if (!Number.isFinite(principal) || principal <= 0) return showError('Enter the starting principal.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return showError('Enter an interest rate between 0% and 100%.');
    const perYear = freq.n;
    const i = Math.pow(1 + rate / 100, 1 / perYear) - 1;

    if (mode === 'length') {
      const years = num('ap-years');
      if (!Number.isFinite(years) || years <= 0 || years > 100) return showError('Enter a payout length between 0 and 100 years.');
      const n = Math.round(years * perYear);
      if (n < 1) return showError('The payout length must cover at least one payment.');
      const payment = i === 0 ? principal / n : (principal * i) / (1 - Math.pow(1 + i, -n));
      const rows = payOut(principal, rate, payment, perYear);
      render(principal, rate, rows, perYear, freq, {
        label: `You can withdraw ${freq.word}`, value: currency(payment), sub: `for ${n} payments over ${Math.round(n / perYear * 100) / 100} years`,
      });
    } else {
      const payment = num('ap-amount');
      if (!Number.isFinite(payment) || payment <= 0) return showError('Enter the payment amount.');
      const interestPerPeriod = principal * i;
      let nper = Infinity;
      if (payment > interestPerPeriod + 1e-9) nper = i === 0 ? principal / payment : Math.log(payment / (payment - interestPerPeriod)) / Math.log(1 + i);
      if (!Number.isFinite(nper) || nper / perYear > FOREVER_YEARS) {
        el('ap-result').innerHTML =
          `<div class="summary-payment-box"><div class="label">You can withdraw ${currency(payment)} ${freq.word}</div><div class="value">Forever</div><div class="label" style="margin-top:6px;">The balance never runs out</div></div>` +
          `<div class="stat-row"><span>Interest earned each ${freq.noun}</span><strong>${currency(interestPerPeriod)}</strong></div>` +
          `<div class="stat-row"><span>Payment each ${freq.noun}</span><strong>${currency(payment)}</strong></div>` +
          `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">At ${Math.round(rate * 100) / 100}% the principal earns more each ${freq.noun} than you withdraw, so the balance never falls. Your principal stays intact and keeps paying you. The payment that would use it up would have to be larger than ${currency(interestPerPeriod)}.</p>`;
        el('ap-results-section').hidden = true;
        return;
      }
      const rows = payOut(principal, rate, payment, perYear);
      const years = Math.round(nper / perYear * 100) / 100;
      render(principal, rate, rows, perYear, freq, {
        label: `You can withdraw ${currency(payment)} ${freq.word}`, value: `${years} years`, sub: `${rows.length} payments until the balance reaches zero`,
      });
    }
  }

  function applyMode() {
    const mode = el('ap-mode').value;
    form.querySelectorAll('[data-modes]').forEach((node) => { node.hidden = !node.dataset.modes.split(' ').includes(mode); });
  }

  el('ap-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
