'use strict';

(function () {
  const U = window.DateUtils;
  const el = (id) => document.getElementById(id);
  if (!U || !el('dc-form')) return;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const row = (l, v) => `<div class="stat-row"><span>${l}</span><strong>${v}</strong></div>`;
  const DAYNAMES = U.DAYS;

  // Day of month for the n-th (1-based) weekday `wd` of a month, or the last one when n is -1.
  function nthWeekday(y, m, wd, n) {
    if (n > 0) {
      const first = U.toDays(y, m, 1), shift = (wd - U.weekday(first) + 7) % 7;
      return first + shift + (n - 1) * 7;
    }
    const last = U.toDays(y, m, U.daysInMonth(y, m)), back = (U.weekday(last) - wd + 7) % 7;
    return last - back;
  }
  const HOLIDAYS = [
    ['ny', 'New Year’s Day', (y) => U.toDays(y, 1, 1)],
    ['ml', 'Martin Luther King Jr. Day', (y) => nthWeekday(y, 1, 1, 3)],
    ['pd', 'Presidents’ Day', (y) => nthWeekday(y, 2, 1, 3)],
    ['md', 'Memorial Day', (y) => nthWeekday(y, 5, 1, -1)],
    ['jd', 'Juneteenth', (y) => U.toDays(y, 6, 19)],
    ['id', 'Independence Day', (y) => U.toDays(y, 7, 4)],
    ['ld', 'Labor Day', (y) => nthWeekday(y, 9, 1, 1)],
    ['cd', 'Columbus Day', (y) => nthWeekday(y, 10, 1, 2)],
    ['vd', 'Veterans Day', (y) => U.toDays(y, 11, 11)],
    ['tx', 'Thanksgiving', (y) => nthWeekday(y, 11, 4, 4)],
    ['bf', 'Black Friday', (y) => nthWeekday(y, 11, 4, 4) + 1],
    ['xe', 'Christmas Eve', (y) => U.toDays(y, 12, 24)],
    ['xm', 'Christmas Day', (y) => U.toDays(y, 12, 25)],
    ['ne', 'New Year’s Eve', (y) => U.toDays(y, 12, 31)],
  ];

  // The holiday settings chosen on the page, as a list of { name, at(year) }.
  function chosenHolidays() {
    if (!el('dc-hol').checked) return [];
    const list = HOLIDAYS.filter(([k]) => el('dc-h-' + k).checked).map(([, name, at]) => ({ name, at }));
    for (let i = 1; i <= 6; i++) {
      const m = parseInt(el('dc-cm' + i).value, 10), d = parseInt(el('dc-cd' + i).value, 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const name = el('dc-cn' + i).value.trim() || 'Holiday ' + i;
        list.push({ name, at: (y) => (d <= U.daysInMonth(y, m) ? U.toDays(y, m, d) : null) });
      }
    }
    return list;
  }
  // Holidays with a date in [from, to), sorted.
  function holidaysIn(from, to, hols) {
    const out = [], y0 = U.fromDays(from).y, y1 = U.fromDays(to).y;
    for (let y = y0; y <= y1; y++) hols.forEach((h) => { const z = h.at(y); if (z !== null && z >= from && z < to) out.push({ name: h.name, z }); });
    return out.sort((a, b) => a.z - b.z);
  }
  const dayLabel = (z) => `${U.nameOf(z)} (${DAYNAMES[U.weekday(z)]})`;

  function calendars(from, to, hols, marks) {
    const a = U.fromDays(from), b = U.fromDays(to - 1);
    const months = (b.y - a.y) * 12 + (b.m - a.m) + 1;
    if (months > 12) return '<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The range is longer than 12 months, so the calendars are not shown.</p>';
    const hz = new Set(hols.map((h) => h.z));
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:16px;">';
    for (let i = 0; i < months; i++) {
      const y = a.y + Math.floor((a.m - 1 + i) / 12), m = ((a.m - 1 + i) % 12) + 1;
      const first = U.toDays(y, m, 1), n = U.daysInMonth(y, m), lead = U.weekday(first);
      html += `<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:center;"><caption style="font-weight:700;padding:4px 0;">${U.MONTHS[m - 1]} ${y}</caption><tr>${'SMTWTFS'.split('').map((c) => `<th style="padding:2px;">${c}</th>`).join('')}</tr><tr>`;
      for (let k = 0; k < lead; k++) html += '<td></td>';
      for (let d = 1; d <= n; d++) {
        const z = first + d - 1, wd = U.weekday(z);
        if ((lead + d - 1) % 7 === 0 && d > 1) html += '</tr><tr>';
        const inRange = z >= from && z < to;
        let st = 'padding:3px 0;';
        if (hz.has(z)) st += 'background:#fde68a;border-radius:4px;';
        else if (wd === 0 || wd === 6) st += 'background:var(--accent-tint);border-radius:4px;';
        if (!inRange) st += 'opacity:0.4;';
        if (marks.includes(z)) st += 'font-weight:700;outline:2px solid var(--accent);border-radius:4px;';
        html += `<td style="${st}">${d}</td>`;
      }
      html += '</tr></table>';
    }
    return html + '</div><p style="font-size:12px;color:var(--text-secondary);margin:10px 0 0;">Shaded blue: weekend. Shaded yellow: holiday. Outlined: the dates you chose. Faded days are outside the range.</p>';
  }

  function between() {
    let s = U.parseIso(el('dc-start').value), e = U.parseIso(el('dc-end').value);
    if (s === null || e === null) return error('dc-result', 'Enter a valid start date and end date.');
    let swapped = false;
    if (s > e) { [s, e] = [e, s]; swapped = true; }
    const inc = el('dc-inc').checked, to = inc ? e + 1 : e, total = to - s;
    const useHol = el('dc-hol').checked, hols = holidaysIn(s, to, chosenHolidays());
    let weekend = 0, weekday = 0;
    const hz = new Set(hols.map((h) => h.z));
    let weekdayHols = 0;
    for (let z = s; z < to; z++) { const wd = U.weekday(z); if (wd === 0 || wd === 6) weekend += 1; else { weekday += 1; if (hz.has(z)) weekdayHols += 1; } }
    let html = `<div class="summary-payment-box"><div class="label">Days between</div><div class="value">${U.group(total)}</div><div class="label" style="margin-top:6px;">${dayLabel(s)} to ${dayLabel(e)}${inc ? ', including both days' : ''}${swapped ? '. The dates were swapped so the start is first' : ''}</div></div>`;
    html += row('Weekend days', U.group(weekend));
    if (useHol) html += row('Holidays', U.group(hols.length)) + row('Business days', U.group(weekday - weekdayHols));
    else html += row('Weekdays', U.group(weekday));
    if (useHol && hols.length) html += '<h3 style="margin:14px 0 6px;font-size:15px;">Holidays in this range</h3>' + hols.map((h) => row(esc(h.name), dayLabel(h.z))).join('');
    html += calendars(s, to, hols, [s, e]);
    el('dc-result').innerHTML = html;
  }

  function offset() {
    const d = U.parseIso(el('do-date').value), n = Number(el('do-n').value), op = el('do-op').value, bus = el('do-bus').checked;
    if (d === null) return error('do-result', 'Enter a valid start date.');
    if (!Number.isInteger(n) || n < 1 || n > 100000) return error('do-result', 'Enter a number of days from 1 to 100,000.');
    const dir = op === '+' ? 1 : -1;
    let r;
    if (!bus) r = d + dir * n;
    else {
      const hols = chosenHolidays();
      const cache = new Map();
      const isHol = (z) => { const y = U.fromDays(z).y; if (!cache.has(y)) cache.set(y, new Set(hols.map((h) => h.at(y)).filter((v) => v !== null))); return cache.get(y).has(z); };
      let left = n; r = d;
      while (left > 0) { r += dir; const wd = U.weekday(r); if (wd !== 0 && wd !== 6 && !isHol(r)) left -= 1; }
      if (r > 3652059 || r < -719162) return error('do-result', 'That date is outside the supported range of years 1 to 9999.');
    }
    if (r > 2932896 || r < -719162) return error('do-result', 'That date is outside the supported range of years 1 to 9999.');
    const from = Math.min(d, r), to = Math.max(d, r) + 1;
    const hols = bus || el('dc-hol').checked ? holidaysIn(from, to, chosenHolidays()) : [];
    let weekend = 0;
    for (let z = from; z < to; z++) { const wd = U.weekday(z); if (wd === 0 || wd === 6) weekend += 1; }
    let html = `<div class="summary-payment-box"><div class="label">${U.group(n)} ${bus ? 'business ' : ''}day${n === 1 ? '' : 's'} ${op === '+' ? 'after' : 'before'} ${U.nameOf(d)}</div><div class="value" style="font-size:22px;">${dayLabel(r)}</div></div>`;
    html += row('Start date', dayLabel(d)) + row('Days in between', U.group(Math.abs(r - d)));
    if (bus) html += row('Weekend days in the span', U.group(weekend)) + row('Holidays in the span', U.group(hols.length));
    if (bus && hols.length) html += '<h3 style="margin:14px 0 6px;font-size:15px;">Holidays in this span</h3>' + hols.map((h) => row(esc(h.name), dayLabel(h.z))).join('');
    html += `<p style="font-size:12px;color:var(--text-secondary);margin:12px 0 0;">The start day is not counted.</p>`;
    el('do-result').innerHTML = html;
  }

  function applyHol() { el('dc-hol-box').style.display = el('dc-hol').checked ? '' : 'none'; }
  const today = U.todayDays();
  el('dc-start').value = U.toIso(today); el('dc-end').value = U.toIso(today + 30); el('do-date').value = U.toIso(today);
  el('dc-form').addEventListener('submit', (e) => { e.preventDefault(); between(); });
  el('do-form').addEventListener('submit', (e) => { e.preventDefault(); offset(); });
  el('dc-form').addEventListener('input', between); el('dc-form').addEventListener('change', between);
  el('do-form').addEventListener('input', offset); el('do-form').addEventListener('change', offset);
  el('dc-settings').addEventListener('input', () => { applyHol(); between(); offset(); });
  el('dc-settings').addEventListener('change', () => { applyHol(); between(); offset(); });
  applyHol();
  between();
  offset();
})();
