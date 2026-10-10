const guides = {
  claim: {
    intro: '.tool-intro', name: 'The Claim Checker',
    steps: [
      ['#quantity', 'Start with the quantity', 'Enter how many cars, journeys, homes or trees the claim refers to. You can change this at any time.'],
      ['.choose', 'Choose the comparison', 'Search for a word such as “flight” or “tree”, then choose an item from the list. The units and time period matter.'],
      ['#parameters, #equivalence', 'Check the assumptions', 'Some comparisons reveal extra inputs: a flight’s distance, a country, or tree survival and growth. Tree capture is averaged over 30 years.'],
      ['#claim-result', 'Read the answer', 'The box translates your claim into tonnes of CO₂, or CO₂-equivalent where stated. “Per year” means an annual rate, not an immediate removal.'],
      ['#claim-details', 'See where the factor comes from', 'Open this explanation whenever you want to check a source or understand what the comparison includes.'],
    ],
  },
  time: {
    intro: '.tool-intro', name: 'The Carbon Time Machine',
    steps: [
      ['.time-top .parameters', 'Enter an amount of CO₂', 'Choose the quantity and unit. A gigatonne is a billion tonnes; this is an amount of carbon dioxide, not an annual rate.'],
      ['#atmosphere-result', 'Compare with atmospheric history', 'We subtract that amount from the latest annual concentration in the dataset, then look for the corresponding year in the Mauna Loa record.'],
      ['#history-chart', 'Follow the historical record', 'The marker shows the comparison on the observed CO₂ curve. It does not predict temperature or recreate a past climate.'],
      ['.map-controls', 'Choose an emissions comparison', 'Select a country or continent, or use the map. Reset to Global returns to the worldwide comparison.'],
      ['#region-result', 'Read the equivalent time', 'This divides your amount by the selected region’s annual fossil and industrial CO₂ emissions. It tells you how long emitting that amount would take at that rate.'],
      ['#time-method', 'Check the method', 'The explanations below the map give the arithmetic, data years and boundaries, including why carbon-cycle rebound is not modelled.'],
    ],
  },
  management: {
    intro: '.intro', name: 'Carbon Management',
    steps: [
      ['.presets', 'Choose a starting scenario', 'Practical Scenario uses the book’s worked assumptions. IPCC Assessed and Physical Limit offer other reference points; they are not forecasts.'],
      ['#compact-method, [data-method="forest"]', 'Explore an approach', 'Choose a method from the menu, or click a circle on larger screens. We’ll use forests to show you the controls. Circle size does not represent potential.'],
      ['#compact-primary, #constraint-controls', 'Change an assumption', 'Adjust the sliders to explore how resources and performance change this method’s annual potential. “More assumptions” opens the remaining inputs.'],
      ['.compact-comparison, #global-bars', 'Watch the comparison', 'The additional-removal total updates as you change assumptions. The red reference stays at 19 GtCO₂ per year: the book’s benchmark for atmospheric increase.'],
      ['#evidence', 'Inspect the calculation', 'Check the selected method’s equation and assumptions here. The sources section explains the evidence and limitations. Use the scenario buttons to reset your inputs.'],
    ],
  },
};

