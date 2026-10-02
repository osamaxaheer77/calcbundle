'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ret-form');
  if (!form) return;

  const currency0 = (v) => (v < -0.5 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-US');
  const GREEN = '#10b981';
  const RED = '#dc2626';

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }
  const pct = (id, fallback = 0) => num(id, fallback) / 100;

  const monthlyRate = (r) => Math.pow(1 + r, 1 / 12) - 1;
  // Future value of 1 paid at the end of each of n periods.
  const annuityFactor = (rate, n) => (Math.abs(rate) < 1e-12 ? n : (Math.pow(1 + rate, n) - 1) / rate);
  // Present value at retirement of N start-of-year withdrawals of 1 that grow with inflation.
  function withdrawalFactor(r, inf, N) {
    const q = (1 + inf) / (1 + r);
    return Math.abs(q - 1) < 1e-12 ? N : (1 - Math.pow(q, N)) / (1 - q);
  }

  // Present value at retirement of 12 monthly withdrawals a year, taken at the start of each month,
  // where the monthly amount steps up with inflation once a year. Multiply by the first monthly amount.
  function monthlyDueFactor(r, inf, N) {
    const m = monthlyRate(r);
    const dDue = Math.abs(m) < 1e-12 ? 12 : ((1 - 1 / (1 + r)) / m) * (1 + m);
    return dDue * withdrawalFactor(r, inf, N);
  }

  // Constant monthly withdrawal (taken at month end) that exactly uses up `amount` over `months`.
  function fixedMonthlyWithdrawal(amount, r, months) {
    const m = monthlyRate(r);
    return Math.abs(m) < 1e-12 ? amount / months : (amount * m) / (1 - Math.pow(1 + m, -months));
  }

  function shortMoney(v) {
    const a = Math.abs(v);
    if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }

  function showError(msg) {
    el('ret-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('ret-results-section').hidden = true;
  }

  // plan: [{ annual, monthly }] one entry per working year; contributions land at month/year end.
  function simulateWorking(startAge, startBal, plan, r) {
    const m = monthlyRate(r);
    const rows = [];
    let bal = startBal;
    plan.forEach((p, idx) => {
      const start = bal;
      for (let k = 0; k < 12; k++) bal = bal * (1 + m) + p.monthly;
      bal += p.annual;
      const flow = p.annual + 12 * p.monthly;
      rows.push({ age: startAge + idx, phase: 'Saving', start, flow, growth: bal - start - flow, end: bal });
    });
    return rows;
  }

  // firstWithdrawal is the first year's total; it is taken monthly (start of month) and steps up with inflation each year.
  function simulateRetirement(retAge, startBal, firstWithdrawal, inf, r, years) {
    const m = monthlyRate(r);
    const rows = [];
    let bal = startBal;
    let runOutAge = null;
    for (let k = 0; k < years; k++) {
      const monthly = (firstWithdrawal / 12) * Math.pow(1 + inf, k);
      const start = Math.max(bal, 0);
      let b = start;
      let taken = 0;
      for (let j = 0; j < 12; j++) {
        const take = Math.min(monthly, b);
        if (take < monthly - 0.005 && runOutAge === null) runOutAge = retAge + k;
        b -= take;
        taken += take;
        b *= 1 + m;
      }
      bal = b;
      rows.push({ age: retAge + k, phase: 'Retired', start, flow: -taken, growth: b - start + taken, end: b });
    }
    return { rows, runOutAge };
  }

  function lineChart(points, retAge) {
    const W = 600, H = 230, pl = 56, pr = 14, pt = 14, pb = 30;
    const maxY = Math.max(...points.map((p) => p.bal), 1);
    const minX = points[0].age;
    const maxX = points[points.length - 1].age;
    const x = (a) => pl + ((a - minX) / (maxX - minX || 1)) * (W - pl - pr);
    const y = (v) => pt + (1 - Math.max(v, 0) / maxY) * (H - pt - pb);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p.bal).toFixed(1)}`).join(' ');
    const area = `${line} L${x(maxX).toFixed(1)},${y(0)} L${x(minX).toFixed(1)},${y(0)} Z`;
    const txt = 'font-size="11" fill="var(--text-secondary)"';
    let marker = '';
    if (retAge > minX && retAge < maxX) {
      marker = `<line x1="${x(retAge)}" y1="${pt}" x2="${x(retAge)}" y2="${H - pb}" stroke="var(--text-muted)" stroke-dasharray="4 4"></line>` +
        `<text x="${x(retAge)}" y="${H - 10}" text-anchor="middle" ${txt}>Retire ${retAge}</text>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Projected savings balance by age">` +
      `<line x1="${pl}" y1="${y(0)}" x2="${W - pr}" y2="${y(0)}" stroke="var(--border)"></line>` +
      `<path d="${area}" fill="var(--accent)" fill-opacity="0.12"></path>` +
      `<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"></path>` +
      marker +
      `<text x="${pl - 6}" y="${y(maxY) + 4}" text-anchor="end" ${txt}>${shortMoney(maxY)}</text>` +
      `<text x="${pl - 6}" y="${y(0) + 4}" text-anchor="end" ${txt}>$0</text>` +
      `<text x="${x(minX)}" y="${H - 10}" text-anchor="start" ${txt}>Age ${minX}</text>` +
      `<text x="${x(maxX)}" y="${H - 10}" text-anchor="end" ${txt}>Age ${maxX}</text>` +
      `</svg>`;
  }

  function showSchedule(rows, startAge, startBal, retAge, withChart = true) {
    const points = [{ age: startAge, bal: startBal }].concat(rows.map((r) => ({ age: r.age + 1, bal: r.end })));
    el('ret-chart').innerHTML = withChart ? lineChart(points, retAge) : '';
    let html = '<table class="schedule-table"><thead><tr><th>Age</th><th>Phase</th><th>Start Balance</th><th>Saved / Withdrawn</th><th>Growth</th><th>End Balance</th></tr></thead><tbody>';
    rows.forEach((r) => {
      const flow = r.flow >= 0 ? currency0(r.flow) : '-' + currency0(-r.flow);
      html += `<tr><td>${r.age}</td><td>${r.phase}</td><td>${currency0(r.start)}</td><td>${flow}</td><td>${currency0(r.growth)}</td><td>${currency0(r.end)}</td></tr>`;
    });
    html += '</tbody></table>';
    el('ret-table-wrap').innerHTML = html;
    el('ret-results-section').hidden = false;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const summaryBox = (label, value, sub) =>
    `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;

  function readAges(needLife) {
    const age = Math.round(num('ret-age', NaN));
    const retAge = Math.round(num('ret-retage', NaN));
    const life = needLife ? Math.round(num('ret-life', NaN)) : null;
    if (!Number.isFinite(age) || age < 0 || age > 110) return { error: 'Enter your current age (0-110).' };
    if (!Number.isFinite(retAge) || retAge <= age) return { error: 'Your planned retirement age must be greater than your current age.' };
    if (needLife && (!Number.isFinite(life) || life <= retAge)) return { error: 'Your life expectancy must be greater than your planned retirement age.' };
    if (needLife && life > 130) return { error: 'Enter a life expectancy of 130 or less.' };
    return { age, retAge, life };
  }

  function readReturn() {
    const r = pct('ret-return', NaN);
    if (!Number.isFinite(r) || r <= -0.99) return { error: 'Enter a valid average investment return.' };
    return { r };
  }

  function calcNeed() {
    const ages = readAges(true); if (ages.error) return showError(ages.error);
    const ret = readReturn(); if (ret.error) return showError(ret.error);
    const { age, retAge, life } = ages;
    const r = ret.r;
    const inf = pct('ret-inflation', 0);
    const income = num('ret-income', 0), g = pct('ret-income-growth', 0);
    const needType = el('ret-need-type').value, needVal = num('ret-need', 0);
    const saveType = el('ret-save-type').value, saveVal = num('ret-save', 0), saveInc = pct('ret-save-inc', 0);
    const other = num('ret-other', 0), savings = num('ret-savings', 0);
    if (income < 0 || needVal < 0 || saveVal < 0 || other < 0 || savings < 0) return showError('Amounts cannot be negative.');
    if (needType === 'pct' && income <= 0) return showError('Enter your current pre-tax income, or switch the income needed to a dollar amount.');

    const n = retAge - age, N = life - retAge;
    const incomeAtRet = income * Math.pow(1 + g, n);
    const need1 = needType === 'pct' ? (needVal / 100) * incomeAtRet : needVal * Math.pow(1 + inf, n);
    const other1 = other * 12 * Math.pow(1 + inf, n);
    const w1 = Math.max(0, need1 - other1);
    const factor = monthlyDueFactor(r, inf, N);
    const required = (w1 / 12) * factor;
    const todayDiv = Math.pow(1 + inf, n);
    const requiredToday = required / todayDiv;

    const plan = [];
    for (let t = 0; t < n; t++) {
      const inc = income * Math.pow(1 + g, t);
      plan.push({ annual: saveType === 'pct' ? (saveVal / 100) * inc : saveVal * Math.pow(1 + saveInc, t), monthly: 0 });
    }
    const work = simulateWorking(age, savings, plan, r);
    const projected = work.length ? work[work.length - 1].end : savings;
    const diff = projected - required;
    const retire = simulateRetirement(retAge, projected, w1, inf, r, N);

    const supported = factor > 0 ? projected / factor : 0;
    const funded = required > 0 ? Math.min(projected / required, 9.99) : 1;
    const gapAlone = required - savings * Math.pow(1 + r, n);

    let status = '';
    if (diff >= 0) {
      status = statRow('Projected surplus at retirement', currency0(diff), GREEN) +
        statRow('Savings last', `Through age ${life}`, GREEN);
    } else {
      const extraYear = -diff / annuityFactor(r, n);
      const extraMonth = -diff / annuityFactor(monthlyRate(r), 12 * n);
      status = statRow('Projected shortfall at retirement', currency0(-diff), RED) +
        statRow('Extra savings needed on top of your plan', `${currency0(extraYear)}/yr or ${currency0(extraMonth)}/mo`, RED) +
        statRow('Savings run out at', retire.runOutAge !== null ? `Age ${retire.runOutAge}` : `After age ${life}`, RED);
    }

    let alone = '';
    if (gapAlone > 0) {
      const perYear = gapAlone / annuityFactor(r, n);
      const perMonth = gapAlone / annuityFactor(monthlyRate(r), 12 * n);
      const growthSum = Math.abs(r - g) < 1e-12 ? n * Math.pow(1 + r, n - 1) : (Math.pow(1 + r, n) - Math.pow(1 + g, n)) / (r - g);
      const pctIncome = income > 0 ? (gapAlone / (income * growthSum)) * 100 : null;
      alone = statRow('To reach it from current savings alone, save',
        `${currency0(perMonth)}/mo, ${currency0(perYear)}/yr` + (pctIncome !== null ? ` or ${pctIncome.toFixed(2)}% of income` : ''));
    }

    el('ret-result').innerHTML =
      summaryBox('You will need at retirement', currency0(required), `${currency0(requiredToday)} in today's dollars`) +
      statRow('First-year spending need (age ' + retAge + ')', currency0(need1)) +
      statRow('Less other income that year', '-' + currency0(other1)) +
      statRow('First-year withdrawal from savings', currency0(w1)) +
      statRow('Projected savings at retirement', `${currency0(projected)} (${Math.round(funded * 100)}% of need)`) +
      statRow('Monthly income those savings could fund', `${currency0(supported)} (${currency0(supported / todayDiv)} in today's dollars)`) +
      status + alone +
      `<p class="field-hint" style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Figures are in future (nominal) dollars unless noted, before taxes. Withdrawals are taken monthly and step up with inflation once a year. The table shows your current savings plan.</p>`;

    showSchedule(work.concat(retire.rows), age, savings, retAge);
  }

  function calcSave() {
    const ages = readAges(false); if (ages.error) return showError(ages.error);
    const ret = readReturn(); if (ret.error) return showError(ret.error);
    const { age, retAge } = ages;
    const r = ret.r;
    const target = num('ret-target', 0), savings = num('ret-savings', 0);
    if (target <= 0) return showError('Enter the amount you need at retirement.');
    if (savings < 0) return showError('Amounts cannot be negative.');
    const n = retAge - age;
    const grown = savings * Math.pow(1 + r, n);
    const gap = target - grown;

    if (gap <= 0) {
      el('ret-result').innerHTML =
        summaryBox('You are on track', currency0(grown), `Your current savings alone are projected to reach this by age ${retAge}`) +
        statRow('Amount needed', currency0(target)) +
        statRow('Projected surplus', currency0(-gap), GREEN) +
        statRow('Additional savings needed', '$0', GREEN);
      showSchedule(simulateWorking(age, savings, Array.from({ length: n }, () => ({ annual: 0, monthly: 0 })), r), age, savings, retAge);
      return;
    }

    const perYear = gap / annuityFactor(r, n);
    const perMonth = gap / annuityFactor(monthlyRate(r), 12 * n);
    const totalYear = perYear * n;
    el('ret-result').innerHTML =
      summaryBox('Save each month', currency0(perMonth), `or ${currency0(perYear)} once a year`) +
      statRow('Amount needed at age ' + retAge, currency0(target)) +
      statRow('Current savings grown to age ' + retAge, currency0(grown)) +
      statRow('Gap to close', currency0(gap)) +
      statRow('Or add one lump sum today', currency0(target / Math.pow(1 + r, n) - savings)) +
      statRow('Total you contribute (yearly plan)', currency0(totalYear)) +
      statRow('Total growth earned (yearly plan)', currency0(target - savings - totalYear)) +
      `<p class="field-hint" style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Contributions are made at the end of each month (or year). The table shows the yearly plan.</p>`;
    showSchedule(simulateWorking(age, savings, Array.from({ length: n }, () => ({ annual: perYear, monthly: 0 })), r), age, savings, retAge);
  }

  function calcWithdraw() {
    const ages = readAges(true); if (ages.error) return showError(ages.error);
    const ret = readReturn(); if (ret.error) return showError(ret.error);
    const { age, retAge, life } = ages;
    const r = ret.r;
    const inf = pct('ret-inflation', 0);
    const savings = num('ret-savings', 0), annual = num('ret-annual', 0), monthly = num('ret-monthly', 0);
    if (savings < 0 || annual < 0 || monthly < 0) return showError('Amounts cannot be negative.');
    const n = retAge - age, N = life - retAge;

    const work = simulateWorking(age, savings, Array.from({ length: n }, () => ({ annual, monthly })), r);
    const balance = work[work.length - 1].end;
    if (balance <= 0) return showError('Add some savings or contributions to see a withdrawal amount.');
    const monthly1 = balance / monthlyDueFactor(r, inf, N);
    const w1 = monthly1 * 12;
    const retire = simulateRetirement(retAge, balance, w1, inf, r, N);
    const todayFactor = Math.pow(1 + inf, n);
    const endFactor = Math.pow(1 + inf, n + N);
    const fixedMonthly = fixedMonthlyWithdrawal(balance, r, 12 * N);
    const totalContrib = (annual + 12 * monthly) * n;
    const infPct = parseFloat((inf * 100).toFixed(2));

    el('ret-result').innerHTML =
      summaryBox('You can withdraw each month', currency0(monthly1), `at age ${retAge}, rising ${infPct}% a year with inflation`) +
      statRow("That first month, in today's dollars", currency0(monthly1 / todayFactor)) +
      statRow('Savings at retirement (age ' + retAge + ')', currency0(balance)) +
      statRow("Savings at retirement, in today's dollars", currency0(balance / todayFactor)) +
      statRow('Or a fixed amount each month, ages ' + retAge + '-' + life, currency0(fixedMonthly)) +
      statRow("Fixed amount in today's dollars at age " + retAge, currency0(fixedMonthly / todayFactor)) +
      statRow("Fixed amount in today's dollars at age " + life, currency0(fixedMonthly / endFactor)) +
      statRow('Total you contribute until then', currency0(totalContrib)) +
      `<p class="field-hint" style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The table follows the inflation-rising option, which uses the balance up by age ${life}. A fixed amount stays the same in dollars, so it buys less each year.</p>`;
    showSchedule(work.concat(retire.rows), age, savings, retAge);
  }

  function calcLast() {
    const ret = readReturn(); if (ret.error) return showError(ret.error);
    const r = ret.r;
    const amount = num('ret-amount', 0), withdraw = num('ret-withdraw', 0);
    if (amount <= 0) return showError('Enter the amount you have.');
    if (withdraw <= 0) return showError('Enter how much you plan to withdraw each month.');
    const m = monthlyRate(r);
    el('ret-results-section').hidden = true;

    const lengths = '<h4 style="margin:18px 0 4px;font-size:13px;">Other withdrawal lengths</h4>' +
      [5, 10, 15, 20, 25, 30, 35].map((y) => statRow(`${y} years`, `${currency0(fixedMonthlyWithdrawal(amount, r, y * 12))}/month`)).join('');
    const note = `<p class="field-hint" style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Withdrawals are taken at the end of each month and stay constant (no inflation adjustment).</p>`;

    // Withdrawals at month end: the balance never runs out when its monthly growth covers the withdrawal.
    const x = Math.abs(m) < 1e-12 ? 0 : (amount * m) / withdraw;
    if (m > 1e-12 && x >= 1) {
      el('ret-result').innerHTML =
        summaryBox('Your money can last', 'Indefinitely', 'Investment growth covers your withdrawals') +
        statRow('Planned monthly withdrawal', currency0(withdraw)) +
        statRow('Largest monthly withdrawal that never depletes it', currency0(amount * m), GREEN) +
        lengths + note;
      return;
    }

    const months = Math.abs(m) < 1e-12 ? amount / withdraw : -Math.log(1 - x) / Math.log(1 + m);
    const tenths = Math.round(months * 10);
    const yrs = Math.floor(tenths / 120);
    const rem = (tenths - yrs * 120) / 10;
    const remText = (rem % 1 === 0 ? String(rem) : rem.toFixed(1)) + (rem === 1 ? ' month' : ' months');
    const lasts = yrs ? `${yrs} year${yrs === 1 ? '' : 's'}` + (rem ? ` and ${remText}` : '') : remText;
    const totalWithdrawn = withdraw * months;
    el('ret-result').innerHTML =
      summaryBox('Your money will last about', lasts, `${Math.round(months).toLocaleString('en-US')} monthly withdrawals`) +
      statRow('Amount you have', currency0(amount)) +
      statRow('Monthly withdrawal', currency0(withdraw)) +
      statRow('Total withdrawn', currency0(totalWithdrawn)) +
      statRow('Growth earned along the way', currency0(totalWithdrawn - amount)) +
      lengths + note;
  }

  function applyMode() {
    const mode = el('ret-mode').value;
    form.querySelectorAll('[data-modes]').forEach((node) => {
      node.hidden = !node.dataset.modes.split(' ').includes(mode);
    });
  }

  function calculate() {
    const mode = el('ret-mode').value;
    if (mode === '1') calcNeed();
    else if (mode === '2') calcSave();
    else if (mode === '3') calcWithdraw();
    else calcLast();
  }

  function swapDefault(typeId, valueId, pctDefault, dollarDefault) {
    el(typeId).addEventListener('change', () => {
      const input = el(valueId);
      const v = parseFloat(input.value);
      if (el(typeId).value === 'pct' && (!Number.isFinite(v) || v > 100)) input.value = pctDefault;
      if (el(typeId).value === 'dollar' && (!Number.isFinite(v) || v <= 100)) input.value = dollarDefault;
    });
  }

  swapDefault('ret-need-type', 'ret-need', 75, 60000);
  swapDefault('ret-save-type', 'ret-save', 10, 10000);

  el('ret-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
