'use strict';

(function () {
  const T = window.TradeCommon;
  if (!T || !T.el('sk-form')) return;

  function run() {
    const amt = T.num('sk-amt'), rate = T.num('sk-rate'), years = T.num('sk-years');
    const add = T.num('sk-add') === null ? 0 : T.num('sk-add'), price = T.num('sk-price');
    if (![amt, rate, years].every((v) => v !== null && Number.isFinite(v))) return T.error('sk-result', 'Enter the amount staked, yield and time as numbers.');
    if (!(amt >= 0) || !(rate >= 0) || !(years > 0) || years > 50) return T.error('sk-result', 'The amount and yield must be 0 or more, and the time from more than 0 up to 50 years.');
    if (!Number.isFinite(add) || add < 0) return T.error('sk-result', 'The monthly addition must be 0 or more.');
    if (amt === 0 && add === 0) return T.error('sk-result', 'Enter an amount staked or a monthly addition.');
    if (price !== null && (!Number.isFinite(price) || !(price > 0))) return T.error('sk-result', 'The coin price must be more than 0, or leave it empty.');
    const type = T.el('sk-type').value, comp = parseInt(T.el('sk-comp').value, 10);
    T.el('sk-comp').disabled = type === 'apy';
    const r = rate / 100;
    const g = type === 'apy' ? Math.pow(1 + r, 1 / 12) : Math.pow(1 + r / comp, comp / 12);
    const months = Math.round(years * 12);
    let bal = amt, rows = [];
    for (let m = 1; m <= months; m++) {
      bal = bal * g + add;
      if (m % 12 === 0 || m === months) rows.push([m / 12, bal, amt + add * m]);
    }
    const put = amt + add * months, rewards = bal - put;
    const usd = (c) => (price !== null ? ` (${T.usd(c * price)} USD)` : '');
    let html = T.big('Balance after staking', `${T.amount(bal, 6)} coins`, price !== null ? `${T.usd(bal * price)} USD at ${T.price(price)} USD per coin` : `After ${T.amount(months / 12, 2)} ${months === 12 ? 'year' : 'years'}`) +
      T.row('Coins put in', T.amount(put, 6) + usd(put)) + T.row('Rewards earned', T.amount(rewards, 6) + usd(rewards), T.GREEN) +
      T.row('Effective yearly yield (APY)', T.pct((Math.pow(g, 12) - 1) * 100, 3));
    html += '<table class="schedule-table" style="margin-top:14px;"><thead><tr><th>Year</th><th>Balance</th><th>Coins put in</th></tr></thead><tbody>' +
      rows.slice(0, 50).map(([y, b, p]) => `<tr><td>${T.amount(y, 2)}</td><td>${T.amount(b, 6)}</td><td>${T.amount(p, 6)}</td></tr>`).join('') + '</tbody></table>';
    T.el('sk-result').innerHTML = html;
  }
  T.wire('sk-form', run);
  T.el('sk-form').querySelectorAll('input').forEach((n) => n.addEventListener('input', run));
})();
