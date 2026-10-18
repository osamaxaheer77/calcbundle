'use strict';

// Exact matrix arithmetic with fractions (BigInt numerator and denominator).
window.MatrixCore = (function () {
  const gcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { [a, b] = [b, a % b]; } return a; };
  const R = (n, d = 1n) => { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
  const ZERO = R(0), ONE = R(1);
  const add = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => R(a.n * b.n, a.d * b.d);
  const div = (a, b) => R(a.n * b.d, a.d * b.n);
  const neg = (a) => ({ n: -a.n, d: a.d });
  const isZero = (a) => a.n === 0n;
  const eq = (a, b) => a.n === b.n && a.d === b.d;

  // "3", "-2.5", "1/4", "1e3" -> fraction, or null
  function parse(text) {
    const s = String(text).trim().replace(/,/g, '');
    if (s === '') return ZERO;
    let m = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) { const d = BigInt(m[2]); return d === 0n ? null : R(BigInt(m[1]), d); }
    m = s.match(/^([+-]?)(\d*)\.?(\d*)(?:[eE]([+-]?\d+))?$/);
    if (!m || !/\d/.test(m[2] + m[3])) return null;
    const e = m[4] ? Number(m[4]) : 0; if (Math.abs(e) > 300) return null;
    let n = BigInt((m[2] + m[3]) || '0'), d = 10n ** BigInt(m[3].length);
    if (e > 0) n *= 10n ** BigInt(e); else if (e < 0) d *= 10n ** BigInt(-e);
    return R(m[1] === '-' ? -n : n, d);
  }
  function text(a) { return a.d === 1n ? a.n.toString() : `${a.n}/${a.d}`; }
  function decimal(a, places = 6) {
    const neg = a.n < 0n; let n = neg ? -a.n : a.n; const scale = 10n ** BigInt(places);
    let q = (n * scale * 2n + a.d) / (2n * a.d); // rounded half up
    const s = q.toString().padStart(places + 1, '0');
    let out = places ? s.slice(0, s.length - places) + '.' + s.slice(s.length - places) : s;
    if (places) out = out.replace(/0+$/, '').replace(/\.$/, '');
    return (neg && q !== 0n ? '-' : '') + out;
  }

  const rows = (A) => A.length, cols = (A) => (A.length ? A[0].length : 0);
  const make = (r, c, f) => Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => f(i, j)));
  const identity = (n) => make(n, n, (i, j) => (i === j ? ONE : ZERO));
  const clone = (A) => A.map((row) => row.slice());

  const addM = (A, B) => make(rows(A), cols(A), (i, j) => add(A[i][j], B[i][j]));
  const subM = (A, B) => make(rows(A), cols(A), (i, j) => sub(A[i][j], B[i][j]));
  const scale = (A, k) => make(rows(A), cols(A), (i, j) => mul(A[i][j], k));
  const transpose = (A) => make(cols(A), rows(A), (i, j) => A[j][i]);
  function multiply(A, B) {
    return make(rows(A), cols(B), (i, j) => { let s = ZERO; for (let k = 0; k < cols(A); k++) { if (!isZero(A[i][k]) && !isZero(B[k][j])) s = add(s, mul(A[i][k], B[k][j])); } return s; });
  }
  const trace = (A) => A.reduce((s, row, i) => add(s, row[i]), ZERO);

  // Gauss-Jordan elimination. Returns the reduced matrix, the pivot columns and the determinant of the square part (if square).
  function eliminate(A) {
    const M = clone(A), r = rows(M), c = cols(M); const pivots = []; let det = ONE, row = 0;
    for (let col = 0; col < c && row < r; col++) {
      let p = -1; for (let i = row; i < r; i++) if (!isZero(M[i][col])) { p = i; break; }
      if (p < 0) { det = ZERO; continue; }
      if (p !== row) { [M[p], M[row]] = [M[row], M[p]]; det = neg(det); }
      const pv = M[row][col]; det = mul(det, pv);
      M[row] = M[row].map((v) => div(v, pv));
      for (let i = 0; i < r; i++) if (i !== row && !isZero(M[i][col])) { const f = M[i][col]; M[i] = M[i].map((v, j) => sub(v, mul(f, M[row][j]))); }
      pivots.push(col); row++;
    }
    return { M, pivots, det: r === c && pivots.length < r ? ZERO : det };
  }
  const rank = (A) => eliminate(A).pivots.length;
  const rref = (A) => eliminate(A).M;
  function det(A) { return eliminate(A).det; }
  function inverse(A) {
    const n = rows(A); const aug = make(n, 2 * n, (i, j) => (j < n ? A[i][j] : i === j - n ? ONE : ZERO));
    const { M, pivots } = eliminate(aug);
    if (pivots.length < n || pivots[n - 1] !== n - 1) return null;
    return make(n, n, (i, j) => M[i][j + n]);
  }
  function power(A, p) {
    if (p < 0) { const inv = inverse(A); if (!inv) return null; return power(inv, -p); }
    let result = identity(rows(A)), base = clone(A), e = p;
    while (e > 0) { if (e & 1) result = multiply(result, base); e >>= 1; if (e) base = multiply(base, base); }
    return result;
  }
  return { parse, text, decimal, R, ZERO, ONE, add, sub, mul, div, isZero, eq, rows, cols, make, identity, addM, subM, scale, transpose, multiply, trace, det, rank, rref, inverse, power };
})();
