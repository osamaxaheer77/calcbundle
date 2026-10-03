'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('fm-form')) return;

  function run() {
    const pair = FX.readPair('fm');
    if (pair.err) return T.error('fm-result', pair.err);
    const size = T.num('fm-size'), lev = T.num('fm-lev');
    if (size === null || !Number.isFinite(size) || !(size > 0)) return T.error('fm-result', 'Enter a position size, more than 0.');
    if (lev === null || !Number.isFinite(lev) || !(lev >= 1)) return T.error('fm-result', 'Leverage must be 1 or more.');
    const units = size * FX.UNITS[T.el('fm-unit').value];
    const conv = FX.toAccount(pair);
    const value = units * conv.baseToAcct, margin = value / lev;
    const acct = pair.acct;
    T.el('fm-result').innerHTML = T.big('Margin required', `${T.usd(margin)} ${acct}`, `At leverage 1 : ${T.amount(lev, 2)}`) +
      T.row('Position value', `${T.usd(value)} ${acct}`) +
      T.row(`Margin in ${pair.base}`, `${T.usd(units / lev)} ${pair.base}`) +
      T.row('Units of ' + pair.base, T.group(String(Math.round(units)))) +
      T.row('Margin per 1 standard lot', `${T.usd((100000 * conv.baseToAcct) / lev)} ${acct}`);
  }
  FX.init('fm', run);
  T.el('fm-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('fm-form').querySelectorAll('input, select').forEach((n) => n.addEventListener('input', run));
})();
