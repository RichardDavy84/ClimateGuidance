import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
test('production workflow, commerce and scientific files match the approved baseline',async()=>{
 const base=await read('docs/redesign/protected-baseline.json');
 for(const [path,expected] of Object.entries(base.hashes))assert.equal(createHash('sha256').update(await readFile(resolve(root,path))).digest('hex'),expected,path);
});
test('research, publication and media provenance is referentially complete',async()=>{
 const sources=new Set((await read('content/source-records.json')).map(s=>s.id));
 for(const name of ['profile','research','publications','media','teaching','projects','tools','book','consulting','paperback']){
  const d=await read(`content/${name}.json`);for(const item of Array.isArray(d)?d:[d]){assert.ok(item.sourceIds?.length,`${name} missing sources`);for(const id of item.sourceIds)assert.ok(sources.has(id),`${name}: ${id}`)}
 }
 for(const m of await read('content/media.json'))assert.equal(typeof m.verified,'boolean');
});
test('tool routes and screenshots exist; deferred Bergen material is not visible',async()=>{
 for(const t of await read('content/tools.json')){await access(resolve(root,'.'+t.image));await access(resolve(root,'.'+t.url,'index.html'));}
 const urban=await readFile(resolve(root,'research/urban-climate/index.html'),'utf8');
 assert.ok(!urban.includes('Urban Climate Hazards Insights'));
 assert.ok(!urban.includes('Neighborhood-Scale Story Map for Bergen'));
 const publications=await read('content/publications.json');assert.equal(new Set(publications.map(p=>p.id)).size,publications.length);
});
test('reviewed profile pages use the requested navigation and editorial style',async()=>{
 const paths=['index.html','about.html','services.html','contact.html','research/index.html','research/arctic-sea-ice/index.html','research/urban-climate/index.html','research/climate-processes-models/index.html','research/decision-support/index.html','publications/index.html','media/index.html','climate-tools/index.html','counting-carbon/index.html','counting-carbon/paperback/index.html'];
 for(const path of paths){
  const html=await readFile(resolve(root,path),'utf8');
  assert.ok(!html.includes('\u2014'),path+' contains U+2014');
  assert.ok(html.includes('href="/">Home</a>')||html.includes('href="/" aria-current="page">Home</a>'),path+' Home navigation');
  assert.ok(html.includes('>Climate Tools</a>'),path+' Climate Tools navigation');
  assert.ok(html.includes('>Consulting</a>'),path+' Consulting navigation');
  if(path.startsWith('research/'))assert.ok(!html.match(/<main[\s\S]*?<\/main>/)?.[0].includes('independent Climate Guidance work'),path+' consulting disclaimer');
 }
 const services=await readFile(resolve(root,'services.html'),'utf8');
 assert.ok(services.includes('Decision support tools built to your timescale'));
 assert.ok(services.includes('Frequently asked questions'));
 const explorer=await readFile(resolve(root,'climate-tools/gsi/index.html'),'utf8');
 assert.ok(explorer.includes('An index devised by Richard Davy'));
 assert.ok(!/\bGSI\b/.test(explorer));
});

test('public book pages expose no sandbox payment links',async()=>{
 for(const path of ['counting-carbon/index.html','counting-carbon/paperback/index.html']){
  const html=await readFile(resolve(root,path),'utf8');
  assert.ok(!html.includes('https://buy.stripe.com/test_'),path);
 }
});
