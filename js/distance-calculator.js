'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const L = window.LineCommon;
  if (!el('d2-form') || !L) return;
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;">${v}</strong></div>`;
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const val = (id) => el(id).value.trim();
  const num = (id) => (val(id) === '' ? NaN : Number(val(id).replace(/,/g, '')));
  const sq = (v) => (v < 0 ? `(${L.f(v)})` : L.f(v));

  // ---- 2D ----
  function flat() {
    const r = L.twoPoints(val('d2-x1'), val('d2-y1'), val('d2-x2'), val('d2-y2'));
    if (r.error) return error('d2-result', r.error);
    if (r.same) { el('d2-result').innerHTML = '<div class="summary-payment-box"><div class="label">Distance</div><div class="value" style="overflow-wrap:anywhere;">0</div><div class="label" style="margin-top:6px;">The two points are the same.</div></div>'; return; }
    const sub = (a, b) => `${L.f(a)} − ${b < 0 ? '(' + L.f(b) + ')' : L.f(b)}`;
    el('d2-result').innerHTML = `<div class="summary-payment-box"><div class="label">Distance (d)</div><div class="value" style="overflow-wrap:anywhere;">${L.f(r.dist)}</div></div>` +
      `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Steps:</strong><br>d = √((x₂ − x₁)² + (y₂ − y₁)²)<br>= √((${sub(r.x2, r.x1)})² + (${sub(r.y2, r.y1)})²)<br>= √(${sq(r.dx)}² + ${sq(r.dy)}²)<br>= √${L.f(r.dsq)} = ${L.f(r.dist)}</div>` +
      `<h3 style="margin:16px 0 4px;font-size:15px;">Slope and angle of the line</h3>` + L.lineBlock(r);
  }

  // ---- 3D ----
  function space() {
    const v = ['x1', 'y1', 'z1', 'x2', 'y2', 'z2'].map((k) => num('d3-' + k));
    if (v.some((x) => !Number.isFinite(x))) return error('d3-result', 'Please provide numerical values for all six coordinates.');
    const [x1, y1, z1, x2, y2, z2] = v;
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, s = dx * dx + dy * dy + dz * dz, d = Math.sqrt(s);
    const sub = (a, b) => `${L.f(a)} − ${b < 0 ? '(' + L.f(b) + ')' : L.f(b)}`;
    el('d3-result').innerHTML = `<div class="summary-payment-box"><div class="label">Distance (d)</div><div class="value" style="overflow-wrap:anywhere;">${L.f(d)}</div></div>` +
      `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Steps:</strong><br>d = √((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²)<br>= √((${sub(x2, x1)})² + (${sub(y2, y1)})² + (${sub(z2, z1)})²)<br>= √(${sq(dx)}² + ${sq(dy)}² + ${sq(dz)}²)<br>= √${L.f(s)} = ${L.f(d)}</div>`;
  }

  // ---- Latitude and longitude: Vincenty's inverse formula on an ellipsoidal Earth ----
  // Equatorial radius 6,378.1 km and flattening 1/298.15, the values that reproduce calculator.net's results.
  function geodesic(lat1, lon1, lat2, lon2) {
    const a = 6378100, f = 1 / 298.15, b = (1 - f) * a, rad = Math.PI / 180;
    const U1 = Math.atan((1 - f) * Math.tan(lat1 * rad)), U2 = Math.atan((1 - f) * Math.tan(lat2 * rad));
    const Lg = (lon2 - lon1) * rad, sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
    let lam = Lg, prev, iter = 0, sigma, sSig, cSig, cos2a, cos2sm, sinLam, cosLam, sinSq;
    do {
      sinLam = Math.sin(lam); cosLam = Math.cos(lam);
      sinSq = (cU2 * sinLam) ** 2 + (cU1 * sU2 - sU1 * cU2 * cosLam) ** 2; sSig = Math.sqrt(sinSq);
      if (sSig === 0) return 0;
      cSig = sU1 * sU2 + cU1 * cU2 * cosLam; sigma = Math.atan2(sSig, cSig);
      const sinAlpha = (cU1 * cU2 * sinLam) / sSig; cos2a = 1 - sinAlpha * sinAlpha;
      cos2sm = cos2a !== 0 ? cSig - (2 * sU1 * sU2) / cos2a : 0;
      const C = (f / 16) * cos2a * (4 + f * (4 - 3 * cos2a));
      prev = lam;
      lam = Lg + (1 - C) * f * sinAlpha * (sigma + C * sSig * (cos2sm + C * cSig * (-1 + 2 * cos2sm * cos2sm)));
    } while (Math.abs(lam - prev) > 1e-12 && ++iter < 200);
    if (iter >= 200) return null;
    const u2 = (cos2a * (a * a - b * b)) / (b * b);
    const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
    const B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
    const dSig = B * sSig * (cos2sm + (B / 4) * (cSig * (-1 + 2 * cos2sm * cos2sm) - (B / 6) * cos2sm * (-3 + 4 * sSig * sSig) * (-3 + 4 * cos2sm * cos2sm)));
    return b * A * (sigma - dSig);
  }
  function haversine(lat1, lon1, lat2, lon2) {
    const rad = Math.PI / 180, dl = (lat2 - lat1) * rad, dn = (lon2 - lon1) * rad;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dn / 2) ** 2;
    return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
  }
  const dms = (d, m, s, hemi) => `${d}° ${m}' ${s}" ${hemi}`;
  const grp = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function geo() {
    const mode = document.querySelector('input[name="dg-mode"]:checked').value;
    let p;
    if (mode === 'dec') {
      p = ['la1', 'lo1', 'la2', 'lo2'].map((k) => num('dg-' + k));
      if (p.some((x) => !Number.isFinite(x))) return error('dg-result', 'Please provide numerical values for all latitudes and longitudes.');
    } else {
      const part = (i, kind) => {
        const d = num(`dg-${kind}d${i}`), m = num(`dg-${kind}m${i}`), s = num(`dg-${kind}s${i}`), h = val(`dg-${kind}u${i}`);
        if (![d, m, s].every(Number.isFinite) || d < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return NaN;
        const v = d + m / 60 + s / 3600; return h === 's' || h === 'w' ? -v : v;
      };
      p = [part(1, 'la'), part(1, 'lo'), part(2, 'la'), part(2, 'lo')];
      if (p.some((x) => !Number.isFinite(x))) return error('dg-result', 'Please provide whole degrees and minutes (0 to 59) and seconds (0 up to 60) for every coordinate.');
    }
    const [la1, lo1, la2, lo2] = p;
    if (Math.abs(la1) > 90 || Math.abs(la2) > 90) return error('dg-result', 'Latitude must be between -90 and 90 degrees.');
    if (Math.abs(lo1) > 180 || Math.abs(lo2) > 180) return error('dg-result', 'Longitude must be between -180 and 180 degrees.');
    let m = geodesic(la1, lo1, la2, lo2); if (m === null || !Number.isFinite(m)) m = haversine(la1, lo1, la2, lo2);
    const km = m / 1000, mi = km / 1.609344;
    const fmtPt = (la, lo) => (mode === 'dec' ? `[${L.f(la)}, ${L.f(lo)}]` : '');
    const text = Math.round(km * 10) / 10 === 0 ? '0 km or 0 mile' : `${grp(km)} km or ${grp(mi)} miles`;
    el('dg-result').innerHTML = `<div class="summary-payment-box"><div class="label">Shortest distance over the Earth's surface</div><div class="value" style="font-size:24px;line-height:1.3;">${text}</div></div>` +
      (mode === 'dec' ? `<p style="font-size:13px;color:var(--text-secondary);margin:10px 0 0;">Between ${fmtPt(la1, lo1)} and ${fmtPt(la2, lo2)}.</p>` : '') +
      `<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:10px 0 0;">This is the straight-line "as the crow flies" distance along the Earth's curved surface, worked out on an ellipsoidal model of the Earth. Roads, flight paths and sea routes are longer.</p>`;
  }
  function toggle() {
    const mode = document.querySelector('input[name="dg-mode"]:checked').value;
    el('dg-dec').hidden = mode !== 'dec'; el('dg-dms').hidden = mode !== 'dms';
  }

  [['d2-form', flat], ['d3-form', space], ['dg-form', geo]].forEach(([id, fn]) => el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); }));
  document.querySelectorAll('input[name="dg-mode"]').forEach((r) => r.addEventListener('change', () => { toggle(); geo(); }));
  toggle(); flat(); space(); geo();
})();
