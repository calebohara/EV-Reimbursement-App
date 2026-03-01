/**
 * App entry point — imports all modules and wires up initialization.
 */

import * as storage from './storage.js';
import { initDarkMode, toggleDarkMode, initializeTooltips } from './ui.js';
import { setupProfileUI } from './profiles.js';
import { setOnProfileChange } from './profiles.js';
import { updateTierInputsState, isUsingTieredRates, validateTierInputs } from './billing.js';
import { generateKwhFields, checkAndGenerateFields, attachKwhValidation, setOnFieldsGenerated } from './fields.js';
import { generateCSVTemplate, importCSV, setOnImportComplete } from './csv.js';
import { renderUsageChart } from './chart.js';
import { updateSummary } from './summary.js';
import { exportToExcel } from './exports/excel.js';
import { exportToPDF } from './exports/pdf.js';
import { initializeFeedbackForm, submitFeedback } from './feedback.js';
import { showButtonLoading, resetButtonLoading, scrollToAndHighlight } from './ui.js';
import { parseLocalDate } from './utils/dates.js';
import { computeTieredTotals } from './billing.js';

// --- Cross-module callbacks ---

function onDataChange() {
  renderUsageChart();
  updateSummary();
}

// When fields are generated or kWh values change
setOnFieldsGenerated(onDataChange);

// When CSV is imported
setOnImportComplete(onDataChange);

// When profile changes, reload everything
setOnProfileChange(() => {
  storage.loadFormData();
  updateTierInputsState();

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
});

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

  // Progressive saving — auto-save on all input/change events
  ['input', 'change'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      if (e.target.matches('input,select,textarea')) {
        storage.saveFormData();
      }
      // Update chart and summary on relevant field changes
      if (e.target.classList.contains('dailyKwh') ||
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
});

// --- Expose functions to HTML onclick handlers via data-action attributes ---
// Using event delegation for clean module integration

document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  switch (action) {
    case 'reset': resetForm(); break;
    case 'calculate': calculateTotal(); break;
    case 'export-excel': exportToExcel(); break;
    case 'export-pdf': exportToPDF(); break;
    case 'download-csv-template': generateCSVTemplate(); break;
    case 'import-csv': importCSV(); break;
    case 'submit-feedback': submitFeedback(); break;
    case 'toggle-dark-mode':
      toggleDarkMode();
      setTimeout(() => onDataChange(), 100);
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
