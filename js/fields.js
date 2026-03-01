/**
 * kWh input field generation, validation, and loading states.
 */

import { ymd, parseLocalDate, isValidDateRange, forEachDay } from './utils/dates.js';
import * as storage from './storage.js';
import { initializeTooltips } from './ui.js';

// Callbacks set by app.js for cross-module communication
let onFieldsGenerated = null;

export function setOnFieldsGenerated(fn) {
  onFieldsGenerated = fn;
}

// --- Field generation ---

export function generateKwhFields() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const kwhFields = document.getElementById('kwhFields');
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');

  if (!isValidDateRange(startDateStr, endDateStr)) {
    alert('Please enter valid start and end dates.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show');
    return;
  }

  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);

  showFieldsLoading();

  setTimeout(() => {
    let html = '';
    forEachDay(startDate, endDate, (d) => {
      const formattedDate = ymd(d);
      html += `
        <div class="mb-2 kwh-field-row">
          <label><i class="bi bi-battery-charging"></i> ${formattedDate} kWh Usage:</label>
          <input type="number" step="0.01" class="form-control dailyKwh"
                 data-date="${formattedDate}"
                 data-bs-toggle="tooltip" data-bs-placement="right"
                 title="Enter kWh used for EV charging on ${formattedDate}. Find this data in your charger app or utility bill.">
        </div>`;
    });

    kwhFields.innerHTML = html;
    completeFieldsLoading();
    attachKwhValidation();
  }, 300);
}

function showFieldsLoading() {
  const kwhFields = document.getElementById('kwhFields');
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');

  kwhFields.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Generating kWh input fields...</div>
    </div>`;

  if (kwhFieldsBox) {
    kwhFieldsBox.classList.add('show');
  }
}

function completeFieldsLoading() {
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');
  if (kwhFieldsBox) kwhFieldsBox.classList.add('show');

  loadDailyKwh();
  initializeTooltips();

  if (onFieldsGenerated) onFieldsGenerated();
}

export function loadDailyKwh() {
  const dailyKwhData = storage.getDailyKwhData();
  document.querySelectorAll('.dailyKwh').forEach(input => {
    const date = input.getAttribute('data-date');
    if (dailyKwhData[date]) {
      input.value = dailyKwhData[date];
    }
  });
}

// --- Auto-generate on date selection ---

export function checkAndGenerateFields() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;

  if (!startDateStr || !endDateStr) return;
  if (!isValidDateRange(startDateStr, endDateStr)) return;

  generateKwhFields();
}

// --- Validation ---

export function validateKwhInput(input) {
  let warningDiv = input.nextElementSibling;
  if (!warningDiv || !warningDiv.classList.contains('kwh-warning')) {
    warningDiv = document.createElement('div');
    warningDiv.className = 'kwh-warning text-danger small';
    input.parentNode.insertBefore(warningDiv, input.nextSibling);
  }

  const value = parseFloat(input.value);
  let warning = '';

  if (!isNaN(value) && value < 0) {
    warning = 'kWh value cannot be negative.';
    input.classList.add('is-invalid');
  } else if (!isNaN(value) && value > 200) {
    warning = 'kWh value is unusually high.';
    input.classList.add('is-invalid');
  } else {
    input.classList.remove('is-invalid');
  }

  warningDiv.textContent = warning;
  warningDiv.style.display = warning ? '' : 'none';
}

export function attachKwhValidation() {
  document.querySelectorAll('.dailyKwh').forEach(input => {
    input.oninput = function () {
      validateKwhInput(this);
      storage.saveFormData();
      if (onFieldsGenerated) onFieldsGenerated();
    };
    validateKwhInput(input);
  });
}
