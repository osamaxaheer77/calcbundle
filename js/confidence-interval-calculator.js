'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const S = window.StatsCommon;
  if (!el('ci-form') || !S) return;

  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fixed = (v, d) => {
    const s = Math.abs(v).toFixed(d), [i, fr] = s.split('.');
    return (v < 0 && Number(s) !== 0 ? '-' : '') + group(i) + (fr ? '.' + fr : '');
  };
  const trim = (v) => String(Number(v.toPrecision(12)));
  const error = (msg) => { el('ci-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function calculate() {
    const rawN = el('ci-n').value.trim(), rawM = el('ci-mean').value.trim().replace(/,/g, ''), rawS = el('ci-sd').value.trim().replace(/,/g, ''), rawC = el('ci-cl').value.trim();
    const n = Number(rawN), mean = Number(rawM), sd = Number(rawS), cl = Number(rawC);
    if (rawN === '' || !Number.isInteger(n) || n < 1) return error('Please provide a positive integer as sample size value.');
    if (rawM === '' || !Number.isFinite(mean)) return error('Please provide a numerical sample mean value.');
    if (rawS === '' || !Number.isFinite(sd) || sd <= 0) return error('Please provide a numerical and positive standard deviation value.');
    if (rawC === '' || !Number.isFinite(cl) || cl <= 0 || cl >= 100) return error('Please provide a numerical confidence level value between 0 and 100%.');

    const useT = el('ci-t').checked;
    const level = cl / 100;
    let crit, name;
    if (useT) {
      if (n < 2) return error('The t-distribution needs a sample size of at least 2. Untick the box to use the z-score.');
      crit = S.tCritical(level, n - 1); name = 't';
    } else { crit = S.inv(1 - (1 - level) / 2); name = 'Z'; }
    const se = sd / Math.sqrt(n);
    const margin = crit * se;
    const lo = mean - margin, hi = mean + margin;
    let pct = '';
    if (mean !== 0) {
      const v = (margin / mean) * 100;
      pct = ` (±${Math.abs(v) < 0.1 ? v.toFixed(3) : v.toFixed(1)}%)`;
    }
    const spread = n < 30 && !useT
      ? '<p class="tool-result" style="background:#fffbeb;border:1px solid #fde68a;color:#78350f;margin:0 0 12px;">Your sample is smaller than 30. If you only have the sample standard deviation, tick the t-distribution box for a more accurate (wider) interval.</p>'
      : '';
    el('ci-result').innerHTML = spread +
      `<div class="summary-payment-box"><div class="label">${trim(cl)}% confidence interval</div><div class="value">${trim(mean)} ± ${fixed(margin, 3)}</div><div class="label" style="margin-top:6px;">${fixed(lo, 3)} to ${fixed(hi, 3)}${pct}</div></div>` +
      `<div class="stat-row"><span>Critical value (${name})</span><strong>${crit.toFixed(4)}</strong></div>` +
      `<div class="stat-row"><span>Standard error (SD ÷ √n)</span><strong>${fixed(se, 4)}</strong></div>` +
      `<div class="stat-row"><span>Margin of error</span><strong>±${fixed(margin, 3)}</strong></div>` +
      `<div class="stat-row"><span>Lower bound</span><strong>${fixed(lo, 3)}</strong></div>` +
      `<div class="stat-row"><span>Upper bound</span><strong>${fixed(hi, 3)}</strong></div>` +
      `<div class="callout" style="margin-top:14px;"><strong>Steps:</strong> CI = x̄ ± ${name} × s ÷ √n = ${trim(mean)} ± ${crit.toFixed(4)} × ${trim(sd)} ÷ √${n} = ${trim(mean)} ± ${fixed(margin, 3)}.</div>` +
      bar(lo, hi, mean);
  }

  // A simple error bar: the dot is the sample mean, the whiskers are the interval.
  function bar(lo, hi, mean) {
    const w = 320, pad = 24, span = hi - lo || 1, x = (v) => pad + ((v - lo) / span) * (w - 2 * pad);
    return `<svg viewBox="0 0 ${w} 56" width="100%" role="img" aria-label="Error bar from ${fixed(lo, 3)} to ${fixed(hi, 3)} with the mean at ${trim(mean)}" style="margin-top:12px;max-width:420px;">` +
      `<line x1="${pad}" x2="${w - pad}" y1="26" y2="26" stroke="#2563eb" stroke-width="3"/>` +
      `<line x1="${pad}" x2="${pad}" y1="16" y2="36" stroke="#2563eb" stroke-width="3"/><line x1="${w - pad}" x2="${w - pad}" y1="16" y2="36" stroke="#2563eb" stroke-width="3"/>` +
      `<circle cx="${x(mean)}" cy="26" r="6" fill="#f59e0b"/>` +
      `<text x="${pad}" y="52" font-size="11" fill="#6b7280" text-anchor="middle">${fixed(lo, 2)}</text><text x="${w - pad}" y="52" font-size="11" fill="#6b7280" text-anchor="middle">${fixed(hi, 2)}</text></svg>`;
  }

  el('ci-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('ci-t').addEventListener('change', calculate);
  calculate();
})();
