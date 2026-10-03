'use strict';

(function () {
  const M = window.IntMath;
  const el = (id) => document.getElementById(id);
  if (!M || !el('lc-form')) return;

  const fmt = (n) => M.group(n.toString());
  const BAD = 'Enter two or more whole numbers above 0, separated by commas or spaces.';

  function calculate() {
    const nums = M.parseList(el('lc-in').value);
    if (!nums) { el('lc-result').innerHTML = `<p class="tool-result is-error">${BAD}</p>`; return; }
    if (nums.length < 2) { el('lc-result').innerHTML = '<p class="tool-result is-error">Enter at least two numbers.</p>'; return; }
    if (nums.length > 50) { el('lc-result').innerHTML = '<p class="tool-result is-error">Enter 50 numbers or fewer.</p>'; return; }
    let l = nums[0], g = nums[0];
    nums.slice(1).forEach((n) => { l = M.lcm(l, n); g = M.gcd(g, n); });
    const name = `LCM(${nums.map(fmt).join(', ')})`;
    let html = `<div class="summary-payment-box"><div class="label">${name}</div><div class="value" style="overflow-wrap:anywhere;">${fmt(l)}</div></div>`;

    if (nums.length === 2) {
      const [a, b] = nums;
      html += '<h3 style="margin:16px 0 6px;font-size:15px;">Greatest common divisor method</h3>' +
        `<p style="font-size:13px;line-height:1.7;margin:0;overflow-wrap:anywhere;">GCD(${fmt(a)}, ${fmt(b)}) = ${fmt(g)}<br>` +
        (g === 1n ? `Since GCD = 1, LCM = ${fmt(a)} × ${fmt(b)} = ${fmt(l)}` : `LCM = ${fmt(a)} × ${fmt(b)} ÷ ${fmt(g)} = ${fmt(a * b)} ÷ ${fmt(g)} = ${fmt(l)}`) + '</p>';
    } else {
      html += `<div class="stat-row"><span>GCD(${nums.map(fmt).join(', ')})</span><strong style="overflow-wrap:anywhere;">${fmt(g)}</strong></div>`;
    }

    const facs = nums.map((n) => M.primeFactors(n));
    if (facs.every(Boolean)) {
      html += '<h3 style="margin:16px 0 6px;font-size:15px;">Prime factorization method</h3><p style="font-size:13px;line-height:1.7;margin:0;overflow-wrap:anywhere;">';
      nums.forEach((n, i) => { html += `${fmt(n)} = ${n === 1n ? '1' : M.times(facs[i])}<br>`; });
      // highest power of each prime
      const maxes = new Map();
      facs.forEach((f) => { const c = new Map(); f.forEach((p) => c.set(p, (c.get(p) || 0) + 1)); c.forEach((k, p) => { if (!maxes.has(p) || maxes.get(p) < k) maxes.set(p, k); }); });
      const parts = [];
      [...maxes.keys()].sort((x, y) => x - y).forEach((p) => { for (let k = 0; k < maxes.get(p); k++) parts.push(p); });
      html += `${name} = ${parts.length ? parts.join(' × ') : '1'} = ${fmt(l)}</p>`;
    }
    el('lc-result').innerHTML = html;
  }

  el('lc-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
