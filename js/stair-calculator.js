'use strict';

(function () {
  const B = window.BuildCommon;
  if (!B || !B.el('st-form')) return;
  const el = B.el;
  const EPS = 1e-9;
  const MAX_STEPS = 1000;
  const IN = (id, unitId) => B.num(id) * B.LEN[el(unitId).value] / 0.0254; // field value in inches

  // ---- Full calculator -------------------------------------------------------------------
  function run() {
    const out = 'st-result';
    const totalMode = el('st-rtype').value === 'total';
    const H = IN('st-h', 'st-h-unit');
    const runIn = totalMode ? IN('st-trun', 'st-trun-unit') : IN('st-run', 'st-run-unit');
    if (!(H > 0)) return B.error(out, 'Enter the total rise, more than 0.');
    if (!(runIn > 0)) return B.error(out, totalMode ? 'Enter the total run, more than 0.' : 'Enter the run (the depth of one step), more than 0.');

    const flush = el('st-mount').value === 'f';
    const byRise = el('st-rmode').value === 'rise';
    let rise, risers, steps, first;
    if (byRise) {
      rise = IN('st-rise', 'st-rise-unit');
      if (!(rise > 0)) return B.error(out, 'Enter the rise (step height), more than 0.');
      if (rise >= H - EPS) return B.error(out, 'The rise has to be less than the total rise, or there is no stair to build.');
      risers = Math.ceil(H / rise - EPS);
      if (risers > MAX_STEPS) return B.error(out, `That makes more than ${B.group(MAX_STEPS)} steps. Check the units.`);
      first = H - (risers - 1) * rise;
      steps = flush ? risers : risers - 1;
    } else {
      steps = B.num('st-steps');
      if (!(steps > 0)) return B.error(out, 'Enter the number of steps, more than 0.');
      if (steps > MAX_STEPS) return B.error(out, `Use ${B.group(MAX_STEPS)} steps or fewer.`);
      risers = flush ? steps : steps + 1;
      rise = H / risers;
      first = rise;
    }
    const runEach = totalMode ? runIn / steps : runIn;
    const totalRun = totalMode ? runIn : runIn * steps;

    let t = 0;
    const hasTread = el('st-tread').value === 'yes';
    if (hasTread) {
      t = IN('st-tt', 'st-tt-unit');
      if (!(t > 0)) return B.error(out, 'Enter the tread thickness, more than 0.');
    }
    const stringerH = (flush ? H : H - rise) - t;
    if (!(stringerH > 0)) return B.error(out, 'The tread is too thick for this rise.');
    const stringerL = Math.hypot(stringerH, totalRun);
    const angle = (Math.atan(rise / runEach) * 180) / Math.PI;

    let html = B.big('Rise (step height)', B.lengthText(rise), `${B.dec(steps, 2)} steps, ${B.fixed(angle, 2)}° angle`);
    html += B.row('Rise', B.lengthText(rise));
    if (byRise && !hasTread) html += B.row('First step height', B.lengthText(first));
    html += B.row(totalMode ? 'Run (each step)' : 'Total run', B.lengthText(totalMode ? runEach : totalRun));
    html += B.row('Number of steps', B.dec(steps, 2));
    html += B.row('Stringer length', B.lengthText(stringerL));
    html += B.row('Stringer height', B.lengthText(stringerH));
    html += B.row('Angle', B.fixed(angle, 2) + '°');

    if (el('st-head').value === 'yes') {
      const opening = IN('st-fo', 'st-fo-unit'), floorT = IN('st-ft', 'st-ft-unit'), need = IN('st-hr', 'st-hr-unit');
      if (!(opening > 0)) return B.error(out, 'Enter the length of the floor opening, more than 0.');
      if (!(floorT > 0)) return B.error(out, 'Enter the floor thickness, more than 0.');
      if (!(need > 0)) return B.error(out, 'Enter the headroom you need, more than 0.');
      const clear = H - floorT; // height of the underside of the upper floor above the lower floor
      const x = totalRun - opening; // where the opening starts, measured along the run
      const k = x <= 0 ? 0 : Math.ceil(x / runEach - EPS);
      const stairAt = k === 0 ? 0 : first + (k - 1) * rise;
      const headroom = clear - stairAt;
      const met = headroom >= need - EPS;
      html += B.row('Headroom', B.lengthText(headroom));
      html += B.row('Headroom requirement', met ? 'Met' : 'Not met');
      if (!met) {
        const allow = clear - need;
        if (allow < 0) html += `<p style="font-size:13px;margin:10px 0 0;">The headroom you need is more than the height of the floor above.</p>`;
        else {
          const kmax = allow < first - EPS ? 0 : 1 + Math.floor((allow - first) / rise + EPS);
          html += B.row('Floor opening needed', 'at least ' + B.lengthText(totalRun - kmax * runEach));
        }
      }
    }
    if (hasTread) {
      const firstNoTread = first - t;
      html += B.row('First step height', firstNoTread > EPS ? B.lengthText(firstNoTread) : `Made up of the ${B.lengthText(t)} thick tread`);
      html += B.row('First step height with tread', B.lengthText(first));
      if (!flush) html += B.row('Stringer placement (L)', B.lengthText(rise + t));
      if (t > rise + EPS) html += `<p style="font-size:13px;margin:10px 0 0;">The tread is thicker than the rise, which is unusual. Check your numbers.</p>`;
    }
    el(out).innerHTML = html;
  }

  // ---- Basic version ---------------------------------------------------------------------
  function basic() {
    const out = 'sb-result';
    const totalMode = el('sb-rtype').value === 'total';
    const H = IN('sb-h', 'sb-h-unit');
    const runIn = totalMode ? IN('sb-trun', 'sb-trun-unit') : IN('sb-run', 'sb-run-unit');
    if (!(H > 0)) return B.error(out, 'Enter the total rise, more than 0.');
    if (!(runIn > 0)) return B.error(out, totalMode ? 'Enter the total run, more than 0.' : 'Enter the run, more than 0.');
    const lo = Math.max(2, Math.ceil(H / 10 - EPS)), hi = Math.floor(H / 5 + EPS);
    if (lo > hi) return B.error(out, 'A rise this small probably does not need a stair.');
    if (hi - lo > 200) return B.error(out, 'That is a very tall rise. Check the units.');
    const cm = (v) => B.fixed(v * 2.54, 2);
    const rows = [];
    for (let risers = lo; risers <= hi; risers++) {
      const n = risers - 1, rise = H / risers;
      const each = totalMode ? runIn / n : runIn, tot = totalMode ? runIn : runIn * n;
      const sh = n * rise, sl = Math.hypot(sh, tot), ang = (Math.atan(rise / each) * 180) / Math.PI;
      rows.push(`<tr><td>${n}</td><td>${risers}</td><td>${B.dec(rise, 2)} in (${cm(rise)} cm)</td><td>${B.dec(totalMode ? each : tot, 2)} in (${cm(totalMode ? each : tot)} cm)</td><td>${B.dec(sl, 2)} in (${cm(sl)} cm)</td><td>${B.dec(sh, 2)} in (${cm(sh)} cm)</td><td>${B.fixed(ang, 2)}°</td></tr>`);
    }
    el(out).innerHTML = `<p style="font-size:13px;margin:0 0 10px;">Choices that keep the rise between 5 and 10 inches.</p><div class="schedule-table-wrap"><table class="schedule-table"><thead><tr><th>Steps</th><th>Risers</th><th>Rise</th><th>${totalMode ? 'Run' : 'Total run'}</th><th>Stringer length</th><th>Stringer height</th><th>Angle</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function applyMode() {
    el('st-run-box').style.display = el('st-rtype').value === 'one' ? '' : 'none';
    el('st-trun-box').style.display = el('st-rtype').value === 'total' ? '' : 'none';
    el('st-rise-box').style.display = el('st-rmode').value === 'rise' ? '' : 'none';
    el('st-steps-box').style.display = el('st-rmode').value === 'steps' ? '' : 'none';
    el('st-tread-box').style.display = el('st-tread').value === 'yes' ? '' : 'none';
    el('st-head-box').style.display = el('st-head').value === 'yes' ? '' : 'none';
    el('sb-run-box').style.display = el('sb-rtype').value === 'one' ? '' : 'none';
    el('sb-trun-box').style.display = el('sb-rtype').value === 'total' ? '' : 'none';
  }
  el('st-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  el('sb-form').addEventListener('submit', (e) => { e.preventDefault(); basic(); });
  el('st-form').addEventListener('input', run);
  el('sb-form').addEventListener('input', basic);
  const onChange = (fn) => () => { applyMode(); fn(); };
  el('st-form').addEventListener('change', onChange(run));
  el('sb-form').addEventListener('change', onChange(basic));
  applyMode();
  run();
  basic();
})();
