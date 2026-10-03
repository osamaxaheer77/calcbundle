'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('cu-form');
  if (!form) return;

  const POPULAR = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY', 'CHF', 'SGD', 'HKD', 'KRW', 'MXN', 'BRL', 'ZAR', 'RUB', 'TRY'];
  const MAJOR = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'JPY', 'CNY', 'CAD', 'AUD'];
  const SOURCES = [
    { url: 'https://open.er-api.com/v6/latest/USD', parse: (j) => (j && j.result === 'success' ? { rates: j.rates, time: j.time_last_update_utc ? new Date(j.time_last_update_utc) : new Date() } : null) },
    { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', parse: (j) => (j && j.usd ? { rates: Object.fromEntries(Object.entries(j.usd).map(([k, v]) => [k.toUpperCase(), v])), time: j.date ? new Date(j.date + 'T00:00:00Z') : new Date() } : null) },
  ];

  let names;
  try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) { names = null; }
  const nameOf = (code) => { try { return (names && names.of(code)) || code; } catch (e) { return code; } };

  let rates = null;   // units of each currency per 1 USD
  let stamp = null;   // Date the rates were published
  let live = true;

  const fmt = (v) => {
    const a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (a >= 1) return v.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return v.toLocaleString('en-US', { maximumSignificantDigits: 6 });
  };
  const amountFmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  async function fetchJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  async function loadRates() {
    for (const s of SOURCES) {
      try {
        const got = s.parse(await fetchJson(s.url));
        if (got && got.rates && got.rates.USD) {
          // Keep only real currency codes.
          const clean = {};
          Object.keys(got.rates).forEach((c) => { if (/^[A-Z]{3}$/.test(c) && typeof got.rates[c] === 'number' && got.rates[c] > 0 && (nameOf(c) !== c || POPULAR.includes(c))) clean[c] = got.rates[c]; });
          if (Object.keys(clean).length > 20) {
            try { localStorage.setItem('cb-fx', JSON.stringify({ rates: clean, time: got.time.toISOString() })); } catch (e) { /* storage may be unavailable */ }
            return { rates: clean, time: got.time, live: true };
          }
        }
      } catch (e) { /* try the next source */ }
    }
    try {
      const saved = JSON.parse(localStorage.getItem('cb-fx'));
      if (saved && saved.rates) return { rates: saved.rates, time: new Date(saved.time), live: false };
    } catch (e) { /* nothing saved */ }
    return null;
  }

  function codes() {
    const all = Object.keys(rates).sort();
    return el('cu-popular').checked ? POPULAR.filter((c) => rates[c]) : all;
  }

  function fillSelects() {
    const list = codes();
    ['cu-from', 'cu-to'].forEach((id) => {
      const sel = el(id);
      const keep = sel.value || (id === 'cu-from' ? 'USD' : 'PKR');
      sel.innerHTML = '';
      const set = list.includes(keep) ? list : list.concat(keep).sort();
      set.forEach((c) => { const o = document.createElement('option'); o.value = c; o.textContent = `${c}: ${nameOf(c)}`; sel.appendChild(o); });
      sel.value = keep;
    });
  }

  const rateOf = (from, to) => rates[to] / rates[from];

  function convert() {
    if (!rates) return;
    const amount = num('cu-amount');
    const from = el('cu-from').value, to = el('cu-to').value;
    if (!Number.isFinite(amount) || amount < 0) {
      el('cu-result').innerHTML = '<p class="tool-result is-error">Enter an amount of 0 or more.</p>';
      return;
    }
    const r = rateOf(from, to);
    const value = amount * r;
    el('cu-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">${fmt(amount)} ${from} =</div><div class="value">${amountFmt(value)} ${to}</div><div class="label" style="margin-top:6px;">${nameOf(from)} to ${nameOf(to)}</div></div>` +
      `<div class="stat-row"><span>1 ${from}</span><strong>${fmt(r)} ${to}</strong></div>` +
      `<div class="stat-row"><span>1 ${to}</span><strong>${fmt(1 / r)} ${from}</strong></div>` +
      `<div class="stat-row"><span>Rates updated</span><strong>${stamp.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>` +
      (live ? '' : '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Could not reach the live rate service, so these are the last rates saved in your browser and may be out of date.</p>');
  }

  function custom() {
    const rate = num('cu-rate'), amount = num('cu-amount2');
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(amount) || amount < 0) {
      el('cu-result2').innerHTML = '<p class="tool-result is-error">Enter an exchange rate above 0 and an amount of 0 or more.</p>';
      return;
    }
    el('cu-result2').innerHTML =
      `<div class="summary-payment-box"><div class="label">${fmt(amount)} of currency A =</div><div class="value">${amountFmt(amount * rate)}</div><div class="label" style="margin-top:6px;">units of currency B at a rate of ${fmt(rate)}</div></div>` +
      `<div class="stat-row"><span>1 unit of B</span><strong>${fmt(1 / rate)} units of A</strong></div>`;
  }

  function buildTables() {
    let html = '<table class="schedule-table"><thead><tr><th></th>' + MAJOR.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    MAJOR.filter((c) => rates[c]).forEach((a) => {
      html += `<tr><td><strong>1 ${a}</strong></td>` + MAJOR.map((b) => `<td>${rates[b] ? fmt(rateOf(a, b)) : ''}</td>`).join('') + '</tr>';
    });
    el('cu-major').innerHTML = html + '</tbody></table>';

    let all = '<table class="schedule-table"><thead><tr><th>Currency</th><th>1 USD buys</th><th>1 unit buys (USD)</th></tr></thead><tbody>';
    Object.keys(rates).sort().forEach((c) => { all += `<tr><td>${c}: ${nameOf(c)}</td><td>${fmt(rates[c])}</td><td>${fmt(1 / rates[c])}</td></tr>`; });
    el('cu-all').innerHTML = all + '</tbody></table>';
    el('cu-stamp').textContent = `Rates published ${stamp.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}.`;
  }

  async function start() {
    el('cu-result').innerHTML = '<p style="font-size:14px;color:var(--text-secondary);">Loading live exchange rates…</p>';
    const got = await loadRates();
    if (!got) {
      el('cu-result').innerHTML = '<p class="tool-result is-error">Could not load exchange rates. Check your internet connection and try again.</p><button type="button" id="cu-retry" class="calc-submit-btn" style="margin-top:10px;">Try again</button>';
      el('cu-retry').addEventListener('click', start);
      return;
    }
    rates = got.rates; stamp = got.time; live = got.live;
    fillSelects();
    buildTables();
    convert();
    custom();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); convert(); });
  ['cu-from', 'cu-to'].forEach((id) => el(id).addEventListener('change', convert));
  el('cu-amount').addEventListener('input', convert);
  el('cu-popular').addEventListener('change', () => { if (rates) { fillSelects(); convert(); } });
  el('cu-swap').addEventListener('click', () => {
    const a = el('cu-from').value; el('cu-from').value = el('cu-to').value; el('cu-to').value = a; convert();
  });
  el('cu-form2').addEventListener('submit', (e) => { e.preventDefault(); custom(); });
  el('cu-rate').addEventListener('input', custom);
  el('cu-amount2').addEventListener('input', custom);
  custom();
  start();
})();
