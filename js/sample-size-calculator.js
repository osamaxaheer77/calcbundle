'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const Z_SCORES = {
    '70': 1.04, '75': 1.15, '80': 1.28, '85': 1.44, '90': 1.65,
    '95': 1.96, '98': 2.33, '99': 2.58, '99.9': 3.29, '99.99': 3.89, '99.999': 4.42,
  };

  function num(id, fallback = null) {
    const field = el(id);
    if (!field || field.value.trim() === '') return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function fmt(n, dp = 2) {
    return n.toLocaleString('en-US', { maximumFractionDigits: dp });
  }

  /* ---------- Panel 1: Find Sample Size ---------- */
  const form1 = el('ss1-form');
  if (form1) {
    function calc1() {
      const z = Z_SCORES[el('ss1-cl').value];
      const marginPct = num('ss1-margin');
      const propPct = num('ss1-prop', 50);
      const popSize = num('ss1-pop');

      if (marginPct === null || marginPct <= 0 || marginPct >= 100 || propPct === null || propPct <= 0 || propPct >= 100) {
        el('ss1-result').innerHTML = '<p class="tool-result is-error">Enter a margin of error and population proportion between 0 and 100%.</p>';
        return;
      }

      const p = propPct / 100;
      const e = marginPct / 100;
      const n0 = (z * z * p * (1 - p)) / (e * e);
      let n = n0;
      if (popSize !== null && popSize > 0) {
        n = n0 / (1 + (n0 - 1) / popSize);
      }
      const sampleSize = Math.ceil(n);

      el('ss1-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Sample Size</div>
          <div class="value">${sampleSize.toLocaleString('en-US')}</div>
        </div>
        <p class="tool-result" style="margin-top:12px;">${sampleSize.toLocaleString('en-US')} or more measurements/surveys are needed to have a confidence level of ${el('ss1-cl').value}% that the real value is within &plusmn;${fmt(marginPct)}% of the measured/surveyed value.</p>
      `;
    }
    form1.addEventListener('submit', (e) => { e.preventDefault(); calc1(); });
    calc1();
  }

  /* ---------- Panel 2: Find Margin of Error ---------- */
  const form2 = el('ss2-form');
  if (form2) {
    function calc2() {
      const z = Z_SCORES[el('ss2-cl').value];
      const sampleSize = num('ss2-size');
      const propPct = num('ss2-prop');
      const popSize = num('ss2-pop');

      if (sampleSize === null || sampleSize <= 0 || propPct === null || propPct <= 0 || propPct >= 100) {
        el('ss2-result').innerHTML = '<p class="tool-result is-error">Enter a sample size and population proportion between 0 and 100%.</p>';
        return;
      }

      const p = propPct / 100;
      let n = sampleSize;
      let marginSq = (z * z * p * (1 - p)) / n;
      if (popSize !== null && popSize > 0) {
        marginSq = marginSq * (popSize - n) / (popSize - 1);
      }
      const margin = Math.sqrt(Math.max(marginSq, 0)) * 100;

      el('ss2-result').innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Margin of Error</div>
          <div class="value">${fmt(margin)}%</div>
        </div>
        <p class="tool-result" style="margin-top:12px;">There is a ${el('ss2-cl').value}% chance that the real value is within &plusmn;${fmt(margin)}% of the measured/surveyed value.</p>
      `;
    }
    form2.addEventListener('submit', (e) => { e.preventDefault(); calc2(); });
    calc2();
  }
})();
