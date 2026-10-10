const status = document.querySelector('#download-status');
const links = document.querySelector('#download-links');
const retry = document.querySelector('#check-payment');
const sessionId = new URLSearchParams(location.search).get('session_id');
let config;
try { config = await fetch('../config.json').then(r => r.json()); } catch { /* Show the helpful unavailable state below. */ }
async function check() {
  links.replaceChildren(); retry.hidden = true;
  if (!sessionId) { status.textContent = 'Open the private download link from your completed checkout. No payment reference was supplied.'; return; }
  if (!config?.checkoutApi) { status.textContent = 'Downloads are not connected yet. Please contact Climate Guidance if you have already paid.'; return; }
  status.textContent = 'Checking your payment…';
  try {
    const response = await fetch(config.checkoutApi + '/api/downloads', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})});
    const body = await response.json();
    if (!response.ok) { retry.hidden = response.status !== 409 && response.status !== 502; throw Error(body.error || 'We could not check this payment. Please try again.'); }
    for (const file of body.files) {
      if (!['pdf','epub'].includes(file.format)) continue;
      // Construct known routes locally: never follow an arbitrary URL from a response.
      const a = document.createElement('a');
      a.href = `${config.checkoutApi}/api/download/${file.format}?session_id=${encodeURIComponent(sessionId)}`;
      a.className = 'button'; a.rel = 'noreferrer'; a.textContent = `Download ${file.format.toUpperCase()}`; links.append(a);
    }
    status.textContent = 'Payment confirmed. Both formats are ready.';
  } catch (error) { status.textContent = error.message; }
}
retry.addEventListener('click', check); await check();
