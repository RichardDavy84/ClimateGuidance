export const MASS_UNITS = Object.freeze({ t: 1, kt: 1e3, Mt: 1e6, Gt: 1e9 });
export function tonnes(value, unit) {
  if (value === '' || value === null || !Number.isFinite(Number(value)) || Number(value) < 0 || !Object.hasOwn(MASS_UNITS, unit)) throw Error('Enter a non-negative CO₂ quantity and a valid unit.');
  const amount = Number(value) * MASS_UNITS[unit];
  if (!Number.isFinite(amount)) throw Error('The quantity is too large.');
  return amount;
}
export function atmosphericHistory(amount, series, gtPerPpm) {
  if (!Number.isFinite(amount) || amount < 0 || !(gtPerPpm > 0) || series.length < 2) throw Error('Invalid atmospheric calculation.');
  const first = series[0], latest = series.at(-1), changePpm = amount / 1e9 / gtPerPpm, targetPpm = latest.ppm - changePpm;
  const result = { targetPpm, changePpm, latest, first };
  if (targetPpm < 0) return { ...result, boundary: 'exceeds-atmosphere' };
  if (targetPpm < first.ppm) return { ...result, boundary: 'before-record' };
  if (amount === 0) return { ...result, year: latest.year, yearsBack: 0 };
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1], b = series[i];
    if (targetPpm >= a.ppm && targetPpm <= b.ppm) {
      const year = a.year + (targetPpm - a.ppm) / (b.ppm - a.ppm);
      return { ...result, year, yearsBack: latest.year - year };
    }
  }
  throw Error('Concentration could not be matched to the record.');
}
export function duration(amount, annualMt, daysPerYear = 365.25) {
  if (!Number.isFinite(amount) || amount < 0) throw Error('Enter a non-negative CO₂ quantity.');
  if (annualMt === null || !Number.isFinite(annualMt) || annualMt <= 0) return null;
  const years = amount / (annualMt * 1e6);
  if (years === 0) return { value: 0, unit: 'seconds', years };
  const levels = [[1, 'years'], [12, 'months'], [daysPerYear, 'days'], [daysPerYear * 24, 'hours'], [daysPerYear * 1440, 'minutes'], [daysPerYear * 86400, 'seconds']];
  const [factor, unit] = levels.find(([factor]) => years * factor >= 1) || levels.at(-1);
  return { value: years * factor, unit, years };
}
export function aggregate(countries) {
  const totals = {};
  for (const c of countries) if (Number.isFinite(c.annualMt)) totals[c.continent] = (totals[c.continent] || 0) + c.annualMt;
  return totals;
}
