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
  {name:'Retirement Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'401K Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Pension Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Social Security Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Annuity Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Annuity Payout Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Roth IRA Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'IRA Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'RMD Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Income Tax Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Salary Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Marriage Tax Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Estate Tax Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Take-Home-Paycheck Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Loan Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Payment Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Currency Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Inflation Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Sales Tax Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Credit Card Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Credit Cards Payoff Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Debt Payoff Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Debt Consolidation Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Repayment Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Student Loan Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'College Cost Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'VAT Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Depreciation Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Margin Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Discount Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Business Loan Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Personal Loan Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Boat Loan Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Lease Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Budget Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'Commission Calculator',url:'categories/financial.html',category:'Financial',live:false},
  {name:'BMI Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Calorie Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Body Fat Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'BMR Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Ideal Weight Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Pace Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Army Body Fat Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Lean Body Mass Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Healthy Weight Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Calories Burned Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'One Rep Max Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Target Heart Rate Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Pregnancy Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Pregnancy Weight Gain Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Pregnancy Conception Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Due Date Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Ovulation Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Conception Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Period Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Macro Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Carbohydrate Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Protein Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Fat Intake Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'TDEE Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'GFR Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Body Type Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Body Surface Area Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'BAC Calculator',url:'categories/fitness.html',category:'Fitness & Health',live:false},
  {name:'Scientific Calculator',url:'calculators/scientific-calculator.html',category:'Math',live:true},
  {name:'Fraction Calculator',url:'calculators/fraction-calculator.html',category:'Math',live:true},
  {name:'Percentage Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Random Number Generator',url:'categories/math.html',category:'Math',live:false},
  {name:'Percent Error Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Exponent Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Binary Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Hex Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Half-Life Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Quadratic Formula Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Log Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Ratio Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Root Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Least Common Multiple Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Greatest Common Factor Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Factor Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Rounding Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Matrix Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Scientific Notation Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Big Number Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Standard Deviation Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Number Sequence Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Sample Size Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Probability Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Statistics Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Mean, Median, Mode, Range Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Permutation and Combination Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Z-score Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Confidence Interval Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Triangle Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Volume Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Slope Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Area Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Distance Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Circle Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Surface Area Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Pythagorean Theorem Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Right Triangle Calculator',url:'categories/math.html',category:'Math',live:false},
  {name:'Crypto Profit Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Break-Even Price Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Position Size Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Liquidation Price Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'DCA (Dollar-Cost Averaging) Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Crypto Staking Growth Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Portfolio Allocation Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Mining Profitability Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Gas Fee Calculator',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Satoshi ↔ BTC Converter',url:'categories/crypto.html',category:'Crypto',live:false},
  {name:'Age Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Date Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Time Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Hours Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Time Card Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Time Zone Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Time Duration Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Day Counter',url:'categories/other.html',category:'Other',live:false},
  {name:'Day of the Week Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Concrete Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'BTU Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Square Footage Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Stair Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Roofing Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Tile Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Mulch Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Gravel Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Height Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Conversion Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'GDP Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Density Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Mass Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Weight Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Speed Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Molarity Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Molecular Weight Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Roman Numeral Converter',url:'categories/other.html',category:'Other',live:false},
  {name:'Voltage Drop Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Resistor Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Ohms Law Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Electricity Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'IP Subnet Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Password Generator',url:'categories/other.html',category:'Other',live:false},
  {name:'Bandwidth Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Base64 Encode / Decode',url:'categories/other.html',category:'Other',live:false},
  {name:'URL Encode / Decode',url:'categories/other.html',category:'Other',live:false},
  {name:'GPA Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Grade Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Bra Size Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Shoe Size Conversion',url:'categories/other.html',category:'Other',live:false},
  {name:'Tip Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Golf Handicap Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Sleep Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Wind Chill Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Heat Index Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Dew Point Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Fuel Cost Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Gas Mileage Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Horsepower Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Engine Horsepower Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Mileage Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Tire Size Calculator',url:'categories/other.html',category:'Other',live:false},
  {name:'Dice Roller',url:'categories/other.html',category:'Other',live:false},
  {name:'Love Calculator',url:'categories/other.html',category:'Other',live:false}
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
})();
