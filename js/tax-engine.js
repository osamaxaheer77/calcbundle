'use strict';

// U.S. federal income tax rules for tax years 2025 and 2026, shared by the tax calculators.
(function (root) {
  const INF = Infinity;

  const PARAMS = {
    2025: {
      stdDed: { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625, qw: 31500 },
      stdAddUnmarried: 2000, stdAddMarried: 1600,
      brackets: {
        single: [[11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [INF, 0.37]],
        mfj: [[23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [INF, 0.37]],
        mfs: [[11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [375800, 0.35], [INF, 0.37]],
        hoh: [[17000, 0.10], [64850, 0.12], [103350, 0.22], [197300, 0.24], [250500, 0.32], [626350, 0.35], [INF, 0.37]],
      },
      capGains: { single: [48350, 533400], mfj: [96700, 600050], mfs: [48350, 300000], hoh: [64750, 566700] },
      ssWageBase: 176100,
      salt: { cap: 40000, thr: 500000, floor: 10000 },
      ctc: 2200, actcMax: 1700, odc: 500,
      eitc: {
        0: { rate: 0.0765, earned: 8490, max: 649, startSingle: 10620, startJoint: 17730, outRate: 0.0765 },
        1: { rate: 0.34, earned: 12730, max: 4328, startSingle: 23350, startJoint: 30470, outRate: 0.1598 },
        2: { rate: 0.40, earned: 17880, max: 7152, startSingle: 23350, startJoint: 30470, outRate: 0.2106 },
        3: { rate: 0.45, earned: 17880, max: 8046, startSingle: 23350, startJoint: 30470, outRate: 0.2106 },
      },
      eitcInvestLimit: 11950,
      amt: { exempt: { single: 88100, mfj: 137000, mfs: 68650, hoh: 88100 }, phaseStart: { single: 626350, mfj: 1252700, mfs: 626350, hoh: 626350 }, phaseRate: 0.25, break: 239100 },
      qbi: { thr: { single: 197300, mfj: 394600, mfs: 197300, hoh: 197300 }, range: { single: 50000, mfj: 100000, mfs: 50000, hoh: 50000 } },
      studentLoan: { single: [85000, 100000], mfj: [170000, 200000], hoh: [85000, 100000] },
      ira: { limit: 7000, catchUp: 1000 },
    },
    2026: {
      stdDed: { single: 16100, mfj: 32200, mfs: 16100, hoh: 24150, qw: 32200 },
      stdAddUnmarried: 2050, stdAddMarried: 1650,
      brackets: {
        single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [INF, 0.37]],
        mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [INF, 0.37]],
        mfs: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [384350, 0.35], [INF, 0.37]],
        hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201775, 0.24], [256200, 0.32], [640600, 0.35], [INF, 0.37]],
      },
      capGains: { single: [49450, 545500], mfj: [98900, 613700], mfs: [49450, 306850], hoh: [66200, 579600] },
      ssWageBase: 184500,
      salt: { cap: 40400, thr: 505000, floor: 10000 },
      ctc: 2200, actcMax: 1700, odc: 500,
      eitc: {
        0: { rate: 0.0765, earned: 8680, max: 664, startSingle: 10860, startJoint: 18140, outRate: 0.0765 },
        1: { rate: 0.34, earned: 13020, max: 4427, startSingle: 23890, startJoint: 31160, outRate: 0.1598 },
        2: { rate: 0.40, earned: 18290, max: 7316, startSingle: 23890, startJoint: 31160, outRate: 0.2106 },
        3: { rate: 0.45, earned: 18290, max: 8231, startSingle: 23890, startJoint: 31160, outRate: 0.2106 },
      },
      eitcInvestLimit: 12200,
      amt: { exempt: { single: 90100, mfj: 140200, mfs: 70100, hoh: 90100 }, phaseStart: { single: 500000, mfj: 1000000, mfs: 500000, hoh: 500000 }, phaseRate: 0.5, break: 244500 },
      qbi: { thr: { single: 201775, mfj: 403550, mfs: 201775, hoh: 201775 }, range: { single: 75000, mfj: 150000, mfs: 75000, hoh: 75000 } },
      studentLoan: { single: [85000, 100000], mfj: [175000, 205000], hoh: [85000, 100000] },
      ira: { limit: 7500, catchUp: 1100 },
    },
  };

  const bracketsFor = (year, status) => PARAMS[year].brackets[status === 'qw' ? 'mfj' : status];
  const key = (status) => (status === 'qw' ? 'mfj' : status);

  function ordinaryTax(taxable, year, status) {
    let tax = 0;
    let lower = 0;
    for (const [upper, rate] of bracketsFor(year, status)) {
      if (taxable <= lower) break;
      tax += (Math.min(taxable, upper) - lower) * rate;
      lower = upper;
    }
    return tax;
  }

  function marginalRate(taxable, year, status) {
    for (const [upper, rate] of bracketsFor(year, status)) if (taxable <= upper) return rate;
    return 0.37;
  }

  // Tax on preferential income (qualified dividends and long-term gains) stacked on top of ordinary income.
  function preferentialTax(pref, ordinary, year, status) {
    if (pref <= 0) return 0;
    const [t0, t15] = PARAMS[year].capGains[key(status)];
    const start = ordinary;
    const end = ordinary + pref;
    const at0 = Math.max(0, Math.min(end, t0) - start);
    const at15 = Math.max(0, Math.min(end, t15) - Math.max(start, t0));
    const at20 = Math.max(0, end - Math.max(start, t15));
    return at15 * 0.15 + at20 * 0.20;
  }

  function eitcAmount(P, kids, earned, agi, status, ages) {
    if (earned <= 0 || status === 'mfs') return 0;
    const n = Math.min(kids, 3);
    const t = P.eitc[n];
    if (n === 0 && !ages.some((a) => a >= 25 && a <= 64)) return 0;
    const joint = status === 'mfj';
    const start = joint ? t.startJoint : t.startSingle;
    let credit = Math.min(earned, t.earned) * t.rate;
    credit = Math.min(credit, t.max);
    const phaseBase = Math.max(agi, earned);
    if (phaseBase > start) credit = Math.max(0, credit - (phaseBase - start) * t.outRate);
    return credit;
  }

  function compute(inp) {
    const P = PARAMS[inp.year];
    const st = inp.status;
    const joint = st === 'mfj';
    const persons = joint ? [inp.p1, inp.p2] : [inp.p1];
    const ded = inp.ded || {};
    const num = (v) => (Number.isFinite(v) ? v : 0);
    const young = Math.max(0, Math.floor(num(inp.youngDeps)));
    const otherDeps = Math.max(0, Math.floor(num(inp.otherDeps)));

    // Earned income, self-employment tax and payroll taxes
    let wages = 0, seNet = 0, seTax = 0, seHalf = 0, withheld = 0, estimated = 0, stateWithheld = 0, medicareBase = 0, seEarnings = 0;
    const earnedPerson = [];
    for (const p of persons) {
      const w = num(p.wages), b = num(p.business);
      const se = b > 0 ? b * 0.9235 : 0;
      const ssRoom = Math.max(0, P.ssWageBase - w);
      const tax = 0.124 * Math.min(se, ssRoom) + 0.029 * se;
      wages += w; seNet += b; seTax += tax; seHalf += tax / 2; seEarnings += se;
      withheld += num(p.withheld); estimated += num(p.estimated); stateWithheld += num(p.stateWithheld) + num(p.localWithheld);
      medicareBase += (num(p.medicareWages) > 0 ? num(p.medicareWages) : w);
      earnedPerson.push(Math.max(0, w + b - tax / 2));
    }
    const earned = Math.max(0, wages + seNet - seHalf);

    // Investment and other income, capital gain netting
    const interest = num(inp.interest), ordDiv = num(inp.ordDividends), qualDiv = num(inp.qualDividends);
    const passive = num(inp.passive), st1 = num(inp.stGain), lt1 = num(inp.ltGain), other = num(inp.otherIncome);
    const net = st1 + lt1;
    let ordinaryCap, ltPref;
    if (net >= 0) {
      ltPref = Math.max(0, lt1 + Math.min(st1, 0));
      ordinaryCap = Math.max(0, st1 + Math.min(lt1, 0));
    } else {
      ltPref = 0;
      ordinaryCap = Math.max(net, st === 'mfs' ? -1500 : -3000);
    }
    const prefIncome = qualDiv + ltPref;
    const incomeNoSS = wages + seNet + interest + ordDiv + qualDiv + passive + ordinaryCap + ltPref + other;

    // Adjustments to income
    const ages = persons.map((p) => num(p.age));
    const iraLimit = P.ira.limit + (ages.some((a) => a >= 50) ? P.ira.catchUp : 0);
    const iraDed = Math.min(num(ded.ira), iraLimit * persons.length, earned);
    const adj1 = seHalf + iraDed + num(inp.otherAdjustments);

    // Taxable Social Security
    const ss = num(inp.ssIncome);
    let ssTaxable = 0;
    if (ss > 0) {
      const prov = incomeNoSS - adj1 + 0.5 * ss;
      const [b1, b2] = joint ? [32000, 44000] : st === 'mfs' ? [0, 0] : [25000, 34000];
      if (prov > b2) ssTaxable = Math.min(0.85 * ss, 0.85 * (prov - b2) + Math.min(0.5 * ss, 0.5 * (b2 - b1)));
      else if (prov > b1) ssTaxable = Math.min(0.5 * ss, 0.5 * (prov - b1));
    }
    const totalIncome = incomeNoSS + ssTaxable;
    const agiBeforeSL = totalIncome - adj1;

    // Student loan interest
    let slDed = 0;
    if (st !== 'mfs' && num(ded.studentLoan) > 0) {
      const [lo, hi] = P.studentLoan[key(st)] || P.studentLoan.single;
      const frac = agiBeforeSL <= lo ? 1 : agiBeforeSL >= hi ? 0 : (hi - agiBeforeSL) / (hi - lo);
      slDed = Math.min(2500, num(ded.studentLoan)) * frac;
    }
    const agi = agiBeforeSL - slDed;
    const magi = agi;

    // New 2025-2028 deductions (tips, overtime, car loan interest, seniors)
    const jointLike = joint;
    const over = (thr) => Math.max(0, magi - thr);
    const tipsDed = Math.max(0, Math.min(num(ded.tips), 25000) - (over(jointLike ? 300000 : 150000) / 1000) * 100);
    const otDed = Math.max(0, Math.min(num(ded.overtime), jointLike ? 25000 : 12500) - (over(jointLike ? 300000 : 150000) / 1000) * 100);
    const carDed = Math.max(0, Math.min(num(ded.carLoan), 10000) - (over(jointLike ? 200000 : 100000) / 1000) * 200);
    const seniors = st === 'mfs' ? 0 : ages.filter((a) => a >= 65).length;
    const seniorDed = seniors * Math.max(0, 6000 - 0.06 * over(jointLike ? 150000 : 75000));
    const special = tipsDed + otDed + carDed + seniorDed;

    // Standard versus itemized deduction
    const marriedStd = st === 'mfj' || st === 'mfs' || st === 'qw';
    const stdBase = P.stdDed[st] + ages.filter((a) => a >= 65).length * (marriedStd ? P.stdAddMarried : P.stdAddUnmarried);
    const stateTaxEst = Math.max((num(inp.stateRate) / 100) * (totalIncome), stateWithheld);
    const saltTotal = num(ded.realEstate) + stateTaxEst;
    const saltCapBase = st === 'mfs' ? P.salt.cap / 2 : P.salt.cap;
    const saltThr = st === 'mfs' ? P.salt.thr / 2 : P.salt.thr;
    const saltFloor = st === 'mfs' ? P.salt.floor / 2 : P.salt.floor;
    const saltCap = Math.max(saltFloor, saltCapBase - 0.3 * Math.max(0, magi - saltThr));
    const saltDed = Math.min(saltTotal, saltCap);
    let charity = num(ded.charity);
    if (inp.year === 2026) charity = Math.max(0, charity - 0.005 * Math.max(0, agi));
    let itemized = num(ded.mortgage) + saltDed + charity + num(ded.other);
    let deduction = stdBase;
    let usedItemized = false;
    if (inp.year === 2026) {
      // Higher earners in the top bracket lose 2/37 of the excess over the 37% threshold.
      const top = bracketsFor(2026, st)[5][0];
      const tentative = Math.max(0, agi - itemized - special);
      itemized -= (2 / 37) * Math.min(itemized, Math.max(0, tentative - top));
      const nonItemizerCharity = Math.min(num(ded.charity), joint ? 2000 : 1000);
      if (stdBase + nonItemizerCharity >= itemized) { deduction = stdBase + nonItemizerCharity; }
      else { deduction = itemized; usedItemized = true; }
    } else if (itemized > stdBase) { deduction = itemized; usedItemized = true; }

    const taxableBeforeQbi = Math.max(0, agi - deduction - special);

    // Qualified business income deduction (20%)
    let qbi = 0;
    if (seNet > 0) {
      const thr = P.qbi.thr[key(st)], range = P.qbi.range[key(st)];
      let frac = 1;
      if (taxableBeforeQbi > thr) frac = Math.max(0, 1 - (taxableBeforeQbi - thr) / range);
      const qbiIncome = Math.max(0, seNet - seHalf - 0);
      const base = 0.2 * qbiIncome * frac;
      qbi = Math.min(base, 0.2 * Math.max(0, taxableBeforeQbi - prefIncome));
    }
    const taxable = Math.max(0, taxableBeforeQbi - qbi);

    // Regular tax
    const pref = Math.min(prefIncome, taxable);
    const ordinaryPart = taxable - pref;
    const regular = ordinaryTax(ordinaryPart, inp.year, st) + preferentialTax(pref, ordinaryPart, inp.year, st);

    // Alternative minimum tax
    const am = P.amt;
    const amtAddBack = usedItemized ? saltDed : deduction;
    const amti = taxable + amtAddBack;
    const exemptBase = am.exempt[key(st)] || am.exempt.single;
    const exempt = Math.max(0, exemptBase - am.phaseRate * Math.max(0, amti - (am.phaseStart[key(st)] || am.phaseStart.single)));
    const amtBase = Math.max(0, amti - exempt);
    const amtPref = Math.min(pref, amtBase);
    const amtOrd = amtBase - amtPref;
    const brk = st === 'mfs' ? am.break / 2 : am.break;
    const tmt = 0.26 * Math.min(amtOrd, brk) + 0.28 * Math.max(0, amtOrd - brk) + preferentialTax(amtPref, amtOrd, inp.year, st);
    const amt = Math.max(0, tmt - regular);

    // Other taxes
    const medThr = joint ? 250000 : st === 'mfs' ? 125000 : 200000;
    const addlMedicare = 0.009 * Math.max(0, medicareBase + seEarnings - medThr);
    const nii = Math.max(0, interest + ordDiv + qualDiv + passive + Math.max(0, net));
    const niit = 0.038 * Math.min(nii, Math.max(0, magi - medThr));

    // Credits
    const childPhaseThr = joint ? 400000 : 200000;
    const reduction = magi > childPhaseThr ? 50 * Math.ceil((magi - childPhaseThr) / 1000) : 0;
    let ctcGross = Math.max(0, young * P.ctc + otherDeps * P.odc - reduction);
    const ctcKidsPart = Math.min(ctcGross, young * P.ctc);

    let care = 0;
    if (st !== 'mfs' && young > 0 && num(ded.childCare) > 0) {
      const cap = young >= 2 ? 6000 : 3000;
      const lowEarner = joint ? Math.min(...earnedPerson) : earnedPerson[0];
      const expenses = Math.min(num(ded.childCare), cap, lowEarner);
      const rate = agi <= 15000 ? 0.35 : Math.max(0.20, 0.35 - 0.01 * Math.ceil((agi - 15000) / 2000));
      care = expenses * rate;
    }

    let aotc = 0, aotcRefundable = 0;
    if (st !== 'mfs') {
      const students = (ded.tuition || []).map(num);
      const [lo, hi] = joint ? [160000, 180000] : [80000, 90000];
      const frac = magi <= lo ? 1 : magi >= hi ? 0 : (hi - magi) / (hi - lo);
      for (const e of students) { const c = Math.min(e, 2000) + 0.25 * Math.min(Math.max(e - 2000, 0), 2000); aotc += c * frac; }
      aotcRefundable = 0.4 * aotc;
    }
    const aotcNonref = aotc - aotcRefundable;

    const taxBeforeCredits = regular + amt;
    let room = taxBeforeCredits;
    const careUsed = Math.min(care, room); room -= careUsed;
    const aotcUsed = Math.min(aotcNonref, room); room -= aotcUsed;
    const ctcUsed = Math.min(ctcGross, room); room -= ctcUsed;
    const actc = Math.max(0, Math.min(ctcKidsPart - Math.min(ctcKidsPart, ctcUsed), young * P.actcMax, 0.15 * Math.max(0, earned - 2500)));

    const investIncome = interest + ordDiv + qualDiv + passive + Math.max(0, net);
    const eitc = investIncome > P.eitcInvestLimit ? 0 : eitcAmount(P, young, earned, agi, st, ages);

    const nonrefundableUsed = careUsed + aotcUsed + ctcUsed;
    const refundableCredits = actc + aotcRefundable + eitc;
    const totalTax = taxBeforeCredits - nonrefundableUsed + seTax + addlMedicare + niit;
    const payments = withheld + estimated;
    const balance = payments + refundableCredits - totalTax;

    return {
      wages, seNet, totalIncome, adjustments: adj1 + slDed, agi, deduction, usedItemized, special, qbi, taxable,
      regular, amt, niit, seTax, addlMedicare, taxBeforeCredits,
      credits: { ctc: ctcUsed + actc, care: careUsed, education: aotcUsed + aotcRefundable, eitc, nonrefundable: nonrefundableUsed, refundable: refundableCredits },
      creditsTotal: nonrefundableUsed + refundableCredits,
      totalTax, payments, balance,
      marginal: marginalRate(ordinaryPart, inp.year, st),
      detail: { ssTaxable, iraDed, slDed, tipsDed, otDed, carDed, seniorDed, saltDed, saltCap, stdBase, itemized, ctcGross, actc, aotc, pref, ordinaryPart, amti, amtExempt: exempt, tmt, ss },
    };
  }

  root.TaxEngine = { PARAMS, ordinaryTax, marginalRate, preferentialTax, compute };
})(typeof window !== 'undefined' ? window : globalThis);
