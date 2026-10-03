'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('gf-form')) return;

  function run() {
    const type = T.el('gf-type').value;
    T.el('gf-custom-box').style.display = type === 'custom' ? '' : 'none';
    const gas = type === 'custom' ? T.num('gf-gas') : parseInt(type, 10);
    const base = T.num('gf-base'), tip = T.num('gf-tip') === null ? 0 : T.num('gf-tip'), eth = T.num('gf-eth');
    if (gas === null || !Number.isFinite(gas) || !(gas > 0)) return T.error('gf-result', 'Enter the gas used, more than 0.');
    if (base === null || !Number.isFinite(base) || base < 0 || !Number.isFinite(tip) || tip < 0) return T.error('gf-result', 'Enter the base fee and priority fee in gwei, 0 or more.');
    if (eth !== null && (!Number.isFinite(eth) || !(eth > 0))) return T.error('gf-result', 'The ETH price must be more than 0, or leave it empty.');
    const price = base + tip;
    const feeEth = (gas * price) / 1e9;
    const usd = (e) => (eth !== null ? `${T.usd(e * eth)} USD` : 'enter an ETH price');
    let html = T.big('Transaction fee', `${T.amount(feeEth, 8)} ETH`, eth !== null ? `${T.usd(feeEth * eth)} USD` : `${T.amount(gas * price, 0)} gwei`) +
      T.row('Gas used', T.group(String(Math.round(gas)))) + T.row('Gas price (base + tip)', `${T.amount(price, 4)} gwei`) +
      T.row('Total in gwei', T.group(String(Math.round(gas * price))));
    html += '<h3 style="margin:16px 0 6px;font-size:15px;">The same transaction at other gas prices</h3><table class="schedule-table"><thead><tr><th>Gas price</th><th>Fee (ETH)</th><th>Fee (USD)</th></tr></thead><tbody>' +
      [5, 10, 20, 50, 100, 200].map((g) => { const e = (gas * g) / 1e9; return `<tr><td>${g} gwei</td><td>${T.amount(e, 8)}</td><td>${eth !== null ? T.usd(e * eth) : '-'}</td></tr>`; }).join('') + '</tbody></table>';
    T.el('gf-result').innerHTML = html;
  }
  T.wire('gf-form', run);
  T.el('gf-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
