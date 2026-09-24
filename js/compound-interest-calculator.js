'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('ci-form');
  if (!form) return;

  const COMPOUND_N = { annually: 1, semiannually: 2, quarterly: 4, monthly: 12, semimonthly: 24, biweekly: 26, weekly: 52, daily: 365 };

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }

  function effectiveAnnual(ratePct, compoundKey) {
    if (compoundKey === 'continuously') return Math.exp(ratePct / 100) - 1;
    const cN = COMPOUND_N[compoundKey];
    return Math.pow(1 + ratePct / 100 / cN, cN) - 1;
  }

  function nominalFromEffective(effAnnual, compoundKey) {
    if (compoundKey === 'continuously') return Math.log(1 + effAnnual) * 100;
    const cN = COMPOUND_N[compoundKey];
    return (Math.pow(1 + effAnnual, 1 / cN) - 1) * cN * 100;
  }

  function calculate() {
    const rate = num('ci-rate', 0);
    const inCompound = el('ci-in-compound').value;
    const outCompound = el('ci-out-compound').value;

    const effAnnual = effectiveAnnual(rate, inCompound);
    const outputRate = nominalFromEffective(effAnnual, outCompound);

    el('ci-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Equivalent Rate</div>
        <div class="value">${outputRate.toFixed(5)}%</div>
      </div>
      <div class="stat-row"><span>Input Rate</span><strong>${rate}% (${inCompound})</strong></div>
      <div class="stat-row"><span>Effective Annual Rate</span><strong>${(effAnnual * 100).toFixed(5)}%</strong></div>
      <div class="stat-row"><span>Output Rate</span><strong>${outputRate.toFixed(5)}% (${outCompound})</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  el('ci-in-compound').addEventListener('change', calculate);
  el('ci-out-compound').addEventListener('change', calculate);
  calculate();
})();
