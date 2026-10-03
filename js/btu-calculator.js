'use strict';

(function () {
  const B = window.BuildCommon;
  if (!B || !B.el('ac-form')) return;
  const el = B.el;
  const FT_PER_M = 1 / 0.3048, SQFT_PER_SQM = FT_PER_M * FT_PER_M;
  const WATTS = 0.29307107, TON = 12000;

  const INSULATION = { good: 0.8, normal: 1, poor: 1.2 };
  const SUN = { shaded: 0.9, normal: 1, sunny: 1.1 };
  const CLIMATE = { cold: 0.85, normal: 1, hot: 1.2 };

  // Extra BTU for ceilings above 8 feet. Large rooms scale it up.
  function heightAdder(h, area) {
    if (h <= 8) return 0;
    const base = h <= 10 ? 1000 * (h - 8) : ((h - 8) * (8000 + 200 * h)) / h;
    return base * Math.max(1, 3 - 1000 / area);
  }
  const out = (btu, tons) => B.big('Cooling or heating needed', `${B.group(Math.round(btu))} BTU per hour`, `${B.group(Math.round(btu * WATTS))} watts${tons ? `, about ${B.dec(btu / TON, 1)} ton${btu / TON === 1 ? '' : 's'}` : ''}`) +
    B.row('BTU per hour', B.group(Math.round(btu))) + B.row('Watts', B.group(Math.round(btu * WATTS))) + B.row('Tons of cooling', B.dec(btu / TON, 2));

  function room() {
    const size = B.num('ac-size'), h = B.num('ac-h'), ppl = B.num('ac-people');
    if (!(size > 0)) return B.error('ac-result', 'Enter the size of the room, more than 0.');
    if (!(h > 0)) return B.error('ac-result', 'Enter the ceiling height, more than 0.');
    if (!(ppl >= 0)) return B.error('ac-result', 'Enter the number of people, 0 or more.');
    const area = el('ac-size-unit').value === 'meters' ? size * SQFT_PER_SQM : size;
    const hft = el('ac-h-unit').value === 'meters' ? h * FT_PER_M : h;
    const type = el('ac-type').value;
    let btu = (20 * area + 2500 + heightAdder(hft, area)) * INSULATION[el('ac-ins').value] * SUN[el('ac-sun').value] * CLIMATE[el('ac-climate').value];
    if (type === 'second') btu *= 1.1;
    btu += 600 * Math.max(0, ppl - 2);
    if (type === 'kitchen') btu += 4000;
    if (type === 'living') btu += 1000;
    if (!(btu < 1e9)) return B.error('ac-result', 'That is too large to estimate. Check the units.');
    el('ac-result').innerHTML = out(btu, false) + `<p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">Room size used: ${B.dec(area, 1)} square feet. This is a rough estimate.</p>`;
  }

  function house() {
    const w = B.num('hc-w'), l = B.num('hc-l'), h = B.num('hc-h'), t = B.num('hc-t');
    if (!(w > 0) || !(l > 0)) return B.error('hc-result', 'Enter the width and length, more than 0.');
    if (!(h > 0)) return B.error('hc-result', 'Enter the ceiling height, more than 0.');
    if (!(t > 0)) return B.error('hc-result', 'Enter the temperature change, more than 0.');
    const toFt = (id, unitId) => (el(unitId).value === 'meters' ? B.num(id) * FT_PER_M : B.num(id));
    const W = toFt('hc-w', 'hc-w-unit'), L = toFt('hc-l', 'hc-l-unit'), H = toFt('hc-h', 'hc-h-unit');
    const dT = el('hc-t-unit').value === 'c' ? t * 1.8 : t;
    const k = { good: 0.24, normal: 0.4, poor: 0.84 }[el('hc-ins').value];
    const btu = dT * k * (W * L + 2 * (W + L) * H);
    if (!(btu < 1e9)) return B.error('hc-result', 'That is too large to estimate. Check the units.');
    el('hc-result').innerHTML = out(btu, true) + `<p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">Based on a temperature change of ${B.dec(dT, 1)}°F.</p>`;
  }

  el('ac-form').addEventListener('submit', (e) => { e.preventDefault(); room(); });
  el('hc-form').addEventListener('submit', (e) => { e.preventDefault(); house(); });
  el('ac-form').addEventListener('input', room); el('ac-form').addEventListener('change', room);
  el('hc-form').addEventListener('input', house); el('hc-form').addEventListener('change', house);
  room();
  house();
})();
