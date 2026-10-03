'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('if-form');
  if (!form || !window.CPI_DATA) return;

  const CPI = window.CPI_DATA;
  const ANNUAL = window.CPI_ANNUAL;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const SHORT = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  const AVERAGE = 13;
  const FIRST_YEAR = 1913;
  const years = Object.keys(CPI).map(Number);
  const LAST_YEAR = Math.max(...years);
  const LAST_MONTH = CPI[LAST_YEAR].length;

  const money = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountText = (v) => '$' + (Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const pct = (v) => (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('if-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('if-results-section').hidden = true;
  }

  // CPI for one month. A missing month is filled in with the midpoint of its neighbours.
  function monthCpi(y, m) {
    const v = CPI[y] && CPI[y][m - 1];
    if (v !== null && v !== undefined) return v;
    const prev = m === 1 ? CPI[y - 1][11] : CPI[y][m - 2];
    const next = m === 12 ? CPI[y + 1][0] : CPI[y][m];
    return (prev + next) / 2;
  }

  function periodInfo(y, m) {
    if (y < FIRST_YEAR || y > LAST_YEAR) return { error: `Pick a year from ${FIRST_YEAR} to ${LAST_YEAR}.` };
    if (m === AVERAGE) {
      if (!ANNUAL[y]) return { error: `The ${y} average is not available yet because the year is not over. Pick a month instead.` };
      // The yearly average is placed in the middle of the year when working out an annual rate.
      return { cpi: ANNUAL[y], label: `${y} (Average)`, short: `${y} (Average)`, index: y * 12 + 6 };
    }
    if (y === LAST_YEAR && m > LAST_MONTH) return { error: `Price data for ${MONTHS[m - 1]} ${y} is not available yet. The latest month is ${MONTHS[LAST_MONTH - 1]} ${LAST_YEAR}.` };
    return { cpi: monthCpi(y, m), label: `${SHORT[m - 1]} ${y}`, short: `${SHORT[m - 1]} ${y}`, index: y * 12 + (m - 1), missing: CPI[y][m - 1] === null };
  }

  function lineChart(points, amountLabel) {
    const W = 480, H = 240, pl = 62, pr = 12, pt = 14, pb = 40;
    const xs = points.map((p) => p.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const vs = points.map((p) => p.v);
    let minV = Math.min(...vs), maxV = Math.max(...vs);
    if (maxV - minV < 1e-9) { minV *= 0.95; maxV *= 1.05; }
    const pad = (maxV - minV) * 0.08;
    minV -= pad; maxV += pad;
    const x = (v) => pl + ((v - minX) / Math.max(1e-9, maxX - minX)) * (W - pl - pr);
    const y = (v) => pt + (1 - (v - minV) / (maxV - minV)) * (H - pt - pb);
    const path = points.map((p, k) => `${k ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const v = minV + ((maxV - minV) / 4) * g;
      grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>$${Math.round(v).toLocaleString('en-US')}</text>`;
    }
    const span = maxX - minX;
    const step = span <= 3 ? 0.5 : span <= 12 ? 1 : span <= 30 ? 5 : span <= 60 ? 10 : 20;
    let ticks = '';
    for (let t = Math.ceil(minX / step) * step; t <= maxX + 1e-9; t += step) ticks += `<text x="${x(t)}" y="${H - 22}" text-anchor="middle" ${txt}>${Number.isInteger(t) ? t : t.toFixed(1)}</text>`;
    return `<div style="max-width:640px;margin:0 auto;"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="${amountLabel}">${grid}` +
      `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5"></path>${ticks}<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Year</text></svg></div>`;
  }

  // ---------- Mode 1: U.S. CPI ----------
  function calcCpi() {
    const amount = num('if-amount');
    const a = periodInfo(parseInt(el('if-in-year').value, 10), parseInt(el('if-in-month').value, 10));
    const b = periodInfo(parseInt(el('if-out-year').value, 10), parseInt(el('if-out-month').value, 10));
    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter an amount greater than zero.');
    if (a.error) return showError(a.error);
    if (b.error) return showError(b.error);

    const value = (amount * b.cpi) / a.cpi;
    const earlier = a.index <= b.index ? a : b;
    const later = a.index <= b.index ? b : a;
    const ratio = later.cpi / earlier.cpi;
    const months = later.index - earlier.index;
    const total = (ratio - 1) * 100;

    let rateLines;
    if (months > 12) {
      const avg = (Math.pow(ratio, 12 / months) - 1) * 100;
      rateLines = `The total inflation rate from ${earlier.label} to ${later.label} is <strong>${pct(total)}</strong>. The average inflation rate is <strong>${pct(avg)}</strong> per year.`;
    } else {
      rateLines = `The inflation rate from ${earlier.label} to ${later.label} is <strong>${pct(total)}</strong>.`;
    }
    const missingNote = (a.missing || b.missing)
      ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">No official price index was published for October 2025, so that month uses the midpoint of September and November.</p>' : '';

    el('if-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${money(amount)} in ${a.label} is worth</div><div class="value">${money(value)}</div><div class="label" style="margin-top:6px;">in ${b.label}</div></div>` +
      `<div class="stat-row"><span>Total change in prices</span><strong>${pct(total)}</strong></div>` +
      (months > 12 ? `<div class="stat-row"><span>Average per year</span><strong>${pct((Math.pow(ratio, 12 / months) - 1) * 100)}</strong></div>` : '') +
      `<div class="stat-row"><span>Price index, ${a.label}</span><strong>${a.cpi}</strong></div>` +
      `<div class="stat-row"><span>Price index, ${b.label}</span><strong>${b.cpi}</strong></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;"><strong>${money(value)}</strong> in ${b.label} has the same buying power as <strong>${amountText(amount)}</strong> in ${a.label}. ${rateLines}</p>` + missingNote;

    // Purchasing power of the amount over time, month by month.
    const pts = [];
    const startIdx = Math.min(a.index, b.index), endIdx = Math.max(a.index, b.index);
    for (let idx = Math.round(startIdx); idx <= Math.round(endIdx); idx++) {
      const yy = Math.floor(idx / 12), mm = (idx % 12) + 1;
      if (yy === LAST_YEAR && mm > LAST_MONTH) break;
      pts.push({ x: yy + (mm - 1) / 12, v: (amount * monthCpi(yy, mm)) / a.cpi });
    }
    if (pts.length > 1) {
      el('if-chart-title').textContent = `What ${amountText(amount)} from ${a.label} is worth over time`;
      el('if-chart').innerHTML = lineChart(pts, 'Value of the amount over time, adjusted for inflation');
      el('if-results-section').hidden = false;
    } else {
      el('if-results-section').hidden = true;
    }
  }

  // ---------- Modes 2 and 3: flat rate ----------
  function flatInputs() {
    const amount = num('if-f-amount'), rate = num('if-f-rate'), yrs = num('if-f-years');
    if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount greater than zero.' };
    if (!Number.isFinite(rate) || rate < -20 || rate > 500) return { error: 'Enter an inflation rate between -20% and 500%.' };
    if (!Number.isFinite(yrs) || yrs < 0 || yrs > 200) return { error: 'Enter a number of years between 0 and 200.' };
    return { amount, rate, yrs };
  }

  function calcForward() {
    const f = flatInputs();
    if (f.error) return showError(f.error);
    const value = f.amount * Math.pow(1 + f.rate / 100, f.yrs);
    el('if-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">You will need</div><div class="value">${money(value)}</div><div class="label" style="margin-top:6px;">in ${f.yrs} years to match ${amountText(f.amount)} today</div></div>` +
      `<div class="stat-row"><span>Inflation rate</span><strong>${f.rate}% a year</strong></div>` +
      `<div class="stat-row"><span>Total change in prices</span><strong>${pct((value / f.amount - 1) * 100)}</strong></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">With an average inflation rate of ${f.rate}% a year, something that costs ${amountText(f.amount)} today will cost about ${money(value)} after ${f.yrs} years. Put another way, ${amountText(f.amount)} in ${f.yrs} years will buy only what ${money(f.amount * f.amount / value)} buys today.</p>`;
    flatChart(f, true);
  }

  function calcBackward() {
    const f = flatInputs();
    if (f.error) return showError(f.error);
    const value = f.amount / Math.pow(1 + f.rate / 100, f.yrs);
    el('if-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${amountText(f.amount)} now equals</div><div class="value">${money(value)}</div><div class="label" style="margin-top:6px;">of buying power ${f.yrs} years ago</div></div>` +
      `<div class="stat-row"><span>Inflation rate</span><strong>${f.rate}% a year</strong></div>` +
      `<div class="stat-row"><span>Total change in prices</span><strong>${pct((f.amount / value - 1) * 100)}</strong></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">With an average inflation rate of ${f.rate}% a year, ${amountText(f.amount)} today buys what ${money(value)} bought ${f.yrs} years ago. In other words, something that cost ${money(value)} then costs about ${amountText(f.amount)} now.</p>`;
    flatChart(f, false);
  }

  function flatChart(f, forward) {
    const pts = [];
    const n = Math.max(1, Math.ceil(f.yrs * 4));
    for (let k = 0; k <= n; k++) {
      const t = (f.yrs * k) / n;
      pts.push({ x: forward ? t : -f.yrs + t, v: forward ? f.amount * Math.pow(1 + f.rate / 100, t) : f.amount / Math.pow(1 + f.rate / 100, f.yrs - t) });
    }
    if (f.yrs > 0) {
      el('if-chart-title').textContent = forward ? `What it costs in the future (${amountText(f.amount)} today)` : `What ${amountText(f.amount)} today was worth in the past`;
      el('if-chart').innerHTML = lineChart(pts, forward ? 'Future cost of an amount' : 'Past value of an amount').replace('>Year<', forward ? '>Years from now<' : '>Years ago (0 is today)<');
      el('if-results-section').hidden = false;
    } else {
      el('if-results-section').hidden = true;
    }
  }

  function applyMode() {
    const mode = el('if-mode').value;
    form.querySelectorAll('[data-modes]').forEach((n) => { n.hidden = !n.dataset.modes.split(' ').includes(mode); });
  }

  function calculate() {
    const mode = el('if-mode').value;
    if (mode === '1') calcCpi(); else if (mode === '2') calcForward(); else calcBackward();
  }

  // Fill the year and month lists.
  function fillSelects() {
    ['if-in-year', 'if-out-year'].forEach((id, k) => {
      const sel = el(id);
      for (let y = LAST_YEAR; y >= FIRST_YEAR; y--) {
        const o = document.createElement('option'); o.value = y; o.textContent = y;
        if ((k === 0 && y === 2020) || (k === 1 && y === LAST_YEAR)) o.selected = true;
        sel.appendChild(o);
      }
    });
    ['if-in-month', 'if-out-month'].forEach((id, k) => {
      const sel = el(id);
      MONTHS.forEach((m, i) => { const o = document.createElement('option'); o.value = i + 1; o.textContent = m; if (i === 0) o.selected = true; sel.appendChild(o); });
      const o = document.createElement('option'); o.value = AVERAGE; o.textContent = 'Average'; sel.appendChild(o);
    });
  }

  fillSelects();
  el('if-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
