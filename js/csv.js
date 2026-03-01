/**
 * CSV template generation and CSV import with validation.
 */

import { ymd, parseLocalDate, isValidDateRange, forEachDay } from './utils/dates.js';
import * as storage from './storage.js';
import { showButtonLoading, resetButtonLoading, initializeTooltips } from './ui.js';
import { validateKwhInput } from './fields.js';

// Callback for post-import updates
let onImportComplete = null;
export function setOnImportComplete(fn) { onImportComplete = fn; }

// --- CSV Template Download ---

export function generateCSVTemplate() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const templateBtn = document.querySelector('[data-action="download-csv-template"]');

  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }

  showButtonLoading(templateBtn, 'Generating Template...');

  setTimeout(() => {
    if (!isValidDateRange(startDateStr, endDateStr)) {
      alert('Please enter valid billing period dates.');
      resetButtonLoading(templateBtn, '<i class="bi bi-download"></i> Download CSV Template');
      return;
    }

    const startDate = parseLocalDate(startDateStr);
    const endDate = parseLocalDate(endDateStr);

    let csvContent = 'Date,kWh Usage\n';
    forEachDay(startDate, endDate, (d) => {
      csvContent += `${ymd(d)},0\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kwh_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    resetButtonLoading(templateBtn, '<i class="bi bi-download"></i> Download CSV Template');
  }, 200);
}

// --- CSV Import ---

export function importCSV() {
  const file = document.getElementById('csvFile').files[0];
  const importBtn = document.querySelector('[data-action="import-csv"]');

  if (!file) {
    alert('Please select a CSV file to upload.');
    return;
  }
  if (!file.name.endsWith('.csv')) {
    alert('Please upload a valid .csv file.');
    return;
  }

  showButtonLoading(importBtn, 'Importing CSV...');
  document.getElementById('csvFile').disabled = true;

  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;

  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
    document.getElementById('csvFile').disabled = false;
    return;
  }

  if (!isValidDateRange(startDateStr, endDateStr)) {
    alert('Please enter valid billing period dates.');
    resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
    document.getElementById('csvFile').disabled = false;
    return;
  }

  const startDateISO = startDateStr;
  const endDateISO = endDateStr;

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const rows = content.split('\n').map(row => row.trim()).filter(row => row);

    if (rows.length < 1) {
      alert('The CSV file is empty.');
      resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
      document.getElementById('csvFile').disabled = false;
      return;
    }

    const headers = rows[0].split(',').map(h => h.trim());
    if (headers.length !== 2 || headers[0] !== 'Date' || headers[1] !== 'kWh Usage') {
      alert('Invalid CSV format. Please ensure the first row contains "Date" and "kWh Usage" headers.');
      resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
      document.getElementById('csvFile').disabled = false;
      return;
    }

    let htmlString = '';
    let imported = 0;
    const invalidRows = [];

    for (let i = 1; i < rows.length; i++) {
      const [date, kwh] = rows[i].split(',').map(v => v.trim());
      let rowInvalid = false;
      let reason = '';

      if (!date || !kwh) {
        rowInvalid = true;
        reason = 'Missing date or kWh value';
      }

      const dateObj = new Date(date);
      if (!rowInvalid && isNaN(dateObj.getTime())) {
        rowInvalid = true;
        reason = 'Invalid date';
      }

      const dateISO = !rowInvalid ? ymd(dateObj) : '';
      if (!rowInvalid && (dateISO < startDateISO || dateISO > endDateISO)) {
        rowInvalid = true;
        reason = 'Date outside billing period';
      }

      const kwhValue = parseFloat(kwh);
      if (!rowInvalid && isNaN(kwhValue)) {
        rowInvalid = true;
        reason = 'Invalid kWh value';
      }

      if (rowInvalid) {
        invalidRows.push({ row: i + 1, date, kwh, reason });
        htmlString += `
          <div class="mb-2">
            <label><i class="bi bi-battery-charging"></i> <span style="color:#dc3545;">${date || 'Invalid Date'}</span> kWh Usage:</label>
            <input type="number" step="0.01" class="form-control dailyKwh is-invalid" data-date="${date}" value="${kwh || ''}" disabled>
            <div class="text-danger small">${reason}</div>
          </div>`;
        continue;
      }

      htmlString += `
        <div class="mb-2">
          <label><i class="bi bi-battery-charging"></i> ${date} kWh Usage:</label>
          <input type="number" step="0.01" class="form-control dailyKwh" data-date="${date}" value="${kwhValue}">
        </div>`;
      imported++;
    }

    const kwhFields = document.getElementById('kwhFields');

    // Show loading state
    kwhFields.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">Processing CSV data...</div>
      </div>`;

    setTimeout(() => {
      kwhFields.innerHTML = htmlString;
      storage.saveFormData();

      // Attach validation to imported fields
      document.querySelectorAll('.dailyKwh:not([disabled])').forEach(input => {
        input.oninput = function () {
          validateKwhInput(this);
          storage.saveFormData();
          if (onImportComplete) onImportComplete();
        };
      });

      // Show invalid row details
      let invalidMsgDiv = document.getElementById('invalidRowsMsg');
      if (!invalidMsgDiv) {
        invalidMsgDiv = document.createElement('div');
        invalidMsgDiv.id = 'invalidRowsMsg';
        kwhFields.parentNode.insertBefore(invalidMsgDiv, kwhFields.nextSibling);
      }

      if (invalidRows.length > 0) {
        invalidMsgDiv.innerHTML = `<div class='alert alert-danger mt-2'><strong>Some rows were invalid and skipped:</strong><ul style='margin-bottom:0;'>${invalidRows.map(r => `<li>Row ${r.row}: ${r.reason}</li>`).join('')}</ul></div>`;
      } else {
        invalidMsgDiv.innerHTML = '';
      }

      if (imported > 0) {
        let message = `Successfully imported ${imported} rows.`;
        if (invalidRows.length > 0) {
          message += ` ${invalidRows.length} rows were invalid or outside the billing period and were skipped.`;
        }
        alert(message);
      } else if (invalidRows.length > 0) {
        alert(`No rows were imported. All ${invalidRows.length} rows were invalid or outside the billing period.`);
      } else {
        alert('The CSV file contains no valid data rows.');
      }

      // Show the kWh fields box
      const kwhFieldsBox = document.getElementById('kwhFieldsBox');
      if (kwhFieldsBox) kwhFieldsBox.classList.add('show');

      initializeTooltips();
      resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
      document.getElementById('csvFile').disabled = false;

      if (onImportComplete) onImportComplete();
    }, 200);
  };

  reader.onerror = function () {
    alert('Error reading the CSV file. Please try again.');
    resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
    document.getElementById('csvFile').disabled = false;
  };

  reader.readAsText(file);
}
