'use strict';

// Straight-line helpers shared by the Slope and Distance calculators.
window.LineCommon = (function () {
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };

  // About 14 significant digits, written without exponent where possible.
  function f(v) {
    if (Object.is(v, -0) || v === 0) return '0';
    const r = Number(v.toPrecision(14));
    if (Math.abs(r) >= 1e21 || Math.abs(r) < 1e-9) return r.toExponential(8).replace(/\.?0+e/, 'e');
    return String(r);
  }
  const deg = (r) => (r * 180) / Math.PI;

  // A plain decimal string as an exact integer scaled by 10^k, so fractions are exact.
  function parseDecimal(str) {
    const s = String(str).trim().replace(/,/g, '');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    const neg = s.startsWith('-'); const body = s.replace(/^[+-]/, '');
    const [i, fr = ''] = body.split('.');
    return { int: BigInt((neg ? '-' : '') + (i || '0') + fr), scale: fr.length };
  }
  function align(list) {
    const k = Math.max(...list.map((p) => p.scale));
    return { S: 10n ** BigInt(k), vals: list.map((p) => p.int * 10n ** BigInt(k - p.scale)) };
  }
  // n/d as lowest terms with a positive denominator, written like "-2/3" or "4"
  function frac(n, d) {
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n; n /= g; d /= g;
    return { n, d, text: d === 1n ? String(n) : `${n}/${d}` };
  }

  // Everything about the line through two points given as exact decimal strings.
  function twoPoints(sx1, sy1, sx2, sy2) {
    const ps = [sx1, sy1, sx2, sy2].map(parseDecimal);
    if (ps.some((p) => !p)) return { error: 'Please provide numerical values for all four coordinates.' };
    const { S, vals } = align(ps); const [X1, Y1, X2, Y2] = vals;
    const dX = X2 - X1, dY = Y2 - Y1;
    const x1 = Number(sx1.replace(/,/g, '')), y1 = Number(sy1.replace(/,/g, '')), x2 = Number(sx2.replace(/,/g, '')), y2 = Number(sy2.replace(/,/g, ''));
    const dx = Number(dX) / Number(S), dy = Number(dY) / Number(S);
    if (dX === 0n && dY === 0n) return { same: true };
    const dist = Math.hypot(dx, dy);
    const out = { x1, y1, x2, y2, dx, dy, dist, dsq: dx * dx + dy * dy, vertical: dX === 0n, horizontal: dY === 0n };
    if (dX === 0n) { out.theta = dY > 0n ? 90 : 270; return out; }
    // reduced rise over run, keeping signs unless both are negative
    const g = gcd(dY, dX);
    let rn = dY / g, rd = dX / g;
    if (rn < 0n && rd < 0n) { rn = -rn; rd = -rd; }
    out.riseText = String(rn); out.runText = String(rd);
    out.m = Number(dY) / Number(dX);
    let th = deg(Math.atan(dy / dx));
    if (dY !== 0n) { if (dX < 0n) th += 180; else if (dY < 0n) th += 360; }
    out.theta = th;
    // y = m x + b, with b as an exact fraction
    const bNum = Y1 * dX - dY * X1, bDen = dX * S;
    out.b = f(Number(bNum) / Number(bDen));
    out.bFrac = frac(bNum, bDen); out.mFrac = frac(dY, dX);
    out.bValue = Number(bNum) / Number(bDen);
    return out;
  }

  // "y = ..." text for slope m (number) and intercept b (number), decimal form
  function decimalEquation(r) {
    if (r.horizontal) return `y = ${r.b}`;
    const m = r.m === 1 ? '' : r.m === -1 ? '-' : f(r.m);
    const b = r.bValue;
    return `y = ${m}x${b === 0 ? '' : b < 0 ? ' − ' + f(-b) : ' + ' + f(b)}`;
  }
  function fractionEquation(r) {
    if (r.horizontal || r.mFrac.d === 1n) return null;
    const mt = r.mFrac.n === 1n ? '' : r.mFrac.n === -1n ? '-' : r.mFrac.text;
    const num = r.mFrac.n, den = r.mFrac.d;
    const slope = `${num < 0n ? '-' : ''}${(num < 0n ? -num : num)}/${den}`;
    const bt = r.bFrac.n === 0n ? '' : r.bFrac.n < 0n ? ` − ${-r.bFrac.n}${r.bFrac.d === 1n ? '' : '/' + r.bFrac.d}` : ` + ${r.bFrac.n}${r.bFrac.d === 1n ? '' : '/' + r.bFrac.d}`;
    return `y = ${slope === '' ? mt : slope}x${bt}`;
  }

  // HTML block describing a line: slope, angle, equation and intercepts
  function lineBlock(r) {
    const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong style="text-align:right;">${v}</strong></div>`;
    let h = row('ΔX = x₂ − x₁', f(r.dx)) + row('ΔY = y₂ − y₁', f(r.dy));
    if (r.vertical) {
      return h + row('Slope (m)', 'undefined (vertical line)') + row('Angle (θ)', `${r.theta}°`) +
        `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;"><strong>Equation of the line:</strong> x = ${f(r.x1)}<br>The line never crosses the y-axis unless x = 0.</div>`;
    }
    h += row('Slope (m) = ΔY ÷ ΔX', `${r.riseText}/${r.runText} = ${f(r.m)}`) + row('Angle (θ)', `${f(r.theta)}°`);
    const alt = fractionEquation(r);
    let eq = `<strong>Equation of the line:</strong><br>${decimalEquation(r)}${alt ? `<br>or ${alt}` : ''}<br>When x = 0, y = ${r.b}`;
    if (!r.horizontal) eq += `<br>When y = 0, x = ${f(-r.bValue / r.m)}`;
    return h + `<div class="callout" style="margin-top:12px;overflow-wrap:anywhere;">${eq}</div>`;
  }

  return { f, deg, twoPoints, lineBlock, decimalEquation, parseDecimal };
})();
