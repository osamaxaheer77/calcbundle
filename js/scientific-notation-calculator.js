'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('sn-form')) return;
  const pow10 = (n) => 10n ** BigInt(n);
  const err = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const wrap = 'overflow-wrap:anywhere;word-break:break-all;';
  const sup = (e) => `10<sup>${e}</sup>`;

  // ---------- turning digits and an exponent into the usual forms ----------
  // digits: string of digits (no sign, no point), pointPos: where the decimal point sits within them
  function forms(neg, digits, pointPos) {
    let first = digits.search(/[1-9]/);
    if (first < 0) return { sci: '0', exp: 0, mant: '0', e: '0e0', eng: '0', real: '0', engExp: 0 };
    const sign = neg ? '-' : '';
    const sigDigits = digits.slice(first).replace(/0+$/, '');
    const exp = pointPos - first - 1;
    const mant = sigDigits[0] + (sigDigits.length > 1 ? '.' + sigDigits.slice(1) : '');
    // engineering: exponent a multiple of 3
    const engExp = 3 * Math.floor(exp / 3), shift = exp - engExp;
    let ed = sigDigits.padEnd(shift + 1, '0');
    const eng = ed.slice(0, shift + 1) + (ed.length > shift + 1 ? '.' + ed.slice(shift + 1) : '');
    return { sign, mant, exp, engMant: eng, engExp };
  }
  function realText(neg, digits, pointPos, trim) {
    let d = digits, p = pointPos;
    const lead = d.search(/[^0]/); if (lead < 0) return '0';
    d = d.slice(lead); p -= lead;
    let out;
    if (p <= 0) out = '0.' + '0'.repeat(-p) + d; else if (p >= d.length) out = d + '0'.repeat(p - d.length); else out = d.slice(0, p) + '.' + d.slice(p);
    if (trim && out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '');
    return (neg ? '-' : '') + out;
  }

  // ---------- 1. converter ----------
  function parseNumber(raw) {
    const s = raw.replace(/[,\s]/g, '');
    const m = s.match(/^([+-]?)(\d*)\.?(\d*)(?:[eE]([+-]?\d+))?$/);
    if (!m || (m[2] === '' && m[3] === '') || (!/\d/.test(m[2] + m[3]))) return null;
    const e = m[4] ? Number(m[4]) : 0; if (Math.abs(e) > 100000) return null;
    return { neg: m[1] === '-', digits: m[2] + m[3], pointPos: m[2].length + e };
  }
  function convert() {
    const v = parseNumber(el('sn-num').value.trim());
    if (!v) return err('sn-result', 'Please provide a valid value.');
    const f = forms(v.neg, v.digits, v.pointPos);
    if (f.mant === '0') {
      el('sn-result').innerHTML = row('Scientific notation', '0 × 10<sup>0</sup>') + row('E-notation', '0e0') + row('Engineering notation', '0 × 10<sup>0</sup>') + row('Real number', '0'); return;
    }
    const sg = v.neg ? '-' : '';
    const real = realText(v.neg, v.digits, v.pointPos);
    el('sn-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Scientific notation</div><div class="value" style="${wrap}">${sg}${f.mant} × ${sup(f.exp)}</div></div>` +
      row('E-notation', `${sg}${f.mant}e${f.exp}`) + row('Engineering notation', `${sg}${f.engMant} × ${sup(f.engExp)}`) + row('Real number', real);
  }
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;${wrap}">${v}</strong></div>`;

  // ---------- 2. arithmetic on numbers in scientific notation ----------
  // exact decimal: value = N / 10^s with s >= 0
  function dec(sig, expo) {
    const m = sig.replace(/,/g, '').match(/^([+-]?)(\d*)\.?(\d*)$/);
    if (!m || !/\d/.test(m[2] + m[3])) return null;
    if (!/^[+-]?\d+$/.test(expo)) return null;
    const e = Number(expo); if (Math.abs(e) > 5000) return null;
    let N = BigInt(m[2] + m[3] || '0'), s = m[3].length - e;
    if (s < 0) { N *= pow10(-s); s = 0; }
    return { N: m[1] === '-' ? -N : N, s };
  }
  const align = (a, b) => { const s = Math.max(a.s, b.s); return [a.N * pow10(s - a.s), b.N * pow10(s - b.s), s]; };
  function isqrt(n) { if (n < 2n) return n; let x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  function show(label, r) {
    // r = {N, s}
    const neg = r.N < 0n, a = neg ? -r.N : r.N;
    if (a === 0n) return `<div class="summary-payment-box"><div class="label">${label} in scientific notation</div><div class="value">0 × 10<sup>0</sup></div></div>` + row('Real number', '0');
    const digits = a.toString(), pointPos = digits.length - r.s;
    const f = forms(neg, digits, pointPos);
    const real = realText(neg, digits, pointPos, true);
    const sg = neg ? '-' : '';
    return `<div class="summary-payment-box"><div class="label">${label} in scientific notation</div><div class="value" style="${wrap}">${sg}${f.mant} × ${sup(f.exp)}</div></div>` +
      row('E-notation', `${sg}${f.mant}e${f.exp}`) + row('Real number', real.length > 400 ? real.slice(0, 400) + '…' : real);
  }

  function operate(op) {
    const x = dec(el('sc-x').value.trim(), el('sc-xp').value.trim()), y = dec(el('sc-y').value.trim(), el('sc-yp').value.trim());
    const cpRaw = el('sc-cp').value.trim(), cp = Number(cpRaw);
    const needY = !['sqrt', 'square'].includes(op);
    if (!x) return err('sc-result', 'Please provide a valid x value (a number, and a whole-number exponent).');
    if (needY && !y) return err('sc-result', 'Please provide a valid y value (a number, and a whole-number exponent).');
    if (cpRaw === '' || !Number.isInteger(cp) || cp < 1 || cp > 1000) return err('sc-result', 'Please provide positive integer as precision.');
    let r, label;
    if (op === 'plus' || op === 'minus') { const [a, b, s] = align(x, y); r = { N: op === 'plus' ? a + b : a - b, s }; label = op === 'plus' ? 'X + Y' : 'X − Y'; }
    else if (op === 'multiple') { r = { N: x.N * y.N, s: x.s + y.s }; label = 'X × Y'; }
    else if (op === 'divide') {
      if (y.N === 0n) return err('sc-result', 'Y cannot be zero when dividing.');
      const num = x.N * pow10(y.s + cp), den = y.N * pow10(x.s);
      r = { N: num / den, s: cp }; label = 'X / Y';
    } else if (op === 'pow') {
      if (y.s > 0 && y.N % pow10(y.s) !== 0n) return err('sc-result', 'The y value needs to be an integer.');
      const e = y.N / pow10(y.s);
      if (e > 20000n || e < -20000n) return err('sc-result', 'The exponent y is too large for this calculator (limit 20,000).');
      const n = Number(e < 0n ? -e : e);
      if (x.N === 0n && e < 0n) return err('sc-result', 'Zero cannot be raised to a negative power.');
      if ((x.N < 0n ? -x.N : x.N).toString().length * n > 120000) return err('sc-result', 'The result is too large to display.');
      let P = x.N ** BigInt(n), S = x.s * n;
      if (e < 0n) { P = pow10(S + cp) / P; S = cp; }
      r = { N: P, s: S }; label = 'X^Y';
    } else if (op === 'sqrt') {
      if (x.N < 0n) return err('sc-result', 'Cannot take the square root of a negative number.');
      const k = 2 * cp - x.s; const arg = k >= 0 ? x.N * pow10(k) : x.N / pow10(-k);
      r = { N: isqrt(arg), s: cp }; label = '√X';
    } else { r = { N: x.N * x.N, s: 2 * x.s }; label = 'X²'; }
    el('sc-result').innerHTML = show(label, r);
  }

  el('sn-form').addEventListener('submit', (e) => { e.preventDefault(); convert(); });
  el('sc-form').addEventListener('submit', (e) => { e.preventDefault(); operate('plus'); });
  ['plus', 'minus', 'multiple', 'divide', 'pow', 'sqrt', 'square'].forEach((op) => el('sc-op-' + op).addEventListener('click', (e) => { e.preventDefault(); operate(op); }));
  convert(); operate('multiple');
})();
