'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('pa-form')) return;

  const MAX = 15;
  const defaults = [['BTC', 6000, 50], ['ETH', 3000, 30], ['SOL', 1000, 20]];
  let count = 0;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function addRow(name, value, target) {
    if (count >= MAX) return;
    count += 1;
    const n = count;
    const div = document.createElement('div');
    div.className = 'field-row';
    div.style.alignItems = 'end';
    div.innerHTML = `<div class="field-group"><label for="pa-n${n}">Asset ${n}</label><input type="text" id="pa-n${n}" value="${name === undefined ? '' : name}" maxlength="12" autocomplete="off"></div>` +
      `<div class="field-group"><label for="pa-v${n}">Value (USD)</label><input type="number" id="pa-v${n}" value="${value === undefined ? '' : value}" min="0" step="any"></div>` +
      `<div class="field-group"><label for="pa-t${n}">Target (%)</label><input type="number" id="pa-t${n}" value="${target === undefined ? '' : target}" min="0" max="100" step="any"></div>`;
    T.el('pa-rows').appendChild(div);
    if (count >= MAX) T.el('pa-add').style.display = 'none';
  }

  function run() {
    const assets = [];
    for (let n = 1; n <= count; n++) {
      const name = T.el('pa-n' + n).value.trim(), v = T.num('pa-v' + n), t = T.num('pa-t' + n);
      if (!name && v === null && t === null) continue;
      if (v === null || t === null || !Number.isFinite(v) || !Number.isFinite(t) || v < 0 || t < 0 || t > 100) return T.error('pa-result', `Check asset ${n}. Enter a value of 0 or more and a target from 0 to 100%.`);
      assets.push({ name: esc(name || 'Asset ' + n), v, t });
    }
    if (assets.length < 2) return T.error('pa-result', 'Enter at least two assets.');
    const extra = T.num('pa-new') === null ? 0 : T.num('pa-new');
    if (!Number.isFinite(extra) || extra < 0) return T.error('pa-result', 'The new money must be 0 or more.');
    const have = assets.reduce((s, a) => s + a.v, 0), total = have + extra;
    if (!(total > 0)) return T.error('pa-result', 'The portfolio value must be more than 0.');
    const sumT = assets.reduce((s, a) => s + a.t, 0);
    const warn = Math.abs(sumT - 100) > 0.01 ? `<p style="font-size:13px;line-height:1.5;color:#ef4444;margin:0 0 10px;">Your target percentages add up to ${T.amount(sumT, 2)}%, not 100%. The results use the targets as entered.</p>` : '';
    let rows = '', worst = 0;
    assets.forEach((a) => {
      const cur = (a.v / have) * 100 || 0, goal = (a.t / 100) * total, diff = goal - a.v;
      worst = Math.max(worst, Math.abs(cur - a.t));
      const act = Math.abs(diff) < 0.005 ? 'Hold' : diff > 0 ? `<span style="color:${T.GREEN}">Buy ${T.usd(diff)}</span>` : `<span style="color:${T.RED}">Sell ${T.usd(-diff)}</span>`;
      rows += `<tr><td>${a.name}</td><td>${T.usd(a.v)}</td><td>${T.amount(cur, 2)}%</td><td>${T.amount(a.t, 2)}%</td><td>${act}</td></tr>`;
    });
    T.el('pa-result').innerHTML = warn + T.big('Portfolio value', `${T.usd(total)} USD`, extra > 0 ? `${T.usd(have)} now plus ${T.usd(extra)} new` : `Largest gap from target: ${T.amount(worst, 2)} percentage points`) +
      '<div class="schedule-table-wrap" style="max-height:none;overflow-x:auto;margin-top:12px;"><table class="schedule-table"><thead><tr><th>Asset</th><th>Value</th><th>Now</th><th>Target</th><th>To rebalance</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  defaults.forEach(([n, v, t]) => addRow(n, v, t));
  T.el('pa-add').addEventListener('click', () => addRow());
  T.wire('pa-form', run);
  T.el('pa-form').addEventListener('input', run);
})();
