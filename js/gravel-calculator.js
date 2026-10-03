'use strict';

(function () {
  const B = window.BuildCommon;
  if (!B || !B.el('gr-form')) return;
  const el = B.el;
  const M3_PER_FT3 = 0.028316846592, M3_PER_YD3 = 0.764554857984, LB = 0.45359237, SHORT_TON_KG = 907.18474;
  const DENSITY = { gravel: 1680, gravelsand: 1920, drysand: 1500, wetsand: 1900 }; // kg per cubic meter
  const money = (v) => '$' + B.fixed(v, 2);

  function run() {
    const mode = el('gr-mode').value, depth = B.num('gr-depth');
    if (depth === null || !(depth >= 0)) return B.error('gr-result', 'Enter the depth of gravel, 0 or more.');
    let area, areaNote = '';
    if (mode === 'area') {
      const a = B.num('gr-area');
      if (a === null || !(a >= 0)) return B.error('gr-result', 'Enter the area to cover, 0 or more.');
      area = a * B.AREA[el('gr-area-unit').value];
    } else if (mode === 'rect') {
      const l = B.num('gr-l'), w = B.num('gr-w');
      if (!(l >= 0) || !(w >= 0) || l === null || w === null) return B.error('gr-result', 'Enter the length and width, 0 or more.');
      area = l * B.LEN[el('gr-l-unit').value] * w * B.LEN[el('gr-w-unit').value];
    } else {
      const d = B.num('gr-d');
      if (d === null || !(d >= 0)) return B.error('gr-result', 'Enter the diameter, 0 or more.');
      const r = (d * B.LEN[el('gr-d-unit').value]) / 2;
      area = Math.PI * r * r;
    }
    let density = DENSITY[el('gr-type').value];
    if (el('gr-type').value === 'own') {
      const d = B.num('gr-density');
      if (!(d > 0)) return B.error('gr-result', 'Enter the density, more than 0.');
      const u = el('gr-density-unit').value;
      density = u === 'gcm' ? d * 1000 : u === 'lbf' ? (d * LB) / M3_PER_FT3 : d;
    }
    if (mode !== 'area') areaNote = `The area is ${B.dec(area / 0.09290304, 1)} square feet, ${B.dec(area / 0.83612736, 1)} square yards, or ${B.dec(area, 1)} square meters.`;
    const vol = area * depth * B.LEN[el('gr-depth-unit').value]; // cubic meters
    if (!(vol < 1e12)) return B.error('gr-result', 'That is more gravel than this calculator can handle. Check the units.');
    const kg = vol * density, lbs = kg / LB;
    let html = B.big('Gravel needed', `${B.dec(vol / M3_PER_YD3, 2)} cubic yards`, `${B.dec(vol, 2)} cubic meters, ${B.dec(vol / M3_PER_FT3, 1)} cubic feet, or ${B.group(Math.round(vol * 1000))} liters`) +
      B.row('Weight', `${B.group(Math.round(kg))} kg, or ${B.group(Math.round(lbs))} lbs`) +
      B.row('In tons', `${B.dec(kg / 1000, 2)} metric tons, or ${B.dec(kg / SHORT_TON_KG, 2)} short tons`);
    if (areaNote) html += `<p style="font-size:13px;margin:10px 0 0;">${areaNote}</p>`;

    const price = B.num('gr-price');
    if (price !== null) {
      if (!Number.isFinite(price) || price < 0) return B.error('gr-result', 'The price must be 0 or more, or leave it empty.');
      const u = el('gr-price-unit').value;
      const per = { f: vol / M3_PER_FT3, y: vol / M3_PER_YD3, m: vol, l: vol * 1000, p: lbs, st: kg / SHORT_TON_KG, k: kg, t: kg / 1000 };
      const names = { f: 'cubic foot', y: 'cubic yard', m: 'cubic meter', l: 'liter', p: 'pound', st: 'short ton', k: 'kilogram', t: 'metric ton' };
      if (u === 'b') {
        const bag = B.num('gr-bag'), bu = el('gr-bag-unit').value;
        if (!(bag > 0)) return B.error('gr-result', 'Enter the size of a bag, more than 0.');
        const perBagM3 = bu === 'f' ? bag * M3_PER_FT3 : bu === 'l' ? bag / 1000 : null;
        const bags = bu === 'f' || bu === 'l' ? Math.ceil(vol / perBagM3 - 1e-9) : Math.ceil((bu === 'b' ? lbs : kg) / bag - 1e-9);
        const unitName = { f: 'cubic-foot', l: 'liter', b: 'pound', k: 'kilogram' }[bu];
        if (!(bags < 1e12) || !(bags * price < 1e15)) return B.error('gr-result', 'The cost is too large to show. Check the price.');
        html += B.row('Bags needed', `${B.group(bags)} bags of ${B.dec(bag, 2)} ${unitName}`) + B.row(`Cost at ${money(price)} per bag`, money(bags * price));
      } else if (!(per[u] * price < 1e15)) return B.error('gr-result', 'The cost is too large to show. Check the price.');
      else html += B.row(`Cost at ${money(price)} per ${names[u]}`, money(per[u] * price));
    }
    html += '<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:10px 0 0;">This is only an estimate. The real amount depends on the type of gravel, how tightly it is packed and how wet it is.</p>';
    el('gr-result').innerHTML = html;
  }

  function applyMode() {
    const m = el('gr-mode').value;
    el('gr-area-box').style.display = m === 'area' ? '' : 'none';
    el('gr-rect-box').style.display = m === 'rect' ? '' : 'none';
    el('gr-circ-box').style.display = m === 'circ' ? '' : 'none';
    el('gr-own-box').style.display = el('gr-type').value === 'own' ? '' : 'none';
    el('gr-bag-box').style.display = el('gr-price-unit').value === 'b' ? '' : 'none';
  }
  el('gr-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('gr-form').addEventListener('input', run);
  el('gr-form').addEventListener('change', () => { applyMode(); run(); });
  applyMode();
  run();
})();
