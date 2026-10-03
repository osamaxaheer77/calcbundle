'use strict';

(function () {
  const B = window.BuildCommon;
  if (!B || !B.el('tl-form')) return;
  const el = B.el;
  const money = (v) => '$' + B.fixed(v, 2).replace(/\.00$/, '');
  const price = (v) => '$' + B.dec(v, 4);

  function run() {
    const tl = B.num('tl-tl'), tw = B.num('tl-tw'), gap = B.num('tl-gap') === null ? 0 : B.num('tl-gap');
    const box = B.num('tl-box'), p = B.num('tl-price');
    if (!(tl > 0) || !(tw > 0)) return B.error('tl-result', 'Enter the tile length and width, more than 0.');
    if (!Number.isFinite(gap)) return B.error('tl-result', 'Enter the gap size as a number, or leave it at 0.');
    const L = tl * B.LEN[el('tl-tl-unit').value], W = tw * B.LEN[el('tl-tw-unit').value], g = gap * B.LEN[el('tl-gap-unit').value];
    if (!(L + g > 0) || !(W + g > 0)) return B.error('tl-result', 'The overlap is too large for the tile size.');
    let area;
    if (el('tl-mode').value === 'area') {
      const a = B.num('tl-area');
      if (a === null || !(a >= 0)) return B.error('tl-result', 'Enter the area to cover, 0 or more.');
      area = a * B.AREA[el('tl-area-unit').value];
    } else {
      const al = B.num('tl-al'), aw = B.num('tl-aw');
      if (!(al >= 0) || !(aw >= 0) || al === null || aw === null) return B.error('tl-result', 'Enter the length and width of the area, 0 or more.');
      area = al * B.LEN[el('tl-al-unit').value] * aw * B.LEN[el('tl-aw-unit').value];
    }
    if (box !== null && (!Number.isFinite(box) || !(box >= 1))) return B.error('tl-result', 'The tiles per box must be 1 or more, or leave it empty.');
    if (p !== null && (!Number.isFinite(p) || p < 0)) return B.error('tl-result', 'The price must be 0 or more, or leave it empty.');
    const unit = el('tl-price-unit').value;
    if (p !== null && unit === 'box' && box === null) return B.error('tl-result', 'Enter the tiles per box to price by the box.');

    const exact = area / ((L + g) * (W + g));
    if (!(exact < 1e9)) return B.error('tl-result', 'That is more tiles than this calculator can count. Check the units.');
    const tiles = Math.ceil(exact - 1e-9);
    const lowT = Math.ceil(exact * 1.05 - 1e-9), highT = Math.ceil(exact * 1.1 - 1e-9);
    const hasBox = box !== null;
    const boxes = hasBox ? Math.ceil(exact / box - 1e-9) : 0, lowB = hasBox ? Math.ceil((exact * 1.05) / box - 1e-9) : 0, highB = hasBox ? Math.ceil((exact * 1.1) / box - 1e-9) : 0;
    const sqft = area / B.AREA.foot;
    let html = B.big('Tiles needed', B.group(tiles), `${hasBox ? B.group(boxes) + (boxes === 1 ? ' box' : ' boxes') + ' of ' + B.group(box) + ', ' : ''}covering ${B.dec(sqft, 2)} square feet (${B.dec(area, 2)} square meters)`) +
      B.row('Add 5% to 10% for waste', `${B.group(lowT)} to ${B.group(highT)} tiles` + (hasBox ? ` (${B.group(lowB)} to ${B.group(highB)} boxes)` : ''));
    if (p !== null) {
      let cost, extra = '';
      if (unit === 'tile') { cost = tiles * p; extra = `${money(lowT * p)} to ${money(highT * p)}`; }
      else if (unit === 'box') { cost = boxes * p; extra = `${money(lowB * p)} to ${money(highB * p)}`; }
      else { const perM2 = { foot: p / 0.09290304, inch: p / 0.00064516, yard: p / 0.83612736, meter: p, cm: p / 0.0001 }[unit]; cost = area * perM2; }
      if (!(Math.max(cost, highT * p, highB * p) < 1e15)) return B.error('tl-result', 'The cost is too large to show. Check the price.');
      const label = { tile: 'per tile', box: 'per box', foot: 'per square foot', inch: 'per square inch', yard: 'per square yard', meter: 'per square meter', cm: 'per square cm' }[unit];
      html += B.row(`Cost at ${price(p)} ${label}`, money(cost));
      if (extra) html += B.row('Cost with 5% to 10% extra', extra);
    }
    const gi = Math.abs(g / 0.0254), gw = `${B.dec(gi, 3)} inch${gi === 1 ? '' : 'es'}`;
    html += `<p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">${g < 0 ? `The tiles overlap by ${gw}, so each tile takes up its size less that amount.` : `Each tile takes up its size plus the gap of ${gw}.`}</p>`;
    el('tl-result').innerHTML = html;
  }

  function applyMode() {
    const area = el('tl-mode').value === 'area';
    el('tl-dim-box').style.display = area ? 'none' : '';
    el('tl-area-box').style.display = area ? '' : 'none';
  }
  el('tl-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('tl-form').addEventListener('input', run);
  el('tl-form').addEventListener('change', () => { applyMode(); run(); });
  applyMode();
  run();
})();
