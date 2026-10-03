'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('fp-form')) return;

  function run() {
    const lev = T.num('fp-lev'), entry = T.num('fp-entry'), exit = T.num('fp-exit'), qty = T.num('fp-qty');
    const fee = T.num('fp-fee') || 0;
    if (![lev, entry, exit, qty].every((v) => v !== null && Number.isFinite(v))) return T.error('fp-result', 'Enter the leverage, entry price, exit price and quantity as numbers.');
    if (!(lev >= 1)) return T.error('fp-result', 'Leverage must be 1 or more.');
    if (!(entry > 0) || !(exit > 0) || !(qty > 0)) return T.error('fp-result', 'Prices and quantity must be more than 0.');
    if (!Number.isFinite(fee) || fee < 0) return T.error('fp-result', 'The fee must be 0 or more.');
    const long = T.side('fp-side') === 'long';
    const size = entry * qty, margin = size / lev;
    const gross = (long ? exit - entry : entry - exit) * qty;
    const fees = ((entry + exit) * qty * fee) / 100;
    const net = gross - fees;
    const roi = (gross / margin) * 100;
    const color = (v) => (v > 0 ? T.GREEN : v < 0 ? T.RED : '');
    let html = T.big(fee > 0 ? 'Profit / loss before fees' : 'Profit / loss', `${T.usd(gross)} USDT`, `Return on margin: ${T.pct(roi)}`, color(gross)) +
      T.row('Initial margin', `${T.usd(margin)} USDT`) +
      T.row('Position size', `${T.usd(size)} USDT`) +
      T.row('Exit value', `${T.usd(exit * qty)} USDT`);
    if (fee > 0) html += T.row('Trading fees', `${T.usd(fees)} USDT`) + T.row('Net profit / loss', `${T.usd(net)} USDT`, color(net)) + T.row('Net return on margin', T.pct((net / margin) * 100), color(net));
    T.el('fp-result').innerHTML = html;
  }
  T.wire('fp-form', run);
})();
