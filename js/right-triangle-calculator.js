'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rt-form');
  if (!form) return;

  const FIELDS = ['a', 'alpha', 'b', 'beta', 'c', 'h', 'area', 'p'];
  const NAMES = { a: 'a', alpha: 'α', b: 'b', beta: 'β', c: 'c', h: 'h', area: 'area', p: 'perimeter' };
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const t5 = (v) => String(Number(v.toFixed(5)));
  const t4 = (v) => String(Number(v.toFixed(4)));
  const t2 = (v) => String(Number(v.toFixed(3)));
  const error = (msg) => { el('rt-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  function dmsText(d) {
    let deg0 = Math.floor(d + 1e-12), rest = (d - deg0) * 60, min = Math.floor(rest + 1e-12), sec = Math.round((rest - min) * 60);
    if (sec === 60) { sec = 0; min += 1; } if (min === 60) { min = 0; deg0 += 1; }
    return `${deg0}°${min}'${sec}"`;
  }
  const angleText = (d) => {
    const nice = Math.abs(d - Math.round(d)) < 1e-9;
    return `${t2(d)}°${nice ? '' : ' = ' + dmsText(d)} = ${t4(rad(d))} rad`;
  };

  // legs a and b are enough to describe a right triangle
  function fromLegs(a, b) { return { a, b, c: Math.hypot(a, b) }; }
  // two-solution helper: c and a quantity s with a*b = k  (a^2 and b^2 are roots of x^2 - c^2 x + k^2 = 0)
  function fromCandProduct(c, k) {
    const disc = c ** 4 - 4 * k * k;
    if (disc < -1e-12 * c ** 4) return null;
    const r = Math.sqrt(Math.max(disc, 0));
    const a = Math.sqrt((c * c - r) / 2), b = Math.sqrt((c * c + r) / 2);
    return a === b ? [fromLegs(a, b)] : [fromLegs(a, b), fromLegs(b, a)];
  }

  function solve(g) {
    const has = (k) => g[k] !== undefined;
    const keys = FIELDS.filter(has);
    // angles
    let alpha = null;
    if (has('alpha') && has('beta')) return { error: 'Can not calculate based on 2 angles only.' };
    if (has('alpha')) alpha = g.alpha; else if (has('beta')) alpha = 90 - g.beta;
    const angKey = has('alpha') ? 'alpha' : has('beta') ? 'beta' : null;
    if (angKey) {
      const v = g[angKey];
      if (!(v > 0 && v < 90)) return { error: `Please provide a ${NAMES[angKey]} value greater than 0° and less than 90°.` };
    }
    const other = keys.filter((k) => k !== angKey);
    if (angKey && other.length === 1) {
      const k = other[0], A = rad(alpha), s = Math.sin(A), co = Math.cos(A), t = Math.tan(A);
      const sideKey = k; // a is always opposite alpha and b opposite beta, and alpha = 90 - beta when beta is given
      const x = g[k]; if (!(x > 0)) return { error: `Please provide a positive value for ${NAMES[k]}.` };
      if (sideKey === 'a') return { sols: [fromLegs(x, x / t)] };
      if (sideKey === 'b') return { sols: [fromLegs(x * t, x)] };
      if (sideKey === 'c') return { sols: [fromLegs(x * s, x * co)] };
      if (k === 'h') return { sols: [fromLegs(x / co, x / s)] };
      if (k === 'area') return { sols: [fromLegs(Math.sqrt(2 * x * t), Math.sqrt((2 * x) / t))] };
      if (k === 'p') { const c = x / (1 + s + co); return { sols: [fromLegs(c * s, c * co)] }; }
    }
    if (keys.length !== 2) return { error: 'internal' };
    const [k1, k2] = keys; const x = g[k1], y = g[k2];
    const pair = `${k1}+${k2}`;
    if (!(x > 0) || !(y > 0)) return { error: 'All values must be greater than zero.' };
    switch (pair) {
      case 'a+b': return { sols: [fromLegs(x, y)] };
      case 'a+c': if (!(x < y)) return { error: 'The value a needs to be smaller than c.' }; return { sols: [fromLegs(x, Math.sqrt(y * y - x * x))] };
      case 'b+c': if (!(x < y)) return { error: 'The value b needs to be smaller than c.' }; return { sols: [fromLegs(Math.sqrt(y * y - x * x), x)] };
      case 'a+h': { if (!(y < x)) return { error: 'The value h needs to be smaller than a.' }; const c = (x * x) / Math.sqrt(x * x - y * y); return { sols: [fromLegs(x, Math.sqrt(c * c - x * x))] }; }
      case 'b+h': { if (!(y < x)) return { error: 'The value h needs to be smaller than b.' }; const c = (x * x) / Math.sqrt(x * x - y * y); return { sols: [fromLegs(Math.sqrt(c * c - x * x), x)] }; }
      case 'c+h': { const s = fromCandProduct(x, x * y); if (!s) return { error: 'The value c needs to be at least twice h.' }; return { sols: s }; }
      case 'a+area': return { sols: [fromLegs(x, (2 * y) / x)] };
      case 'b+area': return { sols: [fromLegs((2 * y) / x, x)] };
      case 'c+area': { const s = fromCandProduct(x, 2 * y); if (!s) return { error: 'No right triangle has that hypotenuse and area. The area is too large for this c.' }; return { sols: s }; }
      case 'h+area': { const c = (2 * y) / x; const s = fromCandProduct(c, 2 * y); if (!s) return { error: 'No right triangle has that height and area.' }; return { sols: s }; }
      case 'a+p': { const b = (y * y - 2 * x * y) / (2 * y - 2 * x); if (!(b > 0) || !(y > 2 * x)) return { error: 'The perimeter must be larger than twice a.' }; return { sols: [fromLegs(x, b)] }; }
      case 'b+p': { const a = (y * y - 2 * x * y) / (2 * y - 2 * x); if (!(a > 0) || !(y > 2 * x)) return { error: 'The perimeter must be larger than twice b.' }; return { sols: [fromLegs(a, x)] }; }
      case 'c+p': { const s = y - x, disc = 2 * x * x - s * s; if (!(s > x) || disc < 0) return { error: 'No right triangle has that hypotenuse and perimeter.' }; const r = Math.sqrt(disc); const a = (s + r) / 2, b = (s - r) / 2; return { sols: a === b ? [fromLegs(a, b)] : [fromLegs(a, b), fromLegs(b, a)] }; }
      case 'area+p': { const s = (y * y + 4 * x) / (2 * y), disc = s * s - 8 * x; if (disc < 0) return { error: 'No right triangle has that area and perimeter.' }; const r = Math.sqrt(disc); const a = (s + r) / 2, b = (s - r) / 2; if (!(b > 0)) return { error: 'No right triangle has that area and perimeter.' }; return { sols: a === b ? [fromLegs(a, b)] : [fromLegs(a, b), fromLegs(b, a)] }; }
      case 'h+p': return { error: 'We are unable to calculate based on h and perimeter.' };
      default: return { error: 'We are unable to calculate based on those two values.' };
    }
  }

  function describe(s, angKey) {
    const { a, b, c } = s;
    const A = deg(Math.asin(a / c)), B = 90 - A;
    const h = (a * b) / c, area = (a * b) / 2, p = a + b + c, inr = (a * b) / p, circ = c / 2;
    const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;">${v}</strong></div>`;
    return row('a', t5(a)) + row('b', t5(b)) + row('c', t5(c)) + row('Angle α (opposite a)', angleText(A)) + row('Angle β (opposite b)', angleText(B)) +
      row('Height to the hypotenuse, h', t5(h)) + row('Area', t5(area)) + row('Perimeter', t5(p)) + row('Inradius', t5(inr)) + row('Circumradius', t5(circ));
  }

  function diagram(s) {
    const W = 260, H = 170, pad = 28; const sc = Math.min((W - 2 * pad) / s.b, (H - 2 * pad) / s.a);
    const bw = Math.max(40, s.b * sc), ah = Math.max(40, s.a * sc);
    const x0 = (W - bw) / 2, y0 = (H + ah) / 2, f = (v) => Number(v.toFixed(2));
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Right triangle with legs a and b and hypotenuse c" style="max-width:300px;display:block;margin:12px 0 0;">` +
      `<polygon points="${x0},${y0} ${x0 + bw},${y0} ${x0},${y0 - ah}" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<polyline points="${x0 + 12},${y0} ${x0 + 12},${y0 - 12} ${x0},${y0 - 12}" fill="none" stroke="#2563eb" stroke-width="1.5"/>` +
      `<text x="${f(x0 - 8)}" y="${f(y0 - ah / 2)}" text-anchor="end" font-size="14" font-weight="700" fill="#111827">a</text>` +
      `<text x="${f(x0 + bw / 2)}" y="${f(y0 + 18)}" text-anchor="middle" font-size="14" font-weight="700" fill="#111827">b</text>` +
      `<text x="${f(x0 + bw / 2 + 8)}" y="${f(y0 - ah / 2 - 6)}" font-size="14" font-weight="700" fill="#111827">c</text>` +
      `<text x="${f(x0 + bw - 26)}" y="${f(y0 - 6)}" font-size="13" fill="#6b7280">α</text><text x="${f(x0 + 6)}" y="${f(y0 - ah + 22)}" font-size="13" fill="#6b7280">β</text></svg>`;
  }

  function calculate() {
    const g = {}; const given = [];
    for (const k of FIELDS) {
      const raw = el('rt-' + k).value.trim().replace(/,/g, '');
      if (raw === '') continue;
      let v = Number(raw);
      if (!Number.isFinite(v)) return error('Please provide numerical values only.');
      if (k === 'alpha' || k === 'beta') { if (el('rt-' + k + '-unit').value === 'r') v = deg(v); }
      g[k] = v; given.push(k);
    }
    if (given.length < 2) return error('Please provide 2 values to calculate.');
    if (given.length > 2) return error(`Please provide 2 values only to calculate, you provided ${given.length} values.`);
    const res = solve(g);
    if (res.error) return error(res.error);
    const text = given.map((k) => `${NAMES[k]} = ${(k === 'alpha' || k === 'beta') ? t4(g[k]).replace(/^/, '') + '°' : t5(g[k])}`).join(' and ');
    let html = `<div class="summary-payment-box"><div class="label">Given ${text}${res.sols.length > 1 ? ', there are two possible solutions' : ''}</div><div class="value" style="overflow-wrap:anywhere;">c = ${t5(res.sols[0].c)}</div></div>`;
    res.sols.forEach((s, i) => { html += (res.sols.length > 1 ? `<h3 style="margin:14px 0 4px;font-size:15px;">Possible ${i + 1}</h3>` : '') + describe(s) + (i === 0 ? diagram(s) : ''); });
    el('rt-result').innerHTML = html;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
