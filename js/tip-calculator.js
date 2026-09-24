'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('tip-form');
  if (!form) return;

  const money = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  function calculate() {
    const bill = parseFloat(el('tip-bill').value);
    const tipPct = parseFloat(el('tip-percent').value);
    const people = parseInt(el('tip-people').value, 10) || 1;
    const resultEl = el('tip-result');

    if (isNaN(bill) || bill < 0 || isNaN(tipPct) || tipPct < 0) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid bill amount and tip percentage.</p>';
      return;
    }

    const tipAmount = bill * (tipPct / 100);
    const total = bill + tipAmount;
    const tipPerPerson = tipAmount / people;
    const totalPerPerson = total / people;

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Tip Amount</div>
        <div class="value">${money(tipAmount)}</div>
      </div>
      <div class="stat-row"><span>Total Bill</span><strong>${money(total)}</strong></div>
      ${people > 1 ? `
        <div class="stat-row"><span>Tip Per Person</span><strong>${money(tipPerPerson)}</strong></div>
        <div class="stat-row"><span>Total Per Person</span><strong>${money(totalPerPerson)}</strong></div>
      ` : ''}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
