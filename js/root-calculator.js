'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('sq-form')) return;

  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return null; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const grp = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function fmt(v) {
    if (v === 0) return '0';
    const s = Number(v.toPrecision(14));
    if (Math.abs(s) >= 1e15 || Math.abs(s) < 1e-9) return s.toExponential();
    const [i, f] = String(s).split('.');
    return grp(i) + (f ? '.' + f : '');
  }
  const sup = (n) => `<sup>${n}</sup>`;

  // Pulls perfect nth powers out of a whole number: n√a = k · n√m.
  function simplify(a, n) {
    if (!Number.isInteger(a) || !Number.isInteger(n) || n < 2 || a < 2 || a > 1e15) return null;
    let k = 1, m = a;
    for (let p = 2; Math.pow(p, n) <= m; p++) {
      const pn = Math.pow(p, n);
      while (m % pn === 0) { m /= pn; k *= p; }
    }
    return { k, m };
  }
  function radical(a, n) {
    const s = simplify(a, n);
    if (!s || s.k === 1) return null;
    const sign = n === 2 ? '√' : `<sup>${n}</sup>√`;
    return s.m === 1 ? String(s.k) : `${s.k}${sign}${s.m}`;
  }

  function show(id, label, root, a, n) {
    const rad = radical(Math.abs(a), n);
    const check = Math.pow(root, n);
    el(id).innerHTML =
      `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="overflow-wrap:anywhere;">${fmt(root)}</div></div>` +
      (rad ? `<div class="stat-row"><span>Exact form</span><strong>${a < 0 ? '−' : ''}${rad}</strong></div>` : '') +
      `<div class="stat-row"><span>Check</span><strong>${fmt(root)}${sup(n)} = ${fmt(check)}</strong></div>` +
      (Number.isInteger(root) ? `<p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">${fmt(a)} is a perfect ${n === 2 ? 'square' : n === 3 ? 'cube' : n + 'th power'}.</p>` : '');
  }

  function square() {
    const x = read('sq-in');
    if (x === null || Number.isNaN(x)) return error('sq-result', 'Enter a number.');
    if (x < 0) {
      const r = Math.sqrt(-x), rad = radical(-x, 2);
      el('sq-result').innerHTML = `<div class="summary-payment-box"><div class="label">√${fmt(x)} (imaginary)</div><div class="value" style="overflow-wrap:anywhere;">${fmt(r)}i</div></div>` +
        (rad ? `<div class="stat-row"><span>Exact form</span><strong>${rad}i</strong></div>` : '') +
        '<p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">A negative number has no real square root, so the answer uses the imaginary unit i.</p>';
      return;
    }
    show('sq-result', `√${fmt(x)}`, Math.sqrt(x), x, 2);
  }
  function cube() {
    const x = read('cb-in');
    if (x === null || Number.isNaN(x)) return error('cb-result', 'Enter a number.');
    show('cb-result', `∛${fmt(x)}`, Math.cbrt(x), x, 3);
  }
  function general() {
    const n = read('gn-n'), x = read('gn-x');
    if (n === null || x === null || Number.isNaN(n) || Number.isNaN(x)) return error('gn-result', 'Enter a root and a number.');
    if (n === 0) return error('gn-result', 'The root n cannot be 0.');
    const odd = Number.isInteger(n) && Math.abs(n) % 2 === 1;
    if (x < 0 && !odd) return error('gn-result', 'A negative number has no real root when n is even or not a whole number.');
    if (x === 0 && n < 0) return error('gn-result', 'The negative root of 0 is undefined.');
    const root = x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n);
    const label = `${n === 2 ? '' : sup(fmt(n))}√${fmt(x)}`;
    if (Number.isInteger(n) && n >= 2) return show('gn-result', label, root, x, n);
    el('gn-result').innerHTML = `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="overflow-wrap:anywhere;">${fmt(root)}</div></div>` +
      `<div class="stat-row"><span>Check</span><strong>${fmt(root)}${sup(fmt(n))} = ${fmt(Math.pow(root, n))}</strong></div>`;
  }

  el('sq-form').addEventListener('submit', (e) => { e.preventDefault(); square(); });
  el('cb-form').addEventListener('submit', (e) => { e.preventDefault(); cube(); });
  el('gn-form').addEventListener('submit', (e) => { e.preventDefault(); general(); });
  square(); cube(); general();
})();
