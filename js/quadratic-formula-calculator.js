'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('qf-form');
  if (!form) return;

  // Accepts numbers, decimals and simple fractions such as 3/4 or -1/2.
  function parse(s) {
    const t = s.trim().replace(/\s+/g, '');
    if (t === '') return NaN;
    const m = /^([+-]?\d*\.?\d+)\/([+-]?\d*\.?\d+)$/.exec(t);
    if (m) { const d = Number(m[2]); return d === 0 ? NaN : Number(m[1]) / d; }
    return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? Number(t) : NaN;
  }
  const clean = (v) => { const s = Number(v.toPrecision(12)); return Object.is(s, -0) ? 0 : s; };
  const num = (v) => { const s = String(clean(v)); return s.includes('e') ? Number(s).toExponential() : s; };
  const show = (v) => (v < 0 ? `(${num(v)})` : num(v));
  const sgn = (v, first) => (first ? (v < 0 ? '−' : '') + num(Math.abs(v)) : `${v < 0 ? '−' : '+'} ${num(Math.abs(v))}`);

  function equation(a, b, c) {
    const term = (v, x, first) => {
      if (v === 0) return '';
      const mag = Math.abs(v) === 1 && x ? '' : num(Math.abs(v));
      const sign = first ? (v < 0 ? '−' : '') : v < 0 ? ' − ' : ' + ';
      return sign + mag + x;
    };
    const parts = [term(a, 'x<sup>2</sup>', true)];
    parts.push(term(b, 'x', parts[0] === ''));
    parts.push(term(c, '', parts[0] === '' && parts[1] === ''));
    return (parts.join('') || '0') + ' = 0';
  }

  // Square root of a whole number as k√m, when it is not a perfect square.
  function simplifyRoot(n) {
    let k = 1, m = n;
    for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
    return { k, m };
  }
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));
  function exactText(a, b, c, disc) {
    if (![a, b, c].every(Number.isInteger) || disc <= 0 || Math.abs(disc) > 1e12) return null;
    const { k, m } = simplifyRoot(disc);
    if (m === 1) return null;
    // x = (-b ± k√m) / 2a, reduced by the common factor
    const g = gcd(gcd(b, k), 2 * a);
    const den = (2 * a) / g, nb = -b / g, nk = k / g;
    const sd = den < 0 ? -1 : 1;
    const rad = `${nk === 1 ? '' : nk}√${m}`;
    const d = Math.abs(den);
    return `x = (${num(nb * sd)} ± ${rad}) ÷ ${d}`.replace(/ ÷ 1$/, '').replace('(0 ± ', '(± ').replace(/^x = \(± (.*)\)$/, 'x = ± $1');
  }

  function calculate() {
    const a = parse(el('qf-a').value), b = parse(el('qf-b').value), c = parse(el('qf-c').value);
    const out = el('qf-result');
    if ([a, b, c].some(Number.isNaN)) { out.innerHTML = '<p class="tool-result is-error">Enter a, b and c as numbers or fractions such as 3/4.</p>'; return; }
    if (a === 0) {
      if (b === 0) { out.innerHTML = '<p class="tool-result is-error">With a and b both 0, there is no x to solve for.</p>'; return; }
      const x = -c / b;
      out.innerHTML = `<p style="font-size:13px;margin:0 0 6px;">Equation: ${equation(a, b, c)}</p>` +
        `<div class="summary-payment-box"><div class="label">Solution (a = 0, so the equation is linear)</div><div class="value">x = ${num(x)}</div></div>` +
        `<p style="font-size:13px;line-height:1.7;margin:12px 0 0;"><strong>Steps:</strong> x = −c ÷ b = ${show(-c)} ÷ ${show(b)} = ${num(x)}</p>`;
      return;
    }
    const disc = b * b - 4 * a * c;
    const eq = `<p style="font-size:13px;margin:0 0 6px;">Equation: ${equation(a, b, c)}</p>`;
    const steps = `<p style="font-size:13px;line-height:1.8;margin:12px 0 0;"><strong>Steps:</strong><br>x = (−b ± √(b² − 4ac)) ÷ 2a<br>` +
      `= (${num(-b)} ± √(${show(b)}² − 4 × ${show(a)} × ${show(c)})) ÷ (2 × ${show(a)})<br>` +
      `= (${num(-b)} ± √${num(disc)}) ÷ ${num(2 * a)}`;
    let html = eq, tail = '';
    if (disc > 0) {
      const r = Math.sqrt(disc);
      // use the numerically stable form for the root that would otherwise cancel
      const q = -0.5 * (b + Math.sign(b || 1) * r);
      const r1 = q / a, r2 = q !== 0 ? c / q : -b / (2 * a);
      const hi = Math.max(r1, r2), lo = Math.min(r1, r2);
      const first = (-b + r) / (2 * a), second = (-b - r) / (2 * a);
      const x1 = first >= second ? hi : lo, x2 = first >= second ? lo : hi;
      html += `<div class="summary-payment-box"><div class="label">Two real solutions</div><div class="value" style="font-size:20px;">x = ${num(x1)}<br>x = ${num(x2)}</div></div>`;
      const ex = exactText(a, b, c, disc);
      tail = (ex ? `<br>${ex}` : '') + `<br>= ${num(x1)} or ${num(x2)}`;
    } else if (disc === 0) {
      const x = -b / (2 * a);
      html += `<div class="summary-payment-box"><div class="label">One real solution (repeated)</div><div class="value">x = ${num(x)}</div></div>`;
      tail = `<br>= ${num(x)}`;
    } else {
      const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * Math.abs(a));
      const imText = im === 1 ? 'i' : `${num(im)}i`;
      html += `<div class="summary-payment-box"><div class="label">Two imaginary solutions</div><div class="value" style="font-size:20px;">x = ${num(re)} ± ${imText}</div></div>`.replace('x = 0 ± ', 'x = ± ');
      tail = `<br>= ${num(re)} ± ${imText}`.replace('= 0 ± ', '= ± ');
    }
    html += `<div class="stat-row"><span>Discriminant (b² − 4ac)</span><strong>${num(disc)}</strong></div>` + steps + tail + '</p>';
    out.innerHTML = html;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
