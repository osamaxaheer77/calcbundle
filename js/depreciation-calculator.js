'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dr-form');
  if (!form) return;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_MS = 86400000;

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }
  const showError = (msg) => { el('dr-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('dr-results-section').hidden = true; };

  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const clampDay = (y, m, d) => Math.min(d, daysInMonth(y, m));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (dt) => `${dt.getUTCFullYear()}/${pad(dt.getUTCMonth() + 1)}/${pad(dt.getUTCDate())}`;

  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
    return { y, m: mo, d };
  }

  // Months and days from start `s` up to the date `n` (calendar arithmetic).
  function monthsAndDays(s, n) {
    let months = (n.y - s.y) * 12 + (n.m - s.m);
    if (n.d < s.d) months -= 1;
    let ay = s.y + Math.floor((s.m - 1 + months) / 12), am = ((s.m - 1 + months) % 12) + 1;
    const anchor = utc(ay, am, clampDay(ay, am, s.d));
    const days = Math.round((utc(n.y, n.m, n.d) - anchor) / DAY_MS);
    return { months, days };
  }

  function depreciation() {
    const method = el('dr-method').value;
    const cost = num('dr-cost'), salvage = num('dr-salvage'), years = num('dr-years'), factor = num('dr-factor');
    const round = form.querySelector('input[name="dr-round"]:checked').value === 'y';
    const partial = form.querySelector('input[name="dr-partial"]:checked').value === 'y';
    const conv = el('dr-conv').value;
    if (!Number.isFinite(cost) || cost <= 0) return showError('Enter the asset cost.');
    if (!Number.isFinite(salvage) || salvage < 0) return showError('Enter the salvage value, 0 or more.');
    if (salvage >= cost) return showError('The salvage value must be less than the asset cost.');
    if (!Number.isFinite(years) || years < 1 || years > 100 || Math.round(years) !== years) return showError('Enter the depreciation years as a whole number from 1 to 100.');
    if (method === 'declining' && (!Number.isFinite(factor) || factor <= 0 || factor > years)) return showError('Enter a depreciation factor above 0 and no more than the number of years.');
    const base = cost - salvage;
    const n = years;

    // Partial-year setup
    let f = 1, note = '', labels = null;
    if (partial) {
      const start = parseDate(el('dr-start').value);
      if (!start) return showError('Enter a valid start date for the asset.');
      const am = parseInt(el('dr-ay-month').value, 10), ad = parseInt(el('dr-ay-day').value, 10);
      if (!Number.isFinite(ad) || ad < 1 || ad > daysInMonth(2001, am)) return showError('Enter a valid day for the start of the accounting year.');
      const startDate = utc(start.y, start.m, start.d);
      const fyThis = utc(start.y, am, clampDay(start.y, am, ad));
      const fyStartDate = fyThis <= startDate ? fyThis : utc(start.y - 1, am, clampDay(start.y - 1, am, ad));
      const next = utc(fyStartDate.getUTCFullYear() + 1, am, clampDay(fyStartDate.getUTCFullYear() + 1, am, ad));
      if (+fyStartDate === +startDate) {
        note = 'It is a full accounting year since the start of service.';
      } else {
        const nd = { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() };
        const md = monthsAndDays(start, nd);
        const nextText = `${nd.y}-${nd.m}-${nd.d}`;
        const span = `It is ${md.months} months and ${md.days} days before the start of the next accounting year on ${nextText}`;
        if (conv === 'day') { f = Math.round((next - startDate) / DAY_MS) / 365; note = `${span}.`; }
        else if (conv === 'halfmonth' || conv === 'fullmonth') {
          const units = md.months + (md.days > 0 ? (conv === 'halfmonth' ? 0.5 : 1) : 0);
          f = units / 12; note = `${span}, which is converted to ${units} months for depreciation.`;
        } else if (conv === 'halfquarter' || conv === 'fullquarter') {
          const units = Math.floor(md.months / 3) + (md.months % 3 > 0 || md.days > 0 ? (conv === 'halfquarter' ? 0.5 : 1) : 0);
          f = units / 4; note = `${span}, which is converted to ${units} quarters for depreciation.`;
        } else { f = 0.5; note = `${span}, which is converted to half a year for depreciation.`; }
        if (f >= 1 - 1e-9) f = 1;
      }
      // Labels for each accounting period.
      labels = (count) => {
        const out = [];
        for (let k = 0; k < count; k++) {
          const a = utc(fyStartDate.getUTCFullYear() + k, am, clampDay(fyStartDate.getUTCFullYear() + k, am, ad));
          const b = new Date(utc(fyStartDate.getUTCFullYear() + k + 1, am, clampDay(fyStartDate.getUTCFullYear() + k + 1, am, ad)) - DAY_MS);
          out.push(am === 1 && ad === 1 ? String(a.getUTCFullYear()) : `${ymd(a)} - ${ymd(b)}`);
        }
        return out;
      };
    }
    const partialOn = partial && f < 1;
    const rowsCount = partialOn ? n + 1 : n;
    const rnd = (v) => (round ? Math.round(v) : v);

    const rows = [];
    let bv = cost, acc = 0;
    const push = (dep, pct) => { bv -= dep; acc += dep; rows.push({ begin: bv + dep, pct, dep, acc, end: bv }); };

    if (method === 'straight' || method === 'sum') {
      const D = [];
      for (let k = 1; k <= n; k++) D.push(method === 'straight' ? base / n : (base * (n - k + 1)) / ((n * (n + 1)) / 2));
      D.push(0);
      for (let j = 1; j <= rowsCount; j++) {
        let dep;
        if (!partialOn) dep = D[j - 1];
        else dep = j === 1 ? f * D[0] : (1 - f) * D[j - 2] + f * D[j - 1];
        dep = rnd(dep);
        if (j === rowsCount) dep = rnd(base - acc); // settle any rounding so the book value ends at the salvage value
        push(dep, dep / base);
      }
    } else {
      const r = factor / n;
      for (let j = 1; j <= rowsCount; j++) {
        const frac = partialOn && j === 1 ? f : 1;
        let dep = Math.min(bv * r * frac, bv - salvage);
        if (j === rowsCount) dep = bv - salvage;
        dep = rnd(Math.max(dep, 0));
        if (j === rowsCount) dep = rnd(bv - salvage);
        push(dep, bv > 0 ? dep / bv : 0);
      }
    }

    const money = (v) => '$' + v.toLocaleString('en-US', round ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const labelList = partial ? labels(rowsCount) : null;
    let head;
    if (method === 'straight') head = `With the straight line method, the depreciation per year is ${money(rnd(base / n))}.`;
    else if (method === 'declining') head = `A depreciation factor of ${factor} equals an annual depreciation rate of ${((factor / n) * 100).toFixed(2)}% for ${n} years.`;
    else head = `With the sum of the year's digits method, the first year takes ${n} of every ${(n * (n + 1)) / 2} parts of the depreciable amount, the second takes ${n - 1 > 0 ? n - 1 : 0}, and so on.`;
    const total = rows.reduce((s, r) => s + r.dep, 0);
    el('dr-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Total depreciation</div><div class="value">${money(total)}</div><div class="label" style="margin-top:6px;">Over ${rowsCount} ${partial && partialOn ? 'accounting periods' : 'years'}, from ${money(cost)} down to ${money(cost - total)}</div></div>` +
      `<p style="font-size:13px;line-height:1.5;margin:14px 0 0;">${head}</p>` +
      (note ? `<p style="font-size:13px;line-height:1.5;margin:10px 0 0;">${note}</p>` : '') +
      '<div class="stat-row"><span>Asset cost</span><strong>' + money(cost) + '</strong></div>' +
      '<div class="stat-row"><span>Salvage value</span><strong>' + money(salvage) + '</strong></div>';

    let html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Beginning Book Value</th><th>Depreciation Percent</th><th>Depreciation Amount</th><th>Accumulated Depreciation</th><th>Ending Book Value</th></tr></thead><tbody>';
    rows.forEach((r, k) => {
      html += `<tr><td>${labelList ? labelList[k] : `${k + 1}.`}</td><td>${money(r.begin)}</td><td>${(r.pct * 100).toFixed(2)}%</td><td>${money(r.dep)}</td><td>${money(r.acc)}</td><td>${money(r.end)}</td></tr>`;
    });
    el('dr-table-wrap').innerHTML = html + '</tbody></table>';
    el('dr-results-section').hidden = false;
  }

  function applyOptions() {
    const method = el('dr-method').value;
    const partial = form.querySelector('input[name="dr-partial"]:checked').value === 'y';
    el('dr-factor-box').style.display = method === 'declining' ? '' : 'none';
    el('dr-partial-box').style.display = partial ? '' : 'none';
  }

  (function init() {
    const sel = el('dr-ay-month');
    MONTHS.forEach((m, k) => { const o = document.createElement('option'); o.value = k + 1; o.textContent = m; sel.appendChild(o); });
    const t = new Date();
    el('dr-start').value = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  })();

  form.addEventListener('submit', (e) => { e.preventDefault(); depreciation(); });
  ['dr-method'].forEach((id) => el(id).addEventListener('change', () => { applyOptions(); depreciation(); }));
  form.querySelectorAll('input[name="dr-partial"]').forEach((n) => n.addEventListener('change', () => { applyOptions(); depreciation(); }));
  applyOptions();
  depreciation();
})();
