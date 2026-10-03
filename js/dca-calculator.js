'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('dc-form')) return;

  const MAX = 24;
  const defaults = [[100, 60000], [100, 50000], [100, 70000]];
  let count = 0;

  function addRow(a, p) {
    if (count >= MAX) return;
    count += 1;
    const n = count;
    const div = document.createElement('div');
    div.className = 'field-row';
    div.innerHTML = `<div class="field-group"><label for="dc-a${n}">Amount ${n} (USD)</label><input type="number" id="dc-a${n}" value="${a === undefined ? '' : a}" min="0" step="any"></div>` +
      `<div class="field-group"><label for="dc-p${n}">Price ${n}</label><input type="number" id="dc-p${n}" value="${p === undefined ? '' : p}" min="0" step="any"></div>`;
    T.el('dc-rows').appendChild(div);
    if (count >= MAX) T.el('dc-add').style.display = 'none';
  }

  function runList() {
    let spent = 0, coins = 0, used = 0;
    for (let n = 1; n <= count; n++) {
      const a = T.num('dc-a' + n), p = T.num('dc-p' + n);
      if (a === null && p === null) continue;
      if (a === null || p === null || !Number.isFinite(a) || !Number.isFinite(p) || !(a > 0) || !(p > 0)) return T.error('dc-result', `Check purchase ${n}. Enter an amount and a price, both more than 0, or clear the row.`);
      spent += a; coins += a / p; used += 1;
    }
    if (!used) return T.error('dc-result', 'Enter at least one amount and price.');
    const avg = spent / coins;
    let html = T.big('Average cost per coin', `${T.price(avg)} USD`, `${used} purchase${used === 1 ? '' : 's'}`) +
      T.row('Total invested', `${T.usd(spent)} USD`) + T.row('Total coins', T.amount(coins, 8));
    const cur = T.num('dc-cur');
    if (cur !== null) {
      if (!Number.isFinite(cur) || !(cur > 0)) return T.error('dc-result', 'The current price must be more than 0, or leave it empty.');
      const value = coins * cur, pnl = value - spent;
      html += T.row('Value at current price', `${T.usd(value)} USD`) + T.row('Profit / loss', `${T.usd(pnl)} USD`, pnl >= 0 ? T.GREEN : T.RED) + T.row('Return', T.pct((pnl / spent) * 100), pnl >= 0 ? T.GREEN : T.RED);
    }
    T.el('dc-result').innerHTML = html;
  }

  function runPlan() {
    const amt = T.num('dp-amt'), n = T.num('dp-n'), p0 = T.num('dp-p0'), p1 = T.num('dp-p1');
    if (![amt, n, p0, p1].every((v) => v !== null && Number.isFinite(v))) return T.error('dp-result', 'Enter the amount, number of purchases and both prices as numbers.');
    if (!(amt > 0) || !Number.isInteger(n) || n < 1 || n > 600 || !(p0 > 0) || !(p1 > 0)) return T.error('dp-result', 'The amount and prices must be more than 0, and the number of purchases a whole number from 1 to 600.');
    let coins = 0;
    for (let i = 0; i < n; i++) coins += amt / (n === 1 ? p0 : p0 + ((p1 - p0) * i) / (n - 1));
    const total = amt * n, avg = total / coins, value = coins * p1, lumpCoins = total / p0, lumpValue = lumpCoins * p1;
    if (![coins, avg, value, lumpValue].every(Number.isFinite)) return T.error('dp-result', 'Those numbers are too extreme to calculate. Use more realistic prices.');
    const pc = (v) => `${T.usd(v - total)} USD (${T.pct(((v - total) / total) * 100)})`;
    T.el('dp-result').innerHTML = T.big('DCA average cost', `${T.price(avg)} USD`, `${n} purchase${n === 1 ? '' : 's'} of ${T.usd(amt)} USD`) +
      T.row('Total invested', `${T.usd(total)} USD`) +
      T.row('DCA value at last price', `${T.usd(value)} USD`) + T.row('DCA profit / loss', pc(value), value >= total ? T.GREEN : T.RED) +
      T.row('Lump sum on day one', `${T.usd(lumpValue)} USD`) + T.row('Lump sum profit / loss', pc(lumpValue), lumpValue >= total ? T.GREEN : T.RED) +
      `<p style="font-size:12px;line-height:1.5;color:var(--text-secondary);margin:12px 0 0;">${value > lumpValue ? 'With this price path, DCA ended ahead of the lump sum.' : value < lumpValue ? 'With this price path, the lump sum ended ahead of DCA.' : 'Both ended level.'} The price is assumed to move in a straight line.</p>`;
  }

  defaults.forEach(([a, p]) => addRow(a, p));
  T.el('dc-add').addEventListener('click', () => addRow());
  T.wire('dc-form', runList);
  T.el('dc-rows').addEventListener('input', runList);
  T.wire('dp-form', runPlan);
  T.el('dp-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', runPlan));
})();
