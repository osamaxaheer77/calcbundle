'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('rr-form')) return;

  function run() {
    const entry = T.num('rr-entry'), stop = T.num('rr-stop'), tp = T.num('rr-tp'), amt = T.num('rr-amt'), win = T.num('rr-win');
    if (![entry, stop, tp].every((v) => v !== null && Number.isFinite(v))) return T.error('rr-result', 'Enter the entry, stop loss and take profit prices as numbers.');
    if (!(entry > 0) || !(stop > 0) || !(tp > 0)) return T.error('rr-result', 'The prices must be more than 0.');
    if (stop === entry) return T.error('rr-result', 'The stop loss cannot be the same as the entry price.');
    const buy = stop < entry;
    if (buy ? tp <= entry : tp >= entry) return T.error('rr-result', `For a ${buy ? 'buy' : 'sell'} trade, the take profit must be ${buy ? 'above' : 'below'} the entry price.`);
    if (amt !== null && (!Number.isFinite(amt) || !(amt > 0))) return T.error('rr-result', 'The amount risked must be more than 0, or leave it empty.');
    if (win !== null && (!Number.isFinite(win) || win < 0 || win > 100)) return T.error('rr-result', 'The win rate must be from 0 to 100%, or leave it empty.');
    const risk = Math.abs(entry - stop), reward = Math.abs(tp - entry), ratio = reward / risk;
    const be = 100 / (1 + ratio);
    let html = T.big('Risk to reward ratio', `1 : ${T.amount(ratio, 2)}`, `${buy ? 'Buy' : 'Sell'} trade`) +
      T.row('Risk (entry to stop)', T.amount(risk, 6)) + T.row('Reward (entry to target)', T.amount(reward, 6)) +
      T.row('Win rate needed to break even', T.pct(be, 1));
    if (amt !== null) html += T.row('Amount at risk', T.usd(amt), T.RED) + T.row('Possible reward', T.usd(amt * ratio), T.GREEN);
    if (win !== null) {
      const w = win / 100, ev = w * ratio - (1 - w);
      html += T.row('Expected value per trade', `${ev >= 0 ? '+' : ''}${T.amount(ev, 2)} R${amt !== null ? ` (${T.usd(ev * amt)})` : ''}`, ev >= 0 ? T.GREEN : T.RED) +
        `<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:10px 0 0;">${ev >= 0 ? 'At this win rate the setup should make money over many trades.' : 'At this win rate the setup should lose money over many trades.'} 1 R means the amount you risk on one trade.</p>`;
    }
    T.el('rr-result').innerHTML = html;
  }
  T.wire('rr-form', run);
  T.el('rr-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
