'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('be-form')) return;

  function run() {
    const buy = T.num('be-buy'), amt = T.num('be-amt'), target = T.num('be-target');
    const fb = T.num('be-fb') === null ? 0 : T.num('be-fb'), fs = T.num('be-fs') === null ? 0 : T.num('be-fs');
    if (buy === null || !Number.isFinite(buy) || !(buy > 0)) return T.error('be-result', 'Enter your buy price, more than 0.');
    if (!Number.isFinite(fb) || !Number.isFinite(fs) || fb < 0 || fs < 0 || fb >= 100 || fs >= 100) return T.error('be-result', 'The fees must be from 0 to less than 100%.');
    if (amt !== null && (!Number.isFinite(amt) || !(amt > 0))) return T.error('be-result', 'The amount invested must be more than 0, or leave it empty.');
    if (target !== null && (!Number.isFinite(target) || target <= -100)) return T.error('be-result', 'The target profit must be a number above -100%, or leave it empty.');
    const a = 1 - fb / 100, b = 1 - fs / 100;
    const be = buy / (a * b);
    let html = T.big('Break-even sell price', `${T.price(be)}`, `${T.pct(((be - buy) / buy) * 100, 3)} above your buy price`);
    if (amt !== null) {
      const coins = (amt * a) / buy;
      html += T.row('Coins bought', T.amount(coins, 8)) + T.row('Buy fee', `${T.usd(amt * (fb / 100))} USD`) + T.row('Sell fee at break-even', `${T.usd(coins * be * (fs / 100))} USD`);
    }
    if (target !== null) {
      const tp = (buy * (1 + target / 100)) / (a * b);
      html += T.row(`Sell price for ${T.amount(target, 2)}% profit`, `${T.price(tp)}`, tp >= be ? T.GREEN : T.RED) + T.row('Price rise needed', T.pct(((tp - buy) / buy) * 100));
    }
    T.el('be-result').innerHTML = html;
  }
  T.wire('be-form', run);
  T.el('be-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
