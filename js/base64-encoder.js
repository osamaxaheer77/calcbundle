'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const encodeForm = el('b64-encode-form');
  if (encodeForm) {
    function calcEncode() {
      const input = el('b64-encode-input').value;
      const resultEl = el('b64-encode-result');
      if (input === '') {
        resultEl.innerHTML = '';
        return;
      }
      try {
        resultEl.innerHTML = `<textarea readonly class="unit-select" style="width:100%; min-height:80px; font-family:monospace;">${utf8ToBase64(input)}</textarea>`;
      } catch (err) {
        resultEl.innerHTML = '<p class="tool-result is-error">Could not encode this text.</p>';
      }
    }
    encodeForm.addEventListener('submit', (e) => e.preventDefault());
    el('b64-encode-input').addEventListener('input', calcEncode);
    el('b64-encode-input').value = 'Hello, CalcBundle!';
    calcEncode();
  }

  const decodeForm = el('b64-decode-form');
  if (decodeForm) {
    function calcDecode() {
      const input = el('b64-decode-input').value.trim();
      const resultEl = el('b64-decode-result');
      if (input === '') {
        resultEl.innerHTML = '';
        return;
      }
      try {
        resultEl.innerHTML = `<textarea readonly class="unit-select" style="width:100%; min-height:80px; font-family:monospace;">${base64ToUtf8(input)}</textarea>`;
      } catch (err) {
        resultEl.innerHTML = '<p class="tool-result is-error">That doesn\'t look like valid Base64 text.</p>';
      }
    }
    decodeForm.addEventListener('submit', (e) => e.preventDefault());
    el('b64-decode-input').addEventListener('input', calcDecode);
    el('b64-decode-input').value = 'SGVsbG8sIENhbGNCdW5kbGUh';
    calcDecode();
  }
})();
