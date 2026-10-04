'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('cv-form')) return;
  const el = C.el;

  // Data sizes in bits (decimal prefixes, so 1 kilobit = 1,000 bits). Bytes are 8 bits.
  const DATA = [
    ['b', 'bits (b)', 1], ['kb', 'kilobits (kb)', 1e3], ['mb', 'megabits (mb)', 1e6], ['gb', 'gigabits (gb)', 1e9], ['tb', 'terabits (tb)', 1e12],
    ['B', 'Bytes (B)', 8], ['KB', 'Kilobytes (KB)', 8e3], ['MB', 'Megabytes (MB)', 8e6], ['GB', 'Gigabytes (GB)', 8e9], ['TB', 'Terabytes (TB)', 8e12],
  ];
  const BYTES = DATA.slice(5);
  const RATE = [['b', 'bit/s', 1], ['kb', 'Kbit/s', 1e3], ['mb', 'Mbit/s', 1e6], ['gb', 'Gbit/s', 1e9], ['tb', 'Tbit/s', 1e12]];
  // Seconds in each period. A month is a twelfth of a 365.25 day year.
  const DAY = 86400, MONTH = 365.25 * DAY / 12;
  const PERIOD = [['second', 'Per Second', 1], ['minute', 'Per Minute', 60], ['hour', 'Per Hour', 3600], ['day', 'Per Day', DAY], ['week', 'Per Week', 7 * DAY], ['month', 'Per Month', MONTH], ['year', 'Per Year', 365.25 * DAY]];
  const by = (t) => { const m = {}; t.forEach((u) => { m[u[0]] = u; }); return m; };
  const DB = by(DATA), RB = by(RATE), PB = by(PERIOD);
  const fill = (id, t, sel) => { const s = el(id); t.forEach((u) => s.add(new Option(u[1], u[0]))); s.value = sel; };
  fill('cv-u', DATA, 'MB');
  fill('dl-su', BYTES, 'MB'); fill('dl-bu', RATE, 'mb');
  fill('wb-pu', PERIOD, 'day'); fill('wb-su', BYTES, 'KB');
  fill('hs-uu', BYTES, 'GB'); fill('hs-bu', RATE, 'mb');
  const sig = C.sig;
  const sym = (u) => u[1].replace(/^.*\((.*)\)$/, '$1');
  const posNum = (id) => { const v = C.num(id); return v !== null && Number.isFinite(v) && v >= 0 ? v : null; };

  // ---- Data unit converter ----
  function convert() {
    const out = 'cv-result', v = C.num('cv-v');
    if (v === null || !Number.isFinite(v) || v < 0) return C.error(out, 'Enter an amount of data, 0 or more.');
    const u = DB[el('cv-u').value], bits = v * u[2];
    if (!Number.isFinite(bits)) return C.error(out, 'That is too large to convert.');
    let html = `<p style="font-size:15px;margin:0 0 10px;"><strong>${sig(v)} ${sym(u)}</strong> is equivalent to:</p>`;
    DATA.forEach((d) => { if (d[0] !== u[0]) html += C.row(d[1], sig(bits / d[2])); });
    el(out).innerHTML = html;
  }

  // ---- Time text ----
  function timeText(t) {
    if (t < 1e-3) return `${sig(t)} seconds`;
    if (t < 60) return `${C.dec(t, 3)} second${C.dec(t, 3) === '1' ? '' : 's'}`;
    let s = Math.round(t);
    const d = Math.floor(s / DAY), h = Math.floor((s % DAY) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const parts = [];
    if (d) parts.push(C.plural(d, 'day'));
    if (h) parts.push(C.plural(h, 'hour'));
    if (m) parts.push(C.plural(m, 'minute'));
    if (sec) parts.push(C.plural(sec, 'second'));
    return parts.join(' ');
  }

  // ---- Download or upload time ----
  function download() {
    const out = 'dl-result', size = posNum('dl-s'), bw = posNum('dl-b');
    if (size === null) return C.error(out, 'Enter the file size, 0 or more.');
    if (bw === null || bw === 0) return C.error(out, 'Enter the bandwidth, more than 0.');
    const t = (size * DB[el('dl-su').value][2]) / (bw * RB[el('dl-bu').value][2]);
    if (!Number.isFinite(t) || t > 1e15) return C.error(out, 'That is too large to calculate.');
    el(out).innerHTML = C.big('Download or upload time', timeText(t)) + C.row('Total seconds', sig(t)) + C.row('Total minutes', sig(t / 60)) + C.row('Total hours', sig(t / 3600)) +
      C.note('This is the best case. Real transfers are slower because of protocol overhead, shared connections and server limits.');
  }

  // ---- Website bandwidth ----
  function website() {
    const out = 'wb-result', pv = posNum('wb-v'), ps = posNum('wb-s'), rf = C.num('wb-r');
    if (pv === null) return C.error(out, 'Enter the number of page views, 0 or more.');
    if (ps === null) return C.error(out, 'Enter the average page size, 0 or more.');
    if (rf === null || !Number.isFinite(rf) || rf <= 0) return C.error(out, 'Enter the redundancy factor, more than 0. Use 1 for none.');
    const bitsPerSec = (pv * ps * DB[el('wb-su').value][2]) / PB[el('wb-pu').value][2];
    const bitsPerMonth = bitsPerSec * MONTH;
    if (!Number.isFinite(bitsPerMonth) || bitsPerMonth * rf > 1e30) return C.error(out, 'That is too large to calculate.');
    const GB = 8e9;
    let html = C.big(rf === 1 ? 'Bandwidth needed' : `Bandwidth needed (redundancy ${sig(rf)})`, `${sig((bitsPerSec * rf) / 1e6)} Mbit/s`, `or ${sig((bitsPerMonth * rf) / GB)} GB per month`);
    if (rf !== 1) html += C.row('Actual bandwidth', `${sig(bitsPerSec / 1e6)} Mbit/s`) + C.row('Actual data per month', `${sig(bitsPerMonth / GB)} GB`);
    el(out).innerHTML = html + C.note('Include search engine bots and other automated traffic in your page views, since they can use more bandwidth than visitors.');
  }

  // ---- Hosting bandwidth converter ----
  function hosting() {
    const out = 'hs-result', usage = C.num('hs-u'), bw = C.num('hs-b');
    const bad = (v) => v !== null && (!Number.isFinite(v) || v < 0);
    if (bad(usage) || bad(bw)) return C.error(out, 'Enter numbers that are 0 or more.');
    const uu = DB[el('hs-uu').value], bu = RB[el('hs-bu').value];
    if (usage !== null) {
      const r = (usage * uu[2]) / MONTH / bu[2];
      if (!Number.isFinite(r)) return C.error(out, 'That is too large to calculate.');
      el(out).innerHTML = C.big(`${sig(usage)} ${sym(uu)} per month is`, `${sig(r)} ${bu[1]}`) + (bw !== null ? C.note('Both boxes are filled in, so the monthly usage was used. Clear it to convert from the bandwidth instead.') : '');
    } else if (bw !== null) {
      const r = (bw * bu[2] * MONTH) / uu[2];
      if (!Number.isFinite(r)) return C.error(out, 'That is too large to calculate.');
      el(out).innerHTML = C.big(`${sig(bw)} ${bu[1]} is`, `${sig(r)} ${sym(uu)} per month`);
    } else C.error(out, 'Enter either the monthly usage or the bandwidth.');
  }

  [['cv-form', convert], ['dl-form', download], ['wb-form', website], ['hs-form', hosting]].forEach(([id, fn]) => {
    el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); });
    el(id).addEventListener('input', fn);
    el(id).addEventListener('change', fn);
    fn();
  });
})();
