'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('ps-form')) return;

  function run() {
    const bal = T.num('ps-bal'), risk = T.num('ps-risk'), entry = T.num('ps-entry'), stop = T.num('ps-stop'), tp = T.num('ps-tp'), lev = T.num('ps-lev');
    if (![bal, risk, entry, stop].every((v) => v !== null && Number.isFinite(v))) return T.error('ps-result', 'Enter the balance, risk percentage, entry price and stop loss as numbers.');
    if (!(bal > 0) || !(risk > 0) || risk > 100) return T.error('ps-result', 'The balance must be more than 0 and the risk from 0 to 100%.');
    if (!(entry > 0) || !(stop > 0)) return T.error('ps-result', 'The entry price and stop loss must be more than 0.');
    if (entry === stop) return T.error('ps-result', 'The stop loss cannot be the same as the entry price.');
    if (lev !== null && (!Number.isFinite(lev) || !(lev >= 1))) return T.error('ps-result', 'Leverage must be 1 or more, or leave it empty.');
    if (tp !== null && !Number.isFinite(tp)) return T.error('ps-result', 'The take profit must be a number, or leave it empty.');
    const long = stop < entry;
    if (tp !== null && (long ? tp <= entry : tp >= entry)) return T.error('ps-result', `For a ${long ? 'long' : 'short'} trade, the take profit must be ${long ? 'above' : 'below'} the entry price.`);
    const riskAmt = (bal * risk) / 100, dist = Math.abs(entry - stop);
    const size = riskAmt / dist, value = size * entry;
    let html = T.big(`Position size (${long ? 'long' : 'short'})`, `${T.amount(size, 8)} coins`, `${T.usd(value)} USDT position value`) +
      T.row('Amount at risk', `${T.usd(riskAmt)} USDT`, T.RED) +
      T.row('Stop distance', `${T.price(dist)} USDT (${T.pct((dist / entry) * 100)})`) +
      T.row('Position as % of account', T.pct((value / bal) * 100));
    if (lev !== null) {
      const margin = value / lev;
      html += T.row('Margin needed', `${T.usd(margin)} USDT`, margin > bal ? T.RED : '');
      if (margin > bal) html += '<p style="font-size:12px;line-height:1.5;color:#ef4444;margin:6px 0 0;">The margin is more than your balance. Use more leverage or a tighter stop to fit this size.</p>';
    }
    if (tp !== null) {
      const reward = size * Math.abs(tp - entry);
      html += T.row('Reward at take profit', `${T.usd(reward)} USDT`, T.GREEN) + T.row('Risk to reward ratio', `1 : ${T.amount(reward / riskAmt, 2)}`);
    }
    T.el('ps-result').innerHTML = html;
  }
  T.wire('ps-form', run);
})();
