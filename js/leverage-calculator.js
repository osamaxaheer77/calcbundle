'use strict';

(function () {
  const T = window.TradeCommon, FX = window.ForexCommon;
  if (!T || !FX || !T.el('lv-form')) return;

  function run() {
    const pair = FX.readPair('lv');
    if (pair.err) return T.error('lv-result', pair.err);
    const eq = T.num('lv-eq'), size = T.num('lv-size'), max = T.num('lv-max');
    if (![eq, size, max].every((v) => v !== null && Number.isFinite(v))) return T.error('lv-result', 'Enter the equity, position size and broker leverage as numbers.');
    if (!(eq > 0) || !(size > 0) || !(max >= 1)) return T.error('lv-result', 'Equity and size must be more than 0, and the broker leverage 1 or more.');
    const units = size * FX.UNITS[T.el('lv-unit').value];
    const notional = units * FX.toAccount(pair).baseToAcct;
    const eff = notional / eq, used = notional / max, free = eq - used, level = (eq / used) * 100;
    const acct = pair.acct;
    const warn = eff > max;
    let html = T.big('Effective leverage', `${T.amount(eff, 2)} : 1`, `${T.usd(notional)} ${acct} position on ${T.usd(eq)} ${acct}`, warn ? T.RED : '') +
      T.row('Margin used', `${T.usd(used)} ${acct}`) + T.row('Free margin', `${T.usd(free)} ${acct}`, free < 0 ? T.RED : '') +
      T.row('Margin level', T.pct(level, 1), level < 100 ? T.RED : '');
    if (warn) html += '<p style="font-size:12px;line-height:1.5;color:#ef4444;margin:8px 0 0;">The position is larger than your broker’s maximum leverage allows for this equity.</p>';
    html += '<h3 style="margin:16px 0 6px;font-size:15px;">Margin for this position at other leverages</h3><table class="schedule-table"><thead><tr><th>Leverage</th><th>Margin</th></tr></thead><tbody>' +
      [10, 30, 50, 100, 200, 500].map((l) => `<tr><td>1 : ${l}</td><td>${T.usd(notional / l)} ${acct}</td></tr>`).join('') + '</tbody></table>';
    T.el('lv-result').innerHTML = html;
  }
  FX.init('lv', run);
  T.el('lv-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  T.el('lv-form').querySelectorAll('input, select').forEach((n) => n.addEventListener('input', run));
})();
