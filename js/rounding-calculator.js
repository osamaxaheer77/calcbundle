'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rd-form');
  if (!form) return;

  const MODES = [
    ['nearest', 'Round to the nearest (default)', ''],
    ['up', 'Round half up', ' using the half up method'],
    ['down', 'Round half down', ' using the half down method'],
    ['ceil', 'Round up (ceiling)', ''],
    ['floor', 'Round down (floor)', ''],
    ['even', 'Round half to even', ' using the half to even method'],
    ['odd', 'Round half to odd', ' using the half to odd method'],
    ['away', 'Round half away from zero', ' using the half away from zero method'],
    ['toward', 'Round half towards zero', ' using the half towards zero method'],
  ];
  const pow10 = (n) => 10n ** BigInt(n);
  const error = (msg) => { el('rd-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; };

  // Exact decimal: value = N / 10^scale
  function parse(raw) {
    const s = raw.replace(/[,\s]/g, '');
    const m = s.match(/^([+-]?)(\d+\.?\d*|\.\d+)(?:[eE]([+-]?\d+))?$/);
    if (!m) return null;
    const neg = m[1] === '-'; const [i, fr = ''] = m[2].split('.');
    let N = BigInt((i || '0') + fr), scale = fr.length - (m[3] ? Number(m[3]) : 0);
    if (Math.abs(scale) > 5000) return null;
    if (scale < 0) { N *= pow10(-scale); scale = 0; }
    return { N: neg ? -N : N, scale, echo: s.replace(/^\+/, '') };
  }
  const floorDiv = (a, b) => { let q = a / b; if (a % b !== 0n && (a < 0n) !== (b < 0n)) q -= 1n; return q; };

  // Round N / 10^scale to a whole number of units of 10^-p (p may be negative), returning an integer
  function roundTo(N, scale, p, mode) {
    if (p >= scale) return N * pow10(p - scale);
    const den = pow10(scale - p);
    const q = floorDiv(N, den), r = N - q * den;
    if (r === 0n) return q;
    const twice = 2n * r, tie = twice === den, below = twice < den;
    switch (mode) {
      case 'floor': return q;
      case 'ceil': return q + 1n;
      case 'up': return tie ? q + 1n : below ? q : q + 1n;
      case 'down': return tie ? q : below ? q : q + 1n;
      case 'toward': return tie ? (N > 0n ? q : q + 1n) : below ? q : q + 1n;
      case 'even': return tie ? (q % 2n === 0n ? q : q + 1n) : below ? q : q + 1n;
      case 'odd': return tie ? (q % 2n !== 0n ? q : q + 1n) : below ? q : q + 1n;
      default: return tie ? (N > 0n ? q + 1n : q) : below ? q : q + 1n; // nearest and half away from zero
    }
  }
  const absB = (x) => (x < 0n ? -x : x);

  // Text for the rounded value
  function decimalText(M, neg, p) {
    if (p <= 0) { const v = M * pow10(-p); return (v < 0n ? '-' : '') + absB(v).toString(); }
    const a = absB(M).toString().padStart(p + 1, '0');
    return (neg ? '-' : '') + a.slice(0, a.length - p) + '.' + a.slice(a.length - p);
  }
  function fractionText(M, d, neg) {
    const a = absB(M), whole = a / BigInt(d), n = a % BigInt(d);
    const sign = neg && a !== 0n ? '-' : '';
    if (n === 0n) return sign + whole.toString();
    return sign + (whole > 0n ? whole.toString() + ' ' : '') + `${n}/${d}`;
  }
  function unitText(spec) {
    if (spec.type === 'frac') return `1/${spec.d}`;
    if (spec.p === 0) return 'integer';
    if (spec.p < 0) return '1' + '0'.repeat(-spec.p);
    return '0.' + '0'.repeat(spec.p - 1) + '1';
  }
  function roundValue(v, spec, mode) {
    if (spec.type === 'frac') {
      const M = roundTo(v.N * BigInt(spec.d), v.scale, 0, mode);
      return fractionText(M, spec.d, v.N < 0n);
    }
    const M = roundTo(v.N, v.scale, spec.p, mode);
    return decimalText(M, v.N < 0n, spec.p);
  }

  function getSpec() {
    const sel = el('rd-prec').value;
    if (sel === 'custom') {
      const raw = el('rd-custom').value.trim();
      const n = Number(raw);
      if (raw === '' || !Number.isInteger(n) || n < -1000 || n > 1000) return null;
      return { type: 'dec', p: n };
    }
    if (sel.startsWith('f')) return { type: 'frac', d: Number(sel.slice(1)) };
    return { type: 'dec', p: Number(sel) };
  }

  function calculate() {
    const v = parse(el('rd-num').value.trim());
    if (!v) return error('Please provide a valid number to round.');
    const spec = getSpec();
    if (!spec) return error('Please enter a whole number of digits from -1000 to 1000 for the precision.');
    const mode = el('rd-mode').value;
    const out = roundValue(v, spec, mode);
    const m = MODES.find((x) => x[0] === mode);
    const dir = mode === 'ceil' ? ' up' : mode === 'floor' ? ' down' : '';
    const sentence = `${v.echo} rounded${dir === '' ? ' to the nearest' : dir + ' to the nearest'} ${unitText(spec)}${m[2]}`;
    const rows = MODES.map(([k, label]) => `<tr><td>${label.replace('Round to the nearest (default)', 'To the nearest (default)')}</td><td style="text-align:right;font-weight:600;">${roundValue(v, spec, k)}</td></tr>`).join('');
    el('rd-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Rounded result</div><div class="value" style="overflow-wrap:anywhere;">${out}</div><div class="label" style="margin-top:6px;overflow-wrap:anywhere;">${v.echo} to the nearest ${unitText(spec)}${m[2]}${dir ? ' (' + dir.trim() + ')' : ''}</div></div>` +
      `<h3 style="margin:16px 0 6px;font-size:15px;">The same number in every rounding mode</h3>` +
      `<div class="schedule-table-wrap"><table class="schedule-table"><tbody>${rows}</tbody></table></div>`;
  }

  function toggle() { el('rd-custom-wrap').hidden = el('rd-prec').value !== 'custom'; }
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('rd-prec').addEventListener('change', () => { toggle(); calculate(); });
  el('rd-mode').addEventListener('change', calculate);
  toggle(); calculate();
})();
