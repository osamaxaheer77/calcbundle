'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const L = window.LineCommon;
  if (!el('sl-form') || !L) return;
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;">${v}</strong></div>`;
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const val = (id) => el(id).value.trim();

  // ---- Two points ----
  function twoPoints() {
    const r = L.twoPoints(val('sl-x1'), val('sl-y1'), val('sl-x2'), val('sl-y2'));
    if (r.error) return error('sl-result', r.error);
    if (r.same) return error('sl-result', 'These two points are the same, so there is no line to measure. Enter two different points.');
    const head = r.vertical
      ? `<div class="summary-payment-box"><div class="label">Slope (m)</div><div class="value" style="overflow-wrap:anywhere;">undefined</div><div class="label" style="margin-top:6px;">vertical line</div></div>`
      : `<div class="summary-payment-box"><div class="label">Slope (m) = ΔY ÷ ΔX</div><div class="value" style="overflow-wrap:anywhere;">${L.f(r.m)}</div><div class="label" style="margin-top:6px;">${r.riseText}/${r.runText}</div></div>`;
    el('sl-result').innerHTML = head + L.lineBlock(r) + row('Distance (d) = √(ΔX² + ΔY²)', `√${L.f(r.dsq)} = ${L.f(r.dist)}`);
  }

  // ---- One point, a distance, and a slope or an angle ----
  function onePoint() {
    const x1 = Number(val('sp-x')), y1 = Number(val('sp-y')), d = Number(val('sp-d'));
    if (val('sp-x') === '' || val('sp-y') === '' || !Number.isFinite(x1) || !Number.isFinite(y1)) return error('sp-result', 'Please provide numerical values for the starting point.');
    if (val('sp-d') === '' || !Number.isFinite(d) || d <= 0) return error('sp-result', 'Please provide a positive distance.');
    const hasM = val('sp-m') !== '', hasT = val('sp-th') !== '';
    if (!hasM && !hasT) return error('sp-result', 'Please provide either the slope or the angle of incline.');
    const clean = (v) => (Math.abs(v) < 1e-12 * Math.max(1, d) ? 0 : v);
    const solve = (dx, dy) => {
      dx = clean(dx); dy = clean(dy);
      const x2 = x1 + dx, y2 = y1 + dy;
      const r = L.twoPoints(String(x1), String(y1), String(Number(x2.toPrecision(15))), String(Number(y2.toPrecision(15))));
      return { dx, dy, x2, y2, r };
    };
    const block = (s, theta, showTheta) => {
      let h = row('X₂', L.f(s.x2)) + row('Y₂', L.f(s.y2)) + row('ΔX', L.f(s.dx)) + row('ΔY', L.f(s.dy));
      if (s.r && !s.r.error && !s.r.same) {
        if (showTheta) h += row('Angle (θ)', `${L.f(theta)}°`);
        if (s.r.vertical) h += row('Slope (m)', 'undefined (vertical line)') + `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Equation of the line:</strong> x = ${L.f(x1)}</div>`;
        else {
          let eq = `<strong>Equation of the line:</strong><br>${L.decimalEquation(s.r)}<br>When x = 0, y = ${s.r.b}`;
          if (!s.r.horizontal) eq += `<br>When y = 0, x = ${L.f(-s.r.bValue / s.r.m)}`;
          h += row('Slope (m)', L.f(s.r.m)) + `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;">${eq}</div>`;
        }
      }
      return h;
    };
    if (hasM) {
      const m = Number(val('sp-m'));
      if (!Number.isFinite(m)) return error('sp-result', 'Please provide a numerical slope.');
      const c = d / Math.sqrt(1 + m * m);
      // the first solution is the one that climbs (or runs to the right when the line is flat)
      const first = m < 0 ? solve(-c, -m * c) : solve(c, m * c), second = m < 0 ? solve(c, m * c) : solve(-c, -m * c);
      const ang = (s) => { let t = L.deg(Math.atan2(s.dy, s.dx)); if (t < 0) t += 360; return t; };
      el('sp-result').innerHTML = `<div class="summary-payment-box"><div class="label">Two points are ${L.f(d)} away at slope ${L.f(m)}</div><div class="value" style="overflow-wrap:anywhere;">(${L.f(first.x2)}, ${L.f(first.y2)})</div><div class="label" style="margin-top:6px;">or (${L.f(second.x2)}, ${L.f(second.y2)})</div></div>` +
        `<h3 style="margin:14px 0 4px;font-size:15px;">Point A</h3>${block(first, ang(first), true)}<h3 style="margin:14px 0 4px;font-size:15px;">Point B</h3>${block(second, ang(second), true)}`;
      return;
    }
    const t = Number(val('sp-th'));
    if (!Number.isFinite(t)) return error('sp-result', 'Please provide a numerical angle in degrees.');
    const rad = (t * Math.PI) / 180;
    const s = solve(d * Math.cos(rad), d * Math.sin(rad));
    el('sp-result').innerHTML = `<div class="summary-payment-box"><div class="label">The other point is</div><div class="value" style="overflow-wrap:anywhere;">(${L.f(s.x2)}, ${L.f(s.y2)})</div></div>` + block(s, t, false);
  }

  [['sl-form', twoPoints], ['sp-form', onePoint]].forEach(([id, fn]) => el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); }));
  twoPoints(); onePoint();
})();
