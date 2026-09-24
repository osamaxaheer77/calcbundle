'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('log-form');
  if (!form) return;

  function parseBase(str) {
    if (!str) return null;
    const trimmed = str.trim().toLowerCase();
    if (trimmed === 'e') return Math.E;
    const v = parseFloat(trimmed);
    return Number.isFinite(v) ? v : null;
  }

  function num(id) {
    const field = el(id);
    if (!field || field.value.trim() === '') return null;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return 'undefined';
    return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
  }

  function calculate() {
    const baseStr = el('log-base').value.trim();
    const base = baseStr === '' ? null : parseBase(baseStr);
    const x = num('log-x');
    const y = num('log-y');
    const filled = [base, x, y].filter((v) => v !== null).length;

    if (filled < 2) {
      el('log-result-box').innerHTML = '<p class="tool-result is-error">Enter any two of the three values (base, argument, result).</p>';
      return;
    }
    if (baseStr !== '' && base === null) {
      el('log-result-box').innerHTML = '<p class="tool-result is-error">Base must be a number, or "e".</p>';
      return;
    }

    let answer, label;
    const baseLabel = baseStr.toLowerCase() === 'e' ? 'e' : fmt(base);

    if (y === null) {
      if (base <= 0 || base === 1 || x <= 0) {
        el('log-result-box').innerHTML = '<p class="tool-result is-error">The base must be positive and not 1, and the argument must be positive.</p>';
        return;
      }
      answer = Math.log(x) / Math.log(base);
      label = `log<sub>${baseLabel}</sub>(${fmt(x)}) = <strong>${fmt(answer)}</strong>`;
    } else if (x === null) {
      if (base <= 0 || base === 1) {
        el('log-result-box').innerHTML = '<p class="tool-result is-error">The base must be positive and not equal to 1.</p>';
        return;
      }
      answer = Math.pow(base, y);
      label = `log<sub>${baseLabel}</sub>(x) = ${fmt(y)} &rarr; x = <strong>${fmt(answer)}</strong>`;
    } else {
      if (x <= 0 || x === 1 || y === 0) {
        el('log-result-box').innerHTML = '<p class="tool-result is-error">Solving for the base requires a positive argument (not 1) and a nonzero result.</p>';
        return;
      }
      answer = Math.pow(x, 1 / y);
      label = `log<sub>b</sub>(${fmt(x)}) = ${fmt(y)} &rarr; b = <strong>${fmt(answer)}</strong>`;
    }

    el('log-result-box').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Result</div>
        <div class="value">${fmt(answer)}</div>
      </div>
      <p class="tool-result" style="margin-top:12px;">${label}</p>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
