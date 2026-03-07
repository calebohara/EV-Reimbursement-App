/**
 * App entry point — imports all modules and wires up initialization.
 */

import * as storage from './storage.js';
import { initDarkMode, toggleDarkMode, initializeTooltips } from './ui.js';
import { setupProfileUI } from './profiles.js';
import { setOnProfileChange } from './profiles.js';
import { updateTierInputsState, isUsingTieredRates, validateTierInputs, updateAdditionalChargesState, getAdditionalCharges } from './billing.js';
import { generateKwhFields, checkAndGenerateFields, attachKwhValidation, setOnFieldsGenerated } from './fields.js';
import { generateCSVTemplate, importCSV, setOnImportComplete } from './csv.js';
import { renderUsageChart } from './chart.js';
import { updateSummary } from './summary.js';
import { exportToExcel } from './exports/excel.js';
import { exportToPDF } from './exports/pdf.js';
import { exportReceipt } from './exports/receipt.js';
import { initializeFeedbackForm, submitFeedback } from './feedback.js';
import { showButtonLoading, resetButtonLoading, scrollToAndHighlight } from './ui.js';
import { parseLocalDate } from './utils/dates.js';
import { computeTieredTotals } from './billing.js';
import { archiveCurrentPeriod, renderHistoryList, restorePeriod, deletePeriod, exportHistoryPDF, setOnHistoryChange } from './history.js';
import { initPresets, applyPreset, saveCurrentAsPreset, deleteSelectedPreset, setOnPresetApply } from './presets.js';
import { renderTrendChart } from './trend.js';
import { getStorageUsage, clearAllData } from './storage.js';
import { initTour, startTour } from './tour.js';
import { updateStats } from './stats.js';

function updateStorageIndicator() {
  const el = document.getElementById('storageUsageText');
  if (!el) return;
  const { bytes } = getStorageUsage();
  if (bytes < 1024) el.textContent = `${bytes} B`;
  else if (bytes < 1024 * 1024) el.textContent = `${(bytes / 1024).toFixed(1)} KB`;
  else el.textContent = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// --- Cross-module callbacks ---

function onDataChange() {
  renderUsageChart();
  updateSummary();
  updateStats();
}

// When fields are generated or kWh values change
setOnFieldsGenerated(onDataChange);

// When CSV is imported
setOnImportComplete(onDataChange);

// When history changes, re-render history list and trend chart
setOnHistoryChange(() => {
  renderHistoryList();
  renderTrendChart();
  updateStats();
});

// When a preset is applied, update chart/summary
setOnPresetApply(onDataChange);

// When profile changes, reload everything
setOnProfileChange(() => {
  storage.loadFormData();
  updateTierInputsState();
  updateAdditionalChargesState();
  rebuildChargeRows();
  initPresets();

  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  if (startDate && endDate) {
    setTimeout(() => {
      generateKwhFields();
    }, 100);
  } else {
    const kwhFieldsBox = document.getElementById('kwhFieldsBox');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show');
    const kwhFields = document.getElementById('kwhFields');
    if (kwhFields) kwhFields.innerHTML = '';
  }

  attachKwhValidation();
  onDataChange();
  renderHistoryList();
  renderTrendChart();
});

// --- Additional charge row management ---

function addChargeRow(name = '', amount = '') {
  const container = document.getElementById('additionalChargeRows');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'additional-charge-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'field-input charge-name';
  nameInput.placeholder = 'Charge name';
  nameInput.value = name;

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '0.01';
  amountInput.className = 'field-input charge-amount';
  amountInput.placeholder = '$0.00';
  amountInput.value = amount;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn-icon-sm btn-icon-danger';
  removeBtn.dataset.action = 'remove-charge';
  removeBtn.title = 'Remove charge';
  removeBtn.setAttribute('aria-label', 'Remove charge');
  removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';

  row.append(nameInput, amountInput, removeBtn);
  container.appendChild(row);
}

function rebuildChargeRows() {
  const container = document.getElementById('additionalChargeRows');
  if (!container) return;
  container.innerHTML = '';
  const raw = storage.getItem('additionalChargesData');
  let charges = [];
  try { charges = raw ? JSON.parse(raw) : []; } catch { charges = []; }
  charges.forEach(c => addChargeRow(c.name, c.amount || ''));
}

// --- Calculate reimbursement ---

function calculateTotal() {
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
  const calculateBtn = document.querySelector('[data-action="calculate"]');
  const costPerKwh = parseFloat(costPerKwhInput.value);
  const tiersOk = isUsingTieredRates() && validateTierInputs(true);

  if (!tiersOk && isNaN(costPerKwh)) {
    alert('Please enter a valid cost per kWh.');
    costPerKwhInput.classList.add('is-invalid');
    scrollToAndHighlight(costPerKwhBox);
    costPerKwhInput.focus();
    return;
  }
  costPerKwhInput.classList.remove('is-invalid');

  showButtonLoading(calculateBtn, 'Calculating...');

  setTimeout(() => {
    const { totalCost } = computeTieredTotals(isNaN(costPerKwh) ? 0 : costPerKwh);
    const resultBox = document.getElementById('resultBox');
    document.getElementById('result').innerText = `Total Reimbursement: $${totalCost.toFixed(2)}`;
    resultBox.classList.add('show');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    resetButtonLoading(calculateBtn, '<i class="bi bi-calculator-fill"></i> Calculate Reimbursement');
  }, 500);
}

// --- Reset form ---

function resetForm() {
  storage.clearFormData();
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('costPerKwh').value = '';

  const resultBox = document.getElementById('resultBox');
  if (resultBox) resultBox.classList.remove('show');
  const resultText = document.getElementById('result');
  if (resultText) resultText.innerText = '';

  const kwhFieldsBox = document.getElementById('kwhFieldsBox');
  if (kwhFieldsBox) kwhFieldsBox.classList.remove('show');
  const kwhFields = document.getElementById('kwhFields');
  if (kwhFields) kwhFields.innerHTML = '';

  location.reload();
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode
  initDarkMode();

  // Profiles
  setupProfileUI();

  // Load saved data
  storage.loadFormData();
  updateTierInputsState();
  updateAdditionalChargesState();
  rebuildChargeRows();

  // Rate presets
  initPresets();

  // Generate fields if dates exist
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  if (startDate && endDate) {
    setTimeout(() => generateKwhFields(), 100);
  }

  // Tooltips
  initializeTooltips();

  // Feedback form
  initializeFeedbackForm();

  // Initial chart and summary
  renderUsageChart();
  updateSummary();

  // History list and trend chart
  renderHistoryList();
  renderTrendChart();

  // Storage indicator
  updateStorageIndicator();

  // EV Impact stats
  updateStats();

  // Guided tour for first-time visitors
  initTour();

  // Ensure result box is hidden on load
  const resultBox = document.getElementById('resultBox');
  if (resultBox) {
    resultBox.classList.remove('show');
    const resultText = document.getElementById('result');
    if (resultText) resultText.innerText = '';
  }

  // Cost per kWh input — clear invalid state on valid input
  document.getElementById('costPerKwh').addEventListener('input', function () {
    if (!isNaN(parseFloat(this.value))) {
      this.classList.remove('is-invalid');
      const box = this.closest('.billing-box');
      if (box) box.classList.remove('highlight');
    }
  });

  // Rate preset dropdown — apply on change
  const presetSelect = document.getElementById('ratePresetSelect');
  if (presetSelect) {
    presetSelect.addEventListener('change', () => {
      applyPreset(presetSelect.value);
    });
  }

  // Progressive saving — auto-save on all input/change events
  ['input', 'change'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.target.matches('input,select,textarea')) {
        storage.saveFormData();
        updateStorageIndicator();
      }
      // Update chart and summary on relevant field changes
      if (e.target.classList.contains('dailyKwh') ||
          e.target.classList.contains('charge-name') ||
          e.target.classList.contains('charge-amount') ||
          e.target.id === 'costPerKwh' ||
          e.target.id === 'startDate' ||
          e.target.id === 'endDate') {
        onDataChange();
      }
    });
  });

  // Tier input validation
  ['tier1Limit', 'tier1Rate', 'tier2Rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => validateTierInputs(false));
      el.addEventListener('change', () => validateTierInputs(false));
    }
  });

  // Tiered rates checkbox — listen for change event (not handled by click delegation)
  const tieredCheckbox = document.getElementById('useTieredRates');
  if (tieredCheckbox) {
    tieredCheckbox.addEventListener('change', () => {
      storage.saveFormData();
      updateTierInputsState();
      onDataChange();
    });
  }

  // Additional charges checkbox
  const chargesCheckbox = document.getElementById('useAdditionalCharges');
  if (chargesCheckbox) {
    chargesCheckbox.addEventListener('change', () => {
      storage.saveFormData();
      updateAdditionalChargesState();
      onDataChange();
    });
  }
});

