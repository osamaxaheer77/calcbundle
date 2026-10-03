'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('cp-form')) return;

  function run() {
    const inv = T.num('cp-inv'), buy = T.num('cp-buy'), sell = T.num('cp-sell');
    const fb = T.num('cp-fb') === null ? 0 : T.num('cp-fb'), fs = T.num('cp-fs') === null ? 0 : T.num('cp-fs');
    if (![inv, buy, sell].every((v) => v !== null && Number.isFinite(v))) return T.error('cp-result', 'Enter the amount invested, buy price and sell price as numbers.');
    if (!(inv > 0) || !(buy > 0) || !(sell > 0)) return T.error('cp-result', 'The amount and both prices must be more than 0.');
    if (!Number.isFinite(fb) || !Number.isFinite(fs) || fb < 0 || fs < 0 || fb >= 100 || fs >= 100) return T.error('cp-result', 'The fees must be from 0 to less than 100%.');
    const a = 1 - fb / 100, b = 1 - fs / 100;
    const coins = (inv * a) / buy, proceeds = coins * sell * b, profit = proceeds - inv;
    const fees = inv * (fb / 100) + coins * sell * (fs / 100);
    const color = profit > 0 ? T.GREEN : profit < 0 ? T.RED : '';
    T.el('cp-result').innerHTML = T.big(profit >= 0 ? 'Profit' : 'Loss', `${T.usd(profit)} USD`, `Return on investment: ${T.pct((profit / inv) * 100)}`, color) +
      T.row('Coins bought', T.amount(coins, 8)) + T.row('Value when sold', `${T.usd(proceeds)} USD`) +
      T.row('Total fees', `${T.usd(fees)} USD`) + T.row('Break-even sell price', `${T.price(buy / (a * b))} USD`) +
      T.row('Price change', T.pct(((sell - buy) / buy) * 100));
  }
  T.wire('cp-form', run);
  T.el('cp-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
