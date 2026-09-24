'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pyth-form');
  if (!form) return;

  function num(id) {
    const field = el(id);
    if (!field || field.value.trim() === '') return null;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }

  function calculate() {
    const a = num('pyth-a');
    const b = num('pyth-b');
    const c = num('pyth-c');
    const filled = [a, b, c].filter((v) => v !== null).length;

    if (filled !== 2) {
      el('pyth-result').innerHTML = '<p class="tool-result is-error">Enter exactly two of the three sides.</p>';
      return;
    }
    if ([a, b, c].some((v) => v !== null && v <= 0)) {
      el('pyth-result').innerHTML = '<p class="tool-result is-error">All sides must be greater than 0.</p>';
      return;
    }

    let result, label, resultVar;
    if (c === null) {
      result = Math.sqrt(a * a + b * b);
      label = `c = &radic;(${fmt(a)}&sup2; + ${fmt(b)}&sup2;) = <strong>${fmt(result)}</strong>`;
      resultVar = 'c';
    } else if (b === null) {
      if (c <= a) {
        el('pyth-result').innerHTML = '<p class="tool-result is-error">The hypotenuse (c) must be longer than side a.</p>';
        return;
      }
      result = Math.sqrt(c * c - a * a);
      label = `b = &radic;(${fmt(c)}&sup2; - ${fmt(a)}&sup2;) = <strong>${fmt(result)}</strong>`;
      resultVar = 'b';
    } else {
      if (c <= b) {
        el('pyth-result').innerHTML = '<p class="tool-result is-error">The hypotenuse (c) must be longer than side b.</p>';
        return;
      }
      result = Math.sqrt(c * c - b * b);
      label = `a = &radic;(${fmt(c)}&sup2; - ${fmt(b)}&sup2;) = <strong>${fmt(result)}</strong>`;
      resultVar = 'a';
    }

    el('pyth-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Side ${resultVar}</div>
        <div class="value">${fmt(result)}</div>
      </div>
      <p class="tool-result" style="margin-top:12px;">${label}</p>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
