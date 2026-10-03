'use strict';

(function () {
  const U = window.DateUtils;
  const el = (id) => document.getElementById(id);
  if (!U || !el('dw-form')) return;

  function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function calculate() {
    const m = parseInt(el('dw-m').value, 10), d = Number(el('dw-d').value), y = Number(el('dw-y').value);
    if (!Number.isInteger(d) || d < 1 || d > 31) return err('Enter a day from 1 to 31.');
    if (!Number.isInteger(y) || y < 1 || y > 9999) return err('Enter a year from 1 to 9999.');
    const z = U.toDays(y, m, d), c = U.fromDays(z); // a date that does not exist rolls on to the next valid day
    if (c.y > 9999) return err('That date is after the year 9999.');
    const wd = U.weekday(z), name = U.DAYS[wd];
    const start = U.toDays(c.y, 1, 1), len = U.isLeap(c.y) ? 366 : 365, doy = z - start + 1;
    const first = U.weekday(start), extra = len - 364;
    const total = 52 + (((wd - first + 7) % 7) < extra ? 1 : 0), nth = Math.floor((doy - 1) / 7) + 1;
    const rolled = c.m !== m || c.d !== d;
    const past = z < U.toDays(1582, 10, 15);

    // calendar of the month
    const mFirst = U.toDays(c.y, c.m, 1), n = U.daysInMonth(c.y, c.m), lead = U.weekday(mFirst);
    let cal = `<table style="width:100%;border-collapse:collapse;text-align:center;font-size:13px;margin-top:6px;"><caption style="font-weight:700;padding:4px 0;">${U.MONTHS[c.m - 1]} ${c.y}</caption><tr>${'SMTWTFS'.split('').map((l) => `<th style="padding:3px;">${l}</th>`).join('')}</tr><tr>`;
    for (let k = 0; k < lead; k++) cal += '<td></td>';
    for (let i = 1; i <= n; i++) {
      if ((lead + i - 1) % 7 === 0 && i > 1) cal += '</tr><tr>';
      const wk = (lead + i - 1) % 7;
      cal += `<td style="padding:5px 0;${i === c.d ? 'background:var(--accent);color:#fff;border-radius:6px;font-weight:700;' : wk === 0 || wk === 6 ? 'background:var(--accent-tint);border-radius:6px;' : ''}">${i}</td>`;
    }
    cal += '</tr></table>';
    el('dw-result').innerHTML = `<div class="summary-payment-box"><div class="label">${U.longName(z)} is a</div><div class="value">${name}</div>${rolled ? `<div class="label" style="margin-top:6px;">${U.MONTHS[m - 1]} ${d}, ${y} does not exist, so the next valid date is used</div>` : ''}</div>` +
      `<div class="stat-row"><span>Day of the year</span><strong>${ordinal(doy)} of ${len}, with ${len - doy} left</strong></div>` +
      `<div class="stat-row"><span>${name}s in ${c.y}</span><strong>the ${ordinal(nth)} of ${total}, with ${total - nth} left</strong></div>` +
      (past ? '<p style="font-size:12px;color:var(--text-secondary);margin:8px 0 0;">This date is before the Gregorian calendar was introduced in 1582, so the weekday is shown in the Gregorian calendar extended backwards.</p>' : '') + cal;
  }
  function err(msg) { el('dw-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; }

  const t = U.fromDays(U.todayDays());
  el('dw-m').value = t.m; el('dw-d').value = t.d; el('dw-y').value = t.y;
  el('dw-form').addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('dw-form').addEventListener('input', calculate);
  el('dw-form').addEventListener('change', calculate);
  calculate();
})();
