'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('hl-form')) return;

  const LN2 = Math.LN2;
  const read = (id) => { const raw = el(id).value.trim(); if (raw === '') return null; const v = Number(raw); return Number.isFinite(v) ? v : NaN; };
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  function fmt(v) {
    if (v === 0) return '0';
    const s = Number(v.toPrecision(12));
    if (Math.abs(s) >= 1e15 || Math.abs(s) < 1e-6) return s.toExponential().replace('e+', ' × 10^').replace('e-', ' × 10^-');
    const [i, f] = String(s).split('.');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
  }
  const row = (l, v, big) => big
    ? `<div class="summary-payment-box"><div class="label">${l}</div><div class="value" style="font-size:22px;overflow-wrap:anywhere;">${v}</div></div>`
    : `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;

  function solve() {
    const nt = read('hl-nt'), n0 = read('hl-n0'), t = read('hl-t'), h = read('hl-t12');
    const v = [nt, n0, t, h];
    if (v.some((x) => Number.isNaN(x))) return error('hl-result', 'Enter numbers only in the boxes you fill in.');
    const empty = v.filter((x) => x === null).length;
    // With all four filled, the half-life is worked out again from the other three.
    if (empty > 1) return error('hl-result', 'Fill in at least three of the four boxes, and leave the one you want to find empty.');
    const needHalf = h === null || empty === 0;

    if (needHalf) {
      if (!(nt > 0) || !(n0 > 0)) return error('hl-result', 'The quantities must be more than 0.');
      if (!(nt < n0)) return error('hl-result', 'The quantity remaining must be smaller than the initial quantity for a decaying substance.');
      if (!(t > 0)) return error('hl-result', 'The time must be more than 0.');
      const half = (t * LN2) / Math.log(n0 / nt);
      el('hl-result').innerHTML = row('Half-life (t½)', fmt(half), true) + row('Mean lifetime (τ)', fmt(half / LN2)) + row('Decay constant (λ)', fmt(LN2 / half)) +
        `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">t½ = t × ln 2 ÷ ln(N0 ÷ Nt)</p>`;
      return;
    }
    if (!(h > 0)) return error('hl-result', 'The half-life must be more than 0.');
    if (t === null) {
      if (!(nt > 0) || !(n0 > 0)) return error('hl-result', 'The quantities must be more than 0.');
      if (!(nt < n0)) return error('hl-result', 'The quantity remaining must be smaller than the initial quantity for a decaying substance.');
      el('hl-result').innerHTML = row('Time (t)', fmt((h * Math.log(n0 / nt)) / LN2), true) + `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">t = t½ × ln(N0 ÷ Nt) ÷ ln 2</p>`;
    } else if (n0 === null) {
      if (!(nt > 0)) return error('hl-result', 'The quantity remaining must be more than 0.');
      if (t < 0) return error('hl-result', 'The time cannot be negative.');
      el('hl-result').innerHTML = row('Initial quantity (N0)', fmt(nt * Math.pow(2, t / h)), true) + `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">N0 = Nt × 2^(t ÷ t½)</p>`;
    } else {
      if (!(n0 > 0)) return error('hl-result', 'The initial quantity must be more than 0.');
      if (t < 0) return error('hl-result', 'The time cannot be negative.');
      el('hl-result').innerHTML = row('Quantity remaining (Nt)', fmt(n0 * Math.pow(2, -t / h)), true) + `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Nt = N0 × (1/2)^(t ÷ t½)</p>`;
    }
  }

  function convert() {
    const h = read('hc-half'), m = read('hc-mean'), l = read('hc-lambda');
    const v = [h, m, l];
    if (v.some((x) => Number.isNaN(x))) return error('hc-result', 'Enter numbers only.');
    if (v.every((x) => x === null)) return error('hc-result', 'Enter one of the three values.');
    if (v.some((x) => x !== null && !(x > 0))) return error('hc-result', 'The values must be more than 0.');
    let half;
    if (h !== null) half = h; else if (m !== null) half = m * LN2; else half = LN2 / l;
    el('hc-result').innerHTML = row('Half-life (t½)', fmt(half)) + row('Mean lifetime (τ)', fmt(half / LN2)) + row('Decay constant (λ)', fmt(LN2 / half)) +
      (v.filter((x) => x !== null).length > 1 ? '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">You filled in more than one box, so the half-life (or else the mean lifetime) was used.</p>' : '');
  }

  el('hl-form').addEventListener('submit', (e) => { e.preventDefault(); solve(); });
  el('hc-form').addEventListener('submit', (e) => { e.preventDefault(); convert(); });
  el('hl-clear').addEventListener('click', () => { ['hl-nt', 'hl-n0', 'hl-t', 'hl-t12'].forEach((id) => { el(id).value = ''; }); el('hl-result').innerHTML = ''; });
  solve();
  el('hc-half').value = '5730'; convert();
})();
