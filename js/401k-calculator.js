'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('k4-form');
  if (!form) return;

  // IRS employee deferral limit for 2026, plus the flat catch-up allowed from age 50.
  const IRS_LIMIT = 24500;
  const CATCH_UP = 8000;
  const CATCH_UP_AGE = 50;

  const GREEN = '#10b981';
  const RED = '#dc2626';
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pctText = (v) => String(Math.round(v * 100) / 100);

  function num(id) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : NaN;
  }
  const radio = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value;

  function showError(msg) {
    el('k4-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('k4-results-section').hidden = true;
  }

  const statRow = (label, value, color) =>
    `<div class="stat-row"><span>${label}</span><strong${color ? ` style="color:${color}"` : ''}>${value}</strong></div>`;
  const summaryBox = (label, value, sub) =>
    `<div class="summary-payment-box"><div class="label">${label}</div><div class="value">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const note = (text) =>
    `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${text}</p>`;
  const heading = (text) => `<h4 style="margin:18px 0 4px;font-size:13px;">${text}</h4>`;

  function shortMoney(v) {
    const a = Math.abs(v);
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }

  function donutChart(segments) {
    const total = segments.reduce((s, x) => s + Math.max(x.value, 0), 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const p = (Math.max(seg.value, 0) / total) * 100;
      circles += `<circle cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"></circle>`;
      offset -= p;
    });
    const legend = segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('');
    return `<div class="donut-wrap" style="margin-top:16px;"><svg viewBox="0 0 42 42" class="donut">${circles}</svg><div class="donut-legend">${legend}</div></div>`;
  }

  function areaChart(points, retAge) {
    const W = 480, H = 240, pl = 56, pr = 12, pt = 14, pb = 34;
    const maxY = Math.max(...points.map((p) => p.bal), 1);
    const minX = points[0].age;
    const maxX = points[points.length - 1].age;
    const x = (a) => pl + ((a - minX) / (maxX - minX || 1)) * (W - pl - pr);
    const y = (v) => pt + (1 - Math.max(v, 0) / maxY) * (H - pt - pb);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p.bal).toFixed(1)}`).join(' ');
    const area = `${line} L${x(maxX).toFixed(1)},${y(0)} L${x(minX).toFixed(1)},${y(0)} Z`;
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:640px;height:auto;display:block;margin:0 auto;" role="img" aria-label="Projected 401(k) balance by age">` +
      `<line x1="${pl}" y1="${y(0)}" x2="${W - pr}" y2="${y(0)}" stroke="var(--border)"></line>` +
      `<path d="${area}" fill="var(--accent)" fill-opacity="0.12"></path>` +
      `<path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"></path>` +
      `<text x="${pl - 6}" y="${y(maxY) + 4}" text-anchor="end" ${txt}>${shortMoney(maxY)}</text>` +
      `<text x="${pl - 6}" y="${y(0) + 4}" text-anchor="end" ${txt}>$0</text>` +
      `<text x="${x(minX)}" y="${H - 10}" text-anchor="start" ${txt}>Age ${minX}</text>` +
      `<text x="${x(maxX)}" y="${H - 10}" text-anchor="end" ${txt}>Age ${retAge}</text></svg>`;
  }

  // ---------- Mode 1: project the 401(k) balance ----------
  function calcProject() {
    const age = Math.round(num('k4-age'));
    const retAge = Math.round(num('k4-retage'));
    const life = Math.round(num('k4-life'));
    const income = num('k4-income');
    const startBal = num('k4-balance');
    const contribPct = num('k4-contrib') / 100;
    const matchPct = num('k4-match') / 100;
    const matchLimit = num('k4-matchlimit') / 100;
    const raise = num('k4-raise') / 100;
    const r = num('k4-return') / 100;
    const inf = num('k4-infl') / 100;
    const applyLimit = el('k4-limit').checked;

    if (!Number.isFinite(age) || age < 16 || age > 100) return showError('Enter your current age.');
    if (!Number.isFinite(retAge) || retAge <= age) return showError('Your retirement age must be greater than your current age.');
    if (!Number.isFinite(life) || life <= retAge) return showError('Your life expectancy must be greater than your retirement age.');
    if (life > 120) return showError('Enter a life expectancy of 120 or less.');
    if (!Number.isFinite(income) || income <= 0) return showError('Enter your current annual salary.');
    if (!Number.isFinite(startBal) || startBal < 0) return showError('Enter your current 401(k) balance (0 or more).');
    if (!Number.isFinite(contribPct) || contribPct < 0 || contribPct > 1) return showError('Enter a contribution between 0% and 100% of salary.');
    if (!Number.isFinite(matchPct) || matchPct < 0) return showError('Enter the employer match (0 if there is none).');
    if (!Number.isFinite(matchLimit) || matchLimit < 0 || matchLimit > 1) return showError('Enter the employer match limit as a percent of salary (0 if there is none).');
    if (!Number.isFinite(raise) || raise <= -1) return showError('Enter a valid expected salary increase.');
    if (!Number.isFinite(r) || r <= -1) return showError('Enter a valid expected annual return.');
    if (!Number.isFinite(inf) || inf <= -1) return showError('Enter a valid expected inflation rate.');

    const n = retAge - age;
    const N = life - retAge;
    const rows = [];
    let bal = startBal;
    let totalEmployee = 0, totalEmployer = 0, totalReturn = 0;
    for (let k = 0; k < n; k++) {
      const salary = income * Math.pow(1 + raise, k);
      const want = contribPct * salary;
      const limit = applyLimit ? IRS_LIMIT * Math.pow(1 + inf, k) + (age + k >= CATCH_UP_AGE ? CATCH_UP : 0) : Infinity;
      const employee = Math.min(want, limit);
      // Once the limit is reached the employer stops matching for the rest of the year.
      const share = want > 0 ? employee / want : 1;
      const employer = matchPct * Math.min(contribPct, matchLimit) * salary * share;
      const contribution = employee + employer;
      const gain = r * (bal + contribution / 2);
      bal += contribution + gain;
      totalEmployee += employee; totalEmployer += employer; totalReturn += gain;
      rows.push({ age: age + k + 1, employee, employer, gain, end: bal });
    }
    const todayAtRet = Math.pow(1 + inf, n);
    const todayAtEnd = Math.pow(1 + inf, n + N);

    // Retirement withdrawals
    const fixedYear = Math.abs(r) < 1e-12 ? bal / N : (bal * r) / (1 - Math.pow(1 + r, -N));
    const m = r / 12;
    const fixedMonth = Math.abs(m) < 1e-12 ? bal / (12 * N) : (bal * m) / (1 - Math.pow(1 + m, -12 * N));
    const im = inf / 12;
    let growFactor = 0;
    for (let k = 0; k < 12 * N; k++) growFactor += Math.pow(1 + im, k) / Math.pow(1 + m, k + 1);
    const risingMonth = bal / growFactor;
    const infText = parseFloat((inf * 100).toFixed(2));

    const payout = [];
    let rb = bal;
    for (let y = 1; y <= N; y++) {
      const gain = rb * r;
      rb = rb + gain - fixedYear;
      payout.push({ age: retAge + y, gain, end: Math.abs(rb) < 0.005 ? 0 : rb });
    }

    el('k4-result').innerHTML =
      summaryBox(`Balance at age ${retAge}`, currency0(bal), `${currency0(bal / todayAtRet)} in today's purchasing power`) +
      statRow('Starting balance', currency0(startBal)) +
      statRow('Your contributions', currency0(totalEmployee)) +
      statRow('Employer match', currency0(totalEmployer)) +
      statRow('Investment returns', currency0(totalReturn)) +
      donutChart([
        { value: startBal, color: '#94a3b8', label: 'Starting balance' },
        { value: totalEmployee, color: 'var(--accent)', label: 'Your contributions' },
        { value: totalEmployer, color: '#f59e0b', label: 'Employer match' },
        { value: totalReturn, color: GREEN, label: 'Investment returns' },
      ]) +
      heading(`Withdrawals from age ${retAge + 1} to ${life}`) +
      statRow(`Rising ${infText}% a year, per month`, `${currency0(risingMonth)} (${currency0(risingMonth / todayAtRet)} today)`) +
      statRow('Fixed amount, per month', `${currency0(fixedMonth)} (${currency0(fixedMonth / todayAtRet)} today)`) +
      statRow('Fixed amount, per year', `${currency0(fixedYear)} (${currency0(fixedYear / todayAtRet)} today)`) +
      note(`Today's-dollar figures use your inflation rate. A fixed amount buys less each year: ${currency0(fixedMonth / todayAtEnd)} a month in today's dollars by age ${life}. Results are before tax. ${applyLimit ? `The IRS limit (${currency0(IRS_LIMIT)} now, plus ${currency0(CATCH_UP)} from age ${CATCH_UP_AGE}) is assumed to rise with inflation.` : 'The IRS contribution limit is ignored.'}`);

    el('k4-card-title').textContent = 'Projected 401(k) Balance';
    el('k4-chart').innerHTML = areaChart([{ age, bal: startBal }].concat(rows.map((x) => ({ age: x.age, bal: x.end }))), retAge);
    let t = '<table class="schedule-table"><thead><tr><th>Age</th><th>Your Contribution</th><th>Employer Match</th><th>Investment Return</th><th>End Balance</th></tr></thead><tbody>';
    rows.forEach((x) => { t += `<tr><td>${x.age}</td><td>${currency0(x.employee)}</td><td>${currency0(x.employer)}</td><td>${currency0(x.gain)}</td><td>${currency0(x.end)}</td></tr>`; });
    t += '</tbody></table>';
    t += heading('If you withdraw a fixed amount each year') +
      '<table class="schedule-table"><thead><tr><th>Age</th><th>Payout</th><th>Investment Return</th><th>End Balance</th></tr></thead><tbody>';
    payout.forEach((x) => { t += `<tr><td>${x.age}</td><td>-${currency0(fixedYear)}</td><td>${currency0(x.gain)}</td><td>${currency0(x.end)}</td></tr>`; });
    t += '</tbody></table>';
    el('k4-table-wrap').innerHTML = t;
    el('k4-results-section').hidden = false;
  }

  // ---------- Mode 2: early withdrawal costs ----------
  function calcEarly() {
    const amount = num('k4-w-amount');
    const fed = num('k4-w-fed') / 100;
    const state = num('k4-w-state') / 100;
    const local = num('k4-w-local') / 100;
    if (!Number.isFinite(amount) || amount <= 0) return showError('Enter the amount you want to withdraw.');
    if (![fed, state, local].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) return showError('Enter each tax rate between 0% and 100%.');
    if (fed + state + local >= 1) return showError('The tax rates add up to 100% or more. Check them and try again.');

    const employed = radio('k4-employed') === 'yes';
    const is55 = radio('k4-55') === 'yes';
    const disabled = radio('k4-disabled') === 'yes';
    const exempt = radio('k4-exempt') === 'yes';
    let why = null;
    if (disabled) why = 'you have a qualifying disability';
    else if (!employed && is55) why = 'you left your employer at 55 or older';
    else if (exempt) why = 'you qualify for another penalty exemption';
    const penalty = why ? 0 : amount * 0.1;
    const fedTax = amount * fed, stateTax = amount * state, localTax = amount * local;
    const total = penalty + fedTax + stateTax + localTax;
    const net = amount - total;

    el('k4-result').innerHTML =
      summaryBox('Amount you would receive', currency2(net), `${pctText((net / amount) * 100)}% of the ${currency2(amount)} withdrawn`) +
      statRow('Total tax and penalty', currency2(total), RED) +
      statRow('10% early withdrawal penalty', currency2(penalty), penalty ? RED : GREEN) +
      statRow('Federal income tax', currency2(fedTax)) +
      statRow('State income tax', currency2(stateTax)) +
      statRow('Local income tax', currency2(localTax)) +
      note(why ? `No 10% penalty applies because ${why}. Income tax is still due.` : 'A 10% penalty applies on top of income tax when you take money out before age 59 and a half, unless an exemption applies.') +
      note('The tax rates are your own estimates. The withdrawal is added to your income for the year, so a large one can push you into a higher bracket.');
    el('k4-results-section').hidden = true;
  }

  // ---------- Mode 3: maximize the employer match ----------
  function calcMaxMatch() {
    const age = Math.round(num('k4-m-age'));
    const income = num('k4-m-income');
    const m1 = num('k4-m-m1') / 100, l1 = num('k4-m-l1') / 100;
    const m2 = num('k4-m-m2') / 100 || 0, l2 = num('k4-m-l2') / 100 || 0;
    if (!Number.isFinite(age) || age < 16 || age > 100) return showError('Enter your current age.');
    if (!Number.isFinite(income) || income <= 0) return showError('Enter your current annual salary.');
    if (![m1, l1].every((v) => Number.isFinite(v) && v >= 0) || l1 > 1 || l2 > 1) return showError('Enter the employer match and its limit (as percents).');
    if (m1 <= 0 && m2 <= 0) return showError('Enter an employer match greater than zero.');

    const cap = IRS_LIMIT + (age >= CATCH_UP_AGE ? CATCH_UP : 0);
    const tier2On = m2 > 0 && l2 > 0;
    const fullPct = Math.max(m1 > 0 ? l1 : 0, tier2On ? l2 : 0);
    const maxPct = cap / income;
    const matchAt = (p) => m1 * Math.min(p, l1) * income + (tier2On ? m2 * Math.max(0, Math.min(p, l2) - l1) * income : 0);

    if (maxPct <= fullPct) {
      const employer = matchAt(maxPct);
      el('k4-result').innerHTML =
        summaryBox('Contribute the maximum', `${pctText(maxPct * 100)}%`, 'of annual income') +
        statRow('Your contribution (IRS limit)', currency0(cap)) +
        statRow('Employer match you can earn', currency0(employer), GREEN) +
        statRow('Total contribution', currency0(cap + employer)) +
        note(`Your salary is high enough that the IRS limit of ${currency0(cap)} is reached before you hit the ${pctText(fullPct * 100)}% needed for the full match, so you cannot capture all of it.`);
      el('k4-results-section').hidden = true;
      return;
    }

    const employer = matchAt(fullPct);
    const lowEmployee = fullPct * income;
    el('k4-result').innerHTML =
      summaryBox('Contribute between', `${pctText(fullPct * 100)}% and ${pctText(maxPct * 100)}%`, 'of annual income to earn the full match') +
      statRow('Full employer match per year', currency0(employer), GREEN) +
      statRow(`At ${pctText(fullPct * 100)}%: you contribute`, currency0(lowEmployee)) +
      statRow(`At ${pctText(fullPct * 100)}%: total with match`, currency0(lowEmployee + employer)) +
      statRow(`At ${pctText(maxPct * 100)}%: you contribute`, currency0(cap)) +
      statRow(`At ${pctText(maxPct * 100)}%: total with match`, currency0(cap + employer)) +
      note(`Below ${pctText(fullPct * 100)}% you leave some match unclaimed. Above ${pctText(maxPct * 100)}% you would hit the IRS limit of ${currency0(cap)} before year end and your employer would stop matching for the rest of the year.${maxPct > 0.15 ? ' Many plans cap contributions below that, so check what yours allows.' : ''}`);
    el('k4-results-section').hidden = true;
  }

  function applyMode() {
    const mode = el('k4-mode').value;
    form.querySelectorAll('[data-modes]').forEach((node) => {
      node.hidden = !node.dataset.modes.split(' ').includes(mode);
    });
  }

  function calculate() {
    const mode = el('k4-mode').value;
    if (mode === '1') calcProject();
    else if (mode === '2') calcEarly();
    else calcMaxMatch();
  }

  el('k4-mode').addEventListener('change', () => { applyMode(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMode();
  calculate();
})();
