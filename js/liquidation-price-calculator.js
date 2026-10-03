'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('lq-form')) return;

  function run() {
    const mode = T.el('lq-mode').value;
    T.el('lq-lev-box').style.display = mode === 'isolated' ? '' : 'none';
    T.el('lq-bal-box').style.display = mode === 'cross' ? '' : 'none';
    const entry = T.num('lq-entry'), qty = T.num('lq-qty'), mmrPct = T.num('lq-mmr');
    if (![entry, qty, mmrPct].every((v) => v !== null && Number.isFinite(v))) return T.error('lq-result', 'Enter the entry price, quantity and maintenance margin rate as numbers.');
    if (!(entry > 0) || !(qty > 0)) return T.error('lq-result', 'The entry price and quantity must be more than 0.');
    if (!(mmrPct >= 0) || mmrPct >= 100) return T.error('lq-result', 'The maintenance margin rate must be from 0 to less than 100%.');
    const long = T.side('lq-side') === 'long', mmr = mmrPct / 100, value = entry * qty;
    let wallet;
    if (mode === 'isolated') {
      const lev = T.num('lq-lev');
      if (lev === null || !Number.isFinite(lev) || !(lev >= 1)) return T.error('lq-result', 'Leverage must be 1 or more.');
      wallet = value / lev;
    } else {
      wallet = T.num('lq-bal');
      if (wallet === null || !Number.isFinite(wallet) || !(wallet > 0)) return T.error('lq-result', 'Enter your wallet balance, more than 0.');
    }
    const lp = long ? (value - wallet) / (qty * (1 - mmr)) : (value + wallet) / (qty * (1 + mmr));
    const maint = value * mmr;
    let html;
    if (lp <= 0) {
      html = T.big('Liquidation price', 'None', 'The margin is large enough that the price would have to fall below 0 to liquidate this long position.') + T.row('Margin backing the position', `${T.usd(wallet)} USDT`);
    } else {
      const dist = (Math.abs(lp - entry) / entry) * 100;
      html = T.big('Liquidation price', `${T.price(lp)} USDT`, `${T.pct(dist)} ${long ? 'below' : 'above'} the entry price`, T.RED) +
        T.row('Entry price', `${T.price(entry)} USDT`) + T.row('Position size', `${T.usd(value)} USDT`) +
        T.row(mode === 'isolated' ? 'Initial margin' : 'Wallet balance used', `${T.usd(wallet)} USDT`) +
        T.row('Maintenance margin at entry', `${T.usd(maint)} USDT`);
    }
    T.el('lq-result').innerHTML = html + '<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:12px 0 0;">Estimate for a USDT-margined contract in one-way mode. Exchanges use tiered maintenance rates, so check the exchange’s own figure.</p>';
  }
  T.wire('lq-form', run);
})();
