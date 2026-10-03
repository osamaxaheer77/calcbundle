'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('sl-form')) return;

  function run() {
    const pair = FX.readPair('sl');
    if (pair.err) return T.error('sl-result', pair.err.replace('current price of the pair', 'entry price'));
    const size = T.num('sl-size'), slp = T.num('sl-slp'), tpp = T.num('sl-tpp');
    if (![size, slp, tpp].every((v) => v !== null && Number.isFinite(v))) return T.error('sl-result', 'Enter the position size and the stop loss and take profit distances as numbers.');
    if (!(size > 0) || !(slp > 0) || !(tpp > 0)) return T.error('sl-result', 'The size and both distances must be more than 0.');
    const buy = T.side('sl-dir') === 'buy', sign = buy ? 1 : -1;
    const dec = FX.pipDecimals(pair.quote);
    const entry = pair.price;
    const stop = entry - sign * slp * pair.pip, target = entry + sign * tpp * pair.pip;
    if (!(stop > 0)) return T.error('sl-result', 'That stop loss distance would put the stop at or below 0.');
    if (!(target > 0)) return T.error('sl-result', 'That take profit distance would put the target at or below 0.');
    const units = size * FX.UNITS[T.el('sl-unit').value];
    const perPip = pair.pip * units * FX.toAccount(pair).quoteToAcct;
    const acct = pair.acct;
    T.el('sl-result').innerHTML = T.big(`${buy ? 'Buy' : 'Sell'} ${pair.base}/${pair.quote}`, `1 : ${T.amount(tpp / slp, 2)}`, 'Risk to reward ratio') +
      T.row('Stop loss price', stop.toFixed(dec), T.RED) + T.row('Take profit price', target.toFixed(dec), T.GREEN) +
      T.row('Money at risk', `${T.usd(perPip * slp)} ${acct}`, T.RED) + T.row('Money to gain', `${T.usd(perPip * tpp)} ${acct}`, T.GREEN) +
      T.row('Value of 1 pip', `${T.usd(perPip)} ${acct}`) + T.row('Win rate needed to break even', T.pct(100 / (1 + tpp / slp), 1));
  }
  FX.init('sl', run);
  T.el('sl-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('sl-form').querySelectorAll('input, select').forEach((n) => n.addEventListener('input', run));
})();
