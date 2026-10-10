import { initTutorial } from '../tutorial.js';
import { calculate } from './model.js';
const $ = id => document.getElementById(id);
const quantity = $('quantity'), select = $('equivalence'), search = $('search'), result = $('claim-result'), details = $('claim-details'), qualifier = $('claim-qualifier'), controls = $('parameters');
const fmt = n => new Intl.NumberFormat('en', { maximumSignificantDigits: 3 }).format(n);
let items = [], selected, params = {};
const saved = new Map();
function paragraph(text, parent = details) { const p = document.createElement('p'); p.textContent = text; parent.append(p); }
function control(key, label, value, options, type = 'number') {
  const wrapper = document.createElement('label'); wrapper.textContent = label;
  const input = document.createElement(options ? 'select' : 'input'); input.id = `assumption-${key}`;
  if (options) for (const [v, text] of options) { const o = document.createElement('option'); o.value = v; o.textContent = text; input.append(o); }
  else { input.type = type; input.min = '0'; input.step = 'any'; if (key === 'survival') input.max = '100'; }
  input.value = value; params[key] = value;
  input.addEventListener('input', () => { params[key] = input.value; saved.set(selected.id, { ...params }); render(); });
  wrapper.append(input); controls.append(wrapper);
}
function choose() {
  selected = items.find(i => i.id === select.value); params = {}; controls.replaceChildren();
  if (!selected) { render(); return; }
  const old = saved.get(selected.id) || {};
  if (selected.kind === 'trees') {
    control('stock', 'Capture per surviving tree by year 30 (kg CO₂)', old.stock ?? 300);
    control('survival', 'Trees surviving establishment (%)', old.survival ?? 80);
    control('shape', 'Illustrative growth trajectory', old.shape ?? 35, [[20,'Earlier growth'],[35,'Gradual growth'],[50,'Later growth']]);
  }
  if (['flight', 'journey'].includes(selected.kind)) {
    control('distance', 'One-way distance (km)', old.distance ?? selected.distance);
    control('legs', 'Journey', old.legs ?? 1, [[1,'One-way'],[2,'Return']]);
  }
  if (selected.kind === 'forest') control('rate', 'Site-specific uptake (tCO₂ per hectare per year)', old.rate ?? '');
  if (selected.kind === 'person') control('geography', 'Country · 2023 data', old.geography ?? 'GBR', selected.rates.map(r => [r.id, r.name + (r.factor === null ? ' (no data)' : '')]));
  if (selected.kind === 'custom') {
    control('name', 'Name of your comparison', old.name ?? '', null, 'text');
    control('factor', 'Carbon per item', old.factor ?? '');
    control('factorUnit', 'Factor unit', old.factorUnit ?? 't', [['t','tonnes per item'],['kg','kilograms per item']]);
    control('gas', 'Reported gas basis', old.gas ?? selected.gas, [['CO₂','CO₂'],['CO₂e','CO₂-equivalent']]);
  }
  render();
}
function filter() {
  const normalise = text => text.normalize('NFKD').replace(/\p{Mark}/gu, '').toLowerCase();
  const query = normalise(search.value.trim()), previous = select.value;
  const visible = items.filter(i => normalise(`${i.label} ${i.group} ${i.aliases || ''}`).includes(query));
  select.replaceChildren();
  const groups = new Map();
  for (const item of visible) {
    if (!groups.has(item.group)) { const group = document.createElement('optgroup'); group.label = item.group; select.append(group); groups.set(item.group, group); }
    const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; groups.get(item.group).append(option);
  }
  select.disabled = !visible.length;
  if (!visible.length) { const option = document.createElement('option'); option.textContent = 'No matches — try another search'; select.append(option); }
  else if (visible.some(i => i.id === previous)) select.value = previous;
  choose();
}
function trajectoryChart(r, parent) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 620 240'); svg.classList.add('growth-chart'); svg.setAttribute('role','img');
  const title = document.createElementNS(ns, 'title'); title.textContent = 'Illustrative annual tree capture during years 1 to 30. The horizontal dashed line is the 30-year annual average.'; svg.append(title);
  const max = Math.max(...r.rates, 1e-9), x = year => 62 + year / 30 * 528, y = v => 195 - v / max * 150;
  function el(name, attrs, text) { const e = document.createElementNS(ns,name); for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v); if (text) e.textContent=text; svg.append(e); }
  el('path',{d:'M62 38V195H590',fill:'none',stroke:'#849b9c'});
  el('path',{d:r.rates.map((v,i)=>`${i?'L':'M'}${x(i+1)},${y(v)}`).join(' '),fill:'none',stroke:'#28785b','stroke-width':3});
  el('path',{d:`M62 ${y(r.annual)}H590`,stroke:'#617576','stroke-dasharray':'5 5'});
  el('text',{x:62,y:20},'Annual capture (tCO₂/yr)');
  el('text',{x:5,y:48},fmt(max)); el('text',{x:40,y:198},'0');
  for (const year of [0,10,20,30]) el('text',{x:x(year),y:218,'text-anchor':'middle'},String(year));
  el('text',{x:310,y:237,'text-anchor':'middle'},'Years after planting');
  parent.append(svg);
  paragraph(`Dashed line: ${fmt(r.annual)} tCO₂/yr averaged over 30 years. Annual capture in this scenario: year 1, ${fmt(r.rates[0])}; year 10, ${fmt(r.rates[9])}; year 20, ${fmt(r.rates[19])}; year 30, ${fmt(r.rates[29])} tCO₂/yr.`, parent);
}
function render() {
  result.replaceChildren(); details.replaceChildren(); qualifier.textContent = '';
  if (!selected) { result.textContent = 'No matching equivalence'; paragraph('Try a broader search, such as tree, car, flight or electricity.'); return; }
  let r;
  try { r = calculate(selected, quantity.value, params); }
  catch (error) { result.textContent = '—'; qualifier.textContent = error.message; paragraph(selected.scope); addSource(); return; }
  result.append(document.createTextNode(`${fmt(r.annualised ? r.annual : r.total)} t${r.gas}${r.annualised ? '/yr' : ''}`));
  const small = document.createElement('small');
  small.textContent = selected.kind === 'custom' && params.name ? `${params.name}${selected.annualised ? ' · annual footprint' : ''}` : selected.kind === 'trees' ? 'Average annual capture over 30 years' : selected.group === 'Homes' || selected.id === 'us-car' ? 'For one year of the selected activity' : r.annualised ? selected.kind === 'forest' ? 'Annual capture at the supplied site rate' : 'Annual emissions for the selected quantity' : 'For the selected quantity'; result.append(small);
  qualifier.textContent = selected.kind === 'trees' ? 'A 30-year average, not immediate removal. Open the calculation to see the growth curve and assumptions.' : selected.scope;
  if (selected.kind === 'trees') {
    paragraph('The starting assumptions come from the book’s illustrative 10 kg CO₂ per surviving tree per year: 300 kg over 30 years. The initial 80% survival rate is an editable assumption, not a measured global average.');
    paragraph(`With your settings, the trees capture ${fmt(r.total)} tonnes over 30 years. Dividing by 30 gives ${fmt(r.annual)} tonnes per year on average. Actual uptake varies with species and site; later losses and project emissions are not included.`);
    const growth = document.createElement('details'), summary = document.createElement('summary');
    summary.textContent = 'See the 30-year growth pattern'; growth.append(summary); details.append(growth);
    paragraph('This illustrative curve spreads the assumed total across the first 30 years. Changing the growth pattern changes when capture happens, but not the 30-year total. It does not assume growth stops at year 30.', growth);
    trajectoryChart(r, growth);
  } else if (selected.kind === 'flight') {
    paragraph(`We use the UK government’s 2026 factor for the selected route category and cabin class: ${selected.factorKg} kg CO₂ per passenger-kilometre. Your distance and one-way/return choice determine the journey total. Preset distances are illustrative; non-CO₂ aviation effects are excluded.`);
  } else if (selected.kind === 'journey') {
    paragraph(`We use the UK government’s 2026 vehicle CO₂ factor and multiply by your distance and number of journeys. It excludes upstream fuel production. A return journey uses twice the one-way distance.`);
  } else if (selected.kind === 'person') {
    const rate = selected.rates.find(r => r.id === params.geography);
    paragraph(`We use Global Carbon Budget data via Our World in Data: ${rate.name}, ${selected.year}, ${rate.factor} tonnes CO₂ per person per year. ${selected.scope}`);
  } else if (selected.kind === 'forest') {
    paragraph('Use a local estimate for annual uptake per hectare. Cook-Patton and colleagues (2020) show how natural forest regrowth varies by location over the first 30 years; their study does not provide one universal forest rate.');
  } else if (selected.kind === 'custom') {
    paragraph('This factor comes from the value you supply. Use the original claim’s source, time period and CO₂ or CO₂-equivalent basis.');
  } else if (selected.rowId || selected.derivedFromRow) {
    paragraph(`We use the CO₂ component of the UK government’s 2026 conversion factors: ${selected.factorKg} kg per selected unit. These are reporting averages; they exclude upstream supply-chain emissions${selected.id === 'electricity' ? ' and electricity transmission losses' : ''}.`);
  } else if (selected.source?.includes('epa.gov')) {
    paragraph(`We use the US Environmental Protection Agency’s published equivalence factor: ${fmt(selected.factor)} tonnes ${selected.gas} per selected item. ${selected.scope}`);
  } else {
    paragraph(selected.id === 'carbon' ? 'Carbon and CO₂ have different masses. We multiply tonnes of elemental carbon by 44/12, the ratio of their molecular masses.' : 'This is a metric mass conversion: one tonne is 1,000 kilograms, one kilotonne is 1,000 tonnes, one megatonne is a million tonnes, and one gigatonne is a billion tonnes.');
  }
  addSource();
}
function addSource() {
  if (!selected.source || selected.group === 'Carbon units') return;
  const p = document.createElement('p'), a = document.createElement('a'); a.href = selected.source;
  a.textContent = selected.source.includes('owid') ? 'Global Carbon Budget via Our World in Data' : selected.source.startsWith('/') ? 'Counting Carbon — book assumptions' : selected.source.includes('gov.uk') ? 'UK government conversion factors' : selected.source.includes('epa.gov') ? 'US EPA equivalencies' : 'Cook-Patton et al.';
  p.append(a, ` · ${selected.year}`); details.append(p);
}
quantity.addEventListener('input', render); select.addEventListener('change', choose); search.addEventListener('input', filter);
try {
  const response = await fetch('/counting-carbon/data/equivalences.json'); if (!response.ok) throw Error();
  items = (await response.json()).items; filter();
} catch { result.textContent='Equivalences could not load'; qualifier.textContent='Please reload the page to try again.'; select.disabled=true; }

initTutorial("claim");
