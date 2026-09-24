'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const VALUES = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  const ROMAN_VALUE = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

  function numberToRoman(num) {
    let result = '';
    let remaining = num;
    for (const [value, symbol] of VALUES) {
      while (remaining >= value) {
        result += symbol;
        remaining -= value;
      }
    }
    return result;
  }

  function romanToNumber(roman) {
    const chars = roman.toUpperCase().split('');
    let total = 0;
    for (let i = 0; i < chars.length; i++) {
      const current = ROMAN_VALUE[chars[i]];
      const next = ROMAN_VALUE[chars[i + 1]];
      if (current === undefined) return null;
      if (next && current < next) {
        total -= current;
      } else {
        total += current;
      }
    }
    return total;
  }

  const toRomanForm = el('roman-to-roman-form');
  if (toRomanForm) {
    function calcToRoman() {
      const input = el('roman-number-input').value.trim();
      const resultEl = el('roman-to-roman-result');
      const num = parseInt(input, 10);

      if (input === '' || isNaN(num)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a whole number.</p>';
        return;
      }
      if (num < 1 || num > 3999) {
        resultEl.innerHTML = '<p class="tool-result is-error">Standard Roman numerals only cover 1 to 3,999.</p>';
        return;
      }

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Roman Numeral</div>
          <div class="value">${numberToRoman(num)}</div>
        </div>
      `;
    }
    toRomanForm.addEventListener('submit', (e) => { e.preventDefault(); calcToRoman(); });
    el('roman-number-input').addEventListener('input', calcToRoman);
    calcToRoman();
  }

  const toNumberForm = el('roman-to-number-form');
  if (toNumberForm) {
    function calcToNumber() {
      const input = el('roman-text-input').value.trim();
      const resultEl = el('roman-to-number-result');

      if (input === '') {
        resultEl.innerHTML = '<p class="tool-result is-error">Enter a Roman numeral.</p>';
        return;
      }
      if (!/^[IVXLCDM]+$/i.test(input)) {
        resultEl.innerHTML = '<p class="tool-result is-error">Only the letters I, V, X, L, C, D, M are valid.</p>';
        return;
      }

      const num = romanToNumber(input);
      if (num === null || num <= 0 || numberToRoman(num) !== input.toUpperCase()) {
        resultEl.innerHTML = '<p class="tool-result is-error">That\'s not a valid Roman numeral.</p>';
        return;
      }

      resultEl.innerHTML = `
        <div class="summary-payment-box">
          <div class="label">Number</div>
          <div class="value">${num.toLocaleString('en-US')}</div>
        </div>
      `;
    }
    toNumberForm.addEventListener('submit', (e) => { e.preventDefault(); calcToNumber(); });
    el('roman-text-input').addEventListener('input', calcToNumber);
    calcToNumber();
  }
})();
