'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('area-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 5 });
  }

  const SHAPES = ['rect', 'tri', 'trap', 'circle', 'sector', 'ellipse', 'para'];

  function calculate() {
    const shape = el('area-shape').value;
    let area, error = null;

    if (shape === 'rect') {
      const l = num('area-rect-l'), w = num('area-rect-w');
      if (l <= 0 || w <= 0) error = 'Enter a positive length and width.';
      else area = l * w;
    } else if (shape === 'tri') {
      const a = num('area-tri-a'), b = num('area-tri-b'), c = num('area-tri-c');
      if (a <= 0 || b <= 0 || c <= 0) error = 'Enter three positive side lengths.';
      else if (a + b <= c || b + c <= a || a + c <= b) error = 'These three sides can\'t form a triangle.';
      else {
        const s = (a + b + c) / 2;
        area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      }
    } else if (shape === 'trap') {
      const b1 = num('area-trap-b1'), b2 = num('area-trap-b2'), h = num('area-trap-h');
      if (b1 <= 0 || b2 <= 0 || h <= 0) error = 'Enter positive bases and height.';
      else area = (b1 + b2) / 2 * h;
    } else if (shape === 'circle') {
      const r = num('area-circle-r');
      if (r <= 0) error = 'Enter a positive radius.';
      else area = Math.PI * r * r;
    } else if (shape === 'sector') {
      const r = num('area-sector-r'), angle = num('area-sector-angle'), unit = el('area-sector-unit').value;
      if (r <= 0 || angle <= 0) error = 'Enter a positive radius and angle.';
      else {
        const fraction = unit === 'deg' ? angle / 360 : angle / (2 * Math.PI);
        area = fraction * Math.PI * r * r;
      }
    } else if (shape === 'ellipse') {
      const a = num('area-ellipse-a'), b = num('area-ellipse-b');
      if (a <= 0 || b <= 0) error = 'Enter positive semi-major and semi-minor axes.';
      else area = Math.PI * a * b;
    } else if (shape === 'para') {
      const b = num('area-para-b'), h = num('area-para-h');
      if (b <= 0 || h <= 0) error = 'Enter a positive base and height.';
      else area = b * h;
    }

    if (error) {
      el('area-result').innerHTML = `<p class="tool-result is-error">${error}</p>`;
      return;
    }

    el('area-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Area</div>
        <div class="value">${fmt(area)}</div>
      </div>
    `;
  }

  function updateVisibility() {
    const shape = el('area-shape').value;
    SHAPES.forEach((s) => { el('area-' + s + '-fields').hidden = s !== shape; });
  }

  el('area-shape').addEventListener('change', () => { updateVisibility(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
