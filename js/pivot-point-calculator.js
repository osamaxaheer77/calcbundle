'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('pv-form')) return;

  function run() {
    const o = T.num('pv-open'), h = T.num('pv-high'), l = T.num('pv-low'), c = T.num('pv-close');
    if (![h, l, c].every((v) => v !== null && Number.isFinite(v))) return T.error('pv-result', 'Enter the high, low and close prices as numbers.');
    if (o !== null && !Number.isFinite(o)) return T.error('pv-result', 'The open price must be a number, or leave it empty.');
    if (!(h > 0) || !(l > 0) || !(c > 0)) return T.error('pv-result', 'The prices must be more than 0.');
    if (h < l) return T.error('pv-result', 'The high must not be lower than the low.');
    if (c > h || c < l) return T.error('pv-result', 'The close must be between the low and the high.');
    const d = parseInt(T.el('pv-dec').value, 10), f = (v) => v.toFixed(d), range = h - l;
    const rows = (pairs) => pairs.map(([n, v]) => `<tr><td>${n}</td><td>${f(v)}</td></tr>`).join('');
    const table = (title, pairs) => `<h3 style="margin:16px 0 6px;font-size:15px;">${title}</h3><table class="schedule-table"><thead><tr><th>Level</th><th>Price</th></tr></thead><tbody>${rows(pairs)}</tbody></table>`;

    const p = (h + l + c) / 3;
    const classic = [['R3', h + 2 * (p - l)], ['R2', p + range], ['R1', 2 * p - l], ['Pivot', p], ['S1', 2 * p - h], ['S2', p - range], ['S3', l - 2 * (h - p)]];
    const fib = [['R3', p + range], ['R2', p + 0.618 * range], ['R1', p + 0.382 * range], ['Pivot', p], ['S1', p - 0.382 * range], ['S2', p - 0.618 * range], ['S3', p - range]];
    const k = (m) => (range * 1.1) / m;
    const cam = [['R4', c + k(2)], ['R3', c + k(4)], ['R2', c + k(6)], ['R1', c + k(12)], ['Pivot', p], ['S1', c - k(12)], ['S2', c - k(6)], ['S3', c - k(4)], ['S4', c - k(2)]];
    const wp = (h + l + 2 * c) / 4;
    const woodie = [['R2', wp + range], ['R1', 2 * wp - l], ['Pivot', wp], ['S1', 2 * wp - h], ['S2', wp - range]];
    let html = T.big('Classic pivot point', f(p), `High ${f(h)}, low ${f(l)}, close ${f(c)}`) + table('Classic', classic) + table('Fibonacci', fib) + table('Camarilla', cam) + table('Woodie', woodie);
    if (o !== null && o > 0) {
      const x = c < o ? h + 2 * l + c : c > o ? 2 * h + l + c : h + l + 2 * c;
      html += table('DeMark', [['R1', x / 2 - l], ['Pivot', x / 4], ['S1', x / 2 - h]]);
    } else {
      html += '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Enter the open price to also see the DeMark levels.</p>';
    }
    T.el('pv-result').innerHTML = html;
  }
  T.wire('pv-form', run);
  T.el('pv-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
