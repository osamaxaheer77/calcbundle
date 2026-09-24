'use strict';

/**
 * Mortgage math engine: month-by-month amortization simulation.
 * Handles extra payments (monthly/yearly/one-time) and annual cost
 * escalation, so the schedule reflects real payoff acceleration
 * rather than just the static formula.
 */
const MortgageMath = {
  monthlyPI(loanAmount, annualRatePct, termYears) {
    const r = annualRatePct / 100 / 12;
    const n = termYears * 12;
    if (r === 0) return loanAmount / n;
    const factor = Math.pow(1 + r, n);
    return (loanAmount * r * factor) / (factor - 1);
  },

  addMonths(year, month, count) {
    const total = (year * 12 + (month - 1)) + count;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  },

  monthDiff(y1, m1, y2, m2) {
    return (y2 - y1) * 12 + (m2 - m1);
  },

  /**
   * Runs the full month-by-month simulation.
   * startMonth/startYear: 1-12 / e.g. 2026
   * extra: { monthly: {amt, fromMonth, fromYear}, yearly: {amt, fromMonth, fromYear}, oneTime: {amt, month, year} }
   * increases: { propertyTax, insurance, hoa, other } as % per year
   */
  simulate(input) {
    const {
      loanAmount, annualRatePct, termYears, startMonth, startYear,
      propertyTaxAnnual, insuranceAnnual, pmiAnnual, hoaAnnual, otherAnnual,
      increases, extra,
    } = input;

    const monthlyRate = annualRatePct / 100 / 12;
    const n = termYears * 12;
    const basePI = this.monthlyPI(loanAmount, annualRatePct, termYears);

    let balance = loanAmount;
    let curTax = propertyTaxAnnual;
    let curIns = insuranceAnnual;
    let curHoa = hoaAnnual;
    let curOther = otherAnnual;

    const months = [];
    let totalInterest = 0;
    let totalExtra = 0;
    let pmiStopMonth = null;

    for (let m = 1; m <= n && balance > 0.005; m++) {
      const cursor = this.addMonths(startYear, startMonth, m - 1);

      if (m > 1 && (m - 1) % 12 === 0) {
        curTax *= 1 + (increases.propertyTax || 0) / 100;
        curIns *= 1 + (increases.insurance || 0) / 100;
        curHoa *= 1 + (increases.hoa || 0) / 100;
        curOther *= 1 + (increases.other || 0) / 100;
      }

      const interest = balance * monthlyRate;
      let principal = basePI - interest;

      let extraThisMonth = 0;
      if (extra.monthly && extra.monthly.amt > 0) {
        const startsAt = this.monthDiff(startYear, startMonth, extra.monthly.fromYear, extra.monthly.fromMonth);
        if (m - 1 >= startsAt) extraThisMonth += extra.monthly.amt;
      }
      if (extra.yearly && extra.yearly.amt > 0) {
        const startsAt = this.monthDiff(startYear, startMonth, extra.yearly.fromYear, extra.yearly.fromMonth);
        if (m - 1 >= startsAt && (m - 1 - startsAt) % 12 === 0) extraThisMonth += extra.yearly.amt;
      }
      if (extra.oneTime && extra.oneTime.amt > 0) {
        const at = this.monthDiff(startYear, startMonth, extra.oneTime.year, extra.oneTime.month);
        if (m - 1 === at) extraThisMonth += extra.oneTime.amt;
      }

      let totalPrincipal = principal + extraThisMonth;
      if (totalPrincipal > balance) totalPrincipal = balance;
      if (principal > balance) principal = balance;

      balance -= totalPrincipal;
      totalInterest += interest;
      totalExtra += extraThisMonth;

      if (pmiStopMonth === null && pmiAnnual > 0 && balance <= loanAmount * 0.8) {
        pmiStopMonth = m;
      }

      months.push({
        month: cursor.month, year: cursor.year,
        interest, principal: totalPrincipal, balance: Math.max(balance, 0),
        tax: curTax / 12, insurance: curIns / 12, hoa: curHoa / 12, other: curOther / 12,
        pmi: pmiAnnual > 0 && (pmiStopMonth === null || m <= pmiStopMonth) ? pmiAnnual / 12 : 0,
      });
    }

    return { basePI, months, totalInterest, totalExtra, actualMonths: months.length };
  },

  toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || (i % 12 === 0)) {
        bucket = { yearIndex: years.length + 1, interest: 0, principal: 0, endingBalance: 0, startMonth: m, endMonth: m };
        years.push(bucket);
      }
      bucket.interest += m.interest;
      bucket.principal += m.principal;
      bucket.endingBalance = m.balance;
      bucket.endMonth = m;
    });
    return years;
  },
};

