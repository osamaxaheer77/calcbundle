'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('rt-form')) return;

  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return null; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const num = (v) => { const s = String(Math.round(v * 1e10) / 1e10); return s.includes('e') ? String(Number(v.toPrecision(10))) : s; };
  const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x));

  // Simplest whole-number form of a : b, if both are decimals with at most 6 places.
  function simplest(a, b) {
    const k = Math.pow(10, 6);
    const x = Math.round(a * k), y = Math.round(b * k);
    if (Math.abs(x / k - a) > 1e-9 || Math.abs(y / k - b) > 1e-9) return null;
    const g = gcd(x, y);
    return g ? `${x / g} : ${y / g}` : null;
  }

  function solve() {
    const v = ['rt-a', 'rt-b', 'rt-c', 'rt-d'].map(read);
    if (v.some((x) => Number.isNaN(x))) return error('rt-result', 'Enter numbers only in the boxes you fill in.');
    const empty = v.filter((x) => x === null).length;
    if (empty !== 1) return error('rt-result', 'Fill in three of the four boxes, and leave the one you want to find empty.');
    if (v.some((x) => x === 0)) return error('rt-result', 'The values must not be 0.');
    let [a, b, c, d] = v;
    if (a === null) a = (b * c) / d;
    else if (b === null) b = (a * d) / c;
    else if (c === null) c = (a * d) / b;
    else d = (b * c) / a;
    const first = [a, b], second = [c, d];
    const ratioBlock = (x, y) => {
      const s = simplest(x, y);
      return `<div class="stat-row"><span>${num(x)} : ${num(y)}</span><strong>${s ? s + ' = ' : ''}1 : ${num(y / x)} = ${num(x / y)} : 1</strong></div>`;
    };
    const total = a + b;
    el('rt-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Proportion</div><div class="value" style="font-size:22px;">${num(a)} : ${num(b)} = ${num(c)} : ${num(d)}</div></div>` +
      ratioBlock(...first) + (v[0] === null || v[1] === null ? ratioBlock(...second) : '') +
      `<div class="stat-row"><span>Share of ${num(a)} : ${num(b)}</span><strong>${num((a / total) * 100)}% and ${num((b / total) * 100)}%</strong></div>`;
  }

  function scale() {
    const a = read('rs-a'), b = read('rs-b'), t = read('rs-times');
    if ([a, b, t].some((x) => x === null || Number.isNaN(x)) || !(t > 0)) return error('rs-result', 'Enter two values and a number of times more than 0.');
    const up = el('rs-mode').value === 'enlarge';
    const f = (x) => num(up ? x * t : x / t);
    el('rs-result').innerHTML = `<div class="summary-payment-box"><div class="label">${num(a)} : ${num(b)} ${up ? 'enlarged' : 'shrunk'} ${num(t)} times</div><div class="value">${f(a)} : ${f(b)}</div></div>` +
      `<div class="stat-row"><span>Before</span><strong>${num(a)} × ${num(b)}</strong></div><div class="stat-row"><span>After</span><strong>${f(a)} × ${f(b)}</strong></div>`;
  }

  el('rt-form').addEventListener('submit', (e) => { e.preventDefault(); solve(); });
  el('rs-form').addEventListener('submit', (e) => { e.preventDefault(); scale(); });
  el('rt-clear').addEventListener('click', () => { ['rt-a', 'rt-b', 'rt-c', 'rt-d'].forEach((id) => { el(id).value = ''; }); el('rt-result').innerHTML = ''; });
  el('rs-mode').addEventListener('change', scale);
  solve(); scale();
})();
