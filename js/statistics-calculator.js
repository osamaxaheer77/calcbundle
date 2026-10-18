'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('st-form');
  if (!form) return;

  // About 14 significant digits, no exponent unless the number is extreme.
  function f(v) {
    if (v === 0) return '0';
    const r = Number(v.toPrecision(14));
    const a = Math.abs(r);
    if (a >= 1e21 || a < 1e-9) return r.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', ' × 10^').replace('e', ' × 10^');
    return String(r);
  }
  const row = (label, value) => `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;

  function parse(text) {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return null;
    const nums = parts.map(Number);
    return nums.some((v) => !Number.isFinite(v)) ? null : nums;
  }

  function calculate() {
    const values = parse(el('st-numbers').value);
    if (!values) {
      el('st-result').innerHTML = '<p class="tool-result is-error">Enter numbers separated by commas, spaces or new lines. Letters and symbols are not allowed.</p>';
      return;
    }
    const n = values.length;
    const sorted = values.slice().sort((a, b) => a - b);
    const sum = values.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

    const counts = new Map();
    sorted.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    const top = Math.max(...counts.values());
    let modeText;
    if (top === 1) modeText = 'All values appeared just once.';
    else {
      // listed in the order they first appear in your data
      const modes = [...new Set(values)].filter((v) => counts.get(v) === top).map(f);
      modeText = modes.length === 1 ? `${modes[0]}, appeared ${top} times` : `${modes.join(', ')}, each appeared ${top} times`;
    }

    // The geometric mean is the nth root of the product, so it needs a product that is not negative.
    let gm;
    const negatives = values.filter((v) => v < 0).length;
    if (values.includes(0)) gm = '0';
    else if (negatives % 2 === 1) gm = 'undefined (the product of your numbers is negative)';
    else {
      const prod = values.reduce((a, v) => a * v, 1);
      gm = f(Number.isFinite(prod) && prod > 1e-300 ? Math.pow(prod, 1 / n) : Math.exp(values.reduce((a, v) => a + Math.log(Math.abs(v)), 0) / n));
    }

    const ss = values.reduce((s, v) => s + (v - mean) * (v - mean), 0);
    const popVar = ss / n;
    const sampVar = n > 1 ? ss / (n - 1) : null;

    el('st-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Mean (Average)</div><div class="value">${f(mean)}</div><div class="label" style="margin-top:6px;">${n} value${n === 1 ? '' : 's'}</div></div>` +
      row('Count', n) +
      row('Sum', f(sum)) +
      row('Median', f(median)) +
      row('Mode', modeText) +
      row('Largest', f(sorted[n - 1])) +
      row('Smallest', f(sorted[0])) +
      row('Range', f(sorted[n - 1] - sorted[0])) +
      row('Geometric Mean', gm) +
      row('Standard Deviation (population, σ)', f(Math.sqrt(popVar))) +
      row('Variance (population, σ²)', f(popVar)) +
      row('Sample Standard Deviation (s)', sampVar === null ? 'needs at least 2 values' : f(Math.sqrt(sampVar))) +
      row('Sample Variance (s²)', sampVar === null ? 'needs at least 2 values' : f(sampVar)) +
      `<p style="font-size:13px;line-height:1.6;color:var(--text-secondary);margin:12px 0 0;word-break:break-word;"><strong>Sorted data:</strong> ${sorted.map(f).join(', ')}</p>`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
