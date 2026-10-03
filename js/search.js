'use strict';

/* Flat index of every calculator across all categories, used by the header search box. */
const CALCULATORS_INDEX = [
  {name:'Mortgage Calculator',url:'calculators/mortgage-calculator.html',category:'Financial',live:true},
  {name:'Amortization Calculator',url:'calculators/amortization-calculator.html',category:'Financial',live:true},
  {name:'Mortgage Payoff Calculator',url:'calculators/mortgage-payoff-calculator.html',category:'Financial',live:true},
  {name:'House Affordability Calculator',url:'calculators/house-affordability-calculator.html',category:'Financial',live:true},
  {name:'Rent Calculator',url:'calculators/rent-calculator.html',category:'Financial',live:true},
  {name:'Debt-to-Income Ratio Calculator',url:'calculators/debt-ratio-calculator.html',category:'Financial',live:true},
  {name:'Real Estate Calculator',url:'calculators/real-estate-calculator.html',category:'Financial',live:true},
  {name:'Refinance Calculator',url:'calculators/refinance-calculator.html',category:'Financial',live:true},
  {name:'Rental Property Calculator',url:'calculators/rental-property-calculator.html',category:'Financial',live:true},
  {name:'APR Calculator',url:'calculators/apr-calculator.html',category:'Financial',live:true},
  {name:'FHA Loan Calculator',url:'calculators/fha-loan-calculator.html',category:'Financial',live:true},
  {name:'VA Mortgage Calculator',url:'calculators/va-mortgage-calculator.html',category:'Financial',live:true},
  {name:'Home Equity Loan Calculator',url:'calculators/home-equity-loan-calculator.html',category:'Financial',live:true},
  {name:'HELOC Calculator',url:'calculators/heloc-calculator.html',category:'Financial',live:true},
  {name:'Down Payment Calculator',url:'calculators/down-payment-calculator.html',category:'Financial',live:true},
  {name:'Rent vs. Buy Calculator',url:'calculators/rent-vs-buy-calculator.html',category:'Financial',live:true},
  {name:'Retirement Calculator',url:'calculators/retirement-calculator.html',category:'Financial',live:true},
  {name:'401K Calculator',url:'calculators/401k-calculator.html',category:'Financial',live:true},
  {name:'Pension Calculator',url:'calculators/pension-calculator.html',category:'Financial',live:true},
  {name:'Social Security Calculator',url:'calculators/social-security-calculator.html',category:'Financial',live:true},
  {name:'Annuity Calculator',url:'calculators/annuity-calculator.html',category:'Financial',live:true},
  {name:'Annuity Payout Calculator',url:'calculators/annuity-payout-calculator.html',category:'Financial',live:true},
  {name:'Roth IRA Calculator',url:'calculators/roth-ira-calculator.html',category:'Financial',live:true},
  {name:'IRA Calculator',url:'calculators/ira-calculator.html',category:'Financial',live:true},
  {name:'RMD Calculator',url:'calculators/rmd-calculator.html',category:'Financial',live:true},
  {name:'Income Tax Calculator',url:'calculators/income-tax-calculator.html',category:'Financial',live:true},
  {name:'Salary Calculator',url:'calculators/salary-calculator.html',category:'Financial',live:true},
  {name:'Marriage Tax Calculator',url:'calculators/marriage-tax-calculator.html',category:'Financial',live:true},
  {name:'Estate Tax Calculator',url:'calculators/estate-tax-calculator.html',category:'Financial',live:true},
  {name:'Take-Home-Paycheck Calculator',url:'calculators/take-home-pay-calculator.html',category:'Financial',live:true},
  {name:'Auto Loan Calculator',url:'calculators/auto-loan-calculator.html',category:'Financial',live:true},
  {name:'Cash Back or Low Interest Calculator',url:'calculators/cash-back-or-low-interest-calculator.html',category:'Financial',live:true},
  {name:'Auto Lease Calculator',url:'calculators/auto-lease-calculator.html',category:'Financial',live:true},
  {name:'Interest Calculator',url:'calculators/interest-calculator.html',category:'Financial',live:true},
  {name:'Investment Calculator',url:'calculators/investment-calculator.html',category:'Financial',live:true},
  {name:'Finance Calculator',url:'calculators/finance-calculator.html',category:'Financial',live:true},
  {name:'Compound Interest Calculator',url:'calculators/compound-interest-calculator.html',category:'Financial',live:true},
  {name:'Interest Rate Calculator',url:'calculators/interest-rate-calculator.html',category:'Financial',live:true},
  {name:'Savings Calculator',url:'calculators/savings-calculator.html',category:'Financial',live:true},
  {name:'Simple Interest Calculator',url:'calculators/simple-interest-calculator.html',category:'Financial',live:true},
  {name:'CD Calculator',url:'calculators/cd-calculator.html',category:'Financial',live:true},
  {name:'Bond Calculator',url:'calculators/bond-calculator.html',category:'Financial',live:true},
  {name:'Mutual Fund Calculator',url:'calculators/mutual-fund-calculator.html',category:'Financial',live:true},
  {name:'Average Return Calculator',url:'calculators/average-return-calculator.html',category:'Financial',live:true},
  {name:'IRR Calculator',url:'calculators/irr-calculator.html',category:'Financial',live:true},
  {name:'ROI Calculator',url:'calculators/roi-calculator.html',category:'Financial',live:true},
  {name:'Payback Period Calculator',url:'calculators/payback-period-calculator.html',category:'Financial',live:true},
  {name:'Present Value Calculator',url:'calculators/present-value-calculator.html',category:'Financial',live:true},
  {name:'Future Value Calculator',url:'calculators/future-value-calculator.html',category:'Financial',live:true},
  {name:'Loan Calculator',url:'calculators/loan-calculator.html',category:'Financial',live:true},
  {name:'Payment Calculator',url:'calculators/payment-calculator.html',category:'Financial',live:true},
  {name:'Currency Calculator',url:'calculators/currency-calculator.html',category:'Financial',live:true},
  {name:'Inflation Calculator',url:'calculators/inflation-calculator.html',category:'Financial',live:true},
  {name:'Sales Tax Calculator',url:'calculators/sales-tax-calculator.html',category:'Financial',live:true},
  {name:'Credit Card Calculator',url:'calculators/credit-card-calculator.html',category:'Financial',live:true},
  {name:'Credit Cards Payoff Calculator',url:'calculators/credit-cards-payoff-calculator.html',category:'Financial',live:true},
  {name:'Debt Payoff Calculator',url:'calculators/debt-payoff-calculator.html',category:'Financial',live:true},
  {name:'Debt Consolidation Calculator',url:'calculators/debt-consolidation-calculator.html',category:'Financial',live:true},
  {name:'Repayment Calculator',url:'calculators/repayment-calculator.html',category:'Financial',live:true},
  {name:'Student Loan Calculator',url:'calculators/student-loan-calculator.html',category:'Financial',live:true},
  {name:'College Cost Calculator',url:'calculators/college-cost-calculator.html',category:'Financial',live:true},
  {name:'VAT Calculator',url:'calculators/vat-calculator.html',category:'Financial',live:true},
  {name:'Depreciation Calculator',url:'calculators/depreciation-calculator.html',category:'Financial',live:true},
  {name:'Margin Calculator',url:'calculators/margin-calculator.html',category:'Financial',live:true},
  {name:'Discount Calculator',url:'calculators/discount-calculator.html',category:'Financial',live:true},
  {name:'Business Loan Calculator',url:'calculators/business-loan-calculator.html',category:'Financial',live:true},
  {name:'Personal Loan Calculator',url:'calculators/personal-loan-calculator.html',category:'Financial',live:true},
  {name:'Boat Loan Calculator',url:'calculators/boat-loan-calculator.html',category:'Financial',live:true},
  {name:'Lease Calculator',url:'calculators/lease-calculator.html',category:'Financial',live:true},
  {name:'Budget Calculator',url:'calculators/budget-calculator.html',category:'Financial',live:true},
  {name:'Commission Calculator',url:'calculators/commission-calculator.html',category:'Financial',live:true},
  {name:'BMI Calculator',url:'calculators/bmi-calculator.html',category:'Fitness & Health',live:true},
  {name:'Calorie Calculator',url:'calculators/calorie-calculator.html',category:'Fitness & Health',live:true},
  {name:'Body Fat Calculator',url:'calculators/body-fat-calculator.html',category:'Fitness & Health',live:true},
  {name:'BMR Calculator',url:'calculators/bmr-calculator.html',category:'Fitness & Health',live:true},
  {name:'Ideal Weight Calculator',url:'calculators/ideal-weight-calculator.html',category:'Fitness & Health',live:true},
  {name:'Pace Calculator',url:'calculators/pace-calculator.html',category:'Fitness & Health',live:true},
  {name:'Army Body Fat Calculator',url:'calculators/army-body-fat-calculator.html',category:'Fitness & Health',live:true},
  {name:'Lean Body Mass Calculator',url:'calculators/lean-body-mass-calculator.html',category:'Fitness & Health',live:true},
  {name:'Healthy Weight Calculator',url:'calculators/healthy-weight-calculator.html',category:'Fitness & Health',live:true},
  {name:'Calories Burned Calculator',url:'calculators/calories-burned-calculator.html',category:'Fitness & Health',live:true},
  {name:'One Rep Max Calculator',url:'calculators/one-rep-max-calculator.html',category:'Fitness & Health',live:true},
  {name:'Target Heart Rate Calculator',url:'calculators/target-heart-rate-calculator.html',category:'Fitness & Health',live:true},
  {name:'Pregnancy Calculator',url:'calculators/pregnancy-calculator.html',category:'Fitness & Health',live:true},
  {name:'Pregnancy Weight Gain Calculator',url:'calculators/pregnancy-weight-gain-calculator.html',category:'Fitness & Health',live:true},
  {name:'Pregnancy Conception Calculator',url:'calculators/pregnancy-conception-calculator.html',category:'Fitness & Health',live:true},
  {name:'Due Date Calculator',url:'calculators/due-date-calculator.html',category:'Fitness & Health',live:true},
  {name:'Ovulation Calculator',url:'calculators/ovulation-calculator.html',category:'Fitness & Health',live:true},
  {name:'Conception Calculator',url:'calculators/conception-calculator.html',category:'Fitness & Health',live:true},
  {name:'Period Calculator',url:'calculators/period-calculator.html',category:'Fitness & Health',live:true},
  {name:'Macro Calculator',url:'calculators/macro-calculator.html',category:'Fitness & Health',live:true},
  {name:'Carbohydrate Calculator',url:'calculators/carbohydrate-calculator.html',category:'Fitness & Health',live:true},
  {name:'Protein Calculator',url:'calculators/protein-calculator.html',category:'Fitness & Health',live:true},
  {name:'Fat Intake Calculator',url:'calculators/fat-intake-calculator.html',category:'Fitness & Health',live:true},
  {name:'TDEE Calculator',url:'calculators/tdee-calculator.html',category:'Fitness & Health',live:true},
  {name:'GFR Calculator',url:'calculators/gfr-calculator.html',category:'Fitness & Health',live:true},
  {name:'Body Type Calculator',url:'calculators/body-type-calculator.html',category:'Fitness & Health',live:true},
  {name:'Body Surface Area Calculator',url:'calculators/body-surface-area-calculator.html',category:'Fitness & Health',live:true},
  {name:'BAC Calculator',url:'calculators/bac-calculator.html',category:'Fitness & Health',live:true},
  {name:'Scientific Calculator',url:'calculators/scientific-calculator.html',category:'Math',live:true},
  {name:'Fraction Calculator',url:'calculators/fraction-calculator.html',category:'Math',live:true},
  {name:'Percentage Calculator',url:'calculators/percentage-calculator.html',category:'Math',live:true},
  {name:'Random Number Generator',url:'calculators/random-number-generator.html',category:'Math',live:true},
  {name:'Percent Error Calculator',url:'calculators/percent-error-calculator.html',category:'Math',live:true},
  {name:'Exponent Calculator',url:'calculators/exponent-calculator.html',category:'Math',live:true},
  {name:'Binary Calculator',url:'calculators/binary-calculator.html',category:'Math',live:true},
  {name:'Hex Calculator',url:'calculators/hex-calculator.html',category:'Math',live:true},
  {name:'Half-Life Calculator',url:'calculators/half-life-calculator.html',category:'Math',live:true},
  {name:'Quadratic Formula Calculator',url:'calculators/quadratic-formula-calculator.html',category:'Math',live:true},
  {name:'Log Calculator',url:'calculators/log-calculator.html',category:'Math',live:true},
  {name:'Ratio Calculator',url:'calculators/ratio-calculator.html',category:'Math',live:true},
  {name:'Root Calculator',url:'calculators/root-calculator.html',category:'Math',live:true},
  {name:'Least Common Multiple Calculator',url:'calculators/lcm-calculator.html',category:'Math',live:true},
  {name:'Greatest Common Factor Calculator',url:'calculators/gcf-calculator.html',category:'Math',live:true},
  {name:'Factor Calculator',url:'calculators/factor-calculator.html',category:'Math',live:true},
  {name:'Rounding Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Matrix Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Scientific Notation Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Big Number Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Standard Deviation Calculator',url:'calculators/standard-deviation-calculator.html',category:'Math',live:true},
  {name:'Number Sequence Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Sample Size Calculator',url:'calculators/sample-size-calculator.html',category:'Math',live:true},
  {name:'Probability Calculator',url:'calculators/probability-calculator.html',category:'Math',live:true},
  {name:'Statistics Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Mean, Median, Mode, Range Calculator',url:'calculators/mean-median-mode-range-calculator.html',category:'Math',live:true},
  {name:'Permutation and Combination Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Z-score Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Confidence Interval Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Triangle Calculator',url:'calculators/triangle-calculator.html',category:'Math',live:true},
  {name:'Volume Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Slope Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Area Calculator',url:'calculators/area-calculator.html',category:'Math',live:true},
  {name:'Distance Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Circle Calculator',url:'calculators/circle-calculator.html',category:'Math',live:true},
  {name:'Surface Area Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Pythagorean Theorem Calculator',url:'calculators/pythagorean-theorem-calculator.html',category:'Math',live:true},
  {name:'Right Triangle Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Futures PNL Calculator',url:'calculators/futures-pnl-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Futures Target Price Calculator',url:'calculators/futures-target-price-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Liquidation Price Calculator',url:'calculators/liquidation-price-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Max Open Calculator',url:'calculators/max-open-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Average Entry Price Calculator',url:'calculators/average-entry-price-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Funding Fee Calculator',url:'calculators/funding-fee-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Position Size Calculator',url:'calculators/position-size-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Crypto Profit Calculator',url:'calculators/crypto-profit-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Break-Even Price Calculator',url:'calculators/break-even-price-calculator.html',category:'Crypto & Forex',live:true},
  {name:'DCA (Dollar-Cost Averaging) Calculator',url:'calculators/dca-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Crypto Staking Growth Calculator',url:'calculators/crypto-staking-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Portfolio Allocation Calculator',url:'calculators/portfolio-allocation-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Mining Profitability Calculator',url:'calculators/mining-profitability-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Gas Fee Calculator',url:'calculators/gas-fee-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Satoshi &harr; BTC Converter',url:'calculators/satoshi-btc-converter.html',category:'Crypto & Forex',live:true},
  {name:'Pip Calculator',url:'calculators/pip-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Lot Size Calculator',url:'calculators/lot-size-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Forex Margin Calculator',url:'calculators/forex-margin-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Leverage Calculator',url:'calculators/leverage-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Forex Profit Calculator',url:'calculators/forex-profit-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Risk Reward Ratio Calculator',url:'calculators/risk-reward-ratio-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Stop Loss and Take Profit Calculator',url:'calculators/stop-loss-and-take-profit-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Pivot Point Calculator',url:'calculators/pivot-point-calculator.html',category:'Crypto & Forex',live:true},
  {name:'Age Calculator',url:'calculators/age-calculator.html',category:'Other',live:true},
  {name:'Date Calculator',url:'calculators/date-calculator.html',category:'Other',live:true},
  {name:'Time Calculator',url:'calculators/time-calculator.html',category:'Other',live:true},
  {name:'Hours Calculator',url:'calculators/hours-calculator.html',category:'Other',live:true},
  {name:'Time Card Calculator',url:'calculators/time-card-calculator.html',category:'Other',live:true},
  {name:'Time Zone Calculator',url:'calculators/time-zone-calculator.html',category:'Other',live:true},
  {name:'Time Duration Calculator',url:'calculators/time-duration-calculator.html',category:'Other',live:true},
  {name:'Day Counter',url:'calculators/day-counter.html',category:'Other',live:true},
  {name:'Day of the Week Calculator',url:'calculators/day-of-the-week-calculator.html',category:'Other',live:true},
  {name:'Concrete Calculator',url:'calculators/concrete-calculator.html',category:'Other',live:true},
  {name:'BTU Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Square Footage Calculator',url:'calculators/square-footage-calculator.html',category:'Other',live:true},
  {name:'Stair Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Roofing Calculator',url:'calculators/roofing-calculator.html',category:'Other',live:true},
  {name:'Tile Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Mulch Calculator',url:'calculators/mulch-calculator.html',category:'Other',live:true},
  {name:'Gravel Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Height Calculator',url:'calculators/height-calculator.html',category:'Other',live:true},
  {name:'Conversion Calculator',url:'calculators/conversion-calculator.html',category:'Other',live:true},
  {name:'GDP Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Density Calculator',url:'calculators/density-calculator.html',category:'Other',live:true},
  {name:'Mass Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Weight Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Speed Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Molarity Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Molecular Weight Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Roman Numeral Converter',url:'calculators/roman-numeral-converter.html',category:'Other',live:true},
  {name:'Voltage Drop Calculator',url:'calculators/voltage-drop-calculator.html',category:'Other',live:true},
  {name:'Resistor Calculator',url:'calculators/resistor-calculator.html',category:'Other',live:true},
  {name:'Ohms Law Calculator',url:'calculators/ohms-law-calculator.html',category:'Other',live:true},
  {name:'Electricity Calculator',url:'calculators/electricity-calculator.html',category:'Other',live:true},
  {name:'IP Subnet Calculator',url:'calculators/ip-subnet-calculator.html',category:'Other',live:true},
  {name:'Password Generator',url:'calculators/password-generator.html',category:'Other',live:true},
  {name:'Bandwidth Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Base64 Encode / Decode',url:'calculators/base64-encoder.html',category:'Other',live:true},
  {name:'URL Encode / Decode',url:'calculators/url-encoder.html',category:'Other',live:true},
  {name:'GPA Calculator',url:'calculators/gpa-calculator.html',category:'Other',live:true},
  {name:'Grade Calculator',url:'calculators/grade-calculator.html',category:'Other',live:true},
  {name:'Bra Size Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Shoe Size Conversion',url:'categories/other.html',category:'Other',live:false},
  {name:'Tip Calculator',url:'calculators/tip-calculator.html',category:'Other',live:true},
  {name:'Golf Handicap Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Sleep Calculator',url:'calculators/sleep-calculator.html',category:'Other',live:true},
  {name:'Wind Chill Calculator',url:'calculators/wind-chill-calculator.html',category:'Other',live:true},
  {name:'Heat Index Calculator',url:'calculators/heat-index-calculator.html',category:'Other',live:true},
  {name:'Dew Point Calculator',url:'calculators/dew-point-calculator.html',category:'Other',live:true},
  {name:'Fuel Cost Calculator',url:'calculators/fuel-cost-calculator.html',category:'Other',live:true},
  {name:'Gas Mileage Calculator',url:'calculators/gas-mileage-calculator.html',category:'Other',live:true},
  {name:'Horsepower Calculator',url:'calculators/horsepower-calculator.html',category:'Other',live:true},
  {name:'Engine Horsepower Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Mileage Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Tire Size Calculator',url:'calculators/tire-size-calculator.html',category:'Other',live:true},
  {name:'Dice Roller',url:'calculators/dice-roller.html',category:'Other',live:true},
  {name:'Love Calculator',url:'calculators/love-calculator.html',category:'Other',live:true},
];

