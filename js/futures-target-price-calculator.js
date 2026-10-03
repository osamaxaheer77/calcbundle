'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('ft-form')) return;

  function run() {
    const lev = T.num('ft-lev'), entry = T.num('ft-entry'), roi = T.num('ft-roi'), qty = T.num('ft-qty');
    if (![lev, entry, roi].every((v) => v !== null && Number.isFinite(v))) return T.error('ft-result', 'Enter the leverage, entry price and target ROI as numbers.');
    if (!(lev >= 1)) return T.error('ft-result', 'Leverage must be 1 or more.');
    if (!(entry > 0)) return T.error('ft-result', 'The entry price must be more than 0.');
    if (qty !== null && !(qty > 0)) return T.error('ft-result', 'The quantity must be more than 0, or leave it empty.');
    const long = T.side('ft-side') === 'long';
    const at = (r) => entry * (1 + ((long ? 1 : -1) * r) / 100 / lev);
    const target = at(roi);
    if (!(target > 0)) return T.error('ft-result', 'At this leverage, that return would need a price at or below 0, which is not possible. Try a smaller ROI.');
    const move = ((target - entry) / entry) * 100;
    let html = T.big('Target price', `${T.price(target)} USDT`, `A move of ${T.pct(move)} from the entry price`) + T.row('Entry price', `${T.price(entry)} USDT`);
    if (qty !== null) {
      const margin = (entry * qty) / lev, profit = (roi / 100) * margin;
      html += T.row('Initial margin', `${T.usd(margin)} USDT`) + T.row(profit >= 0 ? 'Profit at target' : 'Loss at target', `${T.usd(profit)} USDT`, profit >= 0 ? T.GREEN : T.RED);
    }
    html += '<h3 style="margin:16px 0 6px;font-size:15px;">Target prices for other returns</h3><table class="schedule-table"><thead><tr><th>ROI</th><th>Price (USDT)</th></tr></thead><tbody>' +
      [-50, -25, -10, 10, 25, 50, 100, 200, 500].map((r) => { const p = at(r); return `<tr><td>${r > 0 ? '+' : ''}${r}%</td><td>${p > 0 ? T.price(p) : 'not possible'}</td></tr>`; }).join('') + '</tbody></table>';
    T.el('ft-result').innerHTML = html;
  }
  T.wire('ft-form', run);
})();
