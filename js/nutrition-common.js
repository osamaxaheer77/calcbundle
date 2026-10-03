'use strict';

// Shared inputs and energy maths for the Carbohydrate, Protein and Fat Intake calculators.
window.NutritionCommon = (function () {
  const el = (id) => document.getElementById(id);
  const LB_PER_KG = 2.2046226218;

  function num(id) {
    const raw = el(id).value.trim();
    if (raw === '') return NaN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : NaN;
  }

  // Basal metabolic rate: Mifflin-St Jeor, or Katch-McArdle when body fat is known.
  function bmr(formula, male, kg, cm, age, fatPct) {
    if (formula === 'k') return 370 + 21.6 * (1 - fatPct / 100) * kg;
    return 10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161);
  }

  // Reads the shared form. `p` is the id prefix, for example "cb" for ids like cb-age.
  function read(p) {
    const form = el(p + '-form');
    const male = form.querySelector(`input[name="${p}-sex"]:checked`).value === 'm';
    const us = el(p + '-units').value === 'us';
    const age = num(p + '-age');
    if (!Number.isInteger(age) || age < 18 || age > 80) return { err: 'Enter an age from 18 to 80 as a whole number.' };
    let cm, kg;
    if (us) {
      const ft = el(p + '-ft').value.trim() === '' ? 0 : num(p + '-ft'), inch = el(p + '-in').value.trim() === '' ? 0 : num(p + '-in'), lb = num(p + '-lb');
      if (!Number.isFinite(ft) || !Number.isFinite(inch) || ft < 0 || inch < 0 || ft * 12 + inch <= 0) return { err: 'Enter your height, more than 0.' };
      if (!(lb > 0)) return { err: 'Enter your weight, more than 0.' };
      cm = (ft * 12 + inch) * 2.54;
      kg = lb / LB_PER_KG;
    } else {
      cm = num(p + '-cm'); kg = num(p + '-kg');
      if (!(cm > 0)) return { err: 'Enter your height, more than 0.' };
      if (!(kg > 0)) return { err: 'Enter your weight, more than 0.' };
    }
    const formula = el(p + '-formula').value;
    const fat = num(p + '-fat');
    if (formula === 'k' && !(fat >= 0 && fat < 100)) return { err: 'Enter your body fat percentage, from 0 to 99.' };
    const activity = parseFloat(el(p + '-activity').value);
    const maintain = bmr(formula, male, kg, cm, age, fat) * activity;
    const step = 500; // 1 lb or 0.5 kg a week is about 500 Calories a day
    const unit = us ? 'lb' : 'kg';
    const goals = us
      ? [['Weight maintenance', 0, 'maintain your weight'], ['Lose 1 lb/week', -step, 'lose 1 lb per week'], ['Lose 2 lb/week', -2 * step, 'lose 2 lb per week'], ['Gain 1 lb/week', step, 'gain 1 lb per week'], ['Gain 2 lb/week', 2 * step, 'gain 2 lb per week']]
      : [['Weight maintenance', 0, 'maintain your weight'], ['Lose 0.5 kg/week', -step, 'lose 0.5 kg per week'], ['Lose 1 kg/week', -2 * step, 'lose 1 kg per week'], ['Gain 0.5 kg/week', step, 'gain 0.5 kg per week'], ['Gain 1 kg/week', 2 * step, 'gain 1 kg per week']];
    return { male, us, age, cm, kg, formula, fat, activity, maintain, unit, goals: goals.map(([label, delta, phrase]) => ({ label, delta, phrase, cal: maintain + delta })) };
  }

  // Unit switch, formula switch and the unit-aware field conversion that every page repeats.
  function wire(p, run) {
    const form = el(p + '-form');
    function apply() {
      const us = el(p + '-units').value === 'us';
      el(p + '-us').style.display = us ? '' : 'none';
      el(p + '-metric').style.display = us ? 'none' : '';
      el(p + '-fat-box').style.display = el(p + '-formula').value === 'k' ? '' : 'none';
    }
    el(p + '-units').addEventListener('change', () => {
      const us = el(p + '-units').value === 'us';
      if (us) {
        const cm = num(p + '-cm'), kg = num(p + '-kg');
        if (Number.isFinite(cm)) { const t = cm / 2.54; el(p + '-ft').value = Math.floor(t / 12); el(p + '-in').value = Math.round((t % 12) * 10) / 10; }
        if (Number.isFinite(kg)) el(p + '-lb').value = Math.round(kg * LB_PER_KG * 10) / 10;
      } else {
        const ft = num(p + '-ft') || 0, inch = num(p + '-in') || 0, lb = num(p + '-lb');
        el(p + '-cm').value = Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
        if (Number.isFinite(lb)) el(p + '-kg').value = Math.round((lb / LB_PER_KG) * 10) / 10;
      }
      apply(); run();
    });
    el(p + '-formula').addEventListener('change', () => { apply(); run(); });
    el(p + '-activity').addEventListener('change', run);
    form.querySelectorAll(`input[name="${p}-sex"]`).forEach((n) => n.addEventListener('change', run));
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    apply();
    run();
  }

  const group = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const whole = (v) => group(Math.round(v));
  return { read, wire, LB_PER_KG, group, whole, el };
})();