// --- Expose functions to HTML onclick handlers via data-action attributes ---
// Using event delegation for clean module integration

document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;

  switch (action) {
    case 'start-tour': startTour(); break;
    case 'reset': resetForm(); break;
    case 'calculate': calculateTotal(); break;
    case 'export-excel': exportToExcel(); break;
    case 'export-pdf': exportToPDF(); break;
    case 'export-receipt': exportReceipt(); break;
    case 'download-csv-template': generateCSVTemplate(); break;
    case 'import-csv': importCSV(); break;
    case 'submit-feedback': submitFeedback(); break;
    case 'archive-period': archiveCurrentPeriod(); break;
    case 'save-rate-preset': saveCurrentAsPreset(); break;
    case 'delete-rate-preset': deleteSelectedPreset(); break;
    case 'toggle-dark-mode':
      toggleDarkMode();
      setTimeout(() => {
        onDataChange();
        renderTrendChart();
      }, 100);
      break;
    case 'restore-period':
      restorePeriod(actionEl.dataset.historyId);
      // After restore, regenerate fields with restored data
      setTimeout(() => {
        generateKwhFields();
      }, 200);
      break;
    case 'delete-period':
      deletePeriod(actionEl.dataset.historyId);
      break;
    case 'export-history-pdf':
      exportHistoryPDF(actionEl.dataset.historyId);
      break;
    case 'clear-all-data':
      if (confirm('This will permanently delete ALL app data including:\n\n• All profiles and their billing periods\n• All archived billing history\n• All saved rate presets\n• Dark mode and display preferences\n\nThis cannot be undone. Continue?')) {
        clearAllData();
        window.location.reload();
      }
      break;
    case 'add-charge':
      addChargeRow();
      storage.saveFormData();
      onDataChange();
      break;
    case 'remove-charge':
      actionEl.closest('.additional-charge-row')?.remove();
      storage.saveFormData();
      onDataChange();
      break;
    case 'refresh-app':
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) reg.update().then(() => window.location.reload());
          else window.location.reload();
        });
      } else {
        window.location.reload();
      }
      break;
  }
});

// Date change triggers auto-generate
document.addEventListener('change', (e) => {
  if (e.target.id === 'startDate' || e.target.id === 'endDate') {
    storage.saveFormData();
    checkAndGenerateFields();
  }
});
