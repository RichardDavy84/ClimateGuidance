import test from 'node:test';
import assert from 'node:assert/strict';
import { hostedTestCheckout } from '../counting-carbon/checkout.js';
const config = { paymentMode: 'test' };
const product = { id: 'digital', checkoutMode: 'test', purchaseUrl: 'https://example.lemonsqueezy.com/checkout/buy/test-product' };

test('only a configured digital test Share link is accepted', () => {
  assert.equal(hostedTestCheckout(config, product), product.purchaseUrl);
  assert.equal(hostedTestCheckout(config, {...product, purchaseUrl: null}), null);
  assert.equal(hostedTestCheckout(config, {...product, checkoutMode: null}), null);
  assert.equal(hostedTestCheckout(config, {...product, id: 'hardcopy'}), null);
  assert.equal(hostedTestCheckout({paymentMode: 'live'}, product), null);
});
test('customer carts and non-provider checkout URLs are rejected', () => {
  for (const purchaseUrl of [
    'https://example.lemonsqueezy.com/checkout/?cart=customer-cart',
    product.purchaseUrl + '?cart=customer-cart',
    'https://lemonsqueezy.com.evil.test/checkout/buy/test-product',
    'https://user:password@example.lemonsqueezy.com/checkout/buy/test-product',
    'http://example.lemonsqueezy.com/checkout/buy/test-product',
    'javascript:alert(1)',
  ]) assert.equal(hostedTestCheckout(config, {...product, purchaseUrl}), null);
});
