'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('ff-form')) return;

  function run() {
    const qty = T.num('ff-qty'), mark = T.num('ff-mark'), rate = T.num('ff-rate'), days = T.num('ff-days');
    if (![qty, mark, rate, days].every((v) => v !== null && Number.isFinite(v))) return T.error('ff-result', 'Enter the quantity, mark price, funding rate and holding period as numbers.');
    if (!(qty > 0) || !(mark > 0)) return T.error('ff-result', 'The quantity and mark price must be more than 0.');
    if (!(days >= 0)) return T.error('ff-result', 'The holding period must be 0 or more days.');
    const hours = parseInt(T.el('ff-int').value, 10), perDay = 24 / hours;
    const long = T.side('ff-side') === 'long';
    const value = qty * mark, perInterval = (value * rate) / 100;
    const sign = long ? 1 : -1; // positive rates mean longs pay shorts
    const cost = (v) => v * sign;
    const label = (v) => (cost(v) > 0 ? 'You pay' : cost(v) < 0 ? 'You receive' : 'No payment');
    const show = (v) => `${T.usd(Math.abs(v))} USDT`;
    const color = cost(perInterval) > 0 ? T.RED : cost(perInterval) < 0 ? T.GREEN : '';
    const total = perInterval * perDay * days;
    T.el('ff-result').innerHTML = T.big(`${label(perInterval)} each interval`, show(perInterval), `Position value ${T.usd(value)} USDT at ${T.amount(rate, 6)}%`, color) +
      T.row(`${label(perInterval)} per day`, show(perInterval * perDay), color) +
      T.row(`${label(total)} over ${T.amount(days, 2)} day${days === 1 ? '' : 's'}`, show(total), color) +
      T.row('Funding payments in that time', T.amount(perDay * days, 2)) +
      T.row('Cost per year, as % of position', T.pct(Math.abs(rate) * perDay * 365));
  }
  T.wire('ff-form', run);
})();
