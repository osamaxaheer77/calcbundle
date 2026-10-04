'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('mi-form')) return;
  const el = C.el;
  const MILE = 1609.344;
  // The free routing engine assumes slower highway speeds than the posted limits in the US.
  // This factor brings its driving time close to what map apps show for a car with no traffic.
  const TIME_FACTOR = 0.81;
  const US_BOX = '-171.8,18.9,-66.9,71.5'; // the United States including Alaska and Hawaii
  const PLACE_TYPES = { city: 0, town: 0, village: 0, state: 0, locality: 1, district: 1, county: 2 };

  const store = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage may be blocked */ } };
  const load = (k) => { try { const s = sessionStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function getJson(url, signal) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    if (signal) signal.addEventListener('abort', () => ctl.abort());
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  // ---- Place suggestions (Photon, built for search-as-you-type) ----
  function labelOf(p) {
    const parts = [];
    if (p.housenumber && p.street) parts.push(p.name && p.name !== p.street ? p.name : null, `${p.housenumber} ${p.street}`);
    else parts.push(p.name || p.street);
    if (p.city && !parts.includes(p.city) && p.city !== p.name) parts.push(p.city);
    if (p.state && !parts.includes(p.state)) parts.push(p.state);
    return parts.filter(Boolean).join(', ');
  }
  async function search(q, signal) {
    const key = 'cb-ph-' + q.toLowerCase();
    const saved = load(key);
    if (saved) return saved;
    const j = await getJson(`https://photon.komoot.io/api/?lang=en&limit=10&bbox=${US_BOX}&q=${encodeURIComponent(q)}`, signal);
    const seen = new Set(), list = [];
    (j.features || []).forEach((f, i) => {
      const p = f.properties || {};
      if (p.countrycode !== 'US' || !f.geometry) return;
      const label = labelOf(p);
      if (!label || seen.has(label)) return;
      seen.add(label);
      list.push({ label, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], rank: PLACE_TYPES[p.type] ?? 3, i });
    });
    list.sort((a, b) => a.rank - b.rank || a.i - b.i);
    const out = list.slice(0, 6);
    store(key, out);
    return out;
  }

  // ---- The dropdown on each box ----
  function attach(inputId) {
    const input = el(inputId), list = el(inputId + '-list');
    let items = [], active = -1, timer = null, ctl = null;
    const close = () => { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; input.removeAttribute('aria-activedescendant'); };
    const mark = () => {
      [...list.children].forEach((li, i) => { li.setAttribute('aria-selected', i === active ? 'true' : 'false'); li.classList.toggle('is-active', i === active); });
      if (active >= 0) input.setAttribute('aria-activedescendant', list.children[active].id); else input.removeAttribute('aria-activedescendant');
    };
    function pick(i) {
      const it = items[i];
      if (!it) return;
      input.value = it.label;
      input.dataset.lat = it.lat; input.dataset.lon = it.lon; input.dataset.label = it.label;
      close();
    }
    function show(found) {
      items = found; list.innerHTML = '';
      found.forEach((it, i) => {
        const li = document.createElement('li');
        li.id = `${inputId}-opt${i}`; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', 'false');
        li.textContent = it.label;
        li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(i); });
        list.appendChild(li);
      });
      list.hidden = !found.length; input.setAttribute('aria-expanded', found.length ? 'true' : 'false'); active = -1;
    }
    input.addEventListener('input', () => {
      delete input.dataset.lat; delete input.dataset.lon; delete input.dataset.label;
      clearTimeout(timer);
      if (ctl) ctl.abort();
      const q = input.value.trim();
      if (q.length < 3) { close(); return; }
      timer = setTimeout(async () => {
        ctl = new AbortController();
        try { const found = await search(q, ctl.signal); if (input.value.trim() === q) show(found); } catch (e) { /* suggestions are optional */ }
      }, 250);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (list.hidden || !items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % items.length; mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + items.length) % items.length; mark(); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
    });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }
  attach('mi-from'); attach('mi-to');

  // ---- Turning what was typed into a point ----
  async function locate(input) {
    if (input.dataset.lat) return { lat: Number(input.dataset.lat), lon: Number(input.dataset.lon), name: input.dataset.label };
    const text = input.value.trim();
    try {
      const found = await search(text);
      if (found.length) return { lat: found[0].lat, lon: found[0].lon, name: found[0].label };
    } catch (e) { /* fall back to the other service */ }
    const key = 'cb-geo-' + text.toLowerCase();
    let hit = load(key);
    if (!hit) {
      await wait(1100); // the place-search service allows one request a second
      const j = await getJson('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=' + encodeURIComponent(text));
      if (!j.length) return null;
      hit = { lat: Number(j[0].lat), lon: Number(j[0].lon), name: j[0].display_name.replace(/, United States$/, '') };
      store(key, hit);
    }
    return hit;
  }

  function duration(minutes) {
    const total = Math.round(minutes);
    const d = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60;
    const parts = [];
    if (d) parts.push(C.plural(d, 'day'));
    parts.push(C.plural(h, 'hour'));
    if (!d) parts.push(`${m} min${m === 1 ? '' : 's'}`);
    return parts.join(' ');
  }

  let busy = false;
  async function run() {
    if (busy) return;
    const out = 'mi-result';
    const fromEl = el('mi-from'), toEl = el('mi-to');
    const from = fromEl.value.trim(), to = toEl.value.trim();
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!from || !to) return C.error(out, 'Enter a place to start from and a place to go to.');
    if (from.length > 200 || to.length > 200) return C.error(out, 'Those place names are too long.');
    busy = true;
    const btn = el('mi-go'); btn.disabled = true;
    el(out).innerHTML = '<p style="font-size:14px;color:var(--text-secondary);">Finding the route...</p>';
    try {
      const a = await locate(fromEl);
      if (!a) return C.error(out, `Could not find "${esc(from)}" in the United States. Try adding the city and state.`);
      const b = await locate(toEl);
      if (!b) return C.error(out, `Could not find "${esc(to)}" in the United States. Try adding the city and state.`);
      const r = await getJson(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`);
      if (!r.routes || !r.routes[0]) return C.error(out, 'No driving route was found between those two places.');
      const miles = r.routes[0].distance / MILE, minutes = (r.routes[0].duration / 60) * TIME_FACTOR;
      const maps = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(a.name || from)}&destination=${encodeURIComponent(b.name || to)}`;
      el(out).innerHTML = C.big('Total mileage', `${C.group(Math.round(miles))} mi`, `${C.group(Math.round(miles * 1.609344))} km`) +
        C.row('Driving time', duration(minutes)) +
        `<p style="font-size:13px;line-height:1.6;margin:12px 0 0;">Between <strong>${esc(a.name)}</strong> and <strong>${esc(b.name)}</strong>, by car, disregarding traffic. <a href="${maps}" target="_blank" rel="noopener">See the route and traffic in Google Maps</a>.</p>` +
        C.note('Distances and times are estimates. Place search and routing use OpenStreetMap data © OpenStreetMap contributors, through the Photon, Nominatim and OSRM services.');
    } catch (e) {
      C.error(out, 'The routing service did not respond. Please try again in a moment.');
    } finally { busy = false; btn.disabled = false; }
  }
  el('mi-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
})();