export function initTutorial(id, hooks = {}) {
  const guide = guides[id], intro = document.querySelector(guide?.intro);
  if (!intro) return;
  const key = `counting-carbon:tutorial:${id}:1`;
  let previousFocus, step = -1, target, changedDetails = [], touring = false;
  const launch = document.createElement('button');
  launch.type = 'button'; launch.className = 'cc-tutorial-launch'; launch.textContent = 'Show tutorial'; intro.append(launch);
  const dialog = document.createElement('dialog'); dialog.className = 'cc-tutorial';
  dialog.setAttribute('aria-labelledby', `cc-guide-title-${id}`);
  dialog.innerHTML = `<div class="cc-tour-highlight" aria-hidden="true" hidden></div><div class="cc-tour-card"><p class="cc-tour-count"></p><h2 id="cc-guide-title-${id}"></h2><p class="cc-tour-copy"></p><div class="cc-tour-actions"><button type="button" data-action="close">Close tutorial</button><button type="button" data-action="back">Back</button><button type="button" data-action="next">Next</button></div></div>`;
  document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector), closeButton = $('[data-action="close"]'), backButton = $('[data-action="back"]'), nextButton = $('[data-action="next"]');
  function remember() { try { localStorage.setItem(key, 'seen'); } catch { /* The guide still works when storage is unavailable. */ } }
  function restoreDetails() { for (const d of changedDetails) d.open = false; changedDetails = []; }
  function finish() {
    remember(); dialog.close(); restoreDetails(); target = null;
    if (touring) hooks.onClose?.(); touring = false;
    previousFocus?.focus?.({preventScroll:true});
  }
  function position() {
    if (!dialog.open || step < 0 || !target) return;
    const r = target.getBoundingClientRect(), gap = 16, width = Math.min(390, innerWidth - 32);
    dialog.style.width = `${width}px`;
    const h = dialog.getBoundingClientRect().height;
    let y = r.bottom + gap;
    if (y + h > innerHeight - gap) y = r.top - h - gap;
    if (y < gap) y = innerHeight - h - gap;
    dialog.style.top = `${Math.max(gap, y)}px`;
    dialog.style.left = `${Math.max(gap, Math.min(r.left, innerWidth - width - gap))}px`;
    const high = $('.cc-tour-highlight'); high.hidden = false;
    Object.assign(high.style, {left:`${r.left-5}px`,top:`${r.top-5}px`,width:`${r.width+10}px`,height:`${r.height+10}px`});
  }
  function showStep() {
    restoreDetails(); hooks.onStep?.(step); dialog.classList.remove('cc-tour-offer');
    const [selectors, title, copy] = guide.steps[step];
    for (const selector of selectors.split(',')) {
      const candidate = document.querySelector(selector.trim());
      if (!candidate) continue;
      const details = candidate.closest('details');
      if (details && !details.open) { details.open = true; changedDetails.push(details); }
      const r = candidate.getBoundingClientRect();
      if (r.width && r.height) { target = candidate; break; }
    }
    $('.cc-tour-count').textContent = `${step+1} of ${guide.steps.length}`;
    $('h2').textContent = title; $('.cc-tour-copy').textContent = copy;
    closeButton.textContent = 'Close tutorial'; backButton.hidden = step === 0;
    nextButton.textContent = step === guide.steps.length - 1 ? 'Finish' : 'Next';
    target?.scrollIntoView({behavior:'instant',block:'center'});
    position(); nextButton.focus({preventScroll:true});
    requestAnimationFrame(position);
  }
  function start(offer = false) {
    previousFocus = document.activeElement; target = null; step = offer ? -1 : 0;
    dialog.style.cssText = ''; $('.cc-tour-highlight').hidden = true;
    if (!dialog.open) dialog.showModal();
    if (offer) {
      dialog.classList.add('cc-tour-offer'); $('.cc-tour-count').textContent = guide.name;
      $('h2').textContent = 'Would you like a quick guide?';
      $('.cc-tour-copy').textContent = 'Take a short tour of the key controls. You can stop at any point and reopen it with “Show tutorial”.';
      closeButton.textContent = 'No thanks'; backButton.hidden = true; nextButton.textContent = 'Show tutorial'; nextButton.focus();
    } else { touring = true; hooks.onStart?.(); showStep(); }
  }
  closeButton.addEventListener('click', finish);
  backButton.addEventListener('click', () => { step--; target = null; showStep(); });
  nextButton.addEventListener('click', () => {
    remember();
    if (step === guide.steps.length - 1) return finish();
    if (step < 0) { touring = true; hooks.onStart?.(); }
    step++; target = null; showStep();
  });
  // Capture Escape so a tutorial dismissal does not also navigate the underlying tool.
  document.addEventListener('keydown', e => { if (dialog.open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(); } }, true);
  dialog.addEventListener('cancel', e => { e.preventDefault(); finish(); });
  launch.addEventListener('click', () => start());
  window.addEventListener('resize', position); window.addEventListener('scroll', position, {passive:true});
  let seen = true; try { seen = localStorage.getItem(key) === 'seen'; } catch { /* Avoid repeated unsolicited prompts when storage is blocked. */ }
  if (!seen) start(true);
}
