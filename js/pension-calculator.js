'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pn-form');
  if (!form) return;

  const GREEN = '#10b981';
  const MAX_AGE = 120;
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('pn-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('pn-results-section').hidden = true;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const summaryBox = (label, value, sub) =>
    `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const note = (text) =>
    `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${text}</p>`;
  const para = (text) =>
    `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${text}</p>`;

  // Present value, at age `base`, of a monthly pension that starts at age `start` and runs until `until`.
  // Each year's twelve payments are lumped together, grow with the cost-of-living adjustment from the
  // second year on, and are discounted from the middle of the year.
  function pensionValue(monthly, start, until, base, r, c) {
    let pv = 0;
    for (let k = 0; k < until - start; k++) {
      pv += 12 * monthly * Math.pow(1 + c, k) / Math.pow(1 + r, (start - base) + k + 0.5);
    }
    return pv;
  }

  function lineChart(series, from, to, markerAge) {
    const W = 480, H = 250, pl = 58, pr = 12, pt = 14, pb = 44;
    const pts = (fn) => { const o = []; for (let L = from; L <= to; L++) o.push({ L, v: fn(L) }); return o; };
    const lines = series.map((s) => ({ ...s, pts: pts(s.fn) }));
    const maxV = Math.max(1, ...lines.flatMap((s) => s.pts.map((p) => p.v)));
    const x = (L) => pl + ((L - from) / (to - from)) * (W - pl - pr);
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    const path = (p) => p.map((q, i) => `${i ? 'L' : 'M'}${x(q.L).toFixed(1)},${y(q.v).toFixed(1)}`).join(' ');
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    const short = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K');
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const v = (maxV / 4) * i;
      grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>${short(v)}</text>`;
    }
    let ticks = '';
    for (let L = Math.ceil(from / 10) * 10; L <= to; L += 10) ticks += `<text x="${x(L)}" y="${H - 22}" text-anchor="middle" ${txt}>${L}</text>`;
    const right = markerAge > (from + to) / 2;
    const marker = markerAge && markerAge >= from && markerAge <= to
      ? `<line x1="${x(markerAge)}" y1="${pt}" x2="${x(markerAge)}" y2="${H - pb}" stroke="var(--text-muted)" stroke-dasharray="4 4"></line><text x="${x(markerAge)}" y="${pt + 10}" text-anchor="${right ? 'end' : 'start'}" dx="${right ? -5 : 5}" ${txt}>Break-even ${markerAge}</text>` : '';
    const dot = (color) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`;
    const legend = '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">' +
      lines.map((s) => `<span>${dot(s.color)}${s.label}</span>`).join('') + '</div>';
    return '<div style="max-width:640px;margin:0 auto;">' + legend +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Value of each option by life expectancy">${grid}` +
      lines.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="${s.color}" stroke-width="2.5"></path>`).join('') + `${marker}${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Life expectancy (age)</text></svg></div>`;
  }

  function readRates() {
    const r = num('pn-return') / 100;
    const c = num('pn-cola') / 100;
    if (!Number.isFinite(r) || r < -0.1 || r > 0.3) return { error: 'Enter an investment return between -10% and 30%.' };
    if (!Number.isFinite(c) || c < 0 || c > 0.3) return { error: 'Enter a cost-of-living adjustment between 0% and 30%.' };
    return { r, c };
  }

  const validAge = (v) => Number.isFinite(v) && v >= 30 && v <= 100;

  // ---------- Mode 1: lump sum or monthly pension ----------
  function calcLump() {
    const age = Math.round(num('pn-age'));
    const lump = num('pn-lump');
    const monthly = num('pn-monthly');
    const rates = readRates();
    if (!validAge(age)) return showError('Enter a retirement age between 30 and 100.');
    if (!Number.isFinite(lump) || lump < 0) return showError('Enter the lump sum payment amount, 0 or more.');
    if (!Number.isFinite(monthly) || monthly < 0) return showError('Enter the monthly pension income, 0 or more.');
    if (rates.error) return showError(rates.error);
    const { r, c } = rates;
    const pv = (L) => pensionValue(monthly, age, L, age, r, c);

    let be = null;
    for (let L = age + 1; L <= MAX_AGE; L++) { if (pv(L) >= lump) { be = L; break; } }

    let head, sentence;
    if (be === null) {
      head = summaryBox('Better option', 'Lump sum', `Ahead for any life expectancy up to ${MAX_AGE}`);
      sentence = `With an investment return of ${trim(r * 100)}% a year, the lump sum is worth more than the monthly pension even if you live to ${MAX_AGE}.`;
    } else if (be === age + 1) {
      head = summaryBox('Better option', 'Monthly pension', 'Ahead from the very first year');
      sentence = 'Even one year of pension payments is worth at least as much as the lump sum, so the monthly pension is the better choice whatever your life expectancy.';
    } else {
      head = summaryBox('Break-even life expectancy', `${be}`, 'Live to this age or longer and the pension wins');
      sentence = `With an investment return of ${trim(r * 100)}% a year, if you can live to <strong>${be}</strong> or older, it is better to take the monthly pension income. Otherwise, it is better to take the lump sum payout.`;
    }

    el('pn-result').innerHTML = head +
      statRow('Lump sum payment', currency0(lump)) +
      statRow('Monthly pension income', currency0(monthly) + '/month', GREEN) +
      statRow('Pension income in year one', currency0(monthly * 12)) +
      para(sentence) +
      note('This assumes the lump sum is rolled into a tax-deferred account such as an IRA and is not taxed up front. If it would be taxed, enter the after-tax amount instead.');

    const rows = [];
    for (let L = Math.ceil((age + 1) / 5) * 5; L <= 100; L += 5) rows.push(L);
    let table = '<table class="schedule-table"><thead><tr><th>Life Expectancy</th><th>Lump Sum</th><th>Monthly Pension (Value)</th><th>Better Option</th></tr></thead><tbody>';
    rows.forEach((L) => { const v = pv(L); table += `<tr><td>${L}</td><td>${currency0(lump)}</td><td>${currency0(v)}</td><td>${v >= lump ? 'Monthly pension' : 'Lump sum'}</td></tr>`; });
    table += '</tbody></table>';

    el('pn-card-title').textContent = 'Equivalent Present Value of the Options';
    el('pn-chart').innerHTML = lineChart([
      { label: 'Lump sum', color: 'var(--accent)', fn: () => lump },
      { label: 'Monthly pension income', color: GREEN, fn: pv },
    ], age + 1, MAX_AGE, be && be > age + 1 ? be : null);
    el('pn-table-wrap').innerHTML = rows.length ? table : '';
    el('pn-results-section').hidden = false;
  }

  function trim(v) { return String(Math.round(v * 100) / 100); }

  // ---------- Mode 2: single-life or joint-and-survivor ----------
  function calcJoint() {
    const age = Math.round(num('pn-j-age'));
    const life = Math.round(num('pn-j-life'));
    const sAge = Math.round(num('pn-j-sage'));
    const sLife = Math.round(num('pn-j-slife'));
    const single = num('pn-single');
    const joint = num('pn-joint');
    const rates = readRates();
    if (!validAge(age)) return showError('Enter a retirement age between 30 and 100.');
    if (!Number.isFinite(life) || life < age || life > MAX_AGE) return showError(`Enter a life expectancy between your retirement age and ${MAX_AGE}.`);
    if (!Number.isFinite(sAge) || sAge < 18 || sAge > 100) return showError("Enter your spouse's age between 18 and 100.");
    if (!Number.isFinite(sLife) || sLife > MAX_AGE) return showError(`Enter a spouse life expectancy of ${MAX_AGE} or less.`);
    if (!Number.isFinite(single) || single <= 0) return showError('Enter the monthly single-life pension.');
    if (!Number.isFinite(joint) || joint < 0 || joint >= single) return showError('The joint-and-survivor pension must be 0 or more, and lower than the single-life pension.');
    if (rates.error) return showError(rates.error);
    const { r, c } = rates;

    if (sLife <= sAge) {
      el('pn-result').innerHTML = summaryBox('Better choice', 'Single-life pension', 'Your spouse is not expected to outlive your retirement date') +
        para("Since you expect your spouse cannot live until you retire, it is better to pick the single-life pension payout.");
      el('pn-results-section').hidden = true;
      return;
    }

    const diff = single - joint;
    const spouseYears = sLife - sAge;
    // One lump sum, in the year you retire, that would replace the survivor benefit if you died at retirement.
    let lumpNeeded = 0;
    for (let k = 0; k <= spouseYears; k++) lumpNeeded += 12 * joint * Math.pow(1 + c, k) / Math.pow(1 + r, k);

    // What happens if you die at the end of age L.
    function atLife(L) {
      const years = L - age + 1;
      let acc = 0;
      for (let k = 0; k < years; k++) acc += 12 * diff * Math.pow(1 + c, k) * Math.pow(1 + r, years - 1 - k);
      const spouseAge = sAge + (L - age);
      const outlived = spouseAge >= sLife;
      let survivor = 0;
      if (!outlived) {
        for (let k = 0; k < sLife - spouseAge; k++) survivor += 12 * joint * Math.pow(1 + c, years + k) / Math.pow(1 + r, k);
      }
      return { acc, survivor, spouseAge, outlived, single: outlived || acc >= survivor };
    }

    const m = atLife(life);
    const best = m.single ? 'Single-life pension' : 'Joint-and-survivor pension';
    const verdictSub = m.outlived ? 'You are expected to outlive your spouse' : `${currency0(m.acc)} saved versus ${currency0(m.survivor)} of survivor payments`;

    el('pn-result').innerHTML =
      summaryBox('Better choice (investment view)', best, verdictSub) +
      statRow('Monthly payment difference', currency0(diff)) +
      statRow(`Investments from the difference at age ${life}`, currency0(m.acc), GREEN) +
      statRow(`Survivor payments still owed until spouse is ${sLife}`, currency0(m.survivor)) +
      statRow('Lump sum that replaces the survivor benefit', currency0(lumpNeeded)) +
      para(`<strong>Insurance view.</strong> Dying at age ${age} would leave your spouse needing about <strong>${currency0(lumpNeeded)}</strong> to replace the survivor pension. If you can find a ${spouseYears}-year term life policy for that amount with a premium of <strong>${currency0(diff)} a month or less</strong>, taking the single-life pension and buying the policy gives the same or better cover than the joint-and-survivor option.`) +
      para(`<strong>Investment view.</strong> ${m.outlived
        ? `You expect to outlive your spouse, so no survivor payments would be left to collect and the single-life pension is the better choice.`
        : `If you take the single-life pension and invest the ${currency0(single)} − ${currency0(joint)} = ${currency0(diff)} difference each month, you would have about ${currency0(m.acc)} at the end of age ${life} (your spouse would be ${m.spouseAge}). The survivor payments still owed until your spouse reaches ${sLife} would be worth ${currency0(m.survivor)}, so the ${m.single ? 'single-life' : 'joint-and-survivor'} pension comes out ahead.`}`) +
      note('Payments are counted a year at a time and grow with the cost-of-living adjustment after the first year. Pension plans differ, so treat this as a guide rather than a quote.');

    let table = '<table class="schedule-table"><thead><tr><th>If You Die At</th><th>Spouse Age</th><th>Invested Difference</th><th>Survivor Payments Owed</th><th>Better Option</th></tr></thead><tbody>';
    const rows = [];
    for (let L = Math.ceil(age / 5) * 5; L <= 100; L += 5) if (L >= age) rows.push(L);
    rows.forEach((L) => {
      const o = atLife(L);
      table += `<tr><td>${L}</td><td>${o.spouseAge}</td><td>${currency0(o.acc)}</td><td>${currency0(o.survivor)}</td><td>${o.single ? 'Single-life' : 'Joint-and-survivor'}</td></tr>`;
    });
    table += '</tbody></table>';

    el('pn-card-title').textContent = 'Single-Life Versus Joint-and-Survivor by Age at Death';
    el('pn-chart').innerHTML = '';
    el('pn-table-wrap').innerHTML = table;
    el('pn-results-section').hidden = false;
  }

  // ---------- Mode 3: work longer ----------
  function calcLonger() {
    let age1 = Math.round(num('pn-a1')), pay1 = num('pn-p1');
    let age2 = Math.round(num('pn-a2')), pay2 = num('pn-p2');
    const rates = readRates();
    if (!validAge(age1) || !validAge(age2)) return showError('Enter retirement ages between 30 and 100.');
    if (age1 === age2) return showError('Choose two different retirement ages to compare.');
    if (!Number.isFinite(pay1) || pay1 < 0 || !Number.isFinite(pay2) || pay2 < 0) return showError('Enter the monthly pension for each retirement age.');
    if (pay1 === 0 && pay2 === 0) return showError('Enter a monthly pension greater than zero for at least one option.');
    if (rates.error) return showError(rates.error);
    const { r, c } = rates;
    if (age1 > age2) { [age1, age2] = [age2, age1]; [pay1, pay2] = [pay2, pay1]; }

    const pv1 = (L) => pensionValue(pay1, age1, L, age1, r, c);
    const pv2 = (L) => pensionValue(pay2, age2, L, age1, r, c);
    let be = null;
    for (let L = age2 + 1; L <= MAX_AGE; L++) { if (pv2(L) >= pv1(L)) { be = L; break; } }

    let head, sentence;
    if (be === null) {
      head = summaryBox('Better option', `Retire at ${age1}`, `Ahead for any life expectancy up to ${MAX_AGE}`);
      sentence = `Financially, retiring at age <strong>${age1}</strong> is always better than retiring at age ${age2}.`;
    } else {
      head = summaryBox('Break-even life expectancy', `${be}`, `Live this long and retiring at ${age2} wins`);
      sentence = `Financially, if you think you can live to <strong>${be}</strong> or older, it is better to retire at age <strong>${age2}</strong>. Otherwise, it is better to retire at age <strong>${age1}</strong>.`;
    }

    el('pn-result').innerHTML = head +
      statRow(`Retire at ${age1}`, currency0(pay1) + '/month') +
      statRow(`Retire at ${age2}`, currency0(pay2) + '/month', GREEN) +
      statRow('Extra per month for working longer', currency0(pay2 - pay1)) +
      para(sentence) +
      note(`Values are worth in age-${age1} dollars. This compares only the pensions. It leaves out the salary you would earn by working longer.`);

    const rows = [];
    for (let L = Math.ceil((age2 + 1) / 5) * 5; L <= 100; L += 5) rows.push(L);
    let table = `<table class="schedule-table"><thead><tr><th>Life Expectancy</th><th>Retire at ${age1}</th><th>Retire at ${age2}</th><th>Better Option</th></tr></thead><tbody>`;
    rows.forEach((L) => { const a = pv1(L), b = pv2(L); table += `<tr><td>${L}</td><td>${currency0(a)}</td><td>${currency0(b)}</td><td>Retire at ${b >= a ? age2 : age1}</td></tr>`; });
    table += '</tbody></table>';

    el('pn-card-title').textContent = `Equivalent Present Value at Age ${age1}`;
    el('pn-chart').innerHTML = lineChart([
      { label: `Retire at ${age1}`, color: 'var(--accent)', fn: pv1 },
      { label: `Retire at ${age2}`, color: GREEN, fn: pv2 },
    ], age1 + 1, MAX_AGE, be);
    el('pn-table-wrap').innerHTML = rows.length ? table : '';
    el('pn-results-section').hidden = false;
  }

  function applyMode() {
    const mode = el('pn-mode').value;
    form.querySelectorAll('[data-modes]').forEach((node) => {
      node.hidden = !node.dataset.modes.split(' ').includes(mode);
    });
  }

  function calculate() {
    const mode = el('pn-mode').value;
    if (mode === '1') calcLump();
    else if (mode === '2') calcJoint();
    else calcLonger();
  }

  el('pn-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  window.PensionCalc = { pensionValue };
  applyMode();
  calculate();
})();
