'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('exp-form');
  if (!form) return;

  function num(id) {
    const field = el(id);
    if (!field) return null;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return 'NAN';
    return Math.abs(n) < 1e15 && Math.abs(n) > 1e-10 || n === 0
      ? n.toLocaleString('en-US', { maximumFractionDigits: 10 })
      : n.toExponential(6);
  }

  function calculate() {
    const useE = el('exp-use-e').checked;
    const base = useE ? Math.E : num('exp-base');
    const exponent = num('exp-exponent');
    const result = num('exp-result');
    const filled = [base, exponent, result].filter((v) => v !== null).length;

    if (filled < 2) {
      el('exp-result-box').innerHTML = '<p class="tool-result is-error">Enter any two of the three values.</p>';
      return;
    }

    let answer, label;
    if (result === null) {
      answer = Math.pow(base, exponent);
      label = `${useE ? 'e' : fmt(base)}<sup>${fmt(exponent)}</sup> = <strong>${fmt(answer)}</strong>`;
    } else if (exponent === null) {
      if (base <= 0 || base === 1) {
        el('exp-result-box').innerHTML = '<p class="tool-result is-error">Solving for the exponent requires a base greater than 0 and not equal to 1.</p>';
        return;
      }
      if (result <= 0) {
        el('exp-result-box').innerHTML = '<p class="tool-result is-error">Solving for the exponent requires a positive result with a positive base.</p>';
        return;
      }
      answer = Math.log(result) / Math.log(base);
      label = `${fmt(base)}<sup>x</sup> = ${fmt(result)} &rarr; x = <strong>${fmt(answer)}</strong>`;
    } else {
      if (base !== null) {
        el('exp-result-box').innerHTML = '<p class="tool-result is-error">Uncheck "use e as base" or clear the base field, since only two of the three values should be filled.</p>';
        return;
      }
      answer = Math.sign(result) * Math.pow(Math.abs(result), 1 / exponent);
      if (result < 0 && Number.isInteger(exponent) && exponent % 2 === 0) {
        el('exp-result-box').innerHTML = '<p class="tool-result is-error">NAN &mdash; no real base solves this (would require an imaginary number).</p>';
        return;
      }
      label = `x<sup>${fmt(exponent)}</sup> = ${fmt(result)} &rarr; x = <strong>${fmt(answer)}</strong>`;
    }

    el('exp-result-box').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Result</div>
        <div class="value">${fmt(answer)}</div>
      </div>
      <p class="tool-result" style="margin-top:12px;">${label}</p>
    `;
  }

  function updateVisibility() {
    const useE = el('exp-use-e').checked;
    el('exp-base').disabled = useE;
    if (useE) el('exp-base').value = '';
  }

  el('exp-use-e').addEventListener('change', () => { updateVisibility(); calculate(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });

  updateVisibility();
  calculate();
})();
