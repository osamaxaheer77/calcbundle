'use strict';

/**
 * Amortization math engine: month-by-month simulation of a plain
 * fixed-rate loan (no taxes/insurance/PMI), supporting extra monthly,
 * extra yearly, and up to 10 dated one-time extra payments.
 */
const AmortizationMath = {
  monthlyPayment(loanAmount, annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return loanAmount / termMonths;
    const factor = Math.pow(1 + r, termMonths);
    return (loanAmount * r * factor) / (factor - 1);
  },

  addMonths(year, month, count) {
    const total = (year * 12 + (month - 1)) + count;
    return { year: Math.floor(total / 12), month: (total % 12) + 1 };
  },

  monthDiff(y1, m1, y2, m2) {
    return (y2 - y1) * 12 + (m2 - m1);
  },

  simulate(input) {
    const { loanAmount, annualRatePct, termMonths, startMonth, startYear, extra } = input;

    const monthlyRate = annualRatePct / 100 / 12;
    const basePayment = this.monthlyPayment(loanAmount, annualRatePct, termMonths);

    let balance = loanAmount;
    const months = [];
    let totalInterest = 0;
    let totalExtra = 0;

    for (let m = 1; m <= termMonths && balance > 0.005; m++) {
      const cursor = this.addMonths(startYear, startMonth, m - 1);

      const interest = balance * monthlyRate;
      let principal = basePayment - interest;

      let extraThisMonth = 0;
      if (extra.monthly && extra.monthly.amt > 0) {
        const startsAt = this.monthDiff(startYear, startMonth, extra.monthly.fromYear, extra.monthly.fromMonth);
        if (m - 1 >= startsAt) extraThisMonth += extra.monthly.amt;
      }
      if (extra.yearly && extra.yearly.amt > 0) {
        const startsAt = this.monthDiff(startYear, startMonth, extra.yearly.fromYear, extra.yearly.fromMonth);
        if (m - 1 >= startsAt && (m - 1 - startsAt) % 12 === 0) extraThisMonth += extra.yearly.amt;
      }
      if (extra.oneTimes && extra.oneTimes.length) {
        extra.oneTimes.forEach((ot) => {
          if (!(ot.amt > 0)) return;
          const at = this.monthDiff(startYear, startMonth, ot.year, ot.month);
          if (m - 1 === at) extraThisMonth += ot.amt;
        });
      }

      let totalPrincipal = principal + extraThisMonth;
      if (totalPrincipal > balance) totalPrincipal = balance;
      if (principal > balance) principal = balance;

      balance -= totalPrincipal;
      totalInterest += interest;
      totalExtra += extraThisMonth;

      months.push({
        month: cursor.month, year: cursor.year,
        interest, principal: totalPrincipal, balance: Math.max(balance, 0),
      });
    }

    return { basePayment, months, totalInterest, totalExtra, actualMonths: months.length };
  },

  toAnnualSchedule(months) {
    const years = [];
    let bucket = null;
    months.forEach((m, i) => {
      if (!bucket || (i % 12 === 0)) {
        bucket = { yearIndex: years.length + 1, interest: 0, principal: 0, endingBalance: 0 };
        years.push(bucket);
      }
      bucket.interest += m.interest;
      bucket.principal += m.principal;
      bucket.endingBalance = m.balance;
    });
    return years;
  },
};

