'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  function parseTime(str) {
    if (!str) return null;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }

  function fmtTime(totalMinutes) {
    let m = ((totalMinutes % 1440) + 1440) % 1440;
    let h = Math.floor(m / 60);
    const min = m % 60;
    const ampm = h < 12 ? 'AM' : 'PM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(min).padStart(2, '0')} ${ampm}`;
  }

  const cycleForm = el('sleep-cycle-form');
  if (cycleForm) {
    function calcCycle() {
      const mode = el('sleep-cycle-mode').value;
      const timeVal = parseTime(el('sleep-cycle-time').value);
      const cycleLength = parseFloat(el('sleep-cycle-length').value) || 90;
      const fallAsleep = parseFloat(el('sleep-cycle-fallasleep').value) || 0;
      const resultEl = el('sleep-cycle-result');

      if (timeVal === null) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a time.</p>';
        return;
      }

      const rows = [];
      for (let cycles = 6; cycles >= 1; cycles--) {
        const offset = cycles * cycleLength + fallAsleep;
        const resultTime = mode === 'wake' ? timeVal - offset : timeVal + offset;
        rows.push({ cycles, time: fmtTime(resultTime) });
      }

      const label = mode === 'wake' ? 'go to bed at' : 'wake up at';
      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Recommended times to ${label}</div>
        </div>
        ${rows.map((r) => `<div class="stat-row"><span>${r.cycles} sleep cycle${r.cycles === 1 ? '' : 's'} (${(r.cycles * cycleLength / 60).toFixed(1)}h)</span><strong>${r.time}${r.cycles === 5 || r.cycles === 6 ? ' &starf;' : ''}</strong></div>`).join('')}
        <div class="stat-row"><span></span><span style="font-size:0.85em;">&starf; = recommended (5&ndash;6 complete cycles)</span></div>
      `;
    }
    cycleForm.addEventListener('submit', (e) => { e.preventDefault(); calcCycle(); });
    cycleForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calcCycle));
    calcCycle();
  }

  const lengthForm = el('sleep-length-form');
  if (lengthForm) {
    function calcLength() {
      const mode = el('sleep-length-mode').value;
      const timeVal = parseTime(el('sleep-length-time').value);
      const hours = parseFloat(el('sleep-length-hours').value) || 0;
      const minutes = parseFloat(el('sleep-length-minutes').value) || 0;
      const resultEl = el('sleep-length-result');

      if (timeVal === null) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a time.</p>';
        return;
      }

      const durationMinutes = hours * 60 + minutes;
      const resultTime = mode === 'wake' ? timeVal - durationMinutes : timeVal + durationMinutes;
      const label = mode === 'wake' ? 'Go to bed at' : 'Wake up at';

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">${label}</div>
          <div class="value">${fmtTime(resultTime)}</div>
        </div>
      `;
    }
    lengthForm.addEventListener('submit', (e) => { e.preventDefault(); calcLength(); });
    lengthForm.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calcLength));
    calcLength();
  }
})();
