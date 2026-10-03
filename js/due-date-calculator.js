'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dd-form');
  if (!form) return;

  const DAY = 86400000;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
  const add = (d, n) => new Date(d.getTime() + n * DAY);
  const fmt = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  const fmtShort = (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  const error = (msg) => { el('dd-result').innerHTML = `<p class="tool-result is-error">${msg}</p>`; el('dd-schedule').hidden = true; };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

  // Average baby length (cm) and weight (g) by pregnancy week number.
  const SIZE = { 9: [2.3, 2], 10: [3.1, 4], 11: [4.1, 7], 12: [5.4, 14], 13: [7.4, 23], 14: [8.7, 43], 15: [10.1, 70], 16: [11.6, 100], 17: [13, 140], 18: [14.2, 190], 19: [15.3, 240], 20: [16.4, 300],
    21: [26.7, 360], 22: [27.8, 430], 23: [28.9, 501], 24: [30, 600], 25: [34.6, 660], 26: [35.6, 760], 27: [36.6, 875], 28: [37.6, 1005], 29: [38.6, 1153], 30: [39.9, 1319], 31: [41.1, 1502],
    32: [42.4, 1702], 33: [43.7, 1918], 34: [45, 2146], 35: [46.2, 2383], 36: [47.4, 2622], 37: [48.6, 2859], 38: [49.8, 3083], 39: [50.7, 3288], 40: [51.2, 3462] };
  const MILESTONES = { 3: 'Baby conceived', 4: 'Pregnancy test positive', 6: 'Heartbeat detectable by ultrasound', 13: 'Miscarriage risk decreases', 18: 'Baby begins making noticeable movements, can hear sounds, and the sex can be found out', 23: 'Premature baby may survive', 28: 'Baby can breathe', 38: 'Full term' };
  const trim2 = (v) => String(Math.round(v * 100) / 100);
  const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  function sizeText(week) {
    if (week <= 8) return 'On average, your baby weighs less than 1 gram at this stage.';
    if (week > 40) return `On average, your baby weighs more than ${trim2(SIZE[40][1] / 453.59237)} pounds or ${group(SIZE[40][1])} grams at this stage.`;
    const [cm, g] = SIZE[week];
    const inch = cm / 2.54, oz = g / 28.349523125;
    const wt = oz < 16 ? `${trim2(oz)} ounce${oz > 1 ? 's' : ''}` : `${trim2(oz / 16)} pounds`;
    return `On average, your baby is around ${trim2(inch)} inch${inch > 1 ? 'es' : ''} (${trim2(cm)} cm) long and weighs around ${wt} (${group(g)} grams).`;
  }

  function readDate(id) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el(id).value);
    if (!m) return null;
    const d = utc(+m[1], +m[2], +m[3]);
    return d.getUTCMonth() === +m[2] - 1 && +m[1] >= 1900 && +m[1] <= 2200 ? d : null;
  }

  // Months and days from one date to a later one.
  function monthsDays(from, to) {
    let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
    if (to.getUTCDate() < from.getUTCDate()) months -= 1;
    const y = from.getUTCFullYear() + Math.floor((from.getUTCMonth() + months) / 12), m = ((from.getUTCMonth() + months) % 12) + 1;
    const anchor = utc(y, m, Math.min(from.getUTCDate(), daysIn(y, m)));
    return { months, days: Math.round((to - anchor) / DAY) };
  }

  function calculate() {
    const method = el('dd-method').value;
    let lmp;
    if (method === 'lmp') {
      const d = readDate('dd-lmp');
      if (!d) return error('Enter the first day of your last period.');
      lmp = add(d, parseInt(el('dd-cycle').value, 10) - 28);
    } else if (method === 'us') {
      const d = readDate('dd-us-date');
      const w = Number(el('dd-us-weeks').value), dd = Number(el('dd-us-days').value);
      if (!d) return error('Enter the ultrasound date.');
      if (!Number.isInteger(w) || w < 0 || w > 42 || !Number.isInteger(dd) || dd < 0 || dd > 6) return error('Enter the pregnancy length as whole weeks (0 to 42) and days (0 to 6).');
      lmp = add(d, -(w * 7 + dd));
    } else if (method === 'conc') {
      const d = readDate('dd-conc');
      if (!d) return error('Enter the conception date.');
      lmp = add(d, -14);
    } else {
      const d = readDate('dd-ivf-date');
      if (!d) return error('Enter the transfer date.');
      lmp = add(d, -14 - parseInt(el('dd-ivf-age').value, 10));
    }
    const due = add(lmp, 280);
    const t = new Date();
    const today = utc(t.getFullYear(), t.getMonth() + 1, t.getDate());
    const n = Math.round((today - lmp) / DAY);

    let html = `<div class="summary-payment-box"><div class="label">Estimated due date</div><div class="value">${fmt(due)}</div></div>`;
    if (n >= 1 && n <= 294) {
      const week = Math.ceil(n / 7), w = Math.floor(n / 7), d = n % 7;
      const md = monthsDays(lmp, today);
      const span = md.months > 0 ? `${plural(md.months, 'month')}${md.days ? ' ' + plural(md.days, 'day') : ''}` : plural(md.days, 'day');
      const tri = week >= 28 ? 'third' : week >= 13 ? 'second' : 'first';
      const pct = Math.round((n / 280) * 100);
      html += `<p style="font-size:14px;line-height:1.55;margin:14px 0 0;">You are currently at <strong>week ${week}</strong> (${w} week${w === 1 ? '' : 's'} ${d} day${d === 1 ? '' : 's'}, or ${span}) of pregnancy. You are in the ${tri} trimester${week >= 38 ? ' and full term' : ''}.</p>` +
        `<p style="font-size:13px;line-height:1.55;margin:10px 0 0;">${sizeText(week)}</p>`;
      if (n <= 278 && pct < 100) html += `<div class="stat-row"><span>Progress</span><strong>${pct}% through pregnancy</strong></div>`;
      html += `<div class="stat-row"><span>Likely conceived on</span><strong>${fmt(add(lmp, 14))}</strong></div>`;
    } else {
      html += `<div class="stat-row"><span>Likely conceived on</span><strong>${fmt(add(lmp, 14))}</strong></div>`;
    }
    el('dd-result').innerHTML = html;

    let tbl = '<table class="schedule-table"><thead><tr><th>Week</th><th>Dates</th><th>Trimester</th><th>Milestones</th></tr></thead><tbody>';
    const cur = n >= 1 && n <= 294 ? Math.ceil(n / 7) : 0;
    for (let k = 1; k <= 42; k++) {
      const s = add(lmp, (k - 1) * 7 + 1), e = add(s, 6);
      const label = k === 1 ? 'First trimester' : k === 13 ? 'Second trimester' : k === 28 ? 'Third trimester' : '';
      tbl += `<tr${k === cur ? ' style="background:var(--accent-tint);"' : ''}><td>Week ${k}</td><td>${fmtShort(s)}${s.getUTCFullYear() !== e.getUTCFullYear() ? ', ' + s.getUTCFullYear() : ''} – ${fmt(e)}${k === cur ? ' (today)' : ''}</td><td>${label}</td><td>${MILESTONES[k] || ''}</td></tr>`;
    }
    el('dd-table-wrap').innerHTML = tbl + '</tbody></table>';
    el('dd-schedule').hidden = false;
  }

  function applyMethod() {
    const m = el('dd-method').value;
    el('dd-lmp-box').style.display = m === 'lmp' ? '' : 'none';
    el('dd-us-box').style.display = m === 'us' ? '' : 'none';
    el('dd-conc-box').style.display = m === 'conc' ? '' : 'none';
    el('dd-ivf-box').style.display = m === 'ivf' ? '' : 'none';
  }

  (function defaults() {
    const t = new Date();
    const today = utc(t.getFullYear(), t.getMonth() + 1, t.getDate());
    el('dd-lmp').value = iso(add(today, -60));
    el('dd-us-date').value = iso(today);
    el('dd-conc').value = iso(add(today, -46));
    el('dd-ivf-date').value = iso(add(today, -40));
  })();
  el('dd-method').addEventListener('change', () => { applyMethod(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  applyMethod();
  calculate();
})();
