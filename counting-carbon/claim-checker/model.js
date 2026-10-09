export function nonnegative(value, name) {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0) throw Error(`Enter a non-negative number for ${name}.`);
  return Number(value);
}
export function treeTrajectory(quantity, stockKg, survivalPercent, timescale = 35) {
  const n = nonnegative(quantity, 'quantity'), stock = nonnegative(stockKg, '30-year capture'), s = nonnegative(survivalPercent, 'survival');
  if (s > 100) throw Error('Survival must be between 0 and 100%.');
  if (![20, 35, 50].includes(Number(timescale))) throw Error('Choose a growth trajectory.');
  // Normalised illustrative biomass growth: not a species-calibrated yield model.
  const norm = (1 - Math.exp(-30 / timescale)) ** 2;
  const total = n * s / 100 * stock / 1000;
  if (!Number.isFinite(total)) throw Error('The quantity is too large.');
  const cumulative = Array.from({ length: 31 }, (_, year) => total * (1 - Math.exp(-year / timescale)) ** 2 / norm);
  return { total, annual: total / 30, cumulative, rates: cumulative.slice(1).map((v, i) => v - cumulative[i]), survivors: n * s / 100 };
}
export function calculate(item, quantity, params = {}) {
  const q = nonnegative(quantity, 'quantity');
  if (item.kind === 'trees') return { ...treeTrajectory(q, params.stock, params.survival, params.shape), gas: 'CO₂', annualised: true };
  let factor = item.factor, gas = item.gas, annualised = false;
  if (['flight', 'journey'].includes(item.kind)) {
    const distance = nonnegative(params.distance, 'one-way distance');
    if (![1, 2].includes(Number(params.legs))) throw Error('Choose one-way or return.');
    factor *= distance * Number(params.legs);
  }
  if (item.kind === 'forest') { factor = nonnegative(params.rate, 'annual uptake per hectare') * (item.areaMultiplier || 1); annualised = true; }
  if (item.kind === 'person') {
    const rate = item.rates.find(r => r.id === params.geography);
    if (!rate || rate.factor === null) throw Error('No comparable per-person figure is available for this country and year.');
    factor = rate.factor; annualised = true;
  }
  if (item.kind === 'custom') {
    factor = nonnegative(params.factor, 'factor') * (params.factorUnit === 'kg' ? .001 : 1);
    gas = params.gas === 'CO₂e' ? 'CO₂e' : 'CO₂'; annualised = !!item.annualised;
  }
  const total = q * factor;
  if (!Number.isFinite(total)) throw Error('The quantity is too large.');
  return { total, annual: annualised ? total : undefined, annualised, factor, gas };
}
