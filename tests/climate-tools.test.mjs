import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {mean,gridCell,classify,TiledData,regression,correlation} from '../climate-tools/shared/core.js';
const root=resolve(import.meta.dirname,'..'),dataRoot=resolve(root,'climate-tools/data');
const readJSON=async f=>JSON.parse(await readFile(f,'utf8'));
const readBinary=async f=>{const b=gunzipSync(await readFile(f));return new Float32Array(b.buffer,b.byteOffset,b.length/4)};
const close=(a,b,tol=2e-5)=>{if(b===null||!Number.isFinite(b)){assert.ok(!Number.isFinite(a),`expected missing, got ${a}`);return}assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} differs from R reference ${b}`)};
test('all park metric packs preserve R reference points and park anomaly averages',async()=>{
 for(const park of ['reisa','pasvik']){const meta=await readJSON(`${dataRoot}/${park}/manifest.json`),refs=await readJSON(`${dataRoot}/${park}/fixtures.json`);for(const [code,m] of Object.entries(meta.metrics)){const data=await readBinary(`${dataRoot}/${park}/${m.file}`),n=m.width*m.height,r=refs[code];assert.equal(data.length,30*n);const cell=gridCell(m,r.lon,r.lat);assert.equal(cell.y*m.width+cell.x,r.cell);for(let i=0;i<12;i++)close(data[i*n+r.cell],r.absolute[i]);for(let i=0;i<9;i++){close(data[(12+i)*n+r.cell],r.anomaly[i]);close(mean(data.subarray((12+i)*n,(13+i)*n)),r.park[i]);}}}
});
test('traffic-light boundaries retain exact strict inequalities and priority differences',async()=>{
 const reisa=await readJSON(`${dataRoot}/reisa/manifest.json`),pasvik=await readJSON(`${dataRoot}/pasvik/manifest.json`);
 const rules=reisa.classifications['Forest fires'];assert.equal(classify(rules.summer_temp,.99).zone,'SAFE');assert.equal(classify(rules.summer_temp,1).zone,'NEUTRAL');assert.equal(classify(rules.summer_temp,2).zone,'NEUTRAL');assert.equal(classify(rules.summer_temp,2.01).zone,'DANGER');assert.equal(classify(rules.summer_temp,NaN).zone,'Unknown');assert.equal(classify(reisa.classifications['Atlantic Salmon'].summer_runoff,11).zone,'SAFE');assert.equal(classify(reisa.classifications['Atlantic Salmon'].summer_runoff,-11).zone,'DANGER');const bird=pasvik.classifications['Birdlife: food sources'].length_growing_season;assert.equal(classify(bird,2).zone,'NEUTRAL');assert.equal(classify(bird,0).zone,'NEUTRAL');assert.equal(classify(bird,-3).zone,'DANGER');assert.equal(classify(bird,3).zone,'SAFE');
});
test('native snow interpolation and GSI histories match independent terra and R trend statistics',async()=>{
 const reference=await readJSON(resolve(root,'tests/fixtures/climate-reference-values.json'));
 const originalFetch=globalThis.fetch;globalThis.fetch=async file=>new Response(await readFile(file));
 try{
 const sm=await readJSON(`${dataRoot}/snow/manifest.json`),snow=new TiledData(sm,`${dataRoot}/snow/tiles`);for(const r of reference.snow){const values=await snow.bilinear(r.lon,r.lat);if(values===null){assert.ok(r.values.every(v=>v===null));continue}for(let i=0;i<30;i++)close(values[i],r.values[i],5e-5)}
 const gm=await readJSON(`${dataRoot}/gsi/manifest.json`),gsi=new TiledData(gm,`${dataRoot}/gsi/tiles`);for(const r of reference.gsi){const values=await gsi.nearest(r.lon,r.lat);assert.equal(values.length,270);for(let i=0;i<270;i++)close(values[i],r.values[i]);const fit=regression(gm.years,values.subarray(0,45));close(fit.slope,r.slope,1e-6);close(fit.p,r.p,1e-6);for(let i=1;i<6;i++)close(correlation(values.subarray(0,45),values.subarray(i*45,(i+1)*45)),r.correlations[i-1],1e-6)}
 }finally{globalThis.fetch=originalFetch}
});
test('marine probabilities agree with all 51 stored members and the source sample-run rule',async()=>{
 const m=await readJSON(`${dataRoot}/marine/manifest.json`);assert.equal(m.members,51);assert.equal(m.stepHours,6);assert.equal(m.runSamples,5);assert.match(m.times[0],/^2025-04-01/);
 for(const [zone,r] of Object.entries(m.zones)){const d=await readBinary(`${dataRoot}/marine/${r.file}`),n=m.times.length;assert.equal(d.length,n*56);for(let month=4;month<=9;month++)for(let cat=0;cat<5;cat++){let count=0;for(let member=0;member<51;member++){let run=0,hit=false;for(let i=0;i<n;i++)if(Number(m.times[i].slice(5,7))===month){const a=d[member*n+i],b=d[(51+cat)*n+i];run=Number.isFinite(a)&&Number.isFinite(b)&&a>b?run+1:0;if(run>=5)hit=true}if(hit)count++}close(count/51*100,r.probabilities[month-4][cat],1e-8)}}
});
