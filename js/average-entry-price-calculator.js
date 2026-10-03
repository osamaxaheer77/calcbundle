'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('av-form')) return;

  const MAX = 20;
  const defaults = [[60000, 0.1], [55000, 0.2], [50000, 0.3]];
  let count = 0;

  function addRow(p, q) {
    if (count >= MAX) return;
    count += 1;
    const n = count;
    const div = document.createElement('div');
    div.className = 'field-row';
    div.innerHTML = `<div class="field-group"><label for="av-p${n}">Price ${n} (USDT)</label><input type="number" id="av-p${n}" value="${p === undefined ? '' : p}" min="0" step="any"></div>` +
      `<div class="field-group"><label for="av-q${n}">Quantity ${n}</label><input type="number" id="av-q${n}" value="${q === undefined ? '' : q}" min="0" step="any"></div>`;
    T.el('av-rows').appendChild(div);
    if (count >= MAX) T.el('av-add').style.display = 'none';
  }

  function run() {
    let cost = 0, qty = 0, used = 0;
    for (let n = 1; n <= count; n++) {
      const p = T.num('av-p' + n), q = T.num('av-q' + n);
      if (p === null && q === null) continue;
      if (p === null || q === null || !Number.isFinite(p) || !Number.isFinite(q) || !(p > 0) || !(q > 0)) return T.error('av-result', `Check position ${n}. Enter a price and a quantity, both more than 0, or clear the row.`);
      cost += p * q; qty += q; used += 1;
    }
    if (!used) return T.error('av-result', 'Enter at least one price and quantity.');
    const avg = cost / qty;
    let html = T.big('Average entry price', `${T.price(avg)} USDT`, `${used} position${used === 1 ? '' : 's'}`) +
      T.row('Total quantity', T.amount(qty, 8)) + T.row('Total cost', `${T.usd(cost)} USDT`);
    const cur = T.num('av-cur');
    if (cur !== null) {
      if (!Number.isFinite(cur) || !(cur > 0)) return T.error('av-result', 'The current price must be more than 0, or leave it empty.');
      const value = cur * qty, pnl = value - cost;
      html += T.row('Value at current price', `${T.usd(value)} USDT`) + T.row('Profit / loss', `${T.usd(pnl)} USDT`, pnl >= 0 ? T.GREEN : T.RED) + T.row('Return', T.pct((pnl / cost) * 100), pnl >= 0 ? T.GREEN : T.RED);
    }
    T.el('av-result').innerHTML = html;
  }

  defaults.forEach(([p, q]) => addRow(p, q));
  T.el('av-add').addEventListener('click', () => { addRow(); });
  T.wire('av-form', run);
  T.el('av-rows').addEventListener('input', run);
})();
