'use strict';

// Shared pair, account currency and exchange rate handling for the forex calculators.
window.ForexCommon = (function () {
  const T = window.TradeCommon;
  const el = (id) => document.getElementById(id);

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY', 'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'MXN', 'ZAR', 'TRY', 'INR', 'PKR'];
  // Rough values per 1 USD, used only if no live or saved rates can be loaded.
  const FALLBACK = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150, AUD: 1.52, NZD: 1.65, CAD: 1.37, CHF: 0.88, CNY: 7.2, HKD: 7.8, SGD: 1.34, SEK: 10.5, NOK: 10.7, DKK: 6.9, PLN: 4, CZK: 23, HUF: 360, MXN: 17.5, ZAR: 18.5, TRY: 33, INR: 83, PKR: 280 };
  const SOURCES = [
    { url: 'https://open.er-api.com/v6/latest/USD', parse: (j) => (j && j.result === 'success' ? { rates: j.rates, time: j.time_last_update_utc ? new Date(j.time_last_update_utc) : new Date() } : null) },
    { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', parse: (j) => (j && j.usd ? { rates: Object.fromEntries(Object.entries(j.usd).map(([k, v]) => [k.toUpperCase(), v])), time: j.date ? new Date(j.date + 'T00:00:00Z') : new Date() } : null) },
  ];

  let state = { rates: FALLBACK, time: null, kind: 'approx' };
  let loading = null;

  async function fetchJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function load() {
    if (loading) return loading;
    loading = (async () => {
      for (const s of SOURCES) {
        try {
          const got = s.parse(await fetchJson(s.url));
          if (got && got.rates && got.rates.USD) {
            const clean = {};
            CURRENCIES.forEach((c) => { if (typeof got.rates[c] === 'number' && got.rates[c] > 0) clean[c] = got.rates[c]; });
            if (Object.keys(clean).length >= 15) {
              try { localStorage.setItem('cb-fx-forex', JSON.stringify({ rates: clean, time: got.time.toISOString() })); } catch (e) { /* storage may be unavailable */ }
              state = { rates: Object.assign({}, FALLBACK, clean), time: got.time, kind: 'live' };
              return state;
            }
          }
        } catch (e) { /* try the next source */ }
      }
      try {
        const saved = JSON.parse(localStorage.getItem('cb-fx-forex'));
        if (saved && saved.rates) { state = { rates: Object.assign({}, FALLBACK, saved.rates), time: new Date(saved.time), kind: 'saved' }; return state; }
      } catch (e) { /* nothing saved */ }
      return state;
    })();
    return loading;
  }

  // How many units of `to` one unit of `from` buys.
  const rate = (from, to) => (from === to ? 1 : state.rates[to] / state.rates[from]);
  const pipSize = (quote) => (quote === 'JPY' ? 0.01 : 0.0001);
  const pipDecimals = (quote) => (quote === 'JPY' ? 3 : 5);
  const UNITS = { lot: 100000, mini: 10000, micro: 1000, units: 1 };

  function status() {
    if (state.kind === 'live') return `Exchange rates updated ${state.time.toUTCString().replace(' GMT', ' UTC')}.`;
    if (state.kind === 'saved') return `Live rates could not be loaded, so the last saved rates from ${state.time.toUTCString().replace(' GMT', ' UTC')} are used.`;
    return 'Live rates could not be loaded, so rough approximate rates are used. Enter the current price yourself for an accurate result.';
  }

  function fillSelect(id, keep) {
    const sel = el(id);
    if (!sel || sel.options.length) return;
    CURRENCIES.forEach((c) => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    sel.value = keep;
  }

  // Sets up `${p}-base`, `${p}-quote`, `${p}-acct` and the optional `${p}-price` field and `${p}-fxnote` text.
  function init(p, run, onPair) {
    fillSelect(p + '-base', 'EUR');
    fillSelect(p + '-quote', 'USD');
    fillSelect(p + '-acct', 'USD');
    const priceBox = el(p + '-price');
    let edited = false;
    if (priceBox) priceBox.addEventListener('input', () => { edited = true; });
    function refreshPrice() {
      if (!priceBox || edited) return;
      const b = el(p + '-base').value, q = el(p + '-quote').value;
      const r = rate(b, q);
      priceBox.value = r >= 100 ? r.toFixed(3) : r.toFixed(5);
    }
    function pairChanged() { refreshPrice(); if (onPair) onPair(rate(el(p + '-base').value, el(p + '-quote').value)); }
    ['base', 'quote'].forEach((k) => el(p + '-' + k).addEventListener('change', () => { edited = false; pairChanged(); run(); }));
    el(p + '-acct').addEventListener('change', run);
    pairChanged();
    run();
    load().then(() => {
      pairChanged();
      const note = el(p + '-fxnote');
      if (note) note.innerHTML = status() + ' Exchange rates by <a href="https://www.exchangerate-api.com" rel="noopener" target="_blank">ExchangeRate-API</a>.';
      run();
    });
  }

  // Reads the pair; returns { base, quote, acct, price } or an error string.
  function readPair(p, priceId) {
    const base = el(p + '-base').value, quote = el(p + '-quote').value, acct = el(p + '-acct').value;
    if (base === quote) return { err: 'Choose two different currencies for the pair.' };
    const priceBox = el(priceId || p + '-price');
    let price = rate(base, quote);
    if (priceBox) {
      const v = T.num(priceId || p + '-price');
      if (v === null || !Number.isFinite(v) || !(v > 0)) return { err: 'Enter the current price of the pair, more than 0.' };
      price = v;
    }
    return { base, quote, acct, price, pip: pipSize(quote) };
  }

  // Value of 1 unit of `quote` and of `base` in the account currency. The pair price is used when the
  // account currency is the other side of the pair, so the answer matches the price you entered.
  function toAccount(pair) {
    const { base, quote, acct, price } = pair;
    const quoteToAcct = acct === quote ? 1 : acct === base ? 1 / price : rate(quote, acct);
    const baseToAcct = acct === base ? 1 : acct === quote ? price : rate(base, acct);
    return { quoteToAcct, baseToAcct };
  }

  const fx = (p) => `<p id="${p}-fxnote" style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">Loading exchange rates…</p>`;
  return { init, readPair, toAccount, rate, pipSize, pipDecimals, UNITS, load, status, fx, CURRENCIES };
})();
