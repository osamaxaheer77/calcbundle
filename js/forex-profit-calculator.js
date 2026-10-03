'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('fl-form')) return;

  let openEdited = false;
  T.el('fl-open').addEventListener('input', () => { openEdited = true; });

  function run() {
    const pair = FX.readPair('fl', 'fl-price');
    if (pair.err) return T.error('fl-result', pair.err.replace('current price of the pair', 'close price'));
    const size = T.num('fl-size'), open = T.num('fl-open'), close = pair.price;
    if (size === null || !Number.isFinite(size) || !(size > 0)) return T.error('fl-result', 'Enter a position size, more than 0.');
    if (open === null || !Number.isFinite(open) || !(open > 0)) return T.error('fl-result', 'Enter the open price, more than 0.');
    const buy = T.side('fl-dir') === 'buy';
    const units = size * FX.UNITS[T.el('fl-unit').value];
    const conv = FX.toAccount(pair);
    const sign = buy ? 1 : -1;
    const pips = ((close - open) / pair.pip) * sign;
    const quote = (close - open) * units * sign, acctVal = quote * conv.quoteToAcct;
    const color = acctVal > 0 ? T.GREEN : acctVal < 0 ? T.RED : '';
    T.el('fl-result').innerHTML = T.big(acctVal >= 0 ? 'Profit' : 'Loss', `${T.usd(acctVal)} ${pair.acct}`, `${T.amount(pips, 1)} pips`, color) +
      (pair.quote !== pair.acct ? T.row(`Result in ${pair.quote}`, `${T.usd(quote)} ${pair.quote}`, color) : '') +
      T.row('Price move', `${T.amount(close - open, 6)} (${T.pct(((close - open) / open) * 100, 3)})`) +
      T.row('Position value at open', `${T.usd(open * units)} ${pair.quote}`) +
      T.row('Value of 1 pip', `${T.usd(pair.pip * units * conv.quoteToAcct)} ${pair.acct}`);
  }
  FX.init('fl', run, (rate) => {
    if (openEdited) return;
    T.el('fl-open').value = (rate * 0.995).toFixed(rate >= 100 ? 3 : 5);
  });
  T.el('fl-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('fl-form').querySelectorAll('input, select').forEach((n) => n.addEventListener('input', run));
  T.el('fl-form').querySelectorAll('select').forEach((n) => n.addEventListener('change', () => { if (n.id === 'fl-base' || n.id === 'fl-quote') openEdited = false; }));
})();
