import { validCheckoutUrl, paymentLinkForProduct } from './checkout.js';
const config = await fetch('./config.json?v=20261016-paperback', {cache: 'no-store'}).then(r => r.json());
const container = document.querySelector('#products');
const status = document.querySelector('#purchase-status');
const money = (amount, currency) => new Intl.NumberFormat('en', {
  style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount);

for (const product of config.products) {
  const printed = product.id === 'hardcopy';
  const printLink = printed && product.availability === 'available' ? product.purchaseUrl : null;
  const paymentLink = paymentLinkForProduct(config, product);
  const checkoutReady = !printed && product.availability !== 'coming_soon' &&
    config.salesStatus === 'available' &&
    (product.checkoutMode === 'payment_link' ? Boolean(paymentLink) : Boolean(config.checkoutApi));
  if (product.id === 'digital' && checkoutReady) {
    document.querySelector('#delivery-details').hidden = false;
  }
  const article = document.createElement('article');
  const heading = document.createElement('h3');
  const description = document.createElement('p');
  const price = document.createElement('p');
  const note = document.createElement('p');
  const button = document.createElement(printLink ? 'a' : 'button');
  heading.textContent = product.name;
  description.textContent = product.description;
  price.className = 'format-price';
  price.textContent = printed
    ? (printLink ? 'Price on Amazon' : 'Coming soon')
    : money(product.price, product.currency);
  note.className = 'small-note';
  note.textContent = printed
    ? (printLink ? 'Order through Amazon. Price and delivery options are shown there.' : 'Details will follow when the print edition is ready.')
    : (checkoutReady
      ? 'Secure checkout. Applicable VAT included. PDF and EPUB download links sent by email.'
      : 'PDF and EPUB included. Downloads will be available here when sales open.');
  if (printLink) {
    button.href = printLink;
    button.className = 'button';
    button.style.marginTop = 'auto';
  } else {
    button.disabled = !checkoutReady || product.price === null;
  }
  button.textContent = printed
    ? (printLink ? 'Buy paperback on Amazon' : 'Printed edition: coming soon')
    : (checkoutReady ? 'Get PDF + EPUB' : 'PDF + EPUB: coming soon');
  button.addEventListener('click', async () => {
    if (printed) return;
    button.disabled = true;
    status.textContent = 'Opening secure checkout…';
    try {
      if (paymentLink) {
        location.href = paymentLink;
        return;
      }
      const response = await fetch(config.checkoutApi + '/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product.id }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || 'Checkout unavailable');
      const url = validCheckoutUrl(body.url);
      if (!url || body.mode !== config.paymentMode) throw Error("Checkout could not be verified. Please try again.");
      location.href = url;
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
    }
  });
  article.append(heading, description, price, note, button);
  container.append(article);
}

const dialog = document.querySelector('#preview-dialog');
for (const button of document.querySelectorAll('[data-preview]')) {
  button.addEventListener('click', () => {
    document.querySelector('#preview-image').src = button.dataset.preview;
    dialog.showModal();
  });
}
document.querySelector('#close-preview').addEventListener('click', () => dialog.close());
