import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculate, treeTrajectory } from '../counting-carbon/claim-checker/model.js';
const {items}=JSON.parse(await readFile(new URL('../counting-carbon/data/equivalences.json',import.meta.url)));
test('tree annualisation integrates exactly over thirty years',()=>{
 const r=treeTrajectory(10000,300,80);
 assert.equal(r.total,2400); assert.equal(r.annual,80); assert.equal(r.cumulative[0],0);
 assert.ok(Math.abs(r.rates.reduce((a,b)=>a+b,0)-2400)<1e-8);
 assert.ok(r.rates[0]<r.rates[19]);
 assert.equal(treeTrajectory(10000,300,0).annual,0);
 for(const shape of [20,35,50]) assert.equal(treeTrajectory(10000,300,80,shape).annual,80);
 assert.throws(()=>treeTrajectory(1,300,101));
});
test('flight direction and quantity scale; CO2e is kept explicit',()=>{
 const flight=items.find(i=>i.id==='flight-3171');
 const one=calculate(flight,1,{distance:8000,legs:1});
 assert.ok(Math.abs(one.total-.54608)<1e-9);
 assert.equal(calculate(flight,2,{distance:8000,legs:2}).total,4*one.total);
 assert.equal(calculate(items.find(i=>i.id==='us-car'),1).gas,'CO₂e');
});
test('invalid inputs never become silent zero; valid zero is accepted',()=>{
 const item=items.find(i=>i.id==='tonne');
 for(const v of ['',-1,Infinity,'abc']) assert.throws(()=>calculate(item,v));
 assert.equal(calculate(item,0).total,0);
 assert.throws(()=>calculate(items.find(i=>i.id==='forest'),100,{rate:''}));
});
test('registry contains unique searchable entries with scope and source metadata',()=>{
 assert.equal(new Set(items.map(i=>i.id)).size,items.length);
 assert.ok(items.length>=38);
 for(const i of items){assert.ok(i.scope);assert.ok(i.year);assert.ok(i.kind||Number.isFinite(i.factor));}
});
test('parameterised population, journey, custom-unit and forest-area calculations',()=>{
 const person=items.find(i=>i.id==='person-territorial');
 const uk=person.rates.find(r=>r.id==='GBR');
 assert.equal(calculate(person,10,{geography:'GBR'}).annual,uk.factor*10);
 assert.throws(()=>calculate(person,10,{geography:'unknown'}));
 const custom=items.find(i=>i.id==='custom');
 assert.ok(Math.abs(calculate(custom,20000,{factor:23.4,factorUnit:'kg',gas:'CO₂'}).total-468)<1e-9);
 const acre=items.find(i=>i.id==='forest-acre');
 assert.ok(Math.abs(calculate(acre,1,{rate:10}).annual-4.0468564224)<1e-9);
 const journey=items.find(i=>i.id==='petrol-journey');
 assert.equal(calculate(journey,2,{distance:100,legs:2}).total,400*journey.factor);
});
