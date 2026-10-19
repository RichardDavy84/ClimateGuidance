// Digital sales retain their existing checkout. Paperback orders have a separate link.
const requestPath = '/counting-carbon/paperback/';
const products = document.querySelector('#products');
function addDirectOption() {
  const article = [...products.querySelectorAll('article')].find(a => a.querySelector('h3')?.textContent === 'Printed edition');
  if (!article || article.querySelector('[data-direct-paperback]')) return;
  const amazon = article.querySelector('a');
  if (!amazon) return;
  amazon.textContent = 'Buy from Amazon';
  amazon.className = 'button button-quiet';
  const actions = document.createElement('div'); actions.className = 'print-actions';
  const direct = document.createElement('a'); direct.className = 'button';
  direct.href = products.dataset.paperbackUrl || requestPath; direct.dataset.directPaperback = 'true';
  direct.textContent = products.dataset.paperbackMode === 'live' ? 'Buy direct €19.99' : 'Direct orders coming soon';
  amazon.replaceWith(actions); actions.append(direct, amazon);
  const note = article.querySelector('.small-note');
  note.textContent = products.dataset.paperbackMode === 'live' ? 'European postage included. Ships from Norway; import taxes and carrier fees, where applicable, are payable by the recipient.' : 'Amazon prices and delivery options appear at checkout. Direct orders will include postage within Europe.';
  const price = article.querySelector('.format-price'); price.textContent = ''; price.hidden = true;
  article.querySelector('h3 + p').textContent = products.dataset.paperbackMode === 'live' ? 'Paperback edition. Order direct to receive PDF + EPUB too.' : 'Paperback edition, available through Amazon.';
}
if (products) {
  const observer = new MutationObserver(() => { addDirectOption(); if (products.querySelector('[data-direct-paperback]')) observer.disconnect(); });
  observer.observe(products, {childList:true,subtree:true}); addDirectOption();
}
