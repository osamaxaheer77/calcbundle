'use strict';

// Small helpers shared by the everyday calculators in the Other category.
window.CalcCommon = (function () {
  const el = (id) => document.getElementById(id);
  const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // A number field. Empty gives null, anything that is not a finite number gives NaN.
  function num(id) {
    const node = el(id);
    if (!node) return null;
    const raw = node.value.trim().replace(/,/g, '');
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) && Math.abs(v) <= 1e15 ? v : NaN;
  }
  // Decimal text with thousands separators and trailing zeros trimmed.
  function dec(v, max) {
    if (!Number.isFinite(v)) return 'too large';
    if (Math.abs(v) >= 1e21) return 'too large';
    let s = Math.abs(v).toFixed(max);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    const [i, f] = s.split('.');
    return (v < 0 && Number(s) !== 0 ? '-' : '') + group(i) + (f ? '.' + f : '');
  }
  // A value to about 10 significant digits, without exponent text unless it is extreme.
  function sig(v) {
    if (v === 0) return '0';
    if (!Number.isFinite(v)) return 'too large';
    const a = Math.abs(v);
    if (a >= 1e15 || a < 1e-6) {
      const [m, e] = v.toExponential(9).split('e');
      const mant = m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m;
      return `${mant} × 10<sup>${e.replace('+', '')}</sup>`;
    }
    const r = Number(v.toPrecision(10));
    const places = Math.min(20, Math.max(0, 9 - Math.floor(Math.log10(Math.abs(r)))));
    return dec(r, places);
  }

  const fixed = (v, d) => {
    if (!Number.isFinite(v) || Math.abs(v) >= 1e21) return 'too large';
    const s = Math.abs(v).toFixed(d);
    const [i, f] = s.split('.');
    return (v < 0 && Number(s) !== 0 ? '-' : '') + group(i) + (f ? '.' + f : '');
  };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (label, value) => `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
  const big = (label, value, sub) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="overflow-wrap:anywhere;">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const note = (text) => `<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:10px 0 0;">${text}</p>`;
  const plural = (n, w) => `${group(n)} ${w}${n === 1 ? '' : 's'}`;
  return { el, group, num, dec, sig, fixed, error, row, big, note, plural };
})();
