import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tonnes, atmosphericHistory, duration, aggregate } from '../counting-carbon/carbon-time-machine/model.js';
const data = async name => JSON.parse(await readFile(new URL('../counting-carbon/data/' + name, import.meta.url)));
const [a, e, c, map] = await Promise.all(['atmosphere.json','emissions.json','physical-constants.json','world-map.json'].map(data));
test('mass units and ppm conversions retain the carbon-to-CO2 distinction', () => {
 assert.equal(tonnes(1,'Gt'),1e9); assert.equal(tonnes(1,'Mt'),1e6); assert.equal(tonnes(1,'kt'),1e3);
 assert.equal(c.carbonToCO2,44/12); assert.ok(Math.abs(c.gigatonnesCO2PerPpm-7.788)<1e-12);
 for(const bad of ['',null,-1,Infinity,'bad']) assert.throws(()=>tonnes(bad,'Gt'));
 assert.throws(()=>tonnes(1,'GtC'));
});
test('historical interpolation and record boundaries', () => {
 const synthetic=[{year:2000,ppm:370},{year:2001,ppm:372},{year:2002,ppm:375}];
 assert.equal(atmosphericHistory(0,synthetic,8).year,2002);
 assert.equal(atmosphericHistory(24e9,synthetic,8).year,2001);
 assert.equal(atmosphericHistory(32e9,synthetic,8).year,2000.5);
 assert.equal(atmosphericHistory(41e9,synthetic,8).boundary,'before-record');
 assert.equal(atmosphericHistory(4000e9,synthetic,8).boundary,'exceeds-atmosphere');
 const r=atmosphericHistory(200e9,a.series,c.gigatonnesCO2PerPpm);
 assert.ok(r.year>2015&&r.year<2017);
 assert.equal(a.series[0].year,1959);
});
test('regional duration uses emissions rates with natural display units', () => {
 assert.equal(duration(1e9,1000).years,1);
 assert.equal(duration(5e8,1000).unit,'months'); assert.equal(duration(5e8,1000).value,6);
 assert.equal(duration(10000,1000).unit,'minutes');
 assert.equal(duration(0,1000).value,0); assert.equal(duration(100,0),null); assert.equal(duration(100,null),null);
});
test('continents and global reconcile, with international transport explicit', () => {
 const totals=aggregate(e.countries);
 for(const region of e.continents) assert.ok(Math.abs(totals[region.id]-region.annualMt)<1e-5);
 const global=Object.values(totals).reduce((x,y)=>x+y,0)+e.internationalMt;
 assert.ok(Math.abs(global-e.globalMt)<1e-5); assert.ok(Math.abs(global-e.publishedGlobalMt)<.1);
 assert.ok(e.countries.every(x=>x.year===e.year));
 assert.equal(new Set(e.countries.map(x=>x.id)).size,e.countries.length);
});
test('map includes major selectable regions and finite coordinates',()=>{
 for(const iso of ['NOR','USA','CHN','BRA','IND','AUS','ZAF']) assert.ok(map.features.some(x=>x.id===iso));
 for(const f of map.features) for(const p of f.polygons) for(const r of p) for(const [lon,lat] of r){assert.ok(Number.isFinite(lon)&&Math.abs(lon)<=180.001);assert.ok(Number.isFinite(lat)&&Math.abs(lat)<=90);}
});