(function () {
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return dp[n];
  }

  function similarity(a, b) {
    if (!a.length && !b.length) return 1;
    return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  }

  function tokenize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function scoreMatch(query, name) {
    const qLower = query.toLowerCase().trim();
    const nameLower = name.toLowerCase();
    if (!qLower) return 0;
    // Substring match is only a strong signal once the query is long enough that
    // matching "somewhere in the name" is meaningful (a 1-2 letter query would
    // otherwise match almost every name and drown out the word-prefix results below).
    if (qLower.length >= 3 && nameLower.includes(qLower)) {
      return 0.9 + 0.1 * (qLower.length / nameLower.length);
    }
    const qTokens = tokenize(query);
    const nTokens = tokenize(name);
    if (!qTokens.length || !nTokens.length) return 0;
    let total = 0;
    for (const qt of qTokens) {
      let best = 0;
      for (const nt of nTokens) {
        if (qt.length <= 2 || nt.length <= 2) {
          if (nt.startsWith(qt) || qt.startsWith(nt)) best = Math.max(best, 0.85);
          continue;
        }
        const sim = similarity(qt, nt);
        if (sim > best) best = sim;
      }
      total += best;
    }
    return total / qTokens.length;
  }

  function searchCalculators(query, limit) {
    const q = query.trim();
    if (q.length < 1) return [];
    const scored = CALCULATORS_INDEX.map((c) => ({ calc: c, score: scoreMatch(q, c.name) + (c.live ? 0.03 : 0) }))
      .filter((r) => r.score >= 0.5)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit || 8).map((r) => r.calc);
  }

  function urlPrefix() {
    const path = window.location.pathname;
    return (path.includes('/calculators/') || path.includes('/categories/')) ? '../' : '';
  }

  function init(navSearch) {
    const input = navSearch.querySelector('input');
    if (!input) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.hidden = true;
    navSearch.appendChild(dropdown);

    function render(results) {
      dropdown.innerHTML = '';
      if (!results.length) {
        const empty = document.createElement('div');
        empty.className = 'search-result-empty';
        empty.textContent = 'No calculators found.';
        dropdown.appendChild(empty);
        return;
      }
      results.forEach((calc) => {
        const el = document.createElement(calc.live ? 'a' : 'div');
        el.className = 'search-result-item' + (calc.live ? '' : ' is-soon');
        if (calc.live) el.href = urlPrefix() + calc.url;
        el.innerHTML = '<span>' + calc.name + '</span><span class="result-category">' + (calc.live ? calc.category : 'Coming soon') + '</span>';
        dropdown.appendChild(el);
      });
    }

    function update() {
      if (input.value.trim().length < 1) {
        dropdown.hidden = true;
        return;
      }
      const results = searchCalculators(input.value, 8);
      render(results);
      dropdown.hidden = false;
    }

    input.addEventListener('input', update);
    input.addEventListener('focus', () => { if (input.value.trim().length >= 1) update(); });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.hidden = true;
        input.blur();
      } else if (e.key === 'Enter') {
        const firstLive = dropdown.querySelector('a.search-result-item');
        if (firstLive) {
          e.preventDefault();
          window.location.href = firstLive.href;
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!navSearch.contains(e.target)) dropdown.hidden = true;
    });
  }

  document.querySelectorAll('.nav-search').forEach(init);

  const CATEGORIES = [
    { name: 'Financial', url: 'categories/financial.html' },
    { name: 'Fitness & Health', url: 'categories/fitness.html' },
    { name: 'Math', url: 'categories/math.html' },
    { name: 'Crypto & Forex', url: 'categories/crypto.html' },
    { name: 'Other', url: 'categories/other.html' },
  ];

  function initCategoriesDropdown(link) {
    const wrapper = document.createElement('div');
    wrapper.className = 'nav-categories';
    link.parentNode.insertBefore(wrapper, link);
    wrapper.appendChild(link);

    const chevron = document.createElement('span');
    chevron.className = 'nav-categories-chevron';
    chevron.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    link.appendChild(chevron);

    const dropdown = document.createElement('div');
    dropdown.className = 'nav-categories-dropdown';
    dropdown.hidden = true;
    CATEGORIES.forEach((cat) => {
      const a = document.createElement('a');
      a.href = urlPrefix() + cat.url;
      a.textContent = cat.name;
      dropdown.appendChild(a);
    });
    wrapper.appendChild(dropdown);

    function close() {
      dropdown.hidden = true;
      wrapper.classList.remove('is-open');
    }
    function open() {
      dropdown.hidden = false;
      wrapper.classList.add('is-open');
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (dropdown.hidden) open(); else close();
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown.hidden) {
        close();
        link.focus();
      }
    });
  }

  document.querySelectorAll('a.nav-link[href$="#categories"]').forEach(initCategoriesDropdown);
})();
