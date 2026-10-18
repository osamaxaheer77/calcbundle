'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('na-form')) return;
  const pow10 = (n) => 10n ** BigInt(n);
  const err = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;overflow-wrap:anywhere;word-break:break-all;">${v}</strong></div>`;
  const MAX_DIGITS = 40000;
  const abs = (x) => (x < 0n ? -x : x);

  // exact decimals: value = N / 10^s
  function parse(raw) {
    const t = raw.trim().replace(/,/g, '');
    const m = t.match(/^([+-]?)(\d*)\.?(\d*)$/);
    if (!m || !/\d/.test(m[2] + m[3])) return null;
    return { N: BigInt(m[1] === '-' ? '-' + (m[2] + m[3] || '0') : m[2] + m[3] || '0'), s: m[3].length };
  }
  const norm = (v) => { while (v.s > 0 && v.N % 10n === 0n) { v = { N: v.N / 10n, s: v.s - 1 }; } return v; };
  const align = (a, b) => { const s = Math.max(a.s, b.s); return [a.N * pow10(s - a.s), b.N * pow10(s - b.s), s]; };
  const add = (a, b) => { const [x, y, s] = align(a, b); return norm({ N: x + y, s }); };
  const sub = (a, b) => { const [x, y, s] = align(a, b); return norm({ N: x - y, s }); };
  const mul = (a, b) => norm({ N: a.N * b.N, s: a.s + b.s });
  const fromInt = (n) => ({ N: BigInt(n), s: 0 });
  const isZero = (v) => v.N === 0n;
  const digitsOf = (v) => abs(v.N).toString().length;

  // text for one value: plain when short, otherwise scientific with 14 significant digits
  function show(v) {
    v = norm(v);
    const neg = v.N < 0n, a = abs(v.N).toString().padStart(v.s + 1, '0');
    const ip = a.slice(0, a.length - v.s), fp = v.s ? a.slice(a.length - v.s) : '';
    const total = (ip === '0' ? 0 : ip.length) + fp.length;
    if (total <= 30 && !(ip === '0' && fp.length > 20)) return (neg ? '-' : '') + ip.replace(/\B(?=(\d{3})+(?!\d))/g, '') + (fp ? '.' + fp : '');
    // scientific
    let digits, exp;
    if (ip !== '0') { digits = (ip + fp); exp = ip.length - 1; } else { const lead = fp.search(/[1-9]/); digits = fp.slice(lead); exp = -(lead + 1); }
    digits = digits.replace(/0+$/, '');
    let m = digits.slice(0, 14); if (digits.length > 14 && digits[14] >= '5') { m = String(BigInt(m) + 1n); if (m.length > 14) { m = m.slice(0, 14); exp += 1; } }
    m = m.replace(/0+$/, '');
    if (exp >= -5 && exp <= 14) {
      // moderate sizes read better as a plain decimal rounded to 14 significant digits
      const dg = m.padEnd(exp + 1, '0');
      const plain = exp >= 0 ? (dg.length > exp + 1 ? dg.slice(0, exp + 1) + '.' + dg.slice(exp + 1) : dg) : '0.' + '0'.repeat(-exp - 1) + m;
      return (neg ? '-' : '') + plain;
    }
    return `${neg ? '-' : ''}${m[0]}${m.length > 1 ? '.' + m.slice(1) : ''}E${exp >= 0 ? '+' : ''}${exp}`;
  }
  const list = (terms, more) => terms.map(show).join(', ') + (more ? ' ...' : '');
  const ordinal = (n) => `${n}<sup>th</sup>`;

  function parseN(id, max) {
    const raw = el(id).value.trim();
    if (!/^\d+$/.test(raw)) return null;
    const n = Number(raw); return n >= 1 && n <= max ? n : null;
  }

  // ---- arithmetic ----
  function arithmetic() {
    const a = parse(el('na-a').value), d = parse(el('na-d').value), n = parseN('na-n', 1000000);
    if (!a) return err('na-result', 'Please provide a numerical first number value.');
    if (!d) return err('na-result', 'Please provide a numerical common difference value.');
    if (!n) return err('na-result', 'Please provide a positive whole number (up to 1,000,000) as the number to obtain.');
    const nth = add(a, mul(d, fromInt(n - 1)));
    const twice = mul(fromInt(n), add(mul(a, fromInt(2)), mul(d, fromInt(n - 1))));
    const sumV = norm({ N: twice.N * 5n, s: twice.s + 1 });
    const terms = []; for (let i = 0; i < 9; i++) terms.push(add(a, mul(d, fromInt(i))));
    el('na-result').innerHTML = `<div class="summary-payment-box"><div class="label">${ordinal(n)} term</div><div class="value" style="overflow-wrap:anywhere;">${show(nth)}</div></div>` +
      row('Sequence', list(terms, true)) + row(`Sum of the first ${n} terms`, show(sumV)) +
      `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Formulas:</strong><br>aₙ = a₁ + (n − 1) × d<br>Sₙ = n × (a₁ + aₙ) ÷ 2</div>`;
  }

  // ---- geometric ----
  function geometric() {
    const a = parse(el('ng-a').value), r = parse(el('ng-r').value), n = parseN('ng-n', 100000);
    if (!a) return err('ng-result', 'Please provide a numerical first number value.');
    if (!r) return err('ng-result', 'Please provide a numerical common ratio value.');
    if (!n) return err('ng-result', 'Please provide a positive whole number (up to 100,000) as the number to obtain.');
    // r^(n-1) exactly, unless it gets too long
    if (digitsOf(r) > 1 && digitsOf(r) * n > MAX_DIGITS) return err('ng-result', 'That would make a number with more than 40,000 digits. Please try a smaller n or a simpler ratio.');
    if (r.s * n > MAX_DIGITS) return err('ng-result', 'That would make a number with more than 40,000 digits. Please try a smaller n or a simpler ratio.');
    let p = fromInt(1); for (let i = 0; i < n - 1; i++) p = mul(p, r);
    const nth = mul(a, p);
    const one = fromInt(1);
    const rn = mul(p, r); // r^n
    let sum;
    if (r.N === 1n && r.s === 0) sum = mul(a, fromInt(n));
    else {
      // a (1 - r^n) / (1 - r) is a whole division only for whole-number terms; do it exactly with rationals and cut the display
      const num = mul(a, sub(one, rn)), den = sub(one, r);
      const s = Math.max(num.s, den.s), N1 = num.N * pow10(s - num.s), D1 = den.N * pow10(s - den.s);
      const scaleUp = 30; const q = (N1 * pow10(scaleUp)) / D1; sum = norm({ N: q, s: scaleUp });
    }
    const terms = []; let t = a; for (let i = 0; i < 9; i++) { terms.push(t); t = mul(t, r); }
    const absR = Math.abs(Number(r.N) / 10 ** r.s);
    const inf = absR < 1 ? row('Sum of the infinite series (|r| < 1)', show(norm((() => { const den = sub(one, r); return { N: (a.N * pow10(30 + den.s)) / (den.N * pow10(a.s)), s: 30 }; })()))) : '';
    el('ng-result').innerHTML = `<div class="summary-payment-box"><div class="label">${ordinal(n)} term</div><div class="value" style="overflow-wrap:anywhere;">${show(nth)}</div></div>` +
      row('Sequence', list(terms, true)) + row(`Sum of the first ${n} terms`, show(sum)) + inf +
      `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Formulas:</strong><br>aₙ = a₁ × r<sup>n−1</sup><br>Sₙ = a₁ × (1 − r<sup>n</sup>) ÷ (1 − r)</div>`;
  }

  // ---- Fibonacci (fast doubling, exact) ----
  function fibPair(n) {
    if (n === 0n) return [0n, 1n];
    const [a, b] = fibPair(n >> 1n); const c = a * (2n * b - a), d = a * a + b * b;
    return n & 1n ? [d, c + d] : [c, d];
  }
  function fibonacci() {
    const n = parseN('nf-n', 200000);
    if (!n) return err('nf-result', 'Please provide a positive whole number (up to 200,000) as the number to obtain.');
    const f = fibPair(BigInt(n))[0], sum = fibPair(BigInt(n + 2))[0] - 1n;
    const terms = []; let x = 0n, y = 1n; for (let i = 0; i < 11; i++) { [x, y] = [y, x + y]; terms.push({ N: x, s: 0 }); }
    const f1 = show({ N: f, s: 0 }), digits = f.toString().length;
    el('nf-result').innerHTML = `<div class="summary-payment-box"><div class="label">${ordinal(n)} Fibonacci number</div><div class="value" style="overflow-wrap:anywhere;">${f1}</div>${digits > 30 ? `<div class="label" style="margin-top:6px;">${digits.toLocaleString('en-US')} digits</div>` : ''}</div>` +
      row('Sequence', list(terms, true)) + row(`Sum of the first ${n} numbers`, show({ N: sum, s: 0 })) +
      (digits > 30 && digits <= 600 ? row('Exact value', f.toString()) : '') +
      `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Rule:</strong> F₁ = 1, F₂ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂. The sum of the first n numbers is Fₙ₊₂ − 1.</div>`;
  }

  [['na-form', arithmetic], ['ng-form', geometric], ['nf-form', fibonacci]].forEach(([id, fn]) => el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); }));
  arithmetic(); geometric(); fibonacci();
})();
