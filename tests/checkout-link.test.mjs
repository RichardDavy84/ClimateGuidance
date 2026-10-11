import test from 'node:test';
import assert from 'node:assert/strict';
import { validCheckoutUrl, paymentLinkForProduct } from '../counting-carbon/checkout.js';
test('only secure Stripe checkout redirects are accepted', () => {
  const url = 'https://checkout.stripe.com/c/pay/cs_test_example';
  assert.equal(validCheckoutUrl(url),url);
  for (const bad of ['http://checkout.stripe.com/pay','https://checkout.stripe.com.evil.test/pay','https://user:password@checkout.stripe.com/pay','javascript:alert(1)',null]) assert.equal(validCheckoutUrl(bad),null);
});
test('payment links stay on Stripe and match the configured payment environment', () => {
  const product = { checkoutMode: 'payment_link', purchaseUrl: 'https://buy.stripe.com/abc123' };
  assert.equal(paymentLinkForProduct({paymentMode:'live'}, product), product.purchaseUrl);
  assert.equal(paymentLinkForProduct({paymentMode:'test'}, product), null);
  const testProduct = {...product, purchaseUrl:'https://buy.stripe.com/test_abc123'};
  assert.equal(paymentLinkForProduct({paymentMode:'test'}, testProduct), testProduct.purchaseUrl);
  assert.equal(paymentLinkForProduct({paymentMode:'live'}, testProduct), null);
  for (const purchaseUrl of [null, 'http://buy.stripe.com/abc', 'https://buy.stripe.com.evil.test/abc', 'https://user:secret@buy.stripe.com/abc', 'https://buy.stripe.com:444/abc', 'https://buy.stripe.com/abc?prefilled_email=someone@example.com', 'https://buy.stripe.com/abc#fragment', 'https://checkout.stripe.com/abc', 'https://buy.stripe.com/']) {
    assert.equal(paymentLinkForProduct({paymentMode:'live'}, {...product,purchaseUrl}),null);
  }
  assert.equal(paymentLinkForProduct({paymentMode:'typo'},product),null);
  assert.equal(paymentLinkForProduct({paymentMode:'live'},{...product,checkoutMode:null}),null);
});
