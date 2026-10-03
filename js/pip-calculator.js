'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('pc-form')) return;

  function run() {
    const pair = FX.readPair('pc');
    if (pair.err) return T.error('pc-result', pair.err);
    const size = T.num('pc-size'), pips = T.num('pc-pips');
    if (size === null || !Number.isFinite(size) || !(size > 0)) return T.error('pc-result', 'Enter a position size, more than 0.');
    if (pips === null || !Number.isFinite(pips) || pips < 0) return T.error('pc-result', 'Enter a number of pips, 0 or more.');
    const units = size * FX.UNITS[T.el('pc-unit').value];
    const conv = FX.toAccount(pair);
    const perPipQuote = pair.pip * units, perPipAcct = perPipQuote * conv.quoteToAcct;
    const acct = pair.acct;
    const unitsOf = (n) => pair.pip * n * conv.quoteToAcct;
    T.el('pc-result').innerHTML = T.big(`Value of 1 pip (${pair.base}/${pair.quote})`, `${T.usd(perPipAcct)} ${acct}`, `${T.amount(units, 2)} units, pip size ${T.amount(pair.pip, 4)}`) +
      T.row(`Value of ${T.amount(pips, 2)} pip${pips === 1 ? '' : 's'}`, `${T.usd(perPipAcct * pips)} ${acct}`) +
      (pair.quote !== acct ? T.row('1 pip in the quote currency', `${T.usd(perPipQuote)} ${pair.quote}`) : '') +
      '<h3 style="margin:16px 0 6px;font-size:15px;">Value of one pip by lot size</h3><table class="schedule-table"><thead><tr><th>Lot size</th><th>Units</th><th>Per pip</th></tr></thead><tbody>' +
      [['Standard lot', 100000], ['Mini lot', 10000], ['Micro lot', 1000]].map(([n, u]) => `<tr><td>${n}</td><td>${T.group(String(u))}</td><td>${T.usd(unitsOf(u))} ${acct}</td></tr>`).join('') + '</tbody></table>';
  }
  FX.init('pc', run);
  T.el('pc-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('pc-form').querySelectorAll('input, select').forEach((n) => n.addEventListener('input', run));
})();