/* ===================== UI wiring ===================== */
(function () {
  const el = (id) => document.getElementById(id);
  const form = el('amort-form');
  if (!form) return;

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');
  const currency2 = (v) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let lastResult = null;
  let scheduleView = 'annual';
  const ONE_TIME_COUNT = 10;

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function readInputs() {
    const loanAmount = num('a-loan-amount', 0);
    const termYears = num('a-term-years', 0);
    const termMonthsExtra = num('a-term-months', 0);
    const termMonths = Math.round(termYears * 12 + termMonthsExtra);
    const annualRatePct = num('a-interest-rate', 0);

    const extraOn = el('a-extra-toggle').checked;
    const startMonth = extraOn ? parseInt(el('a-start-month').value, 10) : (new Date().getMonth() + 1);
    const startYear = extraOn ? num('a-start-year', new Date().getFullYear()) : new Date().getFullYear();

    let extra = { monthly: null, yearly: null, oneTimes: [] };
    if (extraOn) {
      extra.monthly = { amt: num('a-extra-monthly', 0), fromMonth: parseInt(el('a-extra-monthly-month').value, 10), fromYear: num('a-extra-monthly-year', startYear) };
      extra.yearly = { amt: num('a-extra-yearly', 0), fromMonth: parseInt(el('a-extra-yearly-month').value, 10), fromYear: num('a-extra-yearly-year', startYear) };
      for (let i = 1; i <= ONE_TIME_COUNT; i++) {
        const amtField = el(`a-onetime-amt-${i}`);
        if (!amtField) continue;
        const amt = num(`a-onetime-amt-${i}`, 0);
        if (amt > 0) {
          extra.oneTimes.push({
            amt,
            month: parseInt(el(`a-onetime-month-${i}`).value, 10),
            year: num(`a-onetime-year-${i}`, startYear),
          });
        }
      }
    }

    return { loanAmount, termYears, termMonthsExtra, termMonths, annualRatePct, startMonth, startYear, extra };
  }

  function donutChart(segments) {
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
    const box = el('a-schedule-body');
    let html = '';
    if (scheduleView === 'annual') {
      html += '<table class="schedule-table"><thead><tr><th>Year</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      annualRows.forEach((r) => {
        html += `<tr><td>${r.yearIndex}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.endingBalance)}</td></tr>`;
      });
    } else {
      html += '<table class="schedule-table"><thead><tr><th>Date</th><th>Interest</th><th>Principal</th><th>Ending Balance</th></tr></thead><tbody>';
      monthlyRows.forEach((r) => {
        html += `<tr><td>${MONTH_NAMES[r.month - 1]} ${r.year}</td><td>${currency(r.interest)}</td><td>${currency(r.principal)}</td><td>${currency(r.balance)}</td></tr>`;
      });
    }
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  function calculate() {
    const input = readInputs();
    if (!(input.loanAmount > 0) || !(input.annualRatePct >= 0) || !(input.termMonths > 0)) {
      el('a-result').innerHTML = '<p class="tool-result is-error">Enter a loan amount, loan term, and interest rate.</p>';
      return;
    }

    const sim = AmortizationMath.simulate({
      loanAmount: input.loanAmount, annualRatePct: input.annualRatePct, termMonths: input.termMonths,
      startMonth: input.startMonth, startYear: input.startYear, extra: input.extra,
    });

    const totalPaid = input.loanAmount + sim.totalInterest;
    const payoffCursor = AmortizationMath.addMonths(input.startYear, input.startMonth, sim.actualMonths);

    lastResult = { input, sim };

    el('a-summary-payment').textContent = currency2(sim.basePayment);

    const segments = [
      { value: input.loanAmount, color: 'var(--accent)', label: 'Principal' },
      { value: sim.totalInterest, color: '#10b981', label: 'Interest' },
    ];
    el('a-donut-wrap').innerHTML = donutChart(segments) + '<div class="donut-legend">' +
      segments.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.label}</span>`).join('') + '</div>';

    el('a-summary-stats').innerHTML = `
      <div class="stat-row"><span>Loan Amount</span><strong>${currency(input.loanAmount)}</strong></div>
      <div class="stat-row"><span>Total of ${sim.actualMonths} Monthly Payments</span><strong>${currency(totalPaid)}</strong></div>
      <div class="stat-row"><span>Total Interest</span><strong>${currency(sim.totalInterest)}</strong></div>
      <div class="stat-row"><span>Payoff Date</span><strong>${MONTH_NAMES[payoffCursor.month - 1]} ${payoffCursor.year}</strong></div>
      ${sim.totalExtra > 0 ? `<div class="stat-row"><span>Extra Payments Made</span><strong>${currency(sim.totalExtra)}</strong></div>` : ''}
    `;

    const annualRows = AmortizationMath.toAnnualSchedule(sim.months);
    el('a-chart-wrap').innerHTML = lineChart(sim.months);
    renderSchedule(annualRows, sim.months);
    el('a-results').hidden = false;
    el('a-schedule-section').hidden = false;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
  });

  el('a-extra-toggle').addEventListener('change', () => {
    el('a-extra-fields').hidden = !el('a-extra-toggle').checked;
  });

  const moreOneTimeToggle = el('a-more-onetime-toggle');
  moreOneTimeToggle.addEventListener('click', () => {
    const box = el('a-more-onetime');
    const isHidden = box.hidden;
    box.hidden = !isHidden;
    moreOneTimeToggle.textContent = isHidden ? '− Hide inputs below' : '+ More one-time payments';
  });

  el('a-schedule-annual').addEventListener('click', () => {
    scheduleView = 'annual';
    el('a-schedule-annual').classList.add('active');
    el('a-schedule-monthly').classList.remove('active');
    if (lastResult) renderSchedule(AmortizationMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });
  el('a-schedule-monthly').addEventListener('click', () => {
    scheduleView = 'monthly';
    el('a-schedule-monthly').classList.add('active');
    el('a-schedule-annual').classList.remove('active');
    if (lastResult) renderSchedule(AmortizationMath.toAnnualSchedule(lastResult.sim.months), lastResult.sim.months);
  });

  function populateYearSelect(id, startOffset, endOffset) {
    const select = el(id);
    if (!select) return;
    const thisYear = new Date().getFullYear();
    for (let y = thisYear + startOffset; y <= thisYear + endOffset; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === thisYear) opt.selected = true;
      select.appendChild(opt);
    }
  }
  const yearSelectIds = ['a-start-year', 'a-extra-monthly-year', 'a-extra-yearly-year'];
  for (let i = 1; i <= ONE_TIME_COUNT; i++) yearSelectIds.push(`a-onetime-year-${i}`);
  yearSelectIds.forEach((id) => populateYearSelect(id, 0, 10));

  calculate();
})();
