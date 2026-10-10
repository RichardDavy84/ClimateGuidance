import { validCheckoutUrl } from './checkout.js';
const config = await fetch('./config.json').then(r => r.json());
const container = document.querySelector('#products');
const status = document.querySelector('#purchase-status');
const money = (amount, currency) => new Intl.NumberFormat('en', {
  style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(amount);

for (const product of config.products) {
  const printed = product.id === 'hardcopy';
  const checkoutReady = !printed && product.availability !== 'coming_soon' &&
    config.salesStatus !== 'coming_soon' && Boolean(config.checkoutApi);
  const article = document.createElement('article');
  const heading = document.createElement('h3');
  const description = document.createElement('p');
  const price = document.createElement('p');
  const note = document.createElement('p');
  const button = document.createElement('button');
  heading.textContent = product.name;
  description.textContent = product.description;
  price.className = 'format-price';
  price.textContent = printed
    ? 'Coming soon'
    : money(product.price, product.currency);
  note.className = 'small-note';
  note.textContent = printed
    ? 'Details will follow when the print edition is ready.'
    : (checkoutReady
      ? 'Secure checkout. Applicable VAT included. Both files included.'
      : 'PDF and EPUB included. Downloads will be available here when sales open.');
  button.disabled = !checkoutReady || product.price === null;
  button.textContent = printed
    ? 'Printed edition — coming soon'
    : (checkoutReady ? 'Get PDF + EPUB' : 'PDF + EPUB — coming soon');
  button.addEventListener('click', async () => {
    if (printed) return;
    button.disabled = true;
    status.textContent = 'Opening secure checkout…';
    try {
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
