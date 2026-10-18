'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('bn-form')) return;
  const pow10 = (n) => 10n ** BigInt(n);
  const err = (msg) => { el('bn-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const MAX_DIGITS = 150000;

  // exact decimal: value = N / 10^s
  function parse(raw) {
    const t = raw.replace(/[,\s]/g, '');
    const m = t.match(/^([+-]?)(\d*)\.?(\d*)(?:[eE]([+-]?\d+))?$/);
    if (!m || !/\d/.test(m[2] + m[3])) return null;
    const e = m[4] ? Number(m[4]) : 0; if (Math.abs(e) > 100000) return null;
    let N = BigInt(m[2] + m[3]), s = m[3].length - e;
    if (s < 0) { if (-s > MAX_DIGITS) return null; N *= pow10(-s); s = 0; }
    return { N: m[1] === '-' ? -N : N, s };
  }
  const align = (a, b) => { const s = Math.max(a.s, b.s); return [a.N * pow10(s - a.s), b.N * pow10(s - b.s), s]; };
  const isInt = (v) => v.s === 0 || v.N % pow10(v.s) === 0n;
  const toInt = (v) => v.N / pow10(v.s);
  const abs = (x) => (x < 0n ? -x : x);
  const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  function isqrt(n) { if (n < 2n) return n; let x = 1n << BigInt((n.toString(2).length + 1) >> 1); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  function format(r) {
    const neg = r.N < 0n; const a = abs(r.N).toString().padStart(r.s + 1, '0');
    let ip = a.slice(0, a.length - r.s), fp = r.s ? a.slice(a.length - r.s).replace(/0+$/, '') : '';
    const plain = (neg && (ip !== '0' || fp) ? '-' : '') + ip + (fp ? '.' + fp : '');
    return { shown: (neg && (ip !== '0' || fp) ? '-' : '') + group(ip) + (fp ? '.' + fp : ''), plain, intDigits: ip === '0' ? 0 : ip.length, isZero: ip === '0' && !fp, ip, fp, neg };
  }
  function sci(f) {
    if (f.isZero) return '0';
    let digits, exp;
    if (f.ip !== '0') { digits = (f.ip + f.fp).replace(/0+$/, ''); exp = f.ip.length - 1; }
    else { const lead = f.fp.search(/[1-9]/); digits = f.fp.slice(lead).replace(/0+$/, ''); exp = -(lead + 1); }
    return `${f.neg ? '-' : ''}${digits[0]}${digits.length > 1 ? '.' + digits.slice(1, 16) : ''}${digits.length > 16 ? '…' : ''} × 10<sup>${exp}</sup>`;
  }

  function calculate(op) {
    const x = parse(el('bn-x').value), needY = !['sqrt', 'square', 'factor'].includes(op), y = needY ? parse(el('bn-y').value) : null;
    const cpRaw = el('bn-cp').value.trim(), cp = Number(cpRaw);
    if (!x) return err('Please provide a valid number for X.');
    if (needY && !y) return err('Please provide a valid number for Y.');
    if (cpRaw === '' || !Number.isInteger(cp) || cp < 1 || cp > 5000) return err('Please provide a precision (digits after the decimal point) between 1 and 5000.');
    if (x.N.toString().length > 60000 || (y && y.N.toString().length > 60000)) return err('Those numbers are too long for this calculator. Please use 60,000 digits or fewer.');
    let r, label;
    if (op === 'plus' || op === 'minus') { const [a, b, s] = align(x, y); r = { N: op === 'plus' ? a + b : a - b, s }; label = 'X ' + (op === 'plus' ? '+' : '−') + ' Y'; }
    else if (op === 'multiple') { r = { N: x.N * y.N, s: x.s + y.s }; label = 'X × Y'; }
    else if (op === 'divide') {
      if (y.N === 0n) return err('Division by zero is not possible. Please enter a Y that is not zero.');
      r = { N: (x.N * pow10(y.s + cp)) / (y.N * pow10(x.s)), s: cp }; label = 'X ÷ Y';
    } else if (op === 'pow') {
      if (!isInt(y)) return err('The exponent Y needs to be a whole number.');
      const e = toInt(y); const n = e < 0n ? -e : e;
      if (n > 200000n) return err('The exponent is too large for this calculator (limit 200,000).');
      if (x.N === 0n && e < 0n) return err('Zero cannot be raised to a negative power.');
      const digitsX = abs(x.N).toString().length;
      if (digitsX > 1 && digitsX * Number(n) > MAX_DIGITS) return err('The result would be longer than 150,000 digits. Please use a smaller base or exponent.');
      let P = x.N ** n, S = x.s * Number(n);
      if (e < 0n) { P = pow10(S + cp) / P; S = cp; }
      r = { N: P, s: S }; label = 'X ^ Y';
    } else if (op === 'sqrt') {
      if (x.N < 0n) return err('The square root of a negative number is not a real number.');
      const k = 2 * cp - x.s; const arg = k >= 0 ? x.N * pow10(k) : x.N / pow10(-k);
      r = { N: isqrt(arg), s: cp }; label = '√X';
    } else if (op === 'square') { r = { N: x.N * x.N, s: 2 * x.s }; label = 'X²'; }
    else if (op === 'factor') {
      if (!isInt(x) || x.N < 0n) return err('The factorial needs a whole number that is 0 or more.');
      const n = Number(toInt(x)); if (n > 20000) return err('The factorial is limited to numbers up to 20,000.');
      let p = 1n; for (let i = 2n; i <= BigInt(n); i++) p *= i;
      r = { N: p, s: 0 }; label = 'X!';
    } else {
      if (!isInt(x) || !isInt(y)) return err('MOD, GCD and LCM work with whole numbers only.');
      const a = toInt(x), b = toInt(y);
      if (op === 'mod') { if (a < 0n || b <= 0n) return err('For MOD, enter a whole number X that is 0 or more and a whole number Y that is greater than 0.'); r = { N: a % b, s: 0 }; label = 'X mod Y'; }
      else { if (a <= 0n || b <= 0n) return err('GCD and LCM need whole numbers greater than 0.'); const g = gcd(a, b); r = { N: op === 'gcd' ? g : (a / g) * b, s: 0 }; label = op === 'gcd' ? 'GCD(X, Y)' : 'LCM(X, Y)'; }
    }
    if (r.s > cp) { r = { N: r.N / pow10(r.s - cp), s: cp }; } // results are cut off, not rounded, after the chosen decimals
    const f = format(r);
    const digitsLine = f.isZero ? '' : f.intDigits ? `${group(String(f.intDigits))} digit${f.intDigits === 1 ? '' : 's'} before the decimal point` : 'less than 1';
    el('bn-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="overflow-wrap:anywhere;word-break:break-all;font-size:${f.shown.length > 40 ? 16 : 26}px;line-height:1.4;max-height:260px;overflow:auto;">${f.shown}</div>${digitsLine ? `<div class="label" style="margin-top:8px;">${digitsLine}</div>` : ''}</div>` +
      (f.isZero ? '' : `<div class="stat-row"><span>In scientific notation</span><strong style="text-align:right;overflow-wrap:anywhere;">${sci(f)}</strong></div>`);
  }

  el('bn-form').addEventListener('submit', (e) => { e.preventDefault(); calculate('plus'); });
  ['plus', 'minus', 'multiple', 'divide', 'pow', 'sqrt', 'square', 'factor', 'mod', 'gcd', 'lcm'].forEach((op) => el('bn-op-' + op).addEventListener('click', (e) => { e.preventDefault(); calculate(op); }));
  calculate('multiple');
})();
