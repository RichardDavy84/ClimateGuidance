import { initTutorial } from '../tutorial.js';
import { tonnes, atmosphericHistory, duration } from './model.js';
const $ = id => document.getElementById(id), ns = 'http://www.w3.org/2000/svg';
const number = value => new Intl.NumberFormat('en', { maximumSignificantDigits: 3 }).format(value);
const amountInput = $('amount'), unitInput = $('amount-unit'), mode = $('map-mode'), regions = $('region-select'), map = $('world-map');
let atmosphere, emissions, constants, geography, selected = 'global';
function element(tag, attrs = {}, text) {
  const e = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
  if (text) e.textContent = text;
  return e;
}
function currentRegion() {
  if (selected === 'global') return { id: 'global', name: 'Global', annualMt: emissions.globalMt };
  return (mode.value === 'continent' ? emissions.continents : emissions.countries).find(c => c.id === selected);
}
function regionChoices() {
  regions.replaceChildren();
  const choices = [{ id: 'global', name: 'Global' }, ...(mode.value === 'continent' ? emissions.continents : emissions.countries)];
  for (const c of choices) { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; regions.append(o); }
  regions.value = selected;
}
function historyChart(r) {
  const svg = $('history-chart'); svg.replaceChildren();
  const series = atmosphere.series, first = series[0], last = series.at(-1);
  const x = year => 55 + (year - first.year) / (last.year - first.year) * 595, y = ppm => 225 - (ppm - 300) / (440 - 300) * 195;
  svg.append(element('title', {}, `Mauna Loa annual CO₂, ${first.year}–${last.year}; the marked point shows the concentration comparison.`));
  for (const ppm of [320, 360, 400, 440]) {
    svg.append(element('path', { d: `M55 ${y(ppm)}H650`, stroke: '#d7e2df' }), element('text', { x: 44, y: y(ppm) + 4, 'text-anchor': 'end' }, String(ppm)));
  }
  for (const year of [1960, 1980, 2000, last.year]) svg.append(element('text', { x: x(year), y: 249, 'text-anchor': 'middle' }, String(year)));
  svg.append(element('text', { x: 55, y: 17 }, 'Atmospheric CO₂ (ppm)'), element('path', { d: series.map((v, i) => `${i ? 'L' : 'M'}${x(v.year)},${y(v.ppm)}`).join(' '), fill: 'none', stroke: '#487e85', 'stroke-width': 3 }));
  if (r?.year !== undefined) {
    svg.append(element('path', { d: `M55 ${y(r.targetPpm)}H${x(r.year)}V225`, fill: 'none', stroke: '#28785b', 'stroke-dasharray': '5 4' }), element('circle', { cx: x(r.year), cy: y(r.targetPpm), r: 5, fill: '#28785b' }));
  }
}
function render() {
  const region = currentRegion();
  $('map-label').textContent = `Selected: ${region.name}`;
  for (const path of map.querySelectorAll('path')) {
    const active = selected !== 'global' && (mode.value === 'country' ? path.dataset.id === selected : path.dataset.continent === selected);
    path.classList.toggle('selected', active); path.setAttribute('aria-pressed', String(active));
  }
  let amount;
  try { amount = tonnes(amountInput.value, unitInput.value); amountInput.removeAttribute('aria-invalid'); }
  catch (error) {
    amountInput.setAttribute('aria-invalid', 'true'); $('atmosphere-result').textContent = '—'; $('region-result').textContent = '—';
    $('atmosphere-caption').textContent = error.message; $('region-caption').textContent = ''; historyChart(); return;
  }
  const r = atmosphericHistory(amount, atmosphere.series, constants.gigatonnesCO2PerPpm);
  if (r.boundary === 'exceeds-atmosphere') {
    $('atmosphere-result').textContent = 'More than the atmospheric stock';
    $('atmosphere-caption').textContent = 'This amount exceeds all atmospheric CO₂ in the selected baseline. There is no historical concentration match.';
  } else if (r.boundary === 'before-record') {
    $('atmosphere-result').textContent = `Before the ${r.first.year} annual record`;
    $('atmosphere-caption').textContent = `The implied ${number(r.targetPpm)} ppm is below our earliest annual observation (${r.first.ppm} ppm). We do not extrapolate to an earlier date.`;
  } else {
    $('atmosphere-result').textContent = amount === 0 ? `${r.latest.year} baseline — no change` : r.yearsBack < .5 ? 'Within the latest annual average' : `Around ${Math.round(r.year)}`;
    $('atmosphere-caption').textContent = `A reduction of ${r.changePpm > 0 && r.changePpm < .01 ? r.changePpm.toExponential(1) : number(r.changePpm)} ppm from the ${r.latest.year} annual average (${r.latest.ppm} ppm). This compares atmospheric stocks; it does not rewind the climate.`;
  }
  historyChart(r);
  const d = duration(amount, region.annualMt, constants.daysPerYear);
  $('region-result').textContent = d ? `About ${number(d.value)} ${d.value === 1 ? d.unit.replace(/s$/, '') : d.unit} of ${region.name === 'Global' ? 'global' : region.name + '’s'} emissions` : 'No comparable annual emissions available';
  $('region-caption').textContent = `${emissions.year} fossil-fuel and industrial CO₂${region.annualMt != null ? `: ${number(region.annualMt / 1000)} GtCO₂/year` : ''}. Land-use change is excluded.${selected === 'global' ? ' Includes international aviation and shipping.' : ' International aviation and shipping are not allocated to countries or continents.'}`;
}
function selectRegion(id) { selected = id; regionChoices(); render(); }
function buildMap() {
  map.replaceChildren();
  map.append(element('title', {}, 'Click a country, or use the Region menu. In continent mode, a click selects the entire continent.'));
  const countryIds = new Set(emissions.countries.map(c => c.id));
  for (const f of geography.features) {
    if (f.continent === 'Antarctica') continue;
    const d = f.polygons.flatMap(poly => poly.map(ring => ring.map(([lon, lat], i) => `${i ? 'L' : 'M'}${((lon + 180) / 360 * 1000).toFixed(2)},${((90 - lat) / 180 * 500).toFixed(2)}`).join(' ') + 'Z')).join(' ');
    const path = element('path', { d, 'data-id': f.id, 'data-continent': f.continent, 'aria-label': f.name, 'aria-pressed': 'false', role: 'button', tabindex: '-1' });
    path.append(element('title', {}, f.name));
    const available = countryIds.has(f.id);
    path.classList.toggle('unavailable', !available);
    function choose() {
      if (mode.value === 'continent' && emissions.continents.some(c => c.id === f.continent)) selectRegion(f.continent);
      else if (available) selectRegion(f.id);
      else $('map-hover').textContent = `${f.name}: no comparable data in this snapshot.`;
    }
    path.addEventListener('click', choose);
    path.addEventListener('pointerenter', () => { $('map-hover').textContent = mode.value === 'continent' ? f.continent : f.name; });
    path.addEventListener('pointerleave', () => { $('map-hover').textContent = 'Choose a region on the map or from the menu.'; });
    map.append(path);
  }
}
function explanatoryText() {
  $('time-method').textContent = `For atmospheric history, we divide the amount by ${number(constants.gigatonnesCO2PerPpm)} billion tonnes of CO₂ per ppm, subtract that concentration from the ${atmosphere.series.at(-1).year} annual mean, then interpolate between observed annual means. For a region, we divide the amount by its ${emissions.year} annual emissions. We hold that rate constant only to express the comparison as a duration.`;
  const sourceBox = $('time-sources');
  for (const [label, url, text] of [
    ['NOAA Mauna Loa annual means', atmosphere.url, ` · ${atmosphere.series[0].year}–${atmosphere.series.at(-1).year}. Direct measurements began in 1958; the first complete annual mean is 1959. Mauna Loa is a concentration proxy, not the global annual mean. NOAA used nearby Maunakea measurements during the 2022–23 interruption.`],
    ['Global Carbon Budget via Our World in Data', emissions.url, ` · ${emissions.year} territorial fossil-fuel and industrial CO₂. Continents sum the country/territory records. Global adds ${number(emissions.internationalMt / 1000)} GtCO₂ from international aviation and shipping. This differs from the book’s rounded 40 Gt benchmark, which includes land-use emissions.`],
    ['Physical conversion: Global Carbon Budget 2025', constants.url, ' · 1 ppm = 2.124 GtC; using the book’s 44/12 convention gives 7.788 GtCO₂ (about 7.8).'],
    ['Map: Natural Earth', geography.url, ' · Public-domain country outlines. Continents use its geographic assignments; small territories and Kosovo have documented mappings.'],
    ['Download the source manifest', '/counting-carbon/data/time-data-manifest.json', ` · Snapshots retrieved ${emissions.retrieved}. Values are versioned locally, not live feeds.`],
  ]) { const p = document.createElement('p'), a = document.createElement('a'); a.href = url; a.textContent = label; p.append(a, text); sourceBox.append(p); }
}
try {
  [atmosphere, emissions, constants, geography] = await Promise.all(['atmosphere.json', 'emissions.json', 'physical-constants.json', 'world-map.json'].map(async file => { const r = await fetch('/counting-carbon/data/' + file); if (!r.ok) throw Error(); return r.json(); }));
  regionChoices(); buildMap(); explanatoryText(); render();
  for (const input of [amountInput, unitInput]) input.addEventListener('input', render);
  mode.addEventListener('change', () => selectRegion('global'));
  regions.addEventListener('change', () => { selected = regions.value; render(); });
  $('global-reset').addEventListener('click', () => selectRegion('global'));
} catch { $('atmosphere-result').textContent = 'Data could not load'; $('atmosphere-caption').textContent = 'Please reload the page to try again.'; }

initTutorial("time");
