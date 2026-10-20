import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as policy from '../assets/analytics/policy.js';

const config = {
  measurementId:'G-TESTONLY',
  pages:['/', '/privacy.html', '/contact.html', '/counting-carbon/', '/counting-carbon/claim-checker/', '/counting-carbon/paperback/'],
  tools:[{id:'claims',title:'Claim Checker',url:'/counting-carbon/claim-checker/'}]
};
const source = (await readFile(new URL('../assets/analytics/analytics.js', import.meta.url),'utf8')).replace(/^import[^\n]+\n/, '');
function visit({saved = null, host = 'www.climateguidance.com', path = '/counting-carbon/claim-checker/', privacy = false} = {}) {
  const scripts=[], bodies=[], deleted=[], listeners=new Map(), storage=new Map(saved ? [[policy.CONSENT_KEY,saved]]:[]);
  let reloaded=0;
  const status={textContent:''};
  const doc={title:'Claim Checker', referrer:'https://www.linkedin.com/feed/?email=private@example.com',
    querySelector: selector => selector === '#cg-analytics-config' ? {textContent:JSON.stringify(config)} : selector === '#analytics-choice-status' ? status : null,
    querySelectorAll: () => [],
    createElement: tag => ({tag,setAttribute(){},remove(){},innerHTML:''}),
    head:{append:s=>scripts.push(s)}, body:{append:s=>bodies.push(s)},
    addEventListener:(name,fn)=>listeners.set(name,fn)
  };
  Object.defineProperty(doc,'cookie',{get:()=> '_ga=one; _ga_TESTONLY=two; necessary=keep',set:value=>deleted.push(value)});
  const context={...policy,document:doc,window:{},navigator:{globalPrivacyControl:privacy},
    location:{hostname:host,origin:'https://'+host,pathname:path,search:'?email=private@example.com',hash:'#secret',reload(){reloaded++;}},
    localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
    performance:{now:()=>10000},Date,URL
  };
  vm.runInNewContext(source,context);
  const choose=choice=>listeners.get('click')({target:{closest:selector=>selector==='[data-analytics-choice]'?{dataset:{analyticsChoice:choice}}:null}});
  const events=()=>JSON.parse(JSON.stringify((context.window.dataLayer||[]).map(args=>Array.from(args))));
  return {context,scripts,bodies,deleted,status,choose,events,listeners,storage,get reloaded(){return reloaded;}};
}
const saved=choice=>JSON.stringify({version:1,choice,savedAt:Date.now()});
test('optional analytics makes no tag request before acceptance or after refusal',()=>{
  const page=visit();assert.equal(page.scripts.length,0);assert.equal(page.events().length,0);assert.equal(page.bodies.length,1);
  page.choose('declined');assert.equal(page.scripts.length,0);assert.equal(page.events().length,0);
  const returning=visit({saved:saved('declined')});assert.equal(returning.scripts.length,0);assert.equal(returning.bodies.length,0);
});
test('acceptance loads one tag, strips sensitive URL parts and keeps advertising off',()=>{
  const page=visit();page.choose('accepted');page.choose('accepted');assert.equal(page.scripts.length,1);
  const setup=page.events().find(e=>e[0]==='config')[2];
  assert.equal(setup.page_location,'https://www.climateguidance.com/counting-carbon/claim-checker/');
  assert.equal(setup.page_referrer,'https://www.linkedin.com/');
  assert.equal(setup.allow_google_signals,false);assert.equal(setup.allow_ad_personalization_signals,false);
  for(const consent of page.events().filter(e=>e[0]==='consent')) for(const key of ['ad_storage','ad_user_data','ad_personalization']) assert.equal(consent[2][key],'denied');
  assert.ok(page.events().some(e=>e[0]==='event'&&e[1]==='tool_open'));
});
test('withdrawing consent stops events, clears analytics cookies and removes the tag by reloading',()=>{
  const page=visit({saved:saved('accepted')});page.choose('declined');assert.equal(page.context.window['ga-disable-G-TESTONLY'],true);assert.equal(page.reloaded,1);
  assert.ok(page.deleted.length>0);assert.ok(page.deleted.every(cookie=>cookie.startsWith('_ga')));
  const count=page.events().length;
  page.listeners.get('change')({target:{closest:()=>({}),matches:()=>true,value:'PRIVATE CALCULATOR VALUE'}});
  assert.equal(page.events().length,count);
});
test('local previews, private downloads, unknown paths and browser opt-outs stay untracked',()=>{
  for(const options of [{host:'127.0.0.1'},{path:'/counting-carbon/downloads/'},{path:'/private-person@example.com/'},{privacy:true}]) {
    const page=visit({...options,saved:saved('accepted')});assert.equal(page.scripts.length,0);assert.equal(page.events().length,0);
  }
});
test('tool changes report fixed action labels, excluding entered values',()=>{
  const page=visit({saved:saved('accepted')});
  page.listeners.get('change')({target:{closest:()=>({}),matches:()=>true,value:'PRIVATE CALCULATOR VALUE'}});
  const action=page.events().find(e=>e[1]==='tool_interaction');
  assert.deepEqual(action[2],{tool_id:'claims',tool_name:'Claim Checker',interaction_type:'control'});
  assert.ok(!JSON.stringify(page.events()).includes('PRIVATE CALCULATOR VALUE'));
});
test('checkout events describe clicks without collecting order or destination references',()=>{
  assert.deepEqual(policy.checkoutMeasurement('/counting-carbon/','',true),{book_format:'digital_bundle',checkout_channel:'direct'});
  assert.deepEqual(policy.checkoutMeasurement('/counting-carbon/','https://buy.stripe.com/28EcN41SNfTN8fAc5C4wM03?prefilled_email=private@example.com'),{book_format:'paperback_bundle',checkout_channel:'direct'});
  assert.equal(policy.checkoutMeasurement('/contact.html','mailto:private@example.com'),null);
  assert.equal(policy.checkoutMeasurement('/counting-carbon/','https://example.com/order/private-reference'),null);
});
test('expired or malformed consent never silently enables measurement',()=>{
  const now=Date.now();for(const value of ['',null,'true','{}',JSON.stringify({version:1,choice:'accepted',savedAt:now-181*86400000}),JSON.stringify({version:1,choice:'accepted',savedAt:now+86400000})]) assert.equal(policy.readConsent(value,now),null);
  assert.equal(policy.readConsent(saved('accepted'),now),'accepted');
});
