'use strict';

// Shared engine and interface for the Volume and Surface Area calculators.
window.ShapeCalc = (function () {
  const PI = Math.PI;
  const UNITS = [
    ['miles', 'miles', 1609.344], ['yards', 'yards', 0.9144], ['feet', 'feet', 0.3048], ['inches', 'inches', 0.0254],
    ['kilometers', 'kilometers', 1000], ['meters', 'meters', 1], ['centimeters', 'centimeters', 0.01], ['millimeters', 'millimeters', 0.001],
    ['micrometers', 'micrometers', 1e-6], ['nanometers', 'nanometers', 1e-9], ['angstroms', 'angstroms', 1e-10],
  ];
  const factor = (u) => UNITS.find((x) => x[0] === u)[2];

  // About 14 significant digits, written plainly
  function f(v) {
    if (v === 0 || Object.is(v, -0)) return '0';
    const r = Number(v.toPrecision(14)); const a = Math.abs(r);
    if (a >= 1e21 || a < 1e-9) return r.toExponential(9).replace(/\.?0+e/, 'e').replace('e+', ' × 10^').replace('e', ' × 10^');
    return String(r);
  }

  const SHAPES = {
    ball: { label: 'Sphere', fields: [['r', 'Radius (r)', 2]], vol: ([r]) => ({ total: (4 / 3) * PI * r ** 3 }), area: ([r]) => ({ total: 4 * PI * r * r }),
      vf: 'V = 4/3 × π × r³', af: 'A = 4 × π × r²' },
    cone: { label: 'Cone', fields: [['r', 'Base radius (r)', 3], ['h', 'Height (h)', 4]], vol: ([r, h]) => ({ total: (PI * r * r * h) / 3 }),
      area: ([r, h]) => { const b = PI * r * r, l = PI * r * Math.sqrt(r * r + h * h); return { parts: [['Base surface area', b], ['Lateral surface area', l]], total: b + l }; },
      vf: 'V = 1/3 × π × r² × h', af: 'A = π × r² + π × r × √(r² + h²)' },
    cube: { label: 'Cube', fields: [['a', 'Edge length (a)', 3]], vol: ([a]) => ({ total: a ** 3 }), area: ([a]) => ({ total: 6 * a * a }), vf: 'V = a³', af: 'A = 6 × a²' },
    cylinder: { label: 'Cylinder', fields: [['r', 'Base radius (r)', 3], ['h', 'Height (h)', 5]], vol: ([r, h]) => ({ total: PI * r * r * h }),
      area: ([r, h]) => { const t = PI * r * r, l = 2 * PI * r * h; return { parts: [['Top surface area', t], ['Bottom surface area', t], ['Lateral surface area', l]], total: 2 * t + l }; },
      vf: 'V = π × r² × h', af: 'A = 2 × π × r² + 2 × π × r × h' },
    rect: { label: 'Rectangular tank', fields: [['l', 'Length (l)', 2], ['w', 'Width (w)', 3], ['h', 'Height (h)', 4]], vol: ([l, w, h]) => ({ total: l * w * h }),
      area: ([l, w, h]) => ({ total: 2 * (l * w + l * h + w * h) }), vf: 'V = l × w × h', af: 'A = 2 × (l×w + l×h + w×h)' },
    capsule: { label: 'Capsule', fields: [['r', 'Radius (r)', 2], ['h', 'Height of the cylinder part (h)', 5]], vol: ([r, h]) => ({ total: (4 / 3) * PI * r ** 3 + PI * r * r * h }),
      area: ([r, h]) => { const e = 2 * PI * r * r, l = 2 * PI * r * h; return { parts: [['Top (hemisphere) surface area', e], ['Bottom (hemisphere) surface area', e], ['Lateral surface area', l]], total: 2 * e + l }; },
      vf: 'V = 4/3 × π × r³ + π × r² × h', af: 'A = 4 × π × r² + 2 × π × r × h' },
    cap: { label: 'Spherical cap', special: 'cap', fields: [['r', 'Base radius (r)', 3], ['R', 'Ball radius (R)', ''], ['h', 'Height (h)', 1]],
      vf: 'V = 1/3 × π × h² × (3R − h)', af: 'A = π × r² + 2 × π × h × R' },
    frustum: { label: 'Conical frustum', fields: [['r', 'Top radius (r)', 2], ['R', 'Bottom radius (R)', 4], ['h', 'Height (h)', 5]], vol: ([r, R, h]) => ({ total: (PI * h * (r * r + r * R + R * R)) / 3 }),
      area: ([r, R, h]) => { const t = PI * r * r, b = PI * R * R, l = PI * (R + r) * Math.sqrt((R - r) ** 2 + h * h); return { parts: [['Top surface area', t], ['Bottom surface area', b], ['Lateral surface area', l]], total: t + b + l }; },
      vf: 'V = 1/3 × π × h × (r² + r×R + R²)', af: 'A = π × r² + π × R² + π × (R + r) × √((R − r)² + h²)' },
    ellipsoid: { label: 'Ellipsoid', fields: [['a', 'Axis 1 (a)', 2], ['b', 'Axis 2 (b)', 3], ['c', 'Axis 3 (c)', 4]], vol: ([a, b, c]) => ({ total: (4 / 3) * PI * a * b * c }),
      area: ([a, b, c]) => { const p = 1.6; return { approx: true, total: 4 * PI * (((a * b) ** p + (a * c) ** p + (b * c) ** p) / 3) ** (1 / p) }; },
      vf: 'V = 4/3 × π × a × b × c', af: 'A ≈ 4 × π × (((ab)^p + (ac)^p + (bc)^p) ÷ 3)^(1/p), with p = 1.6' },
    pyramid: { label: 'Square pyramid', fields: [['a', 'Base edge (a)', 4], ['h', 'Height (h)', 5]], vol: ([a, h]) => ({ total: (a * a * h) / 3 }),
      area: ([a, h]) => { const b = a * a, l = 2 * a * Math.sqrt((a / 2) ** 2 + h * h); return { parts: [['Base surface area', b], ['Lateral surface area', l]], total: b + l }; },
      vf: 'V = 1/3 × a² × h', af: 'A = a² + 2 × a × √((a/2)² + h²)' },
    tube: { label: 'Tube (hollow cylinder)', volumeOnly: true, fields: [['d1', 'Outer diameter (d₁)', 6], ['d2', 'Inner diameter (d₂)', 4], ['l', 'Length (l)', 10]],
      vol: ([d1, d2, l]) => ({ total: (PI * (d1 * d1 - d2 * d2) * l) / 4 }), vf: 'V = π × (d₁² − d₂²) × l ÷ 4' },
  };

  // The spherical cap needs two of r, R, h. Returns one or two solutions of [r, R, h] (in metres).
  function capSolutions(v) {
    const [r, R, h] = v; const have = [r, R, h].map((x) => x !== null && x !== undefined);
    const n = have.filter(Boolean).length;
    if (n < 2) return { error: 'Please provide at least two of the three values: base radius, ball radius and height.' };
    let use = have.slice(); let note = '';
    if (n === 3) { use = [true, true, false]; note = 'The calculator only needs two values, so it used the base radius and the ball radius.'; }
    const rr = use[0] ? r : null, RR = use[1] ? R : null, hh = use[2] ? h : null;
    if (rr !== null && RR !== null) {
      if (rr > RR) return { error: 'The base radius cannot be larger than the ball radius.' };
      const root = Math.sqrt(RR * RR - rr * rr), h1 = RR - root, h2 = RR + root;
      return { note, sols: root === 0 ? [[rr, RR, RR]] : [[rr, RR, h1], [rr, RR, h2]] };
    }
    if (rr !== null && hh !== null) { if (hh === 0) return { error: 'The height must be greater than zero.' }; return { note, sols: [[rr, (hh * hh + rr * rr) / (2 * hh), hh]] }; }
    const disc = 2 * RR * hh - hh * hh;
    if (disc < 0) return { error: 'The height cannot be larger than the diameter of the ball (2R).' };
    return { note, sols: [[Math.sqrt(disc), RR, hh]] };
  }
  const capVol = ([r, R, h]) => ({ total: (PI * h * h * (3 * R - h)) / 3 });
  const capArea = ([r, R, h]) => { const b = PI * r * r, c = 2 * PI * h * R; return { parts: [['Base surface area', b], ['Cap surface area', c]], total: b + c }; };

  // Core: values = [{ value: number|null, unit }], returns results grouped by the distinct units used
  function compute(mode, shapeId, values) {
    const S = SHAPES[shapeId]; if (!S) return { error: 'Unknown shape.' };
    if (S.special !== 'cap') {
      if (values.some((x) => x.value === null || !Number.isFinite(x.value))) return { error: 'Please provide a number for every field.' };
      if (values.some((x) => x.value < 0)) return { error: 'Please use zero or positive numbers.' };
    } else if (values.some((x) => x.value !== null && (!Number.isFinite(x.value) || x.value < 0))) return { error: 'Please use zero or positive numbers.' };
    const units = []; values.forEach((x) => { if ((x.value !== null) && !units.includes(x.unit)) units.push(x.unit); });
    const out = [];
    const dim = mode === 'volume' ? 3 : 2;
    for (const unit of units) {
      // convert every value into this unit
      const vv = values.map((x) => (x.value === null ? null : (x.value * factor(x.unit)) / factor(unit)));
      let sols;
      if (S.special === 'cap') { const c = capSolutions(vv); if (c.error) return c; sols = c.sols; out.note = c.note; }
      else {
        let vals = vv;
        if (shapeId === 'tube' && vals[1] > vals[0]) vals = [vals[1], vals[0], vals[2]];
        sols = [vals];
      }
      out.push({ unit, label: unit + (dim === 3 ? '³' : '²'), sols: sols.map((s) => { const r = S.special === 'cap' ? (mode === 'volume' ? capVol(s) : capArea(s)) : (mode === 'volume' ? S.vol(s) : S.area(s)); return Object.assign({ inputs: s }, r); }) });
    }
    return { results: out, note: out.note || '' };
  }

  // ---------- interface ----------
  function init(mode) {
    const root = document.getElementById('sh-root'); if (!root) return;
    const el = (id) => document.getElementById(id);
    const ids = Object.keys(SHAPES).filter((k) => mode === 'volume' || !SHAPES[k].volumeOnly);
    let current = ids[0];
    const fmtDim = mode === 'volume' ? 'Volume' : 'Surface area';
    const unitSel = (id) => `<select id="${id}" aria-label="Unit">${UNITS.map((u) => `<option value="${u[0]}"${u[0] === 'meters' ? ' selected' : ''}>${u[1]}</option>`).join('')}</select>`;
    function renderShape() {
      const S = SHAPES[current];
      el('sh-tabs').innerHTML = ids.map((k) => `<button type="button" class="sh-tab${k === current ? ' is-on' : ''}" data-shape="${k}" aria-pressed="${k === current}">${SHAPES[k].label}</button>`).join('');
      el('sh-tabs').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { current = b.dataset.shape; renderShape(); calculate(); }));
      el('sh-fields').innerHTML = S.fields.map(([k, label, def]) => `<div class="field-group"><label for="sh-${k}">${label}</label><div class="sh-row"><input type="text" id="sh-${k}" value="${def}" inputmode="decimal" autocomplete="off">${unitSel('sh-u-' + k)}</div></div>`).join('') +
        (S.special === 'cap' ? '<p class="sh-hint">Fill in any two of the three boxes and leave the other empty.</p>' : '');
      el('sh-title').textContent = `${S.label} ${fmtDim.toLowerCase()}`;
    }
    function read() {
      const S = SHAPES[current];
      return S.fields.map(([k]) => { const raw = el('sh-' + k).value.trim().replace(/,/g, ''); const n = raw === '' ? null : Number(raw); return { value: n, unit: el('sh-u-' + k).value }; });
    }
    const parts = (r, label) => (r.parts ? r.parts.map(([n, v]) => `<div class="stat-row"><span>${n}</span><strong>${f(v)} ${label}</strong></div>`).join('') : '');
    function calculate() {
      const S = SHAPES[current]; const res = compute(mode, current, read());
      if (res.error) { el('sh-result').innerHTML = `<p class="tool-result is-error">${res.error}</p>`; return; }
      const formula = mode === 'volume' ? S.vf : S.af;
      let html = '';
      res.results.forEach((g, gi) => {
        if (gi > 0) html += '<div class="sh-or">Or in ' + g.label.replace('³', ' cubed').replace('²', ' squared') + ':</div>';
        g.sols.forEach((s, si) => {
          if (g.sols.length > 1) html += `<h3 class="sh-sub">Possible solution ${si + 1}${S.special === 'cap' ? ` (height ${f(s.inputs[2])} ${g.unit})` : ''}</h3>`;
          html += `<div class="summary-payment-box"><div class="label">${fmtDim}${s.approx ? ' (approximate)' : ''}</div><div class="value" style="overflow-wrap:anywhere;">${s.approx ? '≈ ' : ''}${f(s.total)} ${g.label}</div></div>` + parts(s, g.label);
        });
      });
      html += `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Formula:</strong> ${formula}${res.note ? '<br>' + res.note : ''}</div>`;
      el('sh-result').innerHTML = html + conversions(res.results[0].sols[0].total, res.results[0].unit);
    }
    // the first result expressed in other common units
    function conversions(total, unit) {
      const m = mode === 'volume' ? total * factor(unit) ** 3 : total * factor(unit) ** 2;
      const rows = mode === 'volume'
        ? [['Cubic meters (m³)', m], ['Liters', m * 1000], ['Milliliters (cm³)', m * 1e6], ['US gallons', m / 0.003785411784], ['Cubic feet', m / 0.3048 ** 3], ['Cubic inches', m / 0.0254 ** 3]]
        : [['Square meters (m²)', m], ['Square centimeters', m * 1e4], ['Square feet', m / 0.3048 ** 2], ['Square inches', m / 0.0254 ** 2], ['Square yards', m / 0.9144 ** 2], ['Acres', m / 4046.8564224]];
      return `<h3 class="sh-sub" style="margin-top:16px;">The same ${fmtDim.toLowerCase()} in other units</h3>` + rows.map(([n, v]) => `<div class="stat-row"><span>${n}</span><strong>${f(v)}</strong></div>`).join('');
    }
    el('sh-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
    renderShape(); calculate();
  }

  return { UNITS, SHAPES, compute, capSolutions, init, f };
})();
