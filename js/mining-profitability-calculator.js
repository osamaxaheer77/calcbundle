'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('mn-form')) return;

  function run() {
    const hash = T.num('mn-hash'), watt = T.num('mn-watt'), kwh = T.num('mn-kwh'), diff = T.num('mn-diff'), reward = T.num('mn-reward'), price = T.num('mn-price');
    const pool = T.num('mn-pool') === null ? 0 : T.num('mn-pool'), hw = T.num('mn-hw');
    if (![hash, watt, kwh, diff, reward, price].every((v) => v !== null && Number.isFinite(v))) return T.error('mn-result', 'Enter the hash rate, power use, electricity cost, difficulty, block reward and coin price as numbers.');
    if (!(hash > 0) || !(watt >= 0) || !(kwh >= 0) || !(diff > 0) || !(reward > 0) || !(price > 0)) return T.error('mn-result', 'The hash rate, difficulty, block reward and price must be more than 0, and the power and electricity cost 0 or more.');
    if (!Number.isFinite(pool) || pool < 0 || pool >= 100) return T.error('mn-result', 'The pool fee must be from 0 to less than 100%.');
    if (hw !== null && (!Number.isFinite(hw) || hw < 0)) return T.error('mn-result', 'The hardware cost must be 0 or more, or leave it empty.');
    const coinsDay = ((hash * 86400 * reward) / (diff * Math.pow(2, 32))) * (1 - pool / 100);
    const revenue = coinsDay * price, power = (watt / 1000) * 24 * kwh, profit = revenue - power;
    const color = profit > 0 ? T.GREEN : profit < 0 ? T.RED : '';
    const per = (v, d) => `${T.usd(v * d)} USD`;
    let html = T.big('Profit per day', `${T.usd(profit)} USD`, profit >= 0 ? 'Mining is profitable with these numbers' : 'Mining loses money with these numbers', color) +
      T.row('Coins mined per day', T.amount(coinsDay, 8)) + T.row('Revenue per day', per(revenue, 1)) + T.row('Electricity per day', per(power, 1), T.RED) +
      T.row('Profit per month (30 days)', per(profit, 30), color) + T.row('Profit per year', per(profit, 365), color) +
      T.row('Efficiency', `${T.amount(watt / hash, 2)} J/TH`);
    const be = (revenue / ((watt / 1000) * 24)) || 0;
    if (watt > 0) html += T.row('Break-even electricity price', `${T.usd(be)} USD per kWh`);
    if (hw !== null && hw > 0) html += T.row('Hardware payback', profit > 0 ? `${T.amount(hw / profit, 0)} days` : 'Not reached', profit > 0 ? '' : T.RED);
    T.el('mn-result').innerHTML = html;
  }
  T.wire('mn-form', run);
  T.el('mn-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
