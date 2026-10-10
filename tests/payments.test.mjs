import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {mkdtemp, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {paymentConfig, createPayments} from '../server/payments.mjs';
import {createPaymentServer} from '../server/index.mjs';
const sdk = new Stripe('rk_test_fixture');
const secret = 'whsec_fixture';
const price = {id:'price_fixture',active:true,type:'one_time',currency:'eur',unit_amount:1999,tax_behavior:'inclusive',livemode:false};
const paid = {id:'cs_test_fixture',livemode:false,mode:'payment',managed_payments:{enabled:true},status:'complete',payment_status:'paid',line_items:{has_more:false,data:[{quantity:1,price}]},payment_intent:{id:'pi_fixture',latest_charge:{paid:true,amount_refunded:0,refunded:false,disputed:false}}};
async function setup() {
  const dir = await mkdtemp(join(tmpdir(),'counting-carbon-stripe-'));
  const files = {pdf:join(dir,'book.pdf'),epub:join(dir,'book.epub')};
  await Promise.all(Object.values(files).map(p=>writeFile(p,'private book fixture')));
  const config = {...paymentConfig({STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_WEBHOOK_SECRET:secret,STRIPE_DIGITAL_PRICE_ID:price.id}),files,ledgerDir:join(dir,'orders')};
  let current = structuredClone(paid), currentPrice = {...price}, created;
  const stripe = {webhooks:sdk.webhooks,prices:{retrieve:async()=>currentPrice},checkout:{sessions:{create:async params=>{created=params;return {url:'https://checkout.stripe.com/c/pay/cs_test_fixture',livemode:false};},retrieve:async()=>current}}};
  return {dir,config,stripe,p:createPayments(config,{stripe}),get created(){return created;},setSession:p=>{current={...current,...p};},setPrice:p=>{currentPrice={...currentPrice,...p};},cleanup:()=>rm(dir,{recursive:true,force:true})};
}
function event(type='checkout.session.completed',patch={}) {
  const raw=Buffer.from(JSON.stringify({id:'evt_fixture',livemode:false,type,data:{object:{id:paid.id}},...patch}));
  return [raw,sdk.webhooks.generateTestHeaderString({payload:raw.toString(),secret})];
}
test('configuration separates test/live keys and rejects insecure production origins',()=>{
  assert.throws(()=>paymentConfig({PAYMENT_MODE:'live',SITE_ORIGIN:'http://example.com'}));
  assert.throws(()=>paymentConfig({PAYMENT_MODE:'live',SITE_ORIGIN:'https://example.com',STRIPE_SECRET_KEY:'rk_test_fixture'}));
  assert.equal(paymentConfig({}).priceId,'price_...');
});
test('checkout locks the bundle, price and Managed Payments settings',async()=>{
  const f=await setup();try {
    await f.p.checkout({product:'digital'});
    assert.deepEqual(f.created.line_items,[{price:price.id,quantity:1}]);
    assert.equal(f.created.ui_mode,'hosted_page');assert.equal(f.created.mode,'payment');
    assert.deepEqual(f.created.managed_payments,{enabled:true});
    for(const field of ['automatic_tax','payment_method_collection','payment_method_types']) assert.equal(f.created[field],undefined);
    assert.equal(f.created.integration_identifier,'hosted_web_0001');
    await assert.rejects(f.p.checkout({product:'digital',price:1}));
    await assert.rejects(f.p.checkout({product:'hardcopy'}));
    f.setPrice({unit_amount:2000}); await assert.rejects(f.p.checkout({product:'digital'}),/19.99/);
    f.setPrice({unit_amount:1999,tax_behavior:'exclusive'});await assert.rejects(f.p.checkout({product:'digital'}));
  } finally {await f.cleanup();}
});
test('missing private files and placeholder price fail closed',async()=>{
  const f=await setup();try {
    await assert.rejects(createPayments({...f.config,priceId:'price_...'},{stripe:f.stripe}).checkout({product:'digital'}),/not been configured/);
    await assert.rejects(createPayments({...f.config,files:{}},{stripe:f.stripe}).checkout({product:'digital'}),/not ready/);
  } finally {await f.cleanup();}
});
test('only signed, verified paid events grant access; retries are idempotent',async()=>{
  const f=await setup();try {
    await assert.rejects(f.p.downloads(paid.id),/being prepared/);
    const [raw,sig]=event();
    await assert.rejects(f.p.webhook(Buffer.concat([raw,Buffer.from(' ')]),sig),/signature/);
    await assert.rejects(f.p.webhook(...event(undefined,{livemode:true})),/mode/);
    f.setSession({payment_status:'unpaid'});await f.p.webhook(raw,sig);await assert.rejects(f.p.downloads(paid.id),/confirmed/);
    f.setSession({payment_status:'paid'});await f.p.webhook(...event('checkout.session.async_payment_succeeded'));await f.p.webhook(raw,sig);
    assert.equal((await readdir(f.config.ledgerDir)).length,1);
    assert.deepEqual((await f.p.downloads(paid.id)).files.map(f=>f.format),['pdf','epub']);
    f.setSession({payment_intent:{id:'pi_fixture',latest_charge:{paid:true,amount_refunded:1}}});
    await assert.rejects(f.p.download(paid.id,'pdf'),/unavailable/);
    await f.p.webhook(raw,sig);await assert.rejects(f.p.downloads(paid.id),/unavailable/);
  } finally {await f.cleanup();}
});
test('wrong product, quantity or environment never authorises download',async()=>{
  for(const patch of [{livemode:true},{managed_payments:{enabled:false}},{line_items:{data:[{price,quantity:2}]}},{line_items:{data:[{price:{id:'price_other'},quantity:1}]}}]) {
    const f=await setup();try {f.setSession(patch);await f.p.webhook(...event());await assert.rejects(f.p.downloads(paid.id),/does not match/);}finally{await f.cleanup();}
  }
});
test('HTTP origin checks, raw webhook and private file download work together',async()=>{
  const f=await setup(), server=createPaymentServer(f.config,{stripe:f.stripe});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const root=`http://127.0.0.1:${server.address().port}`;
  try {
    const headers={Origin:f.config.origin,'Content-Type':'application/json'};
    assert.equal((await fetch(root+'/api/checkout',{method:'POST'})).status,403);
    assert.equal((await fetch(root+'/api/checkout',{method:'OPTIONS',headers})).status,204);
    assert.equal((await fetch(root+'/api/checkout',{method:'POST',headers,body:'{'})).status,400);
    assert.equal((await fetch(root+'/api/checkout',{method:'POST',headers,body:JSON.stringify({product:'digital'})})).status,200);
    const [body,sig]=event(); assert.equal((await fetch(root+'/api/webhooks/stripe',{method:'POST',headers:{'stripe-signature':sig},body})).status,200);
    const download=await fetch(root+`/api/download/pdf?session_id=${paid.id}`);
    assert.equal(download.status,200);assert.equal(download.headers.get('cache-control'),'no-store');assert.match(download.headers.get('content-disposition'),/attachment/);assert.equal(await download.text(),'private book fixture');
    for(const path of ['/.env','/private-products/book.pdf','/server/payments.mjs']) assert.equal((await fetch(root+path)).status,404);
  }finally{await new Promise(r=>server.close(r));await f.cleanup();}
});
