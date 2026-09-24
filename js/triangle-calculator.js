'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('tri-form');
  if (!form) return;

  const RAD = Math.PI / 180;

  function num(id) {
    const field = el(id);
    if (!field || field.value.trim() === '') return null;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(n, dp = 5) {
    return n.toLocaleString('en-US', { maximumFractionDigits: dp });
  }

  function solveFromSides(a, b, c) {
    if (a + b <= c || b + c <= a || a + c <= b) return null;
    const A = Math.acos((b * b + c * c - a * a) / (2 * b * c));
    const B = Math.acos((a * a + c * c - b * b) / (2 * a * c));
    const C = Math.PI - A - B;
    return { a, b, c, A, B, C };
  }

  function calculate() {
    const mode = form.querySelector('input[name="tri-mode"]:checked').value;
    let a, b, c, A, B, C;

    if (mode === 'sss') {
      a = num('tri-sss-a'); b = num('tri-sss-b'); c = num('tri-sss-c');
      if (a === null || b === null || c === null || a <= 0 || b <= 0 || c <= 0) {
        el('tri-result').innerHTML = '<p class="tool-result is-error">Enter all three sides, each greater than 0.</p>';
        return;
      }
      const solved = solveFromSides(a, b, c);
      if (!solved) {
        el('tri-result').innerHTML = '<p class="tool-result is-error">These three sides can\'t form a triangle &mdash; the sum of any two sides must exceed the third.</p>';
        return;
      }
      ({ A, B, C } = solved);
    } else if (mode === 'sas') {
      a = num('tri-sas-a'); b = num('tri-sas-b');
      const cDeg = num('tri-sas-c');
      if (a === null || b === null || cDeg === null || a <= 0 || b <= 0 || cDeg <= 0 || cDeg >= 180) {
        el('tri-result').innerHTML = '<p class="tool-result is-error">Enter both sides (greater than 0) and the included angle (between 0&deg; and 180&deg;).</p>';
        return;
      }
      C = cDeg * RAD;
      c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C));
      A = Math.acos((b * b + c * c - a * a) / (2 * b * c));
      B = Math.PI - A - C;
    } else {
      const aDeg = num('tri-asa-a'); const bDeg = num('tri-asa-b'); c = num('tri-asa-c');
      if (aDeg === null || bDeg === null || c === null || aDeg <= 0 || bDeg <= 0 || c <= 0 || aDeg + bDeg >= 180) {
        el('tri-result').innerHTML = '<p class="tool-result is-error">Enter both angles (each greater than 0&deg;, summing to less than 180&deg;) and the included side (greater than 0).</p>';
        return;
      }
      A = aDeg * RAD; B = bDeg * RAD; C = Math.PI - A - B;
      const sinC = Math.sin(C);
      a = c * Math.sin(A) / sinC;
      b = c * Math.sin(B) / sinC;
    }

    const perimeter = a + b + c;
    const s = perimeter / 2;
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    const inradius = area / s;
    const circumradius = a / (2 * Math.sin(A));
    const ha = 2 * area / a, hb = 2 * area / b, hc = 2 * area / c;
    const ma = 0.5 * Math.sqrt(2 * b * b + 2 * c * c - a * a);
    const mb = 0.5 * Math.sqrt(2 * a * a + 2 * c * c - b * b);
    const mc = 0.5 * Math.sqrt(2 * a * a + 2 * b * b - c * c);

    const toDeg = (r) => r / RAD;
    let shapeLabel;
    const angles = [toDeg(A), toDeg(B), toDeg(C)];
    const maxAngle = Math.max(...angles);
    if (Math.abs(a - b) < 1e-9 && Math.abs(b - c) < 1e-9) shapeLabel = 'Equilateral Triangle';
    else if (Math.abs(a - b) < 1e-9 || Math.abs(b - c) < 1e-9 || Math.abs(a - c) < 1e-9) shapeLabel = 'Isosceles Triangle';
    else shapeLabel = 'Scalene Triangle';
    if (Math.abs(maxAngle - 90) < 1e-6) shapeLabel += ' (Right)';
    else if (maxAngle > 90) shapeLabel += ' (Obtuse)';
    else shapeLabel += ' (Acute)';

    el('tri-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${shapeLabel}</div>
        <div class="value">Area = ${fmt(area)}</div>
      </div>
      <div class="stat-row"><span>Side a</span><strong>${fmt(a)}</strong></div>
      <div class="stat-row"><span>Side b</span><strong>${fmt(b)}</strong></div>
      <div class="stat-row"><span>Side c</span><strong>${fmt(c)}</strong></div>
      <div class="stat-row"><span>Angle A</span><strong>${fmt(toDeg(A))}&deg;</strong></div>
      <div class="stat-row"><span>Angle B</span><strong>${fmt(toDeg(B))}&deg;</strong></div>
      <div class="stat-row"><span>Angle C</span><strong>${fmt(toDeg(C))}&deg;</strong></div>
      <div class="stat-row" style="margin-top:8px;"><span>Perimeter</span><strong>${fmt(perimeter)}</strong></div>
      <div class="stat-row"><span>Semiperimeter, s</span><strong>${fmt(s)}</strong></div>
      <div class="stat-row"><span>Inradius, r</span><strong>${fmt(inradius)}</strong></div>
      <div class="stat-row"><span>Circumradius, R</span><strong>${fmt(circumradius)}</strong></div>
      <div class="stat-row" style="margin-top:8px;"><span>Height h<sub>a</sub> / h<sub>b</sub> / h<sub>c</sub></span><strong>${fmt(ha)} / ${fmt(hb)} / ${fmt(hc)}</strong></div>
      <div class="stat-row"><span>Median m<sub>a</sub> / m<sub>b</sub> / m<sub>c</sub></span><strong>${fmt(ma)} / ${fmt(mb)} / ${fmt(mc)}</strong></div>
    `;
  }

  function updateVisibility() {
    const mode = form.querySelector('input[name="tri-mode"]:checked').value;
    el('tri-sss-fields').hidden = mode !== 'sss';
    el('tri-sas-fields').hidden = mode !== 'sas';
    el('tri-asa-fields').hidden = mode !== 'asa';
  }

  form.querySelectorAll('input[name="tri-mode"]').forEach((r) => r.addEventListener('change', () => { updateVisibility(); calculate(); }));
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
