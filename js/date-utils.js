'use strict';

// Date and time helpers shared by the Hours, Time Duration, Time Card, Day Counter and Day of the Week calculators.
window.DateUtils = (function () {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pad = (n) => String(n).padStart(2, '0');
  const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const plural = (n, w) => `${group(n)} ${w}${n === 1 ? '' : 's'}`;

  const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const daysInMonth = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

  // Days since 1970-01-01 in the proleptic Gregorian calendar (works for any year).
  function toDays(y, m, d) {
    y -= m <= 2 ? 1 : 0;
    const era = Math.floor(y / 400), yoe = y - era * 400;
    const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
    const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function fromDays(z) {
    z += 719468;
    const era = Math.floor(z / 146097), doe = z - era * 146097;
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153);
    const d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
    return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
  }
  const weekday = (z) => (((z + 4) % 7) + 7) % 7; // 0 = Sunday
  const nameOf = (z) => { const c = fromDays(z); return `${MONTHS[c.m - 1].slice(0, 3)} ${c.d}, ${c.y}`; };
  const longName = (z) => { const c = fromDays(z); return `${MONTHS[c.m - 1]} ${c.d}, ${c.y}`; };

  // Reads a yyyy-mm-dd value from <input type="date">. Returns days since 1970 or null.
  function parseIso(s) {
    const m = /^(\d{1,6})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo) || y < 1) return null;
    return toDays(y, mo, d);
  }
  function toIso(z) { const c = fromDays(z); return `${String(c.y).padStart(4, '0')}-${pad(c.m)}-${pad(c.d)}`; }
  function todayDays() { const t = new Date(); return toDays(t.getFullYear(), t.getMonth() + 1, t.getDate()); }

  // Parses "8", "8:30" or "8:30:15" with an AM/PM flag ('a' or 'p'). Hours above 12 are read as 24-hour time.
  // Returns seconds since midnight, or null when the text is not a valid time.
  function parseClock(text, ampm) {
    const t = String(text).trim();
    if (!/^\d{1,2}(:\d{1,2}){0,2}$/.test(t)) return null;
    const p = t.split(':').map(Number);
    const h = p[0], mi = p[1] || 0, s = p[2] || 0;
    if (mi > 59 || s > 59 || h > 23) return null;
    let hour = h;
    if (h <= 12 && (ampm === 'a' || ampm === 'p')) {
      hour = h === 0 ? 0 : (h % 12) + (ampm === 'p' ? 12 : 0);
    }
    return hour * 3600 + mi * 60 + s;
  }
  function clockText(sec) {
    sec = ((sec % 86400) + 86400) % 86400;
    const h24 = Math.floor(sec / 3600), mi = Math.floor((sec % 3600) / 60), s = sec % 60;
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}:${pad(mi)}${s ? ':' + pad(s) : ''} ${h24 < 12 ? 'AM' : 'PM'}`;
  }
  // "9 hours, 15 minutes and 35 seconds" style text; zero parts are left out.
  function span(sec, units) {
    const parts = [];
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (units.days && d) parts.push(plural(d, 'day'));
    const hh = units.days ? h : Math.floor(sec / 3600);
    if (hh) parts.push(plural(hh, 'hour'));
    if (m) parts.push(plural(m, 'minute'));
    if (s) parts.push(plural(s, 'second'));
    if (!parts.length) return '0 minutes';
    return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }
  // A decimal number trimmed to at most `max` places, with thousands separators.
  function dec(v, max) {
    let s = v.toFixed(v > 0 && v < 0.01 ? Math.max(max, 6) : max);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '0' && v > 0) s = String(Number(v.toPrecision(3)));
    const [i, f] = s.split('.');
    return group(i) + (f ? '.' + f : '');
  }
  return { MONTHS, DAYS, pad, group, plural, isLeap, daysInMonth, toDays, fromDays, weekday, nameOf, longName, parseIso, toIso, todayDays, parseClock, clockText, span, dec };
})();
