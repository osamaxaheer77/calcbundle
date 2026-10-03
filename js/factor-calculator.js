'use strict';

(function () {
  const M = window.IntMath;
  const el = (id) => document.getElementById(id);
  if (!M || !el('fc-form')) return;

  const g = (n) => M.group(n);

  function calculate() {
    const t = el('fc-in').value.trim().replace(/,/g, '');
    const out = el('fc-result');
    if (!/^\d+$/.test(t) || Number(t) < 1) { out.innerHTML = '<p class="tool-result is-error">Enter a whole number of 1 or more.</p>'; return; }
    const n = Number(t);
    if (n > 1e12) { out.innerHTML = '<p class="tool-result is-error">Enter a number up to 1,000,000,000,000.</p>'; return; }
    const primes = n === 1 ? [] : M.primeFactors(BigInt(n));
    const isPrime = n > 1 && primes.length === 1;
    const divs = M.divisors(n);
    const pairs = divs.filter((d) => d * d <= n).map((d) => `(${g(d)}, ${g(n / d)})`);
    let html = `<div class="summary-payment-box"><div class="label">${g(n)} has</div><div class="value">${divs.length} factor${divs.length === 1 ? '' : 's'}</div><div class="label" style="margin-top:6px;">${isPrime ? 'It is a prime number.' : n === 1 ? '1 is neither prime nor composite.' : 'It is not a prime number.'}</div></div>` +
      `<p style="font-size:13px;line-height:1.6;margin:14px 0 0;overflow-wrap:anywhere;"><strong>Factors:</strong> ${divs.length > 400 ? divs.slice(0, 400).map(g).join(', ') + ', … (' + divs.length + ' in all)' : divs.map(g).join(', ')}</p>` +
      `<p style="font-size:13px;line-height:1.6;margin:10px 0 0;overflow-wrap:anywhere;"><strong>Factor pairs:</strong> ${pairs.length > 200 ? pairs.slice(0, 200).join(' ') + ' …' : pairs.join(' ')}</p>`;
    if (n > 1) {
      html += `<p style="font-size:13px;line-height:1.6;margin:10px 0 0;"><strong>Prime factors:</strong> ${g(n)} = ${primes.map(g).join(' × ')}</p>`;
      if (!isPrime) {
        let v = n, steps = '';
        primes.slice(0, -1).forEach((p) => { steps += `${g(v)} = ${g(p)} × ${g(v / p)}<br>`; v /= p; });
        html += `<p style="font-size:12px;line-height:1.6;margin:10px 0 0;color:var(--text-secondary);"><strong>Factor tree steps:</strong><br>${steps}</p>`;
      }
    }
    out.innerHTML = html;
  }

  el('fc-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
