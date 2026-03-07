/**
 * Guided tour — lightweight spotlight + tooltip walkthrough.
 */

const TOUR_KEY = 'tourCompleted';

const STEPS = [
  {
    selector: '.profile-bar',
    title: 'Profiles',
    body: 'Create separate profiles for different vehicles or billing periods. Each profile stores its own dates, rates, kWh data, and history independently.'
  },
  {
    selector: '#setupSection',
    title: 'Step 1: Billing Period',
    body: 'Set your billing period dates, rate per kWh, and optional tiered rates or additional charges.'
  },
  {
    selector: '#usageSection',
    title: 'Step 2: Daily Usage',
    body: 'Enter daily kWh usage manually or import from a CSV file. Fields generate automatically from your billing period dates.'
  },
  {
    selector: '#resultSection',
    title: 'Step 3: Your Reimbursement',
    body: 'Calculate your total reimbursement, export to PDF, Excel, or Receipt, and view your usage chart and billing history below.'
  },
  {
    selector: '#chartBox',
    title: 'Usage & Cost Chart',
    body: 'Interactive dual-axis chart showing your daily kWh usage and cost side by side. Hover for detailed tooltips.'
  },
  {
    selector: '#historyBox',
    title: 'Billing History',
    body: 'Archive completed billing periods here. Browse, restore, or delete past records and export individual history entries as PDFs.'
  },
  {
    selector: '#trendBox',
    title: 'Month-over-Month Trends',
    body: 'Compare archived billing periods over time — see how your kWh usage, cost, and daily average change month to month.'
  },
  {
    selector: '#statsBox',
    title: 'EV Impact',
    body: 'See the environmental impact of your EV charging — CO₂ saved compared to gasoline and total miles powered by electricity.'
  },
  {
    selector: '#nerdsBox',
    title: 'Stats for Nerds',
    body: 'Detailed usage analytics including total days tracked, average daily usage, cost per mile, data points, and build info.'
  }
];

let spotlight = null;
let tooltip = null;
let currentStep = 0;
/** Visible steps filtered at tour start (skips hidden collapsibles). */
let visibleSteps = [];

function createElements() {
  spotlight = document.createElement('div');
  spotlight.className = 'tour-spotlight';
  document.body.appendChild(spotlight);

  tooltip = document.createElement('div');
  tooltip.className = 'tour-tooltip';
  tooltip.setAttribute('role', 'dialog');
  tooltip.setAttribute('aria-label', 'Guided tour');
  tooltip.setAttribute('aria-live', 'polite');
  document.body.appendChild(tooltip);
}

function removeElements() {
  spotlight?.remove();
  tooltip?.remove();
  spotlight = null;
  tooltip = null;
}

function positionSpotlight(el) {
  const rect = el.getBoundingClientRect();
  const pad = 8;
  spotlight.style.top = (rect.top - pad) + 'px';
  spotlight.style.left = (rect.left - pad) + 'px';
  spotlight.style.width = (rect.width + pad * 2) + 'px';
  spotlight.style.height = (rect.height + pad * 2) + 'px';
}

function positionTooltip(el) {
  const rect = el.getBoundingClientRect();
  const pad = 8;
  const tooltipRect = tooltip.getBoundingClientRect();

  // Default: below the element
  let top = rect.bottom + pad + 8;
  let left = rect.left;

  // If tooltip would go below viewport, place above
  if (top + tooltipRect.height > window.innerHeight - 16) {
    top = rect.top - pad - tooltipRect.height - 8;
  }

  // If still off-screen (above viewport), just pin to top
  if (top < 8) top = 8;

  // Constrain horizontally
  const maxLeft = window.innerWidth - tooltipRect.width - 12;
  if (left > maxLeft) left = maxLeft;
  if (left < 12) left = 12;

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

function renderTooltip(step, index) {
  const total = visibleSteps.length;
  const isLast = index === total - 1;
  tooltip.innerHTML = `
    <div class="tour-tooltip-title">${step.title}</div>
    <div class="tour-tooltip-body">${step.body}</div>
    <div class="tour-tooltip-footer">
      <span class="tour-step-counter">${index + 1} of ${total}</span>
      <div class="tour-tooltip-actions">
        <button class="tour-btn" data-tour-action="skip" aria-label="Skip tour">Skip</button>
        <button class="tour-btn tour-btn-primary" data-tour-action="next" aria-label="${isLast ? 'Finish tour' : 'Next step'}">
          ${isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  `;

  // Focus the Next/Finish button for keyboard users
  const nextBtn = tooltip.querySelector('[data-tour-action="next"]');
  if (nextBtn) nextBtn.focus();
}

function showStep(index) {
  if (index < 0 || index >= visibleSteps.length) { endTour(); return; }

  const step = visibleSteps[index];
  const el = document.querySelector(step.selector);
  if (!el) { endTour(); return; }

  currentStep = index;

  // Scroll target into view
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Wait for scroll to settle, then position
  setTimeout(() => {
    positionSpotlight(el);
    renderTooltip(step, index);
    positionTooltip(el);
  }, 350);
}

function endTour() {
  removeElements();
  localStorage.setItem(TOUR_KEY, 'true');
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClick);
}

function advanceStep() {
  tooltip.style.animation = 'none';
  tooltip.offsetHeight; // force reflow
  tooltip.style.animation = '';
  if (currentStep < visibleSteps.length - 1) {
    showStep(currentStep + 1);
  } else {
    endTour();
  }
}

function retreatStep() {
  if (currentStep > 0) {
    tooltip.style.animation = 'none';
    tooltip.offsetHeight;
    tooltip.style.animation = '';
    showStep(currentStep - 1);
  }
}

function handleClick(e) {
  const action = e.target.closest('[data-tour-action]');
  if (!action) return;

  e.preventDefault();
  e.stopPropagation();

  if (action.dataset.tourAction === 'skip') {
    endTour();
  } else if (action.dataset.tourAction === 'next') {
    advanceStep();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    endTour();
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault();
    advanceStep();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    retreatStep();
  }
}

/**
 * Filter STEPS to only those whose target element exists and is visible.
 * Collapsible sections hidden via `display: none` (no `.show` class) are skipped.
 */
function getVisibleSteps() {
  return STEPS.filter(step => {
    const el = document.querySelector(step.selector);
    if (!el) return false;
    // Skip elements hidden by CSS (e.g. collapsibles without .show)
    return el.offsetParent !== null || el.offsetHeight > 0;
  });
}

export function startTour() {
  // Clean up any existing tour elements
  removeElements();

  // Build visible step list at tour start
  visibleSteps = getVisibleSteps();
  if (visibleSteps.length === 0) return;

  createElements();
  currentStep = 0;

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClick);

  showStep(0);
}

export function initTour() {
  if (localStorage.getItem(TOUR_KEY) !== 'true') {
    // Small delay so the page finishes rendering
    setTimeout(startTour, 800);
  }
}
