'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('pwgen-form');
  if (!form) return;

  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
  const AMBIGUOUS = /[iIl1Lo0O`'\-_":;.,|]/;
  const BRACKETS = /[<>()[\]{}]/;

  function secureRandomInt(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function buildCharset() {
    let charset = '';
    if (el('pwgen-lower').checked) charset += LOWER;
    if (el('pwgen-upper').checked) charset += UPPER;
    if (el('pwgen-numbers').checked) charset += NUMBERS;
    if (el('pwgen-symbols').checked) charset += SYMBOLS;
    if (el('pwgen-exclude-ambiguous').checked) charset = charset.split('').filter((c) => !AMBIGUOUS.test(c)).join('');
    if (el('pwgen-exclude-brackets').checked) charset = charset.split('').filter((c) => !BRACKETS.test(c)).join('');
    return [...new Set(charset.split(''))];
  }

  function entropyBits(length, charsetSize) {
    return length * Math.log2(charsetSize);
  }

  function strengthLabel(bits) {
    if (bits < 28) return 'Very Weak';
    if (bits < 36) return 'Weak';
    if (bits < 60) return 'Reasonable';
    if (bits < 128) return 'Strong';
    return 'Very Strong';
  }

  function generate() {
    const length = parseInt(el('pwgen-length').value, 10);
    const noRepeats = el('pwgen-no-repeat').checked;
    const resultEl = el('pwgen-result');
    const charset = buildCharset();

    if (!length || length < 1) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a password length of at least 1.</p>';
      return;
    }
    if (charset.length === 0) {
      resultEl.innerHTML = '<p class="tool-result is-error">Select at least one character type to include.</p>';
      return;
    }
    if (noRepeats && length > charset.length) {
      resultEl.innerHTML = '<p class="tool-result is-error">Can\'t generate a ' + length + '-character password with no repeats from only ' + charset.length + ' available characters.</p>';
      return;
    }

    let password = '';
    if (noRepeats) {
      const pool = [...charset];
      for (let i = 0; i < length; i++) {
        const idx = secureRandomInt(pool.length);
        password += pool[idx];
        pool.splice(idx, 1);
      }
    } else {
      for (let i = 0; i < length; i++) {
        password += charset[secureRandomInt(charset.length)];
      }
    }

    const bits = entropyBits(length, charset.length);

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Generated Password</div>
        <div class="value" id="pwgen-password" style="font-family:monospace; word-break:break-all;">${password}</div>
      </div>
      <div class="stat-row"><span>Password Entropy</span><strong>${bits.toFixed(1)} bits</strong></div>
      <div class="stat-row"><span>Strength</span><strong>${strengthLabel(bits)}</strong></div>
      <button type="button" class="calc-submit-btn" id="pwgen-copy-btn" style="margin-top:12px;">Copy Password</button>
    `;

    el('pwgen-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(password).then(() => {
        el('pwgen-copy-btn').textContent = 'Copied!';
        setTimeout(() => { el('pwgen-copy-btn').textContent = 'Copy Password'; }, 1500);
      });
    });
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); generate(); });
  form.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach((i) => i.addEventListener('input', generate));
  generate();
})();
