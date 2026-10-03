'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('bn-form')) return;

  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const grp = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v) => (v < 0n ? '-' : '') + grp((v < 0n ? -v : v).toString());
  const bin = (v) => (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString(2);

  function parseBin(s) {
    const t = s.trim().replace(/\s+/g, '');
    if (!/^-?[01]+$/.test(t)) return null;
    const neg = t[0] === '-';
    const v = BigInt('0b' + t.replace('-', ''));
    return neg ? -v : v;
  }
  const row = (l, v) => `<div class="stat-row" style="display:block;overflow-wrap:anywhere;"><span>${l}</span><br><strong>${v}</strong></div>`;

  function operate() {
    const a = parseBin(el('bn-a').value), b = parseBin(el('bn-b').value);
    if (a === null || b === null) return error('bn-result', 'Enter binary numbers using only the digits 0 and 1, with an optional minus sign.');
    const op = el('bn-op').value;
    const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
    let main, decimalText;
    if (op === '/') {
      if (b === 0n) return error('bn-result', 'Division by zero is not possible.');
      const q = a / b, r = a % b;
      main = `${bin(q)}, remainder ${bin(r)}`;
      decimalText = `${dec(a)} ${sym} ${dec(b)} = ${dec(q)}, remainder ${dec(r)}`;
    } else {
      const r = op === '+' ? a + b : op === '-' ? a - b : a * b;
      main = bin(r);
      decimalText = `${dec(a)} ${sym} ${dec(b)} = ${dec(r)}`;
    }
    el('bn-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Binary result</div><div class="value" style="font-size:20px;overflow-wrap:anywhere;">${main}</div></div>` +
      row('Binary', `${bin(a)} ${sym} ${bin(b)}`) + row('Decimal', decimalText);
  }

  function toDecimal() {
    const v = parseBin(el('b2d-in').value);
    if (v === null) return error('b2d-result', 'Enter a binary number using only the digits 0 and 1, with an optional minus sign.');
    el('b2d-result').innerHTML = `<div class="summary-payment-box"><div class="label">Decimal value</div><div class="value" style="overflow-wrap:anywhere;">${dec(v)}</div></div>`;
  }

  function toBinary() {
    const t = el('d2b-in').value.trim().replace(/,/g, '');
    if (!/^-?\d+$/.test(t)) return error('d2b-result', 'Enter a whole decimal number, such as 170 or -45.');
    const v = BigInt(t);
    el('d2b-result').innerHTML = `<div class="summary-payment-box"><div class="label">Binary value</div><div class="value" style="font-size:20px;overflow-wrap:anywhere;">${bin(v)}</div></div>`;
  }

  el('bn-form').addEventListener('submit', (e) => { e.preventDefault(); operate(); });
  el('b2d-form').addEventListener('submit', (e) => { e.preventDefault(); toDecimal(); });
  el('d2b-form').addEventListener('submit', (e) => { e.preventDefault(); toBinary(); });
  el('bn-op').addEventListener('change', operate);
  operate(); toDecimal(); toBinary();
})();
