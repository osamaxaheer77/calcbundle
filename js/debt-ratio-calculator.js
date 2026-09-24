'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('dti-form');
  if (!form) return;

  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function monthlyPIFactor(annualRatePct, termYears) {
    const r = annualRatePct / 100 / 12;
    const n = termYears * 12;
    if (r === 0) return 1 / n;
    return r / (1 - Math.pow(1 + r, -n));
  }

  function monthlyAmount(id) {
    const val = parseFloat(el(`${id}-amt`).value) || 0;
    const mode = el(`${id}-mode`).value;
    return mode === 'year' ? val / 12 : val;
  }

  const INCOME_IDS = ['salary', 'pension', 'investment', 'otherincome'];
  const HOUSE_DEBT_IDS = ['rental', 'mortgage', 'propertytax', 'hoa', 'insurance'];
  const OTHER_DEBT_IDS = ['creditcards', 'studentloan', 'autoloan', 'otherloan'];

  function calculate() {
    const monthlyIncome = INCOME_IDS.reduce((s, id) => s + monthlyAmount(id), 0);
    if (!(monthlyIncome > 0)) {
      el('dti-result').innerHTML = '<p class="tool-result is-error">Enter at least one source of income.</p>';
      return;
    }

    const houseMonthly = HOUSE_DEBT_IDS.reduce((s, id) => s + monthlyAmount(id), 0);
    const otherMonthly = OTHER_DEBT_IDS.reduce((s, id) => s + monthlyAmount(id), 0);
    const totalDebtMonthly = houseMonthly + otherMonthly;

    const backEnd = totalDebtMonthly / monthlyIncome * 100;
    const frontEnd = houseMonthly / monthlyIncome * 100;
    const remainingPct = Math.max(100 - (frontEnd + (otherMonthly / monthlyIncome * 100)), 0);
    const otherPct = otherMonthly / monthlyIncome * 100;

    let tierMsg, tierClass;
    if (backEnd < 36) { tierMsg = 'Your DTI ratio is good.'; tierClass = 'good'; }
    else if (backEnd < 50) { tierMsg = "Your DTI ratio is in the mid-range. While it is not considered low, certain actions can be taken to lower it."; tierClass = 'mid'; }
    else { tierMsg = 'Your DTI ratio is high, and may put you in more financially-risky situations. We recommend taking actions to lower it.'; tierClass = 'high'; }

    let houseNote;
    const targetHousing = 0.36 * monthlyIncome - otherMonthly;
    if (backEnd <= 36) {
      const rate = 7.047, term = 30, downPct = 20, taxInsPct = 2;
      const piFactor = monthlyPIFactor(rate, term);
      const a = 1 - downPct / 100;
      const slope = a * piFactor + taxInsPct / 1200;
      const price = targetHousing / slope;
      houseNote = `<div class="callout">If you plan to buy a house after clearing any existing rent or mortgage, you could spend up to ${currency(targetHousing)} per month on the new house — equivalent to a house valued up to ${currency(price)}, assuming a 30-year conventional loan at 7.047% with 20% down and roughly 2% spent on property tax and insurance.</div>`;
    } else {
      houseNote = `<div class="callout">With your current income and debt level, you likely would not qualify for a conventional mortgage, which typically caps back-end DTI at 36%. Paying down existing debt would improve your odds.</div>`;
    }

    el('dti-result').innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Debt-to-Income (DTI) Ratio</div>
        <div class="value">${backEnd.toFixed(0)}%</div>
      </div>
      <p class="headline-sub dti-tier dti-tier-${tierClass}">${tierMsg}</p>
      <div class="stat-row"><span>Back-End DTI Ratio</span><strong>${backEnd.toFixed(0)}%</strong></div>
      <div class="stat-row"><span>Front-End DTI Ratio</span><strong>${frontEnd.toFixed(0)}%</strong></div>
      <div class="stat-row"><span>Total Income</span><strong>${currency(monthlyIncome)} / month</strong></div>
      <div class="stat-row"><span>Total Debt</span><strong>${currency(totalDebtMonthly)} / month</strong></div>
      <div class="subsection-title">Income Breakdown</div>
      <div class="dti-bar-track">
        <div class="dti-bar-seg dti-seg-house" style="width:${frontEnd}%;" title="House Debts/Expenses ${frontEnd.toFixed(0)}%"></div>
        <div class="dti-bar-seg dti-seg-other" style="width:${otherPct}%;" title="Other Debts/Expenses ${otherPct.toFixed(0)}%"></div>
        <div class="dti-bar-seg dti-seg-remain" style="width:${remainingPct}%;" title="Remaining ${remainingPct.toFixed(0)}%"></div>
      </div>
      <div class="dti-bar-legend">
        <span><span class="legend-dot" style="background:var(--accent)"></span> House Debts/Expenses ${frontEnd.toFixed(0)}%</span>
        <span><span class="legend-dot" style="background:#f59e0b"></span> Other Debts/Expenses ${otherPct.toFixed(0)}%</span>
        <span><span class="legend-dot" style="background:#e5e7eb"></span> Remaining ${remainingPct.toFixed(0)}%</span>
      </div>
      ${houseNote}
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
