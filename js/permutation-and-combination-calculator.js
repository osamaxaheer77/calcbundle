'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pc-form');
  if (!form) return;

  const MAX_EXACT_DIGITS = 3000;
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // ln(m!) exactly for small m, by Stirling's series for large m
  function lnFact(m) {
    if (m < 20) { let s = 0; for (let i = 2; i <= m; i++) s += Math.log(i); return s; }
    const x = m + 1;
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x) - 1 / (360 * x ** 3) + 1 / (1260 * x ** 5);
  }
  const log10Perm = (n, r) => (lnFact(n) - lnFact(n - r)) / Math.LN10;
  const log10Comb = (n, r) => (lnFact(n) - lnFact(r) - lnFact(n - r)) / Math.LN10;

  function perm(n, r) { let p = 1n; for (let i = n - r + 1; i <= n; i++) p *= BigInt(i); return p; }
  function comb(n, r) {
    const k = Math.min(r, n - r); let c = 1n;
    for (let i = 1; i <= k; i++) c = (c * BigInt(n - k + i)) / BigInt(i);
    return c;
  }

  // Exact whole number when it is a sensible length, otherwise a scientific-notation estimate.
  function show(log10v, exact) {
    if (log10v < MAX_EXACT_DIGITS) {
      const s = exact().toString();
      const text = group(s);
      const sci = s.length > 15 ? ` <span style="color:var(--text-secondary);font-weight:400;">(≈ ${s[0]}.${s.slice(1, 7)} × 10<sup>${s.length - 1}</sup>, ${s.length} digits)</span>` : '';
      return `<span style="overflow-wrap:anywhere;">${text}</span>${sci}`;
    }
    const e = Math.floor(log10v), mant = Math.pow(10, log10v - e);
    return `≈ ${mant.toFixed(6)} × 10<sup>${group(String(e))}</sup> <span style="color:var(--text-secondary);font-weight:400;">(about ${group(String(e + 1))} digits, too long to write out)</span>`;
  }

  function parseCount(id) {
    const s = el(id).value.trim().replace(/,/g, '');
    return /^\d{1,6}$/.test(s) ? Number(s) : NaN;
  }

  function calculate() {
    const n = parseCount('pc-n'), r = parseCount('pc-r');
    if (Number.isNaN(n) || Number.isNaN(r)) {
      el('pc-result').innerHTML = '<p class="tool-result is-error">Enter whole numbers from 0 to 999,999 for n and r.</p>';
      return;
    }
    if (r > n) {
      el('pc-result').innerHTML = '<p class="tool-result is-error">r cannot be larger than n. You cannot choose more items than the set contains (without repetition).</p>';
      return;
    }
    const lp = log10Perm(n, r), lc = log10Comb(n, r);
    const lrep = n === 0 ? 0 : r * Math.log10(n);
    const lcrep = log10Comb(n + r - 1 < 0 ? 0 : n + r - 1, r);
    const nr = n - r;
    const row = (label, value) => `<div class="stat-row"><span>${label}</span><strong style="text-align:right;">${value}</strong></div>`;
    el('pc-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Permutations, ${n}P${r} (order matters)</div><div class="value" style="font-size:24px;line-height:1.3;">${show(lp, () => perm(n, r))}</div></div>` +
      `<div class="summary-payment-box" style="margin-top:12px;"><div class="label">Combinations, ${n}C${r} (order does not matter)</div><div class="value" style="font-size:24px;line-height:1.3;">${show(lc, () => comb(n, r))}</div></div>` +
      `<div class="callout" style="margin-top:14px;"><strong>Steps:</strong><br>` +
      `P = n! ÷ (n − r)! = ${n}! ÷ (${n} − ${r})! = ${n}! ÷ ${nr}!<br>` +
      `C = n! ÷ (r! × (n − r)!) = ${n}! ÷ (${r}! × ${nr}!)</div>` +
      `<h3 style="margin:18px 0 8px;font-size:15px;">If items can repeat</h3>` +
      row(`Arrangements with repetition (n<sup>r</sup>)`, show(lrep, () => (n === 0 ? 1n : BigInt(n) ** BigInt(r)))) +
      row(`Combinations with repetition, C(n + r − 1, r)`, show(lcrep, () => (n + r === 0 ? 1n : comb(n + r - 1, r))));
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
