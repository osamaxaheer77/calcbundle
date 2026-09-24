'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('tz-form');
  if (!form) return;

  function tzOffsetMinutes(date, timeZone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const parts = dtf.formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
    const hour = parts.hour === '24' ? '00' : parts.hour;
    const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
    return (asUTC - date.getTime()) / 60000;
  }

  function zoneLabel(timeZone, date) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(date);
    const abbr = parts.find((p) => p.type === 'timeZoneName');
    return abbr ? abbr.value : timeZone;
  }

  function calculate() {
    const dateVal = el('tz-date').value;
    const timeVal = el('tz-time').value || '00:00';
    const fromZone = el('tz-from').value;
    const toZone = el('tz-to').value;
    const resultEl = el('tz-result');

    if (!dateVal) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a date.</p>';
      return;
    }

    const [y, mo, d] = dateVal.split('-').map(Number);
    const [h, mi] = timeVal.split(':').map(Number);

    const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));
    const fromOffset = tzOffsetMinutes(guess, fromZone);
    const utc = new Date(guess.getTime() - fromOffset * 60000);

    const dateFmt = new Intl.DateTimeFormat('en-US', { timeZone: toZone, month: 'long', day: 'numeric', year: 'numeric' }).format(utc);
    const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: toZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(utc);
    const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: toZone, weekday: 'long' }).format(utc);

    const toOffset = tzOffsetMinutes(utc, toZone);
    const diffMinutes = toOffset - fromOffset;
    const diffHours = diffMinutes / 60;
    const diffLabel = diffHours === 0 ? 'Same time' : `${diffHours > 0 ? '+' : ''}${diffHours} hours`;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${zoneLabel(toZone, utc)} Time</div>
        <div class="value">${dateFmt}, ${timeFmt}</div>
      </div>
      <div class="stat-row"><span>Day of week</span><strong>${weekdayFmt}</strong></div>
      <div class="stat-row"><span>Difference from origin</span><strong>${diffLabel}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('change', calculate));
  calculate();
})();
