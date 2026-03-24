/**
 * UI helpers — theme switcher, button loading states, tooltips.
 */

import * as storage from './storage.js';

// --- Theme switcher (system / light / dark) ---

const darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
let currentMode = 'system';

function applyTheme(mode) {
  const isDark = mode === 'dark' || (mode === 'system' && darkMQ.matches);
  document.body.classList.toggle('dark-mode', isDark);
}

function updateSwitcherUI(mode) {
  const switcher = document.querySelector('.theme-switcher');
  if (!switcher) return;
  switcher.dataset.active = mode;
  switcher.querySelectorAll('.theme-option').forEach(btn => {
    const isActive = btn.dataset.theme === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
}

export function setTheme(mode) {
  if (!['system', 'light', 'dark'].includes(mode)) return;
  currentMode = mode;
  storage.setThemeMode(mode);
  applyTheme(mode);
  updateSwitcherUI(mode);
}

export function initTheme() {
  currentMode = storage.getThemeMode();
  applyTheme(currentMode);
  updateSwitcherUI(currentMode);

  // Listen for OS theme changes (relevant when mode is 'system')
  darkMQ.addEventListener('change', () => {
    if (currentMode === 'system') {
      applyTheme('system');
    }
  });
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
