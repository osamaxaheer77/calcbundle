'use strict';

(function () {
  const C = window.CalcCommon;
  if (!C || !C.el('mi-form')) return;
  const el = C.el;
  const MILE = 1609.344;
  // The free routing engine assumes slower highway speeds than the posted limits in the US.
  // This factor brings its driving time close to what map apps show for a car with no traffic.
  const TIME_FACTOR = 0.81;

  const cache = {};
  const store = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage may be blocked */ } };
  const load = (k) => { try { const s = sessionStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };

  async function getJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  async function geocode(text) {
    const key = 'cb-geo-' + text.toLowerCase();
    if (cache[key]) return cache[key];
    const saved = load(key);
    if (saved) { cache[key] = saved; return saved; }
    const j = await getJson('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=' + encodeURIComponent(text));
    if (!j.length) return null;
    const hit = { lat: Number(j[0].lat), lon: Number(j[0].lon), name: j[0].display_name.replace(/, United States$/, '') };
    cache[key] = hit; store(key, hit);
    return hit;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const from = el('mi-from').value.trim(), to = el('mi-to').value.trim();
    if (!from || !to) return C.error(out, 'Enter a place to start from and a place to go to.');
    if (from.length > 200 || to.length > 200) return C.error(out, 'Those place names are too long.');
    busy = true;
    const btn = el('mi-go'); btn.disabled = true;
    el(out).innerHTML = '<p style="font-size:14px;color:var(--text-secondary);">Finding the route...</p>';
    try {
      const a = await geocode(from);
      if (!a) return C.error(out, `Could not find "${from.replace(/</g, '&lt;')}" in the United States. Try adding the city and state.`);
      if (!cache['cb-geo-' + to.toLowerCase()] && !load('cb-geo-' + to.toLowerCase())) await wait(1100); // the place-search service allows one request a second
      const b = await geocode(to);
      if (!b) return C.error(out, `Could not find "${to.replace(/</g, '&lt;')}" in the United States. Try adding the city and state.`);
      const r = await getJson(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`);
      if (!r.routes || !r.routes[0]) return C.error(out, 'No driving route was found between those two places.');
      const miles = r.routes[0].distance / MILE, minutes = (r.routes[0].duration / 60) * TIME_FACTOR;
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const maps = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
      el(out).innerHTML = C.big('Total mileage', `${C.group(Math.round(miles))} mi`, `${C.group(Math.round(miles * 1.609344))} km`) +
        C.row('Driving time', duration(minutes)) +
        `<p style="font-size:13px;line-height:1.6;margin:12px 0 0;">Between <strong>${esc(a.name)}</strong> and <strong>${esc(b.name)}</strong>, by car, disregarding traffic. <a href="${maps}" target="_blank" rel="noopener">See the route and traffic in Google Maps</a>.</p>` +
        C.note('Distances and times are estimates. Place search and routing by OpenStreetMap data © OpenStreetMap contributors, using Nominatim and OSRM.');
    } catch (e) {
      C.error(out, 'The routing service did not respond. Please try again in a moment.');
    } finally { busy = false; btn.disabled = false; }
  }
  el('mi-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });
})();
