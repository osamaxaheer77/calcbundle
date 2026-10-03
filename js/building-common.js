'use strict';

// Unit conversion and formatting shared by the BTU, Stair, Tile and Gravel calculators.
window.BuildCommon = (function () {
  const el = (id) => document.getElementById(id);
  const LEN = { inch: 0.0254, foot: 0.3048, meter: 1, cm: 0.01, centimeter: 0.01, mm: 0.001, yard: 0.9144 };
  const AREA = { foot: 0.09290304, meter: 1, yard: 0.83612736, inch: 0.00064516, centimeter: 0.0001, acre: 4046.8564224 };
  const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // A number field. Empty gives null, anything that is not a finite number gives NaN.
  function num(id) {
    const node = el(id);
    if (!node) return null;
    const raw = node.value.trim().replace(/,/g, '');
    if (raw === '') return null;
    const v = Number(raw);
    return Number.isFinite(v) && Math.abs(v) <= 1e12 ? v : NaN;
  }
  // Decimal text with thousands separators and trailing zeros trimmed.
  function dec(v, max) {
    if (!Number.isFinite(v)) return 'too large';
    let s = Math.abs(v).toFixed(max);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    const [i, f] = s.split('.');
    return (v < 0 && s !== '0' ? '-' : '') + group(i) + (f ? '.' + f : '');
  }
  const fixed = (v, d) => { const s = Math.abs(v).toFixed(d); const [i, f] = s.split('.'); return (v < 0 && Number(s) !== 0 ? '-' : '') + group(i) + (f ? '.' + f : ''); };
  // Inches as feet and inches: 167.32 gives "13 feet 11.32 inches".
  function feetInches(inches) {
    let ft = Math.floor(inches / 12 + 1e-9), rem = Math.round((inches - ft * 12) * 100) / 100;
    if (rem >= 12) { ft += 1; rem = 0; }
    const parts = [];
    if (ft) parts.push(`${ft} ${ft === 1 ? 'foot' : 'feet'}`);
    if (rem || !ft) parts.push(`${dec(rem, 2)} ${rem <= 1 ? 'inch' : 'inches'}`);
    return parts.join(' ');
  }
  // "7.87 inches or 20.00 cm"
  const lengthText = (inches) => `${feetInches(inches)} or ${fixed(inches * 2.54, 2)} cm`;
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (label, value) => `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`;
  const big = (label, value, sub) => `<div class="summary-payment-box"><div class="label">${label}</div><div class="value" style="overflow-wrap:anywhere;">${value}</div>${sub ? `<div class="label" style="margin-top:6px;">${sub}</div>` : ''}</div>`;
  const plural = (n, w) => `${group(n)} ${w}${n === 1 ? '' : 's'}`;
  return { el, LEN, AREA, num, dec, fixed, group, feetInches, lengthText, error, row, big, plural };
})();
