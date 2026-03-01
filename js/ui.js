/**
 * UI helpers — dark mode toggle, button loading states, tooltips.
 */

import * as storage from './storage.js';

// --- Dark mode ---

export function initDarkMode() {
  if (storage.getDarkMode()) {
    document.body.classList.add('dark-mode');
  }
}

export function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  storage.setDarkMode(document.body.classList.contains('dark-mode'));
}

// --- Button loading helpers ---

export function showButtonLoading(button, loadingText = 'Loading...') {
  if (!button) return;
  button.dataset.originalContent = button.innerHTML;
  button.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    ${loadingText}
  `;
  button.disabled = true;
}

export function resetButtonLoading(button, fallbackContent = null) {
  if (!button) return;
  button.innerHTML = fallbackContent || button.dataset.originalContent || button.innerHTML;
  button.disabled = false;
  delete button.dataset.originalContent;
}

// --- Tooltips ---

export function initializeTooltips() {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
}

// --- Scroll & highlight helpers ---

export function scrollToAndHighlight(element, highlightClass = 'highlight', duration = 1500) {
  if (!element) return;
  element.classList.add(highlightClass);
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  setTimeout(() => element.classList.remove(highlightClass), duration);
}
