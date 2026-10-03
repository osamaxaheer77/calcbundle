'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rt-form');
  if (!form) return;

  const GREEN = '#10b981';
  const AMBER = '#f59e0b';
  const LIMIT = 7500;          // 2026 Roth IRA contribution limit, under age 50
  const LIMIT_50 = 8600;       // 2026 limit with the catch-up contribution, age 50 and over
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('rt-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('rt-results-section').hidden = true;
  }

  const limitFor = (age) => (age >= 50 ? LIMIT_50 : LIMIT);

  function lineChart(rows, startAge, endAge) {
    const W = 480, H = 250, pl = 58, pr = 12, pt = 14, pb = 44;
    const pts = [{ age: startAge, roth: rows[0].rothStart, tax: rows[0].taxStart, prin: rows[0].prinStart }];
    rows.forEach((r) => pts.push({ age: r.age + 1, roth: r.rothEnd, tax: r.taxEnd, prin: r.prinEnd }));
    const maxV = Math.max(1, ...pts.map((p) => Math.max(p.roth, p.tax, p.prin)));
    const x = (a) => pl + ((a - startAge) / (endAge - startAge)) * (W - pl - pr);
    const y = (v) => pt + (1 - v / maxV) * (H - pt - pb);
    const path = (key) => pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const txt = 'font-size="12" fill="var(--text-secondary)"';
    const short = (v) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K');
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const v = (maxV / 4) * g;
      grid += `<line x1="${pl}" y1="${y(v)}" x2="${W - pr}" y2="${y(v)}" stroke="var(--border)"></line><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" ${txt}>${short(v)}</text>`;
    }
    const span = endAge - startAge;
    const step = span <= 10 ? 1 : span <= 25 ? 5 : 10;
    let ticks = '';
    for (let a = Math.ceil(startAge / step) * step; a <= endAge; a += step) ticks += `<text x="${x(a)}" y="${H - 22}" text-anchor="middle" ${txt}>${a}</text>`;
    const dot = (color) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;"></span>`;
    const legend = '<div style="display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--text-secondary);margin-bottom:8px;">' +
      `<span>${dot('var(--accent)')}Roth IRA</span><span>${dot(GREEN)}Taxable account</span><span>${dot(AMBER)}Principal</span></div>`;
    return '<div style="max-width:640px;margin:0 auto;">' + legend +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Roth IRA and taxable account balance by age">${grid}` +
      `<path d="${path('prin')}" fill="none" stroke="${AMBER}" stroke-width="2.5"></path><path d="${path('tax')}" fill="none" stroke="${GREEN}" stroke-width="2.5"></path><path d="${path('roth')}" fill="none" stroke="var(--accent)" stroke-width="2.5"></path>${ticks}` +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Age</text></svg></div>`;
  }

  function calculate() {
    const start = num('rt-start');
    const annual = num('rt-annual');
    const rate = num('rt-rate');
    const age = Math.floor(num('rt-age'));
    const retire = Math.floor(num('rt-retire'));
    const taxPct = num('rt-tax');
    const maximize = form.querySelector('input[name="rt-max"]:checked').value === 'y';

    if (!Number.isFinite(start) || start < 0) return showError('Enter your current balance, 0 or more.');
    if (!Number.isFinite(annual) || annual < 0) return showError('Enter your annual contribution, 0 or more.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 30) return showError('Enter an expected rate of return between 0% and 30%.');
    if (!Number.isFinite(age) || age < 0 || age > 99) return showError('Enter your current age, from 0 to 99.');
    if (!Number.isFinite(retire) || retire <= age || retire > 100) return showError('Enter a retirement age that is later than your current age and no more than 100.');
    if (!Number.isFinite(taxPct) || taxPct < 0 || taxPct > 60) return showError('Enter a marginal tax rate between 0% and 60%.');

    const r = rate / 100, t = taxPct / 100;
    const rows = [];
    let roth = start, tax = start, prin = start, totalTax = 0, capped = false;
    for (let a = age; a < retire; a++) {
      const limit = limitFor(a);
      let contribution = maximize ? limit : annual;
      if (contribution > limit) { contribution = limit; capped = true; }
      const taxable = tax * r * t;
      const row = { age: a, prinStart: prin, rothStart: roth, taxStart: tax };
      roth = roth * (1 + r) + contribution;
      tax = tax * (1 + r) - taxable + contribution;
      prin += contribution;
      totalTax += taxable;
      rows.push({ ...row, prinEnd: prin, rothEnd: roth, taxEnd: tax });
    }

    const rothInterest = roth - prin;
    const taxInterest = tax - prin + totalTax;
    const diff = roth - tax;

    const cell = (label, a, b, bold) => `<tr${bold ? ' style="font-weight:700;"' : ''}><td>${label}</td><td>${a}</td><td>${b}</td></tr>`;
    const compare = '<div class="schedule-table-wrap" style="max-height:none;margin-top:14px;"><table class="schedule-table"><thead><tr><th></th><th>Roth IRA</th><th>Taxable Account</th></tr></thead><tbody>' +
      cell(`Balance at age ${retire}`, currency0(roth), currency0(tax), true) +
      cell('Total principal', currency0(prin), currency0(prin)) +
      cell('Total interest', currency0(rothInterest), currency0(taxInterest)) +
      cell('Total tax', currency0(0), currency0(totalTax)) + '</tbody></table></div>';

    const sentence = diff > 0.5
      ? `With these figures, the Roth IRA can build <strong>${currency0(diff)} more</strong> than a regular taxable account by age ${retire}, because its growth is never taxed.`
      : 'With these figures, the Roth IRA and the taxable account end at the same balance, because no tax is charged on the growth in the taxable account.';

    el('rt-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Roth IRA balance at age ${retire}</div><div class="value">${currency0(roth)}</div>` +
      `<div class="label" style="margin-top:6px;">${diff > 0.5 ? currency0(diff) + ' more than a taxable account' : 'Same as a taxable account'}</div></div>` +
      `<div class="stat-row"><span>Taxable account balance</span><strong>${currency0(tax)}</strong></div>` +
      `<div class="stat-row"><span>Total you contribute</span><strong>${currency0(prin)}</strong></div>` +
      `<div class="stat-row"><span>Tax paid on growth, taxable account</span><strong style="color:${GREEN}">${currency0(totalTax)}</strong></div>` +
      compare +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${sentence}</p>` +
      (capped ? `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Your annual contribution is above the 2026 IRS limit of ${currency0(LIMIT)} (${currency0(LIMIT_50)} from age 50), so the limit was used in those years.</p>` : '');

    el('rt-chart').innerHTML = lineChart(rows, age, retire);
    let html = '<table class="schedule-table"><thead><tr><th rowspan="2">Age</th><th colspan="2">Principal</th><th colspan="2">Roth IRA</th><th colspan="2">Taxable Account</th></tr><tr><th>Start</th><th>End</th><th>Start</th><th>End</th><th>Start</th><th>End</th></tr></thead><tbody>';
    rows.forEach((x) => {
      html += `<tr><td>${x.age}</td><td>${currency0(x.prinStart)}</td><td>${currency0(x.prinEnd)}</td><td>${currency0(x.rothStart)}</td><td>${currency0(x.rothEnd)}</td><td>${currency0(x.taxStart)}</td><td>${currency0(x.taxEnd)}</td></tr>`;
    });
    el('rt-table-wrap').innerHTML = html + '</tbody></table>';
    el('rt-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input[name="rt-max"]').forEach((n) => n.addEventListener('change', () => {
    el('rt-annual').disabled = form.querySelector('input[name="rt-max"]:checked').value === 'y';
  }));
  calculate();
})();
