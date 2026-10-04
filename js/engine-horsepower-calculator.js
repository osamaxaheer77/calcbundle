'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('et-form')) return;
  const el = C.el;

  const LB = { pound: 1, ton: 1000 / 0.45359237, kilogram: 1 / 0.45359237 };       // pounds per unit (a ton is a metric ton)
  const SEC = { second: 1, minute: 60, hour: 3600, day: 86400 };
  const MPH = { mph: 1, kmph: 1 / 1.609344, mps: 3600 / 1609.344 };                // miles per hour per unit
  const WATTS_PER_HP = 745.7;

  function show(out, hp, lb, note) {
    if (!Number.isFinite(hp) || hp > 1e15) return C.error(out, 'That is too large to calculate. Check the numbers.');
    const shown = hp < 10 ? C.dec(hp, 2) : hp < 100 ? C.dec(hp, 1) : C.group(Math.round(hp));
    el(out).innerHTML = C.big('Estimated engine power', `${shown} horsepower`, `${C.group(Math.round(hp * WATTS_PER_HP))} watts`) +
      C.row('Horsepower', C.fixed(hp, 2)) + C.row('Kilowatts', C.fixed((hp * WATTS_PER_HP) / 1000, 2)) + C.row('Vehicle weight used', `${C.fixed(lb, 1)} lb`) + note;
  }
  const NOTE = C.note('This is an estimate of peak engine power, worked out from the performance of the whole vehicle. It is only as good as the numbers you put in.');

  function et() {
    const out = 'et-result', w = C.num('et-w'), t = C.num('et-t');
    if (w === null || !Number.isFinite(w) || !(w > 0)) return C.error(out, 'Enter the vehicle weight, more than 0.');
    if (t === null || !Number.isFinite(t) || !(t > 0)) return C.error(out, 'Enter the quarter mile time, more than 0.');
    const lb = w * LB[el('et-wu').value], sec = t * SEC[el('et-tu').value];
    // Horsepower = weight x (5.825 / ET) ^ 3, with weight in pounds and ET in seconds.
    show(out, lb * Math.pow(5.825 / sec, 3), lb, C.row('Elapsed time used', `${C.dec(sec, 3)} seconds`) + NOTE);
  }

  function trap() {
    const out = 'tp-result', w = C.num('tp-w'), s = C.num('tp-s');
    if (w === null || !Number.isFinite(w) || !(w > 0)) return C.error(out, 'Enter the vehicle weight, more than 0.');
    if (s === null || !Number.isFinite(s) || !(s > 0)) return C.error(out, 'Enter the trap speed, more than 0.');
    const lb = w * LB[el('tp-wu').value], mph = s * MPH[el('tp-su').value];
    // Horsepower = weight x (speed / 234) ^ 3, with weight in pounds and speed in miles per hour.
    show(out, lb * Math.pow(mph / 234, 3), lb, C.row('Speed used', `${C.dec(mph, 2)} mph`) + NOTE);
  }

  [['et-form', et], ['tp-form', trap]].forEach(([id, fn]) => {
    el(id).addEventListener('submit', (e) => { e.preventDefault(); fn(); });
    el(id).addEventListener('input', fn);
    el(id).addEventListener('change', fn);
    fn();
  });
})();
