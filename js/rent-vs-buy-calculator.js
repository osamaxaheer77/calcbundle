'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('rvb-form');
  if (!form) return;

  const currency = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function num(id, fallback = 0) {
    const field = el(id);
    if (!field) return fallback;
    const v = parseFloat(field.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function monthlyPIFactor(annualRatePct, termMonths) {
    const r = annualRatePct / 100 / 12;
    if (termMonths <= 0) return 0;
    if (r === 0) return 1 / termMonths;
    return r / (1 - Math.pow(1 + r, -termMonths));
  }

  function lineChart(years, buySeries, rentSeries, width = 700, height = 220) {
    const maxY = Math.max(...buySeries, ...rentSeries) || 1;
    const stepX = width / (years.length - 1 || 1);
    const toPoints = (arr) => arr.map((v, i) => `${(i * stepX).toFixed(1)},${(height - (v / maxY) * height).toFixed(1)}`).join(' ');
    return `
      <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none">
        <polyline points="${toPoints(buySeries)}" fill="none" stroke="var(--accent)" stroke-width="2.5" />
        <polyline points="${toPoints(rentSeries)}" fill="none" stroke="#dc2626" stroke-width="2.5" />
      </svg>`;
  }

  function calculate() {
    const price = num('rvb-price', 0);
    const downPct = num('rvb-down', 20);
    const rate = num('rvb-rate', 0);
    const termYears = num('rvb-term', 30);
    const buyClosingPct = num('rvb-buy-closing', 2);
    const taxPct = num('rvb-tax', 1.5);
    const taxInc = num('rvb-tax-increase', 0) / 100;
    const insuranceBase = num('rvb-insurance', 0);
    const hoaBase = num('rvb-hoa', 0);
    const maintPct = num('rvb-maintenance', 1.5);
    const valueInc = num('rvb-value-increase', 3) / 100;
    const costInc = num('rvb-cost-increase', 3) / 100;
    const sellClosingPct = num('rvb-sell-closing', 7);

    const rentBase = num('rvb-rent', 0);
    const rentInc = num('rvb-rent-increase', 3) / 100;
    const renterInsMonthly = num('rvb-renter-insurance', 0);
    const upfrontCost = num('rvb-upfront', 0);

    const investReturn = num('rvb-invest-return', 5) / 100;

    if (!(price > 0) || !(rentBase > 0)) {
      el('rvb-result').innerHTML = '<p class="tool-result is-error">Enter a home price and monthly rent.</p>';
      return;
    }

    const downAmt = price * downPct / 100;
    const buyClosing = price * buyClosingPct / 100;
    const loanAmount = price - downAmt;
    const termMonths = Math.round(termYears * 12);
    const piFactor = monthlyPIFactor(rate, termMonths);
    const payment = loanAmount * piFactor;
    const monthlyRate = rate / 100 / 12;
    const maintenanceBase = price * maintPct / 100;
    const taxBase = price * taxPct / 100;

    const years = [];
    let balance = loanAmount;
    let cumBuyCash = downAmt + buyClosing;
    let cumRentCash = upfrontCost;
    const investedCapital = downAmt + buyClosing;

    for (let year = 1; year <= 30; year++) {
      const taxYr = taxBase * Math.pow(1 + taxInc, year - 1);
      const insYr = insuranceBase * Math.pow(1 + costInc, year - 1);
      const hoaYr = hoaBase * Math.pow(1 + costInc, year - 1);
      const maintYr = maintenanceBase * Math.pow(1 + costInc, year - 1);
      const rentYr = rentBase * 12 * Math.pow(1 + rentInc, year - 1);
      const renterInsYr = renterInsMonthly * 12 * Math.pow(1 + costInc, year - 1);

      let piPaidThisYear = 0;
      for (let m = 1; m <= 12 && balance > 0.005; m++) {
        const interest = balance * monthlyRate;
        let principal = payment - interest;
        if (principal > balance) principal = balance;
        balance -= principal;
        piPaidThisYear += interest + principal;
      }

      cumBuyCash += piPaidThisYear + taxYr + insYr + hoaYr + maintYr;
      cumRentCash += rentYr + renterInsYr;

      const homeValue = price * Math.pow(1 + valueInc, year);
      const sellCost = homeValue * sellClosingPct / 100;
      const netSaleProceeds = homeValue - sellCost - Math.max(balance, 0);
      const netCostOfBuying = cumBuyCash - netSaleProceeds;

      const investmentValue = investedCapital * Math.pow(1 + investReturn, year);
      const investmentGain = investmentValue - investedCapital;
      const netCostOfRenting = cumRentCash - investmentGain;

      years.push({
        year,
        avgBuyMonthly: netCostOfBuying / (year * 12),
        avgBuyAnnual: netCostOfBuying / year,
        avgRentMonthly: netCostOfRenting / (year * 12),
        avgRentAnnual: netCostOfRenting / year,
      });
    }

    let crossoverYear = null;
    for (const y of years) {
      if (y.avgBuyMonthly <= y.avgRentMonthly) { crossoverYear = y.year; break; }
    }

    const headline = crossoverYear
      ? `Buying is cheaper if you stay for ${crossoverYear} year${crossoverYear === 1 ? '' : 's'} or longer. Otherwise, renting is cheaper.`
      : `Renting is cheaper for every length of stay modeled here (up to 30 years), based on these inputs.`;

    el('rvb-result').innerHTML = `<p class="tool-result-headline" style="font-size:16px;font-weight:600;color:var(--text-primary);margin:0 0 20px;">${headline}</p>`;

    el('rvb-chart-wrap').innerHTML = lineChart(years, years.map((y) => y.avgBuyMonthly), years.map((y) => y.avgRentMonthly));

    let tableHtml = '<table class="schedule-table"><thead><tr><th>Staying Length</th><th>Avg. Buying (Monthly)</th><th>Avg. Buying (Annual)</th><th>Avg. Renting (Monthly)</th><th>Avg. Renting (Annual)</th></tr></thead><tbody>';
    years.forEach((y) => {
      tableHtml += `<tr><td>${y.year} Year${y.year === 1 ? '' : 's'}</td><td>${currency(y.avgBuyMonthly)}</td><td>${currency(y.avgBuyAnnual)}</td><td>${currency(y.avgRentMonthly)}</td><td>${currency(y.avgRentAnnual)}</td></tr>`;
    });
    tableHtml += '</tbody></table>';
    el('rvb-table-wrap').innerHTML = tableHtml;

    el('rvb-results').hidden = false;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  calculate();
})();