/* ===================== UI wiring ===================== */
(function () {
  const el = (id) => document.getElementById(id);
  const form = el('mortgage-form');
  if (!form) return;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let lastResult = null;
  let scheduleView = 'annual';

  function num(id, fallback = 0) {
    const v = parseFloat(el(id).value);
    return Number.isFinite(v) ? v : fallback;
  }

  function readInputs() {
    const homePrice = num('m-home-price', 0);
    const downMode = el('m-down-mode').value;
    let downPct, downAmt;
    if (downMode === 'pct') {
      downPct = num('m-down-payment', 0);
      downAmt = homePrice * (downPct / 100);
    } else {
      downAmt = num('m-down-payment', 0);
      downPct = homePrice > 0 ? (downAmt / homePrice) * 100 : 0;
    }
    const termYears = num('m-loan-term', 30);
    const annualRatePct = num('m-interest-rate', 0);
    const startMonth = parseInt(el('m-start-month').value, 10);
    const startYear = num('m-start-year', new Date().getFullYear());

    const includeTaxes = el('m-include-taxes').checked;
    let propertyTaxAnnual = 0, insuranceAnnual = 0, pmiAnnual = 0, hoaAnnual = 0, otherAnnual = 0;
    if (includeTaxes) {
      const taxMode = el('m-tax-mode').value;
      const taxVal = num('m-property-tax', 0);
      propertyTaxAnnual = taxMode === 'pct' ? homePrice * (taxVal / 100) : taxVal;
      insuranceAnnual = num('m-home-insurance', 0);
      pmiAnnual = num('m-pmi', 0);
      hoaAnnual = num('m-hoa', 0);
      otherAnnual = num('m-other-costs', 0);
    }

    const increases = {
      propertyTax: num('m-tax-increase', 0),
      insurance: num('m-insurance-increase', 0),
      hoa: num('m-hoa-increase', 0),
      other: num('m-other-increase', 0),
    };

    const extra = {
      monthly: { amt: num('m-extra-monthly', 0), fromMonth: parseInt(el('m-extra-monthly-month').value, 10), fromYear: num('m-extra-monthly-year', startYear) },
      yearly: { amt: num('m-extra-yearly', 0), fromMonth: parseInt(el('m-extra-yearly-month').value, 10), fromYear: num('m-extra-yearly-year', startYear) },
      oneTime: { amt: num('m-extra-onetime', 0), month: parseInt(el('m-extra-onetime-month').value, 10), year: num('m-extra-onetime-year', startYear) },
    };

    return {
      homePrice, downPct, downAmt, termYears, annualRatePct, startMonth, startYear,
      includeTaxes, propertyTaxAnnual, insuranceAnnual, pmiAnnual, hoaAnnual, otherAnnual,
      increases, extra, showBiweekly: el('m-show-biweekly').checked,
    };
  }

  function donutChart(segments) {
    // segments: [{ value, color }]
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const r = 15.9155;
    let offset = 25;
    let circles = '';
    segments.forEach((seg) => {
      const pct = (seg.value / total) * 100;
      circles += `<circle class="donut-seg" cx="21" cy="21" r="${r}" fill="transparent" stroke="${seg.color}" stroke-width="4" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"></circle>`;
      offset -= pct;
    });
    return `<svg viewBox="0 0 42 42" class="donut">${circles}</svg>`;
  }

  function lineChart(months, width = 560, height = 200) {
    if (!months.length) return '';
    const maxVal = Math.max(...months.map((m) => m.balance), months[0].balance);
    let cumInterest = 0, cumPayment = 0;
    const interestSeries = [];
    const paymentSeries = [];
    months.forEach((m) => {
      cumInterest += m.interest;
      cumPayment += m.principal + m.interest;
      interestSeries.push(cumInterest);
      paymentSeries.push(cumPayment);
    });
    const maxY = Math.max(maxVal, ...interestSeries, ...paymentSeries) || 1;
    const stepX = width / (months.length - 1 || 1);
    const toPoints = (arr) => arr.map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / maxY) * height).toFixed(1)}`).join(' ');

    const balancePoints = toPoints(months.map((m) => m.balance));
    const interestPoints = toPoints(interestSeries);
    const paymentPoints = toPoints(paymentSeries);

    return `
      <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none">
        <polyline points="${paymentPoints}" fill="none" stroke="#dc2626" stroke-width="2" />
        <polyline points="${interestPoints}" fill="none" stroke="#10b981" stroke-width="2" />
        <polyline points="${balancePoints}" fill="none" stroke="var(--accent)" stroke-width="2.5" />
      </svg>`;
  }

  function renderSchedule(annualRows, monthlyRows) {
    const box = el('m-schedule-body');
    const rows = scheduleView === 'annual' ? annualRows : monthlyRows;
    let html = '';
    if (scheduleView === 'annual') {
      html += '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => {
        html += `<tr><td>${r.yearIndex}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.endingBalance)}</td></tr>`;
      });
    } else {
      html += '<table class="schedule-table"><thead><tr><th>Date</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      rows.forEach((r) => {
        html += `<tr><td>${MONTH_NAMES[r.month - 1]} ${r.year}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.balance)}</td></tr>`;
      });
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  function calculate() {
    const input = readInputs();
    if (!(input.homePrice > 0) || !(input.annualRatePct >= 0) || !(input.termYears > 0)) {
      el('m-result').innerHTML = '<p class="tool-result is-error">Enter a home price, loan term, and interest rate.</p>';
      return;
    }

    const loanAmount = input.homePrice - input.downAmt;
    const sim = MortgageMath.simulate({
      loanAmount, annualRatePct: input.annualRatePct, termYears: input.termYears,
      startMonth: input.startMonth, startYear: input.startYear,
      propertyTaxAnnual: input.propertyTaxAnnual, insuranceAnnual: input.insuranceAnnual,
      pmiAnnual: input.pmiAnnual, hoaAnnual: input.hoaAnnual, otherAnnual: input.otherAnnual,
      increases: input.increases, extra: input.extra,
    });

    const monthlyTax = input.propertyTaxAnnual / 12;
    const monthlyIns = input.insuranceAnnual / 12;
    const monthlyPmi = input.pmiAnnual / 12;
    const monthlyHoa = input.hoaAnnual / 12;
    const monthlyOther = input.otherAnnual / 12;
    const monthlyOutOfPocket = sim.basePI + monthlyTax + monthlyIns + monthlyPmi + monthlyHoa + monthlyOther;

    const totalPI = loanAmount + sim.totalInterest;
    const payoffCursor = MortgageMath.addMonths(input.startYear, input.startMonth, sim.actualMonths);

    lastResult = { input, sim, loanAmount };

    el('m-summary-payment').textContent = currency2(sim.basePI);

    el('m-breakdown').innerHTML = `
      <table class="breakdown-table">
        <thead><tr><th></th><th>Monthly</th><th>Total</th></tr></thead>
        <tbody>
          <tr><td>Mortgage Payment</td><td>${currency2(sim.basePI)}</td><td>${currency(totalPI)}</td></tr>
          ${input.includeTaxes && input.propertyTaxAnnual > 0 ? `<tr><td>Property Tax</td><td>${currency2(monthlyTax)}</td><td>${currency(monthlyTax * sim.actualMonths)}</td></tr>` : ''}
          ${input.includeTaxes && input.insuranceAnnual > 0 ? `<tr><td>Home Insurance</td><td>${currency2(monthlyIns)}</td><td>${currency(monthlyIns * sim.actualMonths)}</td></tr>` : ''}
          ${input.includeTaxes && input.pmiAnnual > 0 ? `<tr><td>PMI Insurance</td><td>${currency2(monthlyPmi)}</td><td>${currency(monthlyPmi * sim.actualMonths)}</td></tr>` : ''}
          ${input.includeTaxes && input.hoaAnnual > 0 ? `<tr><td>HOA Fee</td><td>${currency2(monthlyHoa)}</td><td>${currency(monthlyHoa * sim.actualMonths)}</td></tr>` : ''}
          ${input.includeTaxes && input.otherAnnual > 0 ? `<tr><td>Other Costs</td><td>${currency2(monthlyOther)}</td><td>${currency(monthlyOther * sim.actualMonths)}</td></tr>` : ''}
          <tr class="total-row"><td>Total Out-of-Pocket</td><td>${currency2(monthlyOutOfPocket)}</td><td>${currency(monthlyOutOfPocket * sim.actualMonths)}</td></tr>
        </tbody>
      </table>`;

    const segments = [
      { value: sim.basePI, color: 'var(--accent)', label: 'Principal & Interest' },
    ];
    if (input.includeTaxes && input.propertyTaxAnnual > 0) segments.push({ value: monthlyTax, color: '#10b981', label: 'Property Taxes' });
    if (input.includeTaxes && input.insuranceAnnual > 0) segments.push({ value: monthlyIns, color: '#f34469', label: 'Home Insurance' });
    if (input.includeTaxes && (input.hoaAnnual > 0 || input.otherAnnual > 0 || input.pmiAnnual > 0)) {
      segments.push({ value: monthlyHoa + monthlyOther + monthlyPmi, color: '#d97706', label: 'Other Costs' });
    }
    el('m-donut-wrap').innerHTML = donutChart(segments) + '<div class="donut-legend">' +
      segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('') + '</div>';

    el('m-summary-stats').innerHTML = `
      <div class="stat-row"><span>House Price</span><strong>${currency(input.homePrice)}</strong></div>
      <div class="stat-row"><span>Loan Amount</span><strong>${currency(loanAmount)}</strong></div>
      <div class="stat-row"><span>Down Payment</span><strong>${currency(input.downAmt)} (${input.downPct.toFixed(1)}%)</strong></div>
      <div class="stat-row"><span>Total of Payments</span><strong>${currency(totalPI)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(sim.totalInterest)}</strong></div>
      <div class="stat-row"><span>Payoff Date</span><strong>${MONTH_NAMES[payoffCursor.month - 1]} ${payoffCursor.year}</strong></div>
      ${sim.totalExtra > 0 ? `<div class="stat-row"><span>Extra Payments Made</span><strong>${currency(sim.totalExtra)}</strong></div>` : ''}
    `;

    if (input.showBiweekly) {
      const biweeklyExtra = { monthly: null, yearly: { amt: sim.basePI, fromMonth: input.startMonth, fromYear: input.startYear }, oneTime: null };
      const biSim = MortgageMath.simulate({
        loanAmount, annualRatePct: input.annualRatePct, termYears: input.termYears,
        startMonth: input.startMonth, startYear: input.startYear,
        propertyTaxAnnual: 0, insuranceAnnual: 0, pmiAnnual: 0, hoaAnnual: 0, otherAnnual: 0,
        increases: { propertyTax: 0, insurance: 0, hoa: 0, other: 0 }, extra: biweeklyExtra,
      });
      const biPayoff = MortgageMath.addMonths(input.startYear, input.startMonth, biSim.actualMonths);
      const interestSaved = sim.totalInterest - biSim.totalInterest;
      el('m-biweekly').hidden = false;
      el('m-biweekly').innerHTML = `
        <h3>Biweekly payback estimate</h3>
        <p class="card-sub">Paying half your mortgage payment every two weeks (26 payments/year ≈ 13 monthly payments) instead of monthly.</p>
        <div class="stat-row"><span>Biweekly Payment</span><strong>${currency2(sim.basePI / 2)}</strong></div>
        <div class="stat-row"><span>New Payoff Date</span><strong>${MONTH_NAMES[biPayoff.month - 1]} ${biPayoff.year}</strong></div>
        <div class="stat-row"><span>Interest Saved</span><strong>${currency(interestSaved)}</strong></div>
      `;
    } else {
      el('m-biweekly').hidden = true;
      el('m-biweekly').innerHTML = '';
    }

    const annualRows = MortgageMath.toAnnualSchedule(sim.months);
    el('m-chart-wrap').innerHTML = lineChart(sim.months);
    renderSchedule(annualRows, sim.months);
    el('m-results').hidden = false;
    el('m-schedule-section').hidden = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  el('m-include-taxes').addEventListener('change', () => {
    el('m-taxes-fields').hidden = !el('m-include-taxes').checked;
  });

  const moreToggle = el('m-more-options-toggle');
  moreToggle.addEventListener('click', () => {
    const box = el('m-more-options');
    const isHidden = box.hidden;
    box.hidden = !isHidden;
    moreToggle.textContent = isHidden ? '− Fewer Options' : '+ More Options';
  });

  el('m-schedule-annual').addEventListener('click', () => {
    scheduleView = 'annual';
    el('m-schedule-annual').classList.add('active');
    el('m-schedule-monthly').classList.remove('active');
    if (lastResult) renderSchedule(MortgageMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });
  el('m-schedule-monthly').addEventListener('click', () => {
    scheduleView = 'monthly';
    el('m-schedule-monthly').classList.add('active');
    el('m-schedule-annual').classList.remove('active');
    if (lastResult) renderSchedule(MortgageMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });

  // Populate year selects with a sensible range
  function populateYearSelect(id, startOffset, endOffset) {
    const select = el(id);
    const thisYear = new Date().getFullYear();
    for (let y = thisYear + startOffset; y <= thisYear + endOffset; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === thisYear) opt.selected = true;
      select.appendChild(opt);
    }
  }
  ['m-start-year', 'm-extra-monthly-year', 'm-extra-yearly-year', 'm-extra-onetime-year'].forEach((id) => {
    if (el(id)) populateYearSelect(id, 0, 10);
  });

  calculate();
})();
