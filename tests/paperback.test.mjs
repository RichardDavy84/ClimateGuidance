import test from 'node:test';
import assert from 'node:assert/strict';
import {paperbackCheckout} from '../assets/profile/paperback-checkout.js';
const config={price:19.99,currency:'EUR',shippingRegion:'Europe',shippingIncluded:true,paymentMode:'test',checkoutUrl:'https://buy.stripe.com/test_example123'};
test('paperback checkout accepts the configured Stripe test link and Europe-inclusive price',()=>{
  assert.equal(paperbackCheckout(config),config.checkoutUrl);
  assert.equal(paperbackCheckout({...config,paymentMode:'live',checkoutUrl:'https://buy.stripe.com/example123'}),'https://buy.stripe.com/example123');
});
test('paperback checkout stays closed for absent links, wrong mode, altered terms and untrusted destinations',()=>{
  for(const change of [{checkoutUrl:null},{checkoutUrl:'https://buy.stripe.com/example123'},{price:9.99},{shippingIncluded:false},{shippingRegion:'Worldwide'},{paymentMode:'unknown'},{checkoutUrl:'https://buy.stripe.com.evil.example/test_example123'},{checkoutUrl:'https://buy.stripe.com@evil.example/test_example123'},{checkoutUrl:'javascript:alert(1)'},{checkoutUrl:'https://buy.stripe.com/test_example123?redirect=evil'}])assert.equal(paperbackCheckout({...config,...change}),null);
});
