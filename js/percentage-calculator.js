'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  function num(id, fallback = null) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function fmt(n) {
    return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }

  /* ---------- Calc 1: P% of V1 = V2 ---------- */
  const form1 = el('pct1-form');
  if (form1) {
    function calc1() {
      const p = num('pct1-p');
      const v1 = num('pct1-v1');
      const v2 = num('pct1-v2');
      const filled = [p, v1, v2].filter((v) => v !== null).length;
      if (filled < 2) {
        el('pct1-result').innerHTML = '<p class="tool-result is-error">Enter any two of the three values.</p>';
        return;
      }
      let result, label;
      if (p === null) {
        if (v1 === 0) { el('pct1-result').innerHTML = '<p class="tool-result is-error">Value 1 can\'t be zero.</p>'; return; }
        result = v2 / v1 * 100;
        label = `${fmt(v2)} is <strong>${fmt(result)}%</strong> of ${fmt(v1)}`;
      } else if (v1 === null) {
        if (p === 0) { el('pct1-result').innerHTML = '<p class="tool-result is-error">Percentage can\'t be zero.</p>'; return; }
        result = v2 / (p / 100);
        label = `${fmt(v2)} is ${fmt(p)}% of <strong>${fmt(result)}</strong>`;
      } else {
        result = (p / 100) * v1;
        label = `${fmt(p)}% of ${fmt(v1)} is <strong>${fmt(result)}</strong>`;
      }
      el('pct1-result').innerHTML = `<div class="summary-payment-box"><div class="label">Result</div><div class="value">${fmt(result)}</div></div><p class="tool-result" style="margin-top:12px;">${label}</p>`;
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Calc 2: Percentage Difference ---------- */
  const form2 = el('pct2-form');
  if (form2) {
    function calc2() {
      const v1 = num('pct2-v1', 0);
      const v2 = num('pct2-v2', 0);
      if (v1 === 0 && v2 === 0) {
        el('pct2-result').innerHTML = '<p class="tool-result is-error">Values can\'t both be zero.</p>';
        return;
      }
      const diff = Math.abs(v1 - v2) / ((v1 + v2) / 2) * 100;
      el('pct2-result').innerHTML = `<div class="summary-payment-box"><div class="label">Percentage Difference</div><div class="value">${fmt(diff)}%</div></div>`;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }

  /* ---------- Calc 3: Percentage Change (increase/decrease) ---------- */
  const form3 = el('pct3-form');
  if (form3) {
    function calc3() {
      const base = num('pct3-base', 0);
      const pct = num('pct3-pct', 0);
      const type = el('pct3-type').value;
      const result = type === 'increase' ? base * (1 + pct / 100) : base * (1 - pct / 100);
      el('pct3-result').innerHTML = `<div class="summary-payment-box"><div class="label">Result</div><div class="value">${fmt(result)}</div></div><p class="tool-result" style="margin-top:12px;">${fmt(base)} ${type}d by ${fmt(pct)}% is <strong>${fmt(result)}</strong></p>`;
    }
    form3.addEventListener('submit', (e) => { e.preventDefault(); calc3(); });
    calc3();
  }
})();
