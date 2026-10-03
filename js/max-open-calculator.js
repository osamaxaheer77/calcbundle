'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('mo-form')) return;

  function run() {
    const lev = T.num('mo-lev'), entry = T.num('mo-entry'), bal = T.num('mo-bal');
    const fee = T.num('mo-fee') || 0;
    if (![lev, entry, bal].every((v) => v !== null && Number.isFinite(v))) return T.error('mo-result', 'Enter the leverage, entry price and balance as numbers.');
    if (!(lev >= 1)) return T.error('mo-result', 'Leverage must be 1 or more.');
    if (!(entry > 0) || !(bal > 0)) return T.error('mo-result', 'The entry price and balance must be more than 0.');
    if (!Number.isFinite(fee) || fee < 0 || fee >= 100) return T.error('mo-result', 'The fee must be from 0 to less than 100%.');
    const long = T.side('mo-side') === 'long';
    const value = bal / (1 / lev + fee / 100);
    const qty = value / entry, margin = value / lev, feeAmt = (value * fee) / 100;
    T.el('mo-result').innerHTML = T.big(`Max open (${long ? 'long' : 'short'})`, `${T.amount(qty, 8)} coins`, `${T.usd(value)} USDT position value`) +
      T.row('Margin used', `${T.usd(margin)} USDT`) + (fee > 0 ? T.row('Opening fee', `${T.usd(feeAmt)} USDT`) : '') +
      T.row('Leverage', `${T.amount(lev, 2)}x`) +
      '<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:12px 0 0;">This is the arithmetic limit from your balance. Exchanges also cap size by leverage tier, and open orders can use some of your margin.</p>';
  }
  T.wire('mo-form', run);
})();
