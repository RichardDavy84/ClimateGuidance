// The existing digital checkout is retained. Direct paperback orders use their own configuration.
const requestPath = '/counting-carbon/paperback/';
const products = document.querySelector('#products');
function addDirectOption() {
  const article = [...products.querySelectorAll('article')].find(a => a.querySelector('h3')?.textContent === 'Printed edition');
  if (!article || article.querySelector('[data-direct-paperback]')) return;
  const amazon = article.querySelector('a');
  if (!amazon) return;
  amazon.textContent = 'Get a copy from Amazon';
  const actions = document.createElement('div'); actions.className = 'print-actions';
  const direct = document.createElement('a'); direct.className = 'button button-quiet';
  direct.href = products.dataset.paperbackUrl || requestPath; direct.dataset.directPaperback = 'true'; direct.textContent = products.dataset.paperbackMode === 'live' ? 'Request a copy direct' : 'Direct orders coming soon';
  amazon.replaceWith(actions); actions.append(amazon, direct);
  const note = article.querySelector('.small-note');
  note.textContent = products.dataset.paperbackMode === 'live' ? 'Direct orders include postage within Europe. Amazon prices and delivery options appear at checkout.' : 'Amazon prices and delivery options appear at checkout. Direct orders will include postage within Europe.';
  const price = article.querySelector('.format-price'); price.textContent = products.dataset.paperbackMode === 'live' ? '€19.99 direct' : 'See Amazon for the current price';
  article.querySelector('h3 + p').textContent = products.dataset.paperbackMode === 'live' ? 'Paperback edition. Order direct or through Amazon.' : 'Paperback edition, available through Amazon.';
}
if (products) {
  const observer = new MutationObserver(() => { addDirectOption(); if (products.querySelector('[data-direct-paperback]')) observer.disconnect(); });
  observer.observe(products, {childList:true,subtree:true}); addDirectOption();
}
