'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ss-form');
  if (!form) return;

  const GREEN = '#10b981';
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const trimNum = (v) => String(Math.round(v * 100) / 100);

  function num(id) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('ss-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('ss-results-section').hidden = true;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const summaryBox = (label, value, sub) =>
    `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const note = (text) =>
    `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${text}</p>`;

  // Full retirement age in months, by birth year (SSA schedule).
  function fraMonths(by) {
    if (by <= 1937) return 780;
    if (by <= 1942) return 780 + (by - 1937) * 2;
    if (by <= 1954) return 792;
    if (by <= 1959) return 792 + (by - 1954) * 2;
    return 804;
  }
  const fraText = (m) => `${Math.floor(m / 12)}` + (m % 12 ? ` and ${m % 12} months` : '');

  // Benefit as a percent of the full-retirement-age benefit (PIA) for a claiming age given in whole years.
  function pctOfPia(fraM, claimAge) {
    const m = claimAge * 12 - fraM;
    if (m >= 0) return 100 + m * (2 / 3);
    const early = -m;
    return 100 - (Math.min(early, 36) * (5 / 9) + Math.max(early - 36, 0) * (5 / 12));
  }

  function monthsPhrase(m) {
    if (m === 0) return 'exactly at';
    return `${Math.abs(m)} month${Math.abs(m) === 1 ? '' : 's'} ${m < 0 ? 'before' : 'after'}`;
  }

  function barChart(items, bestAge) {
    const W = 440, H = 250, pl = 44, pr = 8, pt = 22, pb = 34;
    const n = items.length;
    const slot = (W - pl - pr) / n;
    const bw = Math.min(40, slot * 0.7);
    const y = (v) => pt + (1 - v / 100) * (H - pt - pb);
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    let grid = '';
    [0, 25, 50, 75, 100].forEach((g) => {
      grid += `<line x1="${pl}" y1="${y(g)}" x2="${W - pr}" y2="${y(g)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(g) + 4}" text-anchor="end" ${txt}>${g}%</text>`;
    });
    let bars = '';
    items.forEach((it, i) => {
      const cx = pl + slot * i + slot / 2;
      const isBest = it.age === bestAge;
      bars += `<rect x="${cx - bw / 2}" y="${y(it.rel)}" width="${bw}" height="${y(0) - y(it.rel)}" rx="3" fill="${isBest ? 'var(--accent)' : 'var(--accent-tint)'}" stroke="var(--accent)" stroke-width="${isBest ? 0 : 1}"></rect>` +
        `<text x="${cx}" y="${y(it.rel) - 5}" text-anchor="middle" font-size="11" font-weight="${isBest ? 700 : 400}" fill="var(--text-primary)">${it.rel.toFixed(1)}%</text>` +
        `<text x="${cx}" y="${H - 14}" text-anchor="middle" ${txt}>${it.age}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:640px;height:auto;display:block;margin:0 auto;" role="img" aria-label="Relative value of each Social Security claiming age">${grid}${bars}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 1}" text-anchor="middle" ${txt}>Age you start benefits</text></svg>`;
  }

  // ---------- Mode 1: best age to claim ----------
  function calcBest() {
    const year = new Date().getFullYear();
    const by = Math.round(num('ss-birth'));
    const life = Math.round(num('ss-life'));
    const r = num('ss-return') / 100;
    const c = num('ss-cola') / 100;
    const pia = num('ss-pia');
    if (!Number.isFinite(by) || by < 1900 || by > year) return showError('Enter a reasonable birth year.');
    if (!Number.isFinite(life) || life <= 0) return showError('Enter your life expectancy.');
    if (life > 120) return showError('Enter a life expectancy of 120 or less.');
    if (!Number.isFinite(r) || r <= -1) return showError('Enter a valid investment return.');
    if (!Number.isFinite(c) || c < 0) return showError('Enter a valid cost-of-living adjustment (0 or higher).');

    const age = year - by;
    if (age >= 70) {
      el('ss-result').innerHTML = summaryBox('Best age to claim', 'Now', `You are already ${age}`) +
        note(`Since you are already ${age}, you should apply for Social Security retirement benefits as soon as possible. Waiting past 70 earns no extra credits.`);
      el('ss-results-section').hidden = true;
      return;
    }
    if (life <= 63) {
      el('ss-result').innerHTML = summaryBox('Best age to claim', 'Age 62', 'The earliest possible age') +
        note('Since you do not expect to live long, you should apply for Social Security retirement benefits as soon as you reach the age of 62.');
      el('ss-results-section').hidden = true;
      return;
    }

    const fraM = fraMonths(by);
    const items = [];
    for (let a = 62; a <= 70; a++) {
      if (a >= life) continue;
      const pct = pctOfPia(fraM, a);
      let pv = 0;
      for (let x = a; x <= life; x++) pv += (pct / 100) * Math.pow(1 + c, x - 62) / Math.pow(1 + r, x - 62);
      items.push({ age: a, pct, pv, monthsFromFra: a * 12 - fraM });
    }
    const maxPv = Math.max(...items.map((i) => i.pv));
    items.forEach((i) => { i.rel = (i.pv / maxPv) * 100; });
    const best = items.find((i) => i.pv === maxPv);

    let rows = '<table class="schedule-table"><thead><tr><th>Claim Age</th><th>vs. Full Retirement Age</th><th>Benefit (% of PIA)</th>' +
      (pia > 0 ? '<th>Monthly Benefit</th>' : '') + '<th>Relative Value</th></tr></thead><tbody>';
    items.forEach((i) => {
      const bold = i.age === best.age ? ' style="font-weight:700;"' : '';
      const vs = i.monthsFromFra === 0 ? 'At full retirement age' : `${Math.abs(i.monthsFromFra)} months ${i.monthsFromFra < 0 ? 'before' : 'after'}`;
      rows += `<tr${bold}><td>${i.age}</td><td>${vs}</td><td>${trimNum(i.pct)}%</td>` +
        (pia > 0 ? `<td>${currency0(pia * i.pct / 100)}</td>` : '') + `<td>${i.rel.toFixed(2)}%</td></tr>`;
    });
    rows += '</tbody></table>';

    let missed = '';
    if (age >= 62 && best.age < age) {
      const still = items.filter((i) => i.age >= age);
      if (still.length) {
        const alt = still.reduce((m, i) => (i.pv > m.pv ? i : m), still[0]);
        missed = note(`You are already ${age}, so ${best.age} has passed. Among the ages you can still choose, ${alt.age} has the highest value.`);
      }
    }

    el('ss-result').innerHTML =
      summaryBox('Best age to claim', `Age ${best.age}`, `${trimNum(best.pct)}% of your full-retirement-age benefit`) +
      statRow('Full retirement age', fraText(fraM)) +
      statRow(`Claiming at ${best.age}`, `${monthsPhrase(best.monthsFromFra)} full retirement age`) +
      statRow('Benefit vs. full retirement age', `${trimNum(best.pct)}%`) +
      (pia > 0 ? statRow('Estimated monthly benefit', currency0(pia * best.pct / 100), GREEN) : '') +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">Financially, the best age for you to apply for Social Security retirement benefits is <strong>${best.age}</strong>. At ${best.age}, you start ${monthsPhrase(best.monthsFromFra)} your full retirement age of ${fraText(fraM)}, and your benefit will be ${trimNum(best.pct)}% of your primary insurance amount (PIA).</p>` +
      missed +
      note('Relative value compares the worth, in age-62 dollars, of the benefits you would collect from each claiming age through your life expectancy. 100% marks the best age.');

    el('ss-card-title').textContent = 'Value Comparison of Claiming Ages';
    el('ss-chart').innerHTML = barChart(items, best.age);
    el('ss-table-wrap').innerHTML = rows;
    el('ss-results-section').hidden = false;
  }

  // ---------- Mode 2: compare two claiming ages ----------
  const MAX_LIFE = 120;

  function monthlyValues(a, pay, a1, r, c, maxLife) {
    const months = Math.round((maxLife - a) * 12);
    const cum = new Array(months + 1);
    cum[0] = 0;
    for (let k = 0; k < months; k++) {
      const growYears = Math.floor((a - a1) + k / 12 + 1e-9);
      const t = (a - a1) + (k + 0.5) / 12;
      cum[k + 1] = cum[k] + pay * Math.pow(1 + c, growYears) / Math.pow(1 + r, t);
    }
    return cum;
  }

  function lineChart(a1, a2, beL, v1, v2, maxL) {
    const W = 480, H = 250, pl = 58, pr = 12, pt = 14, pb = 44;
    const from = a1 + 1;
    const pts = (cum, a) => { const o = []; for (let L = from; L <= maxL; L++) o.push({ L, v: cum[Math.max(0, Math.min(cum.length - 1, Math.round((L - a) * 12)))] }); return o; };
    const p1 = pts(v1, a1), p2 = pts(v2, a2);
    const maxV = Math.max(...p1.map((p) => p.v), ...p2.map((p) => p.v), 1);
    const x = (L) => pl + ((L - from) / (maxL - from)) * (W - pl - pr);
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    const path = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${x(q.L).toFixed(1)},${y(q.v).toFixed(1)}`).join(' ');
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    const short =(v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K');
    let grid = '';
    for (let i = 0; i <= 4; i++) { const v = (maxV / 4) * i; grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>${short(v)}</text>`; }
    let ticks = '';
    for (let L = Math.ceil(from / 5) * 5; L <= maxL; L += 5) ticks += `<text x="${x(L)}" y="${H - 22}" text-anchor="middle" ${txt}>${L}</text>`;
    const marker = beL && beL >= from && beL <= maxL
      ? `<line x1="${x(beL)}" y1="${pt}" x2="${x(beL)}" y2="${H - pb}" stroke="var(--text-muted)" stroke-dasharray="4 4"></line><text x="${x(beL)}" y="${pt + 10}" text-anchor="${beL > (from + maxL) / 2 ? 'end' : 'start'}" dx="${beL > (from + maxL) / 2 ? -5 : 5}" ${txt}>Break-even ~${Math.floor(beL)}</text>` : '';
    const dot = (color) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`;
    const legend = `<div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">` +
      `<span>${dot('var(--accent)')}Claim at ${a1}</span><span>${dot(GREEN)}Claim at ${a2}</span></div>`;
    return `<div style="max-width:640px;margin:0 auto;">` + legend + `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Value of each claiming option by life expectancy">${grid}` +
      `<path d="${path(p1)}" fill="none" stroke="var(--accent)" stroke-width="2.5"></path><path d="${path(p2)}" fill="none" stroke="${GREEN}" stroke-width="2.5"></path>${marker}${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Life expectancy (age)</text></svg></div>`;
  }

  function calcCompare() {
    let ageA = num('ss-age1'), payA = num('ss-pay1'), ageB = num('ss-age2'), payB = num('ss-pay2');
    const r = num('ss-return') / 100;
    const c = num('ss-cola') / 100;
    if (!Number.isFinite(ageA) || !Number.isFinite(ageB) || ageA < 62 || ageA > 70 || ageB < 62 || ageB > 70) return showError('Claiming ages must be between 62 and 70.');
    if (ageA === ageB) return showError('Choose two different claiming ages to compare.');
    if (!Number.isFinite(payA) || !Number.isFinite(payB) || payA < 0 || payB < 0) return showError('Enter the monthly payment for each claiming age.');
    if (payA === 0 && payB === 0) return showError('Enter a monthly payment greater than zero for at least one option.');
    if (!Number.isFinite(r) || r <= -1) return showError('Enter a valid investment return.');
    if (!Number.isFinite(c) || c < 0) return showError('Enter a valid cost-of-living adjustment (0 or higher).');
    if (ageA > ageB) { [ageA, ageB] = [ageB, ageA]; [payA, payB] = [payB, payA]; }

    const a1 = ageA, a2 = ageB;
    const cum1 = monthlyValues(a1, payA, a1, r, c, MAX_LIFE);
    const cum2 = monthlyValues(a2, payB, a1, r, c, MAX_LIFE);
    const gap = Math.round((a2 - a1) * 12);
    const value1 = (L) => cum1[Math.max(0, Math.min(cum1.length - 1, Math.round((L - a1) * 12)))];
    const value2 = (L) => cum2[Math.max(0, Math.min(cum2.length - 1, Math.round((L - a2) * 12)))];

    let beL = null;
    for (let m = 1; m < cum2.length; m++) {
      if (cum2[m] > 0 && cum2[m] >= cum1[Math.min(m + gap, cum1.length - 1)]) { beL = a2 + m / 12; break; }
    }

    const rowsL = [75, 80, 85, 90, 95, 100].filter((L) => L > a2);
    let table = `<table class="schedule-table"><thead><tr><th>Life Expectancy</th><th>Claim at ${a1}</th><th>Claim at ${a2}</th><th>Better Option</th></tr></thead><tbody>`;
    rowsL.forEach((L) => {
      const v1 = value1(L), v2 = value2(L);
      table += `<tr><td>${L}</td><td>${currency0(v1)}</td><td>${currency0(v2)}</td><td>Age ${v2 > v1 ? a2 : a1}</td></tr>`;
    });
    table += '</tbody></table>';

    let head, sentence;
    if (beL === null) {
      head = summaryBox('Better option', `Claim at ${a1}`, `Ahead for any life expectancy up to ${MAX_LIFE}`);
      sentence = `Financially, applying at age <strong>${a1}</strong> is better than applying at age ${a2}, even if you live to ${MAX_LIFE}.`;
    } else {
      const yrs = Math.floor(beL + 1e-9);
      const mos = Math.round((beL - yrs) * 12);
      const exact = `${yrs} year${yrs === 1 ? '' : 's'}` + (mos ? ` ${mos} month${mos === 1 ? '' : 's'}` : '');
      head = summaryBox('Break-even age', `${yrs}`, `About ${exact}. Live longer and waiting wins`);
      sentence = `Financially, if you think you can live to <strong>${yrs}</strong> or older, it is better to apply for Social Security at age <strong>${a2}</strong>. Otherwise, it is better to apply at age <strong>${a1}</strong>.`;
    }

    el('ss-result').innerHTML = head +
      statRow(`Claim at ${a1}`, `${currency0(payA)}/month`) +
      statRow(`Claim at ${a2}`, `${currency0(payB)}/month`, GREEN) +
      statRow('Extra per month for waiting', currency0(payB - payA)) +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${sentence}</p>` +
      note(`Values are worth in age-${a1} dollars, adding up monthly payments (rising with the cost-of-living adjustment each year) and discounting them at your investment return.`);

    el('ss-card-title').textContent = `Equivalent Value at Age ${a1}`;
    el('ss-chart').innerHTML = lineChart(a1, a2, beL, cum1, cum2, 100);
    el('ss-table-wrap').innerHTML = table;
    el('ss-results-section').hidden = false;
  }

  function applyMode() {
    const mode = el('ss-mode').value;
    form.querySelectorAll('[data-modes]').forEach((node) => {
      node.hidden = !node.dataset.modes.split(' ').includes(mode);
    });
  }

  function calculate() {
    if (el('ss-mode').value === '1') calcBest();
    else calcCompare();
  }

  el('ss-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
