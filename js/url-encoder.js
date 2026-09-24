'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  const encodeForm = el('urlenc-encode-form');
  if (encodeForm) {
    function calcEncode() {
      const input = el('urlenc-encode-input').value;
      const resultEl = el('urlenc-encode-result');
      if (input === '') {
        resultEl.innerHTML = '';
        return;
      }
      resultEl.innerHTML = `<textarea readonly class="unit-select" style="width:100%; min-height:80px; font-family:monospace;">${encodeURIComponent(input)}</textarea>`;
    }
    encodeForm.addEventListener('submit', (e) => e.preventDefault());
    el('urlenc-encode-input').addEventListener('input', calcEncode);
    el('urlenc-encode-input').value = 'https://example.com/search?q=hello world&lang=en';
    calcEncode();
  }

  const decodeForm = el('urlenc-decode-form');
  if (decodeForm) {
    function calcDecode() {
      const input = el('urlenc-decode-input').value;
      const resultEl = el('urlenc-decode-result');
      if (input === '') {
        resultEl.innerHTML = '';
        return;
      }
      try {
        resultEl.innerHTML = `<textarea readonly class="unit-select" style="width:100%; min-height:80px; font-family:monospace;">${decodeURIComponent(input.replace(/\+/g, ' '))}</textarea>`;
      } catch (err) {
        resultEl.innerHTML = '<p class="tool-result is-error">That doesn\'t look like valid URL-encoded text.</p>';
      }
    }
    decodeForm.addEventListener('submit', (e) => e.preventDefault());
    el('urlenc-decode-input').addEventListener('input', calcDecode);
    el('urlenc-decode-input').value = 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den';
    calcDecode();
  }
})();
