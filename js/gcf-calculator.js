'use strict';

(function () {
  const M = window.IntMath;
  const el = (id) => document.getElementById(id);
  if (!M || !el('gc-form')) return;

  const fmt = (n) => M.group(n.toString());

  function calculate() {
    const nums = M.parseList(el('gc-in').value);
    if (!nums) { el('gc-result').innerHTML = '<p class="tool-result is-error">Enter two or more whole numbers above 0, separated by commas or spaces.</p>'; return; }
    if (nums.length < 2) { el('gc-result').innerHTML = '<p class="tool-result is-error">Enter at least two numbers.</p>'; return; }
    if (nums.length > 50) { el('gc-result').innerHTML = '<p class="tool-result is-error">Enter 50 numbers or fewer.</p>'; return; }
    let g = nums[0];
    nums.slice(1).forEach((n) => { g = M.gcd(g, n); });
    const name = `GCF(${nums.map(fmt).join(', ')})`;
    let html = `<div class="summary-payment-box"><div class="label">${name}</div><div class="value" style="overflow-wrap:anywhere;">${fmt(g)}</div></div>`;

    const facs = nums.map((n) => M.primeFactors(n));
    if (facs.every(Boolean)) {
      html += '<h3 style="margin:16px 0 6px;font-size:15px;">Prime factorization</h3><p style="font-size:13px;line-height:1.7;margin:0;overflow-wrap:anywhere;">';
      nums.forEach((n, i) => { html += `${fmt(n)} = ${n === 1n ? '1' : M.times(facs[i])}<br>`; });
      const counts = facs.map((f) => { const c = new Map(); f.forEach((p) => c.set(p, (c.get(p) || 0) + 1)); return c; });
      const parts = [];
      [...counts[0].keys()].sort((x, y) => x - y).forEach((p) => {
        const k = Math.min(...counts.map((c) => c.get(p) || 0));
        for (let i = 0; i < k; i++) parts.push(p);
      });
      html += `${name} = ${parts.length ? parts.join(' × ') : '1'} = ${fmt(g)}</p>`;
    }
    html += `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">${g === 1n ? 'The numbers share no common factor other than 1, so they are coprime.' : 'Every number divides evenly by the GCF.'}</p>`;
    el('gc-result').innerHTML = html;
  }

  el('gc-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
