'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rng-form');
  if (!form) return;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomDecimal(min, max, precision) {
    const v = Math.random() * (max - min) + min;
    return parseFloat(v.toFixed(precision));
  }

  function generate() {
    const lower = num('rng-lower', 1);
    const upper = num('rng-upper', 100);
    const count = Math.max(1, Math.min(10000, Math.round(num('rng-count', 1))));
    const allowDup = form.querySelector('input[name="rng-dup"]:checked').value === 'y';
    const sort = form.querySelector('input[name="rng-sort"]:checked').value;
    const type = form.querySelector('input[name="rng-type"]:checked').value;
    const precision = Math.max(0, Math.min(20, Math.round(num('rng-precision', 2))));

    if (lower > upper) {
      el('rng-result').innerHTML = '<p class="tool-result is-error">Lower limit must be less than or equal to the upper limit.</p>';
      return;
    }

    if (type === 'i' && !allowDup) {
      const rangeSize = Math.floor(upper) - Math.ceil(lower) + 1;
      if (rangeSize < count) {
        el('rng-result').innerHTML = `<p class="tool-result is-error">Can't generate ${count} unique integers from a range that only contains ${rangeSize} values.</p>`;
        return;
      }
    }

    let results = [];
    if (type === 'i') {
      const lo = Math.ceil(lower), hi = Math.floor(upper);
      if (allowDup) {
        for (let i = 0; i < count; i++) results.push(randomInt(lo, hi));
      } else {
        const pool = [];
        for (let v = lo; v <= hi; v++) pool.push(v);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        results = pool.slice(0, count);
      }
    } else {
      for (let i = 0; i < count; i++) results.push(randomDecimal(lower, upper, precision));
      if (!allowDup) {
        // Decimal duplicates are astronomically unlikely at any real precision; re-roll any exact collisions.
        const seen = new Set();
        results = results.map((v) => {
          let val = v, tries = 0;
          while (seen.has(val) && tries < 20) { val = randomDecimal(lower, upper, precision); tries++; }
          seen.add(val);
          return val;
        });
      }
    }

    if (sort === 'a') results.sort((a, b) => a - b);
    else if (sort === 'd') results.sort((a, b) => b - a);

    const display = results.map((v) => v.toLocaleString('en-US', { maximumFractionDigits: 20 }));

    el('rng-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">${count === 1 ? 'Random Number' : `${count} Random Numbers`}</div>
        <div class="value" style="font-size:${count === 1 ? '32px' : '18px'};word-break:break-word;">${count === 1 ? display[0] : display.join(', ')}</div>
      </div>
    `;
  }

  function updateVisibility() {
    const type = form.querySelector('input[name="rng-type"]:checked').value;
    el('rng-precision-field').hidden = type !== 'd';
  }

  form.querySelectorAll('input[name="rng-type"]').forEach((r) => r.addEventListener('change', updateVisibility));
  form.addEventListener('submit', (e) => { e.preventDefault(); generate(); });

  updateVisibility();
  generate();
})();
