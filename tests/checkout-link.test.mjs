import test from 'node:test';
import assert from 'node:assert/strict';
import { validCheckoutUrl } from '../counting-carbon/checkout.js';
test('only secure Stripe checkout redirects are accepted', () => {
  const url = 'https://checkout.stripe.com/c/pay/cs_test_example';
  assert.equal(validCheckoutUrl(url),url);
  for (const bad of ['http://checkout.stripe.com/pay','https://checkout.stripe.com.evil.test/pay','https://user:password@checkout.stripe.com/pay','javascript:alert(1)',null]) assert.equal(validCheckoutUrl(bad),null);
});
