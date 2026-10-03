'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ir-form');
  if (!form) return;

  const GREEN = '#10b981';
  const AMBER = '#f59e0b';
  const RED = '#dc2626';
  const currency0 = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  function showError(msg) {
    el('ir-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`;
    el('ir-results-section').hidden = true;
  }

  function lineChart(rows, startAge, endAge) {
    const W = 480, H = 250, pl = 58, pr = 12, pt = 14, pb = 44;
    const series = [
      { key: 'tradBefore', label: 'Traditional (before tax)', color: 'var(--accent)' },
      { key: 'tradAfter', label: 'Traditional (after tax)', color: '#8b5cf6' },
      { key: 'roth', label: 'Roth IRA', color: GREEN },
      { key: 'taxable', label: 'Taxable savings', color: RED },
      { key: 'contrib', label: 'Contributions (before tax)', color: AMBER },
    ];
    const pts = [{ age: startAge, ...rows[0].start }];
    rows.forEach((r) => pts.push({ age: r.age + 1, ...r.end }));
    const maxV = Math.max(1, ...pts.map((p) => Math.max(...series.map((s) => p[s.key]))));
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
      series.map((s) => `<span>${dot(s.color)}${s.label}</span>`).join('') + '</div>';
    return '<div style="max-width:640px;margin:0 auto;">' + legend +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Traditional IRA, Roth IRA and taxable balances by age">${grid}` +
      series.slice().reverse().map((s) => `<path d="${path(s.key)}" fill="none" stroke="${s.color}" stroke-width="2.5"></path>`).join('') + ticks +
      `<text x="${pl + (W - pl - pr) / 2}" y="${H - 6}" text-anchor="middle" ${txt}>Age</text></svg></div>`;
  }

  function calculate() {
    const start = num('ir-start');
    const annual = num('ir-annual');
    const rate = num('ir-rate');
    const age = Math.floor(num('ir-age'));
    const retire = Math.floor(num('ir-retire'));
    const taxNow = num('ir-tax');
    const taxLater = num('ir-tax-later');

    if (!Number.isFinite(start) || start < 0) return showError('Enter your current balance, 0 or more.');
    if (!Number.isFinite(annual) || annual < 0) return showError('Enter your yearly before-tax contribution, 0 or more.');
    if (!Number.isFinite(rate) || rate < 0 || rate > 30) return showError('Enter an expected rate of return between 0% and 30%.');
    if (!Number.isFinite(age) || age < 0 || age > 99) return showError('Enter your current age, from 0 to 99.');
    if (!Number.isFinite(retire) || retire <= age || retire > 100) return showError('Enter a retirement age that is later than your current age and no more than 100.');
    if (!Number.isFinite(taxNow) || taxNow < 0 || taxNow > 60) return showError('Enter a current marginal tax rate between 0% and 60%.');
    if (!Number.isFinite(taxLater) || taxLater < 0 || taxLater > 60) return showError('Enter an expected retirement tax rate between 0% and 60%.');

    const r = rate / 100, tn = taxNow / 100, tl = taxLater / 100;
    // Every dollar of take-home pay is worth (1 - tn) of a before-tax dollar. The Roth IRA and the
    // taxable account are funded with that after-tax money, so they start from smaller amounts.
    const rows = [];
    let trad = start, roth = start * (1 - tn), taxable = start * (1 - tn), contrib = start;
    const snap = () => ({ tradBefore: trad, tradAfter: trad * (1 - tl), roth, taxable, contrib });
    for (let a = age; a < retire; a++) {
      const s = snap();
      trad = trad * (1 + r) + annual;
      roth = roth * (1 + r) + annual * (1 - tn);
      taxable = taxable * (1 + r * (1 - tn)) + annual * (1 - tn);
      contrib += annual;
      rows.push({ age: a, start: s, end: snap() });
    }
    const end = snap();

    const diffTR = end.tradAfter - end.roth;
    let best, second, bestVal, secondVal, tie = Math.abs(diffTR) < 0.5;
    if (diffTR >= 0) { best = 'Traditional IRA'; second = 'Roth IRA'; bestVal = end.tradAfter; secondVal = end.roth; }
    else { best = 'Roth IRA'; second = 'Traditional IRA'; bestVal = end.roth; secondVal = end.tradAfter; }
    const secondVsTaxable = secondVal - end.taxable;

    const sentence = tie
      ? `With these tax rates, a Traditional IRA and a Roth IRA end at the same after-tax balance at age ${retire}. Both beat regular taxable savings by ${currency0(secondVal - end.taxable)}.`
      : `A <strong>${best}</strong> can accumulate <strong>${currency0(Math.abs(diffTR))} more</strong> after tax than a ${second} at age ${retire}. The ${second} can accumulate ${currency0(secondVsTaxable)} more than regular taxable savings.`;

    const cell = (label, a, b, c, bold) => `<tr${bold ? ' style="font-weight:700;"' : ''}><td>${label}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
    const table = '<div class="schedule-table-wrap" style="max-height:none;margin-top:14px;"><table class="schedule-table"><thead><tr><th></th><th>Traditional IRA</th><th>Roth IRA</th><th>Taxable Savings</th></tr></thead><tbody>' +
      cell(`Balance at age ${retire}`, currency0(end.tradBefore), currency0(end.roth), currency0(end.taxable)) +
      cell('After tax', currency0(end.tradAfter), currency0(end.roth), currency0(end.taxable), true) + '</tbody></table></div>';

    el('ir-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${tie ? 'Traditional and Roth IRA tie' : 'Best after-tax result'}</div><div class="value">${tie ? currency0(end.tradAfter) : best}</div>` +
      `<div class="label" style="margin-top:6px;">${tie ? 'after-tax balance at age ' + retire : currency0(bestVal) + ' after tax at age ' + retire}</div></div>` +
      `<div class="stat-row"><span>Traditional IRA after tax</span><strong>${currency0(end.tradAfter)}</strong></div>` +
      `<div class="stat-row"><span>Roth IRA</span><strong>${currency0(end.roth)}</strong></div>` +
      `<div class="stat-row"><span>Regular taxable savings</span><strong style="color:${GREEN}">${currency0(end.taxable)}</strong></div>` +
      table +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${sentence}</p>` +
      '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The Roth IRA and taxable savings are shown after tax, funded with the take-home value of the same contribution. The Traditional IRA is shown before and after the tax due when you withdraw it.</p>';

    el('ir-chart').innerHTML = lineChart(rows, age, retire);
    let html = '<table class="schedule-table"><thead><tr><th rowspan="2">Age</th><th colspan="2">Traditional (Before Tax)</th><th colspan="2">Traditional (After Tax)</th><th colspan="2">Roth IRA</th><th colspan="2">Taxable Savings</th></tr><tr><th>Start</th><th>End</th><th>Start</th><th>End</th><th>Start</th><th>End</th><th>Start</th><th>End</th></tr></thead><tbody>';
    rows.forEach((x) => {
      html += `<tr><td>${x.age}</td><td>${currency0(x.start.tradBefore)}</td><td>${currency0(x.end.tradBefore)}</td><td>${currency0(x.start.tradAfter)}</td><td>${currency0(x.end.tradAfter)}</td>` +
        `<td>${currency0(x.start.roth)}</td><td>${currency0(x.end.roth)}</td><td>${currency0(x.start.taxable)}</td><td>${currency0(x.end.taxable)}</td></tr>`;
    });
    el('ir-table-wrap').innerHTML = html + '</tbody></table>';
    el('ir-results-section').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
