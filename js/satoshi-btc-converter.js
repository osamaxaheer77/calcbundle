'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('sb-form')) return;

  const SATS = { btc: 1e8, mbtc: 1e5, bits: 100, sat: 1 };

  function run() {
    const amt = T.num('sb-amt'), price = T.num('sb-price');
    if (amt === null || !Number.isFinite(amt) || amt < 0) return T.error('sb-result', 'Enter an amount of 0 or more.');
    if (price !== null && (!Number.isFinite(price) || !(price > 0))) return T.error('sb-result', 'The BTC price must be more than 0, or leave it empty.');
    const unit = T.el('sb-unit').value;
    const sats = amt * SATS[unit];
    if (sats > 2.1e15 * 10) return T.error('sb-result', 'That amount is far more than the 21 million bitcoin that will ever exist.');
    const btc = sats / 1e8;
    const rows = [['Bitcoin (BTC)', T.amount(btc, 8)], ['Millibitcoin (mBTC)', T.amount(sats / 1e5, 5)], ['Bits (µBTC)', T.amount(sats / 100, 2)], ['Satoshi (sat)', T.amount(sats, 3)]];
    const main = rows[['btc', 'mbtc', 'bits', 'sat'].indexOf(unit)];
    let html = T.big('Value in BTC', `${T.amount(btc, 8)} BTC`, `${T.amount(amt, 8)} ${main[0].match(/\((.*)\)/)[1]}`);
    html += rows.map(([n, v]) => T.row(n, v)).join('');
    if (price !== null) html += T.row('Value in USD', `${T.usd(btc * price)} USD`, T.GREEN);
    T.el('sb-result').innerHTML = html;
  }
  T.wire('sb-form', run);
  T.el('sb-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
