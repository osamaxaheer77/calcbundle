'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  if (!el('hx-form')) return;

  const error = (id, msg) => { el(id).innerHTML = `<p class="tool-result is-error">${msg}</p>`; };
  const grp = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v) => (v < 0n ? '-' : '') + grp((v < 0n ? -v : v).toString());
  const hex = (v) => (v < 0n ? '-' : '') + (v < 0n ? -v : v).toString(16).toUpperCase();

  function parseHex(s) {
    const t = s.trim().replace(/\s+/g, '').replace(/^(-?)0x/i, '$1');
    if (!/^-?[0-9a-fA-F]+$/.test(t)) return null;
    const neg = t[0] === '-';
    const v = BigInt('0x' + t.replace('-', ''));
    return neg ? -v : v;
  }
  const row = (l, v) => `<div class="stat-row" style="display:block;overflow-wrap:anywhere;"><span>${l}</span><br><strong>${v}</strong></div>`;
  const BAD = 'Enter hex numbers using the digits 0 to 9 and the letters A to F, with an optional minus sign.';

  function operate() {
    const a = parseHex(el('hx-a').value), b = parseHex(el('hx-b').value);
    if (a === null || b === null) return error('hx-result', BAD);
    const op = el('hx-op').value;
    const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];
    let main, decimalText;
    if (op === '/') {
      if (b === 0n) return error('hx-result', 'Division by zero is not possible.');
      const q = a / b, r = a % b;
      main = `${hex(q)}, remainder ${hex(r)}`;
      decimalText = `${dec(a)} ${sym} ${dec(b)} = ${dec(q)}, remainder ${dec(r)}`;
    } else {
      const r = op === '+' ? a + b : op === '-' ? a - b : a * b;
      main = hex(r);
      decimalText = `${dec(a)} ${sym} ${dec(b)} = ${dec(r)}`;
    }
    el('hx-result').innerHTML =
      `<div class="summary-payment-box"><div class="label">Hex result</div><div class="value" style="font-size:22px;overflow-wrap:anywhere;">${main}</div></div>` +
      row('Hex', `${hex(a)} ${sym} ${hex(b)}`) + row('Decimal', decimalText);
  }

  function toDecimal() {
    const v = parseHex(el('h2d-in').value);
    if (v === null) return error('h2d-result', BAD);
    el('h2d-result').innerHTML = `<div class="summary-payment-box"><div class="label">Decimal value</div><div class="value" style="overflow-wrap:anywhere;">${dec(v)}</div></div>`;
  }

  function toHex() {
    const t = el('d2h-in').value.trim().replace(/,/g, '');
    if (!/^-?\d+$/.test(t)) return error('d2h-result', 'Enter a whole decimal number, such as 170 or -255.');
    el('d2h-result').innerHTML = `<div class="summary-payment-box"><div class="label">Hexadecimal value</div><div class="value" style="overflow-wrap:anywhere;">${hex(BigInt(t))}</div></div>`;
  }

  el('hx-form').addEventListener('submit', (e) => { e.preventDefault(); operate(); });
  el('h2d-form').addEventListener('submit', (e) => { e.preventDefault(); toDecimal(); });
  el('d2h-form').addEventListener('submit', (e) => { e.preventDefault(); toHex(); });
  el('hx-op').addEventListener('change', operate);
  operate(); toDecimal(); toHex();
})();
