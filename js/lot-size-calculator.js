'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('ls-form')) return;

  function run() {
    const pair = FX.readPair('ls');
    if (pair.err) return T.error('ls-result', pair.err);
    const bal = T.num('ls-bal'), risk = T.num('ls-risk'), sl = T.num('ls-sl');
    if (![bal, risk, sl].every((v) => v !== null && Number.isFinite(v))) return T.error('ls-result', 'Enter the balance, risk percentage and stop loss as numbers.');
    if (!(bal > 0) || !(risk > 0) || risk > 100 || !(sl > 0)) return T.error('ls-result', 'The balance and stop loss must be more than 0, and the risk from 0 to 100%.');
    const conv = FX.toAccount(pair);
    const riskAmt = (bal * risk) / 100;
    const pipPerUnit = pair.pip * conv.quoteToAcct;
    const units = riskAmt / (sl * pipPerUnit);
    const lots = units / 100000;
    const acct = pair.acct;
    T.el('ls-result').innerHTML = T.big('Lot size', `${T.amount(lots, 2)} lots`, `${T.group(String(Math.round(units)))} units of ${pair.base}`) +
      T.row('Mini lots', T.amount(units / 10000, 2)) + T.row('Micro lots', T.amount(units / 1000, 1)) +
      T.row('Amount at risk', `${T.usd(riskAmt)} ${acct}`, T.RED) +
      T.row('Pip value for this size', `${T.usd(units * pipPerUnit)} ${acct}`) +
      T.row('Pip value for 1 standard lot', `${T.usd(100000 * pipPerUnit)} ${acct}`) +
      '<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:12px 0 0;">Round down to your broker’s lot step, usually 0.01 lots, so the risk stays within your limit.</p>';
  }
  FX.init('ls', run);
  T.el('ls-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('ls-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
