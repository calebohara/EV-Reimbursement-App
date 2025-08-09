// Local date formatter (YYYY-MM-DD)
const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};

function generateCSVTemplate() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const templateBtn = document.querySelector('button[onclick="generateCSVTemplate()"]');
  
  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }
  
  // Show loading state
  showButtonLoading(templateBtn, 'Generating Template...');
  
  // Use setTimeout to allow spinner to render
  setTimeout(() => {
    // Parse dates more carefully to avoid timezone issues
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      alert('Please enter valid billing period dates.');
      resetButtonLoading(templateBtn, '<i class="bi bi-download"></i> Download CSV Template');
      return;
    }

  let csvContent = 'Date,kWh Usage\n';
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const formattedDate = ymd(d);
    csvContent += `${formattedDate},0\n`;
  }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kwh_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Reset button state
    resetButtonLoading(templateBtn, '<i class="bi bi-download"></i> Download CSV Template');
  }, 200); // Brief delay to show loading state
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
}

function generateKwhFields() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const kwhFields = document.getElementById('kwhFields');
  const kwhFieldsBox = document.getElementById('kwhFieldsBox'); // Get the wrapper box

  if (!startDateStr || !endDateStr) {
    alert('Please enter valid start and end dates.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show'); // Hide box if dates invalid
    return;
  }

  // Parse dates more carefully to avoid timezone issues
  // Date input format is YYYY-MM-DD, so we can parse it directly
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  
  const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

  if (isNaN(startDate) || isNaN(endDate)) {
    alert('Please enter valid start and end dates.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show'); // Hide box if dates invalid
    return;
  }

  if (startDate > endDate) {
    alert('Start date must be before end date.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show'); // Hide box if dates invalid
    return;
  }

  // Show loading state
  showFieldsLoading();
  
  // Use setTimeout to allow loading spinner to render before generating fields
  setTimeout(() => {
    kwhFields.innerHTML = '';
    
    // Generate fields with staggered animation classes
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const formattedDate = ymd(d);
      kwhFields.innerHTML += `
        <div class="mb-2 kwh-field-row">
          <label><i class="bi bi-battery-charging"></i> ${formattedDate} kWh Usage:</label>
          <input type="number" step="0.01" class="form-control dailyKwh" data-date="${formattedDate}" oninput="saveData(); updateSummary();" data-bs-toggle="tooltip" data-bs-placement="right" title="Enter kWh used for EV charging on ${formattedDate}. Find this data in your charger app or utility bill.">
        </div>`;
    }

    // Complete the loading process
    completeFieldsLoading();
  }, 300); // Short delay to show loading spinner
}

function showFieldsLoading() {
  const kwhFields = document.getElementById('kwhFields');
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');
  
  // Show loading spinner
  kwhFields.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Generating kWh input fields...</div>
    </div>`;
  
  // Show the box immediately with loading state
  if (kwhFieldsBox) {
    kwhFieldsBox.style.display = 'block';
    kwhFieldsBox.style.opacity = '1';
    kwhFieldsBox.style.transform = 'translateY(0)';
  }
}

function completeFieldsLoading() {
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');
  
  // Add show class for full animation effect
  if (kwhFieldsBox) kwhFieldsBox.classList.add('show');
  
  // Load existing data and complete setup
  loadDailyKwh();
  // Re-initialize tooltips for the new dynamically added elements
  initializeTooltips();
  // Update summary when fields are generated
  updateSummary();
}

function showCSVLoading() {
  const kwhFields = document.getElementById('kwhFields');
  
  // Show CSV loading spinner
  kwhFields.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Processing CSV data...</div>
    </div>`;
}

function importCSV() {
  const file = document.getElementById('csvFile').files[0];
  const importBtn = document.querySelector('button[onclick="importCSV()"]');
  
  if (!file) {
    alert('Please select a CSV file to upload.');
    return;
  }
  if (!file.name.endsWith('.csv')) {
    alert('Please upload a valid .csv file.');
    return;
  }

  // Show loading state
  showButtonLoading(importBtn, 'Importing CSV...');
  
  // Disable file input during processing
  document.getElementById('csvFile').disabled = true;

  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }
  // Parse dates more carefully to avoid timezone issues
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  const startDateISO = ymd(startDate);
  const endDateISO = ymd(endDate);
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    alert('Please enter valid billing period dates.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const rows = content.split('\n').map(row => row.trim()).filter(row => row);
    if (rows.length < 1) {
      alert('The CSV file is empty.');
      return;
    }

    const headers = rows[0].split(',').map(header => header.trim());
    if (headers.length !== 2 || headers[0] !== 'Date' || headers[1] !== 'kWh Usage') {
      alert('Invalid CSV format. Please ensure the first row contains "Date" and "kWh Usage" headers.');
      return;
    }

    let htmlString = '';
    let imported = 0;
    let invalidRows = [];

    for (let i = 1; i < rows.length; i++) {
      const [date, kwh] = rows[i].split(',').map(value => value.trim());
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
      // Normalize date to YYYY-MM-DD for comparison
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
        invalidRows.push({row: i+1, date, kwh, reason});
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
          <input type="number" step="0.01" class="form-control dailyKwh" data-date="${date}" value="${kwhValue}" oninput="validateKwhInput(this); saveData()">
        </div>`;
      imported++;
    }

    const kwhFields = document.getElementById('kwhFields');
    
    // Show loading state during CSV processing
    showCSVLoading();
    
    // Use setTimeout to show loading state briefly
    setTimeout(() => {
      kwhFields.innerHTML = htmlString;
      saveData();

      // Show invalid row details below the kWh fields
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
      renderUsageChart();
    } else if (invalidRows.length > 0) {
      alert(`No rows were imported. All ${invalidRows.length} rows were invalid or outside the billing period.`);
    } else {
      alert('The CSV file contains no valid data rows.');
    }

      // Show the kWh fields box after import
      const kwhFieldsBox = document.getElementById('kwhFieldsBox');
      if (kwhFieldsBox) kwhFieldsBox.classList.add('show');

      renderUsageChart(); // Add chart update after successful import
      updateSummary(); // Update summary after CSV import
      initializeTooltips(); // Re-initialize tooltips for CSV imported fields
      
      // Reset loading state
      resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
      document.getElementById('csvFile').disabled = false;
    }, 200); // Brief delay to show loading state
  };
  
  reader.onerror = function() {
    alert('Error reading the CSV file. Please try again.');
    resetButtonLoading(importBtn, '<i class="bi bi-upload"></i> Import from CSV');
    document.getElementById('csvFile').disabled = false;
  };
  
  reader.readAsText(file);
}

function calculateTotal() {
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
  const calculateBtn = document.querySelector('button[onclick="calculateTotal()"]');
  const costPerKwh = parseFloat(costPerKwhInput.value);
  
  if (isNaN(costPerKwh)) {
    alert('Please enter a valid cost per kWh.');
    costPerKwhInput.classList.add('is-invalid');
    if (costPerKwhBox) {
      costPerKwhBox.classList.add('highlight');
      console.log('Highlighting and scrolling to Cost per kWh box');
      costPerKwhBox.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
      setTimeout(() => costPerKwhBox.classList.remove('highlight'), 1500);
    }
    costPerKwhInput.focus();
    return;
  } else {
    costPerKwhInput.classList.remove('is-invalid');
  }
  
  // Show loading state
  showButtonLoading(calculateBtn, 'Calculating...');
  
  // Simulate async calculation for better UX
  setTimeout(() => {
    const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
    let total = 0;
    dailyKwhInputs.forEach(input => { total += parseFloat(input.value || 0); });
    const reimbursement = total * costPerKwh;
    const resultBox = document.getElementById('resultBox');
    document.getElementById('result').innerText = `Total Reimbursement: $${reimbursement.toFixed(2)}`;
    resultBox.classList.add('show');
    resultBox.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    
    // Reset button state
    resetButtonLoading(calculateBtn, '<i class="bi bi-calculator-fill"></i> Calculate Reimbursement');
  }, 500); // Brief delay to show loading state
}

function resetForm() {
  const KEYS = ['startDate','endDate','costPerKwh','dailyKwhData'];
  KEYS.forEach(key => localStorage.removeItem(getProfileKey(key)));
  KEYS.forEach(key => localStorage.removeItem(key));

  // Clear form inputs
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('costPerKwh').value = '';

  // Hide the result box and clear the result text
  const resultBox = document.getElementById('resultBox');
  const resultText = document.getElementById('result');
  if (resultBox) resultBox.classList.remove('show');
  if (resultText) resultText.innerText = '';

  // Also hide the kWh fields box
  const kwhFieldsBox = document.getElementById('kwhFieldsBox');
  if (kwhFieldsBox) kwhFieldsBox.classList.remove('show');
  const kwhFields = document.getElementById('kwhFields');
  if (kwhFields) kwhFields.innerHTML = ''; // Clear fields content as well

  // Reload the page to clear the form inputs and regenerate fields
  location.reload();
}

function exportToExcel() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
  const exportBtn = document.querySelector('button[onclick="exportToExcel()"]');
  const costPerKwh = parseFloat(costPerKwhInput.value);
  
  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }
  if (isNaN(costPerKwh)) {
    alert('Please enter a valid cost per kWh.');
    costPerKwhInput.classList.add('is-invalid');
    if (costPerKwhBox) {
      costPerKwhBox.classList.add('highlight');
      costPerKwhBox.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
      setTimeout(() => costPerKwhBox.classList.remove('highlight'), 1500);
    }
    costPerKwhInput.focus();
    return;
  } else {
    costPerKwhInput.classList.remove('is-invalid');
  }
  
  // Show loading state
  showButtonLoading(exportBtn, 'Generating Excel...');
  
  // Use setTimeout to allow spinner to render
  setTimeout(() => {
    // Parse dates more carefully to avoid timezone issues
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      alert('Please enter valid billing period dates.');
      resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-excel-fill"></i> Export to Excel');
      return;
    }
  let data = [];
  let totalKwh = 0;
  let totalCost = 0;
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let kwhMap = {};
  dailyKwhInputs.forEach(input => {
    kwhMap[input.getAttribute('data-date')] = parseFloat(input.value || 0);
  });
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = ymd(d);
    const kwh = kwhMap[dateStr] || 0;
    const dailyCost = kwh * costPerKwh;
    totalKwh += kwh;
    totalCost += dailyCost;
    data.push({
      'Date': dateStr,
      'kWh Usage': kwh,
      'Cost per kWh': costPerKwh,
      'Daily Cost': dailyCost
    });
  }
  // Add a summary row
  data.push({
    'Date': 'TOTAL',
    'kWh Usage': totalKwh,
    'Cost per kWh': '',
    'Daily Cost': totalCost
  });
  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet(data, {header: ['Date', 'kWh Usage', 'Cost per kWh', 'Daily Cost']});
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reimbursement');
  // Format currency columns
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = 1; R <= range.e.r; ++R) {
    const dailyCostCell = ws[XLSX.utils.encode_cell({c: 3, r: R})];
    if (dailyCostCell) dailyCostCell.z = '$0.00';
    const costPerKwhCell = ws[XLSX.utils.encode_cell({c: 2, r: R})];
    if (costPerKwhCell) costPerKwhCell.z = '$0.00';
  }
    // Format file name with billing period
    const fileName = `ev_reimbursement_${startDateStr}_to_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Reset button state
    resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-excel-fill"></i> Export to Excel');
  }, 300); // Brief delay to show loading state
}

function saveData() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const costPerKwh = document.getElementById('costPerKwh').value;
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let dailyKwhData = {};

  dailyKwhInputs.forEach(input => {
    dailyKwhData[input.getAttribute('data-date')] = input.value;
  });

  localStorage.setItem('startDate', startDate);
  localStorage.setItem('endDate', endDate);
  localStorage.setItem('costPerKwh', costPerKwh);
  localStorage.setItem('dailyKwhData', JSON.stringify(dailyKwhData));
}

function loadData() {
  const startDate = localStorage.getItem(getProfileKey('startDate'));
  const endDate = localStorage.getItem(getProfileKey('endDate'));
  const costPerKwh = localStorage.getItem(getProfileKey('costPerKwh'));
  const dailyKwhData = JSON.parse(localStorage.getItem(getProfileKey('dailyKwhData'))) || {};

  // Populate input fields directly from profile data
  if (startDate) document.getElementById('startDate').value = startDate;
  if (endDate) document.getElementById('endDate').value = endDate;
  if (costPerKwh) document.getElementById('costPerKwh').value = costPerKwh;

  // Update the global dailyKwhData for compatibility if needed elsewhere
  localStorage.setItem('dailyKwhData', JSON.stringify(dailyKwhData));

  // Regenerate fields and load daily kWh values based on the loaded data
  if (startDate && endDate) {
    // Add a subtle delay to show smooth loading when page loads with existing data
    setTimeout(() => {
      generateKwhFields();
    }, 100);
  }
  loadDailyKwh(); // Load values into the generated fields

  // Apply dark mode if saved (this part remains the same as it's not profile specific)
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  // Note: We don't call origLoadData() anymore as we handle everything here.
}

function loadDailyKwh() {
  const dailyKwhData = JSON.parse(localStorage.getItem('dailyKwhData')) || {};
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  dailyKwhInputs.forEach(input => {
    const date = input.getAttribute('data-date');
    if (dailyKwhData[date]) {
      input.value = dailyKwhData[date];
    }
  });
}

window.onload = function() {
  loadData();
  // Remove is-invalid and highlight when user types a valid value
  document.getElementById('costPerKwh').addEventListener('input', function() {
    if (!isNaN(parseFloat(this.value))) {
      this.classList.remove('is-invalid');
      const box = this.closest('.billing-box');
      if (box) box.classList.remove('highlight');
    }
  });

  // Ensure result box is hidden on load
  const resultBox = document.getElementById('resultBox');
  if (resultBox) {
    resultBox.classList.remove('show');
    // Optional: Clear text content on load as well
    const resultText = document.getElementById('result');
    if (resultText) resultText.innerText = '';
  }

  // Initialize Bootstrap tooltips
  initializeTooltips();
};

// Inline validation for daily kWh inputs
function validateKwhInput(input) {
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
  if (!warning) warningDiv.style.display = 'none';
  else warningDiv.style.display = '';
}

// Attach inline validation to all dailyKwh inputs on page load and after generating fields
function attachKwhValidation() {
  document.querySelectorAll('.dailyKwh').forEach(input => {
    input.oninput = function() { validateKwhInput(this); saveData(); updateSummary(); };
    validateKwhInput(input);
  });
}

// Patch generateKwhFields to use inline validation
const originalGenerateKwhFields = generateKwhFields;
generateKwhFields = function() {
  originalGenerateKwhFields();
  attachKwhValidation();
};

// Also attach validation on load
window.addEventListener('DOMContentLoaded', attachKwhValidation);

// Export to PDF
function exportToPDF() {
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
  const exportBtn = document.querySelector('button[onclick="exportToPDF()"]');
  const startDateStr = startDateInput.value;
  const endDateStr = endDateInput.value;
  const costPerKwh = parseFloat(costPerKwhInput.value);
  let invalid = false;
  // Validate start date - using better date parsing
  const startParts = startDateStr ? startDateStr.split('-') : [];
  const testStartDate = startParts.length === 3 ? new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])) : null;
  if (!startDateStr || !testStartDate || isNaN(testStartDate)) {
    alert('Please select a valid billing period start date.');
    startDateInput.classList.add('is-invalid');
    startDateInput.focus();
    startDateInput.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    setTimeout(() => startDateInput.classList.remove('is-invalid'), 1500);
    invalid = true;
  } else {
    startDateInput.classList.remove('is-invalid');
  }
  // Validate end date - using better date parsing
  const endParts = endDateStr ? endDateStr.split('-') : [];
  const testEndDate = endParts.length === 3 ? new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2])) : null;
  if (!endDateStr || !testEndDate || isNaN(testEndDate)) {
    alert('Please select a valid billing period end date.');
    endDateInput.classList.add('is-invalid');
    endDateInput.focus();
    endDateInput.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    setTimeout(() => endDateInput.classList.remove('is-invalid'), 1500);
    invalid = true;
  } else {
    endDateInput.classList.remove('is-invalid');
  }
  // Validate cost per kWh
  if (isNaN(costPerKwh)) {
    alert('Please enter a valid cost per kWh.');
    costPerKwhInput.classList.add('is-invalid');
    if (costPerKwhBox) {
      costPerKwhBox.classList.add('highlight');
      costPerKwhBox.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
      setTimeout(() => costPerKwhBox.classList.remove('highlight'), 1500);
    }
    costPerKwhInput.focus();
    invalid = true;
  } else {
    costPerKwhInput.classList.remove('is-invalid');
  }
  if (invalid) return;
  
  // Show loading state
  showButtonLoading(exportBtn, 'Generating PDF...');
  
  // Use setTimeout to allow spinner to render
  setTimeout(() => {
    // Parse dates more carefully to avoid timezone issues
    const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
      alert('Please enter valid billing period dates.');
      resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-pdf-fill"></i> Export to PDF');
      return;
    }
  let data = [];
  let totalKwh = 0;
  let totalCost = 0;
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let kwhMap = {};
  dailyKwhInputs.forEach(input => {
    kwhMap[input.getAttribute('data-date')] = parseFloat(input.value || 0);
  });
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = ymd(d);
    const kwh = kwhMap[dateStr] || 0;
    const dailyCost = kwh * costPerKwh;
    totalKwh += kwh;
    totalCost += dailyCost;
    data.push([dateStr, kwh, `$${costPerKwh.toFixed(2)}`, `$${dailyCost.toFixed(2)}`]);
  }
  data.push(['TOTAL', totalKwh, '', `$${totalCost.toFixed(2)}`]);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('EV kWh Reimbursement Report', 14, 14);
  doc.setFontSize(10);
  doc.text(`Billing Period: ${startDateStr} to ${endDateStr}`, 14, 22);
  doc.text(`Cost per kWh: $${costPerKwh.toFixed(2)}`, 14, 28);
  doc.autoTable({
    head: [['Date', 'kWh Usage', 'Cost per kWh', 'Daily Cost']],
    body: data,
    startY: 34,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [41, 128, 185] },
    styles: { cellPadding: 2, fontSize: 10 },
    didDrawPage: function (data) {
      doc.setFontSize(8);
      doc.text('Generated by EV kWh Reimbursement App', 14, doc.internal.pageSize.height - 10);
    }
  });
    doc.save(`ev_reimbursement_${startDateStr}_to_${endDateStr}.pdf`);
    
    // Reset button state
    resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-pdf-fill"></i> Export to PDF');
  }, 400); // Brief delay to show loading state
}

// Re-render summary table on dark mode toggle
document.querySelector('.btn-dark-mode').addEventListener('click', function() {
  setTimeout(renderSummaryTable, 100);
});

// Progressive Saving: Auto-save on every input/change
document.addEventListener('input', function(e) {
  if (e.target.matches('input,select,textarea')) {
    saveData();
  }
});
document.addEventListener('change', function(e) {
  if (e.target.matches('input,select,textarea')) {
    saveData();
  }
});

// Multi-User Support
function getProfiles() {
  return JSON.parse(localStorage.getItem('profiles') || '["Default"]');
}
function setProfiles(profiles) {
  localStorage.setItem('profiles', JSON.stringify(profiles));
}
function getCurrentProfile() {
  return localStorage.getItem('currentProfile') || 'Default';
}
function setCurrentProfile(profile) {
  localStorage.setItem('currentProfile', profile);
}
function getProfileKey(key) {
  return `${getCurrentProfile()}__${key}`;
}
// Patch saveData/loadData to use profile keys
const origSaveData = saveData;
saveData = function() {
  const keys = ['startDate','endDate','costPerKwh','dailyKwhData'];
  keys.forEach(key => {
    let val = null;
    if (key === 'dailyKwhData') {
        // Read directly from the input fields for dailyKwhData when saving
        const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
        let currentDailyKwhData = {};
        dailyKwhInputs.forEach(input => {
          currentDailyKwhData[input.getAttribute('data-date')] = input.value;
        });
        val = JSON.stringify(currentDailyKwhData);
    } else {
        val = document.getElementById(key)?.value || '';
    }
    if (val !== null) {
       localStorage.setItem(getProfileKey(key), val);
    }
  });
  // Optionally, keep the original save to global for backward compatibility, or remove if only profile saving is desired.
  // origSaveData(); // Keeping this for now
};
const origLoadData = loadData;
loadData = function() {
  const keys = ['startDate','endDate','costPerKwh','dailyKwhData'];
  keys.forEach(key => {
    let val = localStorage.getItem(getProfileKey(key));
    if (val !== null) {
      if (key === 'dailyKwhData') localStorage.setItem('dailyKwhData', val);
      else localStorage.setItem(key, val);
    }
  });
  origLoadData();
}
function updateProfileDropdown() {
  const select = document.getElementById('profileSelect');
  const profiles = getProfiles();
  select.innerHTML = profiles.map(p => `<option value="${p}">${p}</option>`).join('');
  select.value = getCurrentProfile();
}
function setupProfileUI() {
  updateProfileDropdown();
  document.getElementById('profileSelect').onchange = function() {
    setCurrentProfile(this.value);
    loadData();
    attachKwhValidation();
    renderUsageChart();
    updateSummary();
  };
  document.getElementById('addProfileBtn').onclick = function() {
    let name = prompt('Enter new profile name:');
    if (!name) return;
    let profiles = getProfiles();
    if (profiles.includes(name)) { alert('Profile already exists.'); return; }
    profiles.push(name);
    setProfiles(profiles);
    setCurrentProfile(name);
    updateProfileDropdown();
    // Clear data for new profile
    ['startDate','endDate','costPerKwh','dailyKwhData'].forEach(key => localStorage.removeItem(getProfileKey(key)));
    loadData();
    attachKwhValidation();
    renderUsageChart();
    updateSummary();
  };
  document.getElementById('deleteProfileBtn').onclick = function() {
    let profiles = getProfiles();
    let current = getCurrentProfile();
    if (current === 'Default') { alert('Cannot delete Default profile.'); return; }
    if (!confirm(`Delete profile '${current}'?`)) return;
    profiles = profiles.filter(p => p !== current);
    setProfiles(profiles);
    setCurrentProfile('Default');
    // Remove all keys for deleted profile
    ['startDate','endDate','costPerKwh','dailyKwhData'].forEach(key => localStorage.removeItem(`${current}__${key}`));
    updateProfileDropdown();
    loadData();
    attachKwhValidation();
    renderUsageChart();
    updateSummary();
  };
}
window.addEventListener('DOMContentLoaded', setupProfileUI);
window.addEventListener('DOMContentLoaded', initializeTooltips);
window.addEventListener('DOMContentLoaded', initializeFeedbackForm);

// Chart.js Visualization
let usageChart = null;
function renderUsageChart() {
  const ctx = document.getElementById('usageChart');
  const chartBox = document.getElementById('chartBox');
  if (!ctx || !chartBox) return;
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
  if (!startDateStr || !endDateStr || isNaN(costPerKwh)) {
    if (usageChart) { usageChart.destroy(); usageChart = null; }
    chartBox.classList.remove('show');
    return;
  }
  // Parse dates more carefully to avoid timezone issues
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    if (usageChart) { usageChart.destroy(); usageChart = null; }
    chartBox.classList.remove('show');
    return;
  }
  let labels = [];
  let kwhData = [];
  let costData = [];
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let kwhMap = {};
  dailyKwhInputs.forEach(input => {
    kwhMap[input.getAttribute('data-date')] = parseFloat(input.value || 0);
  });
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = ymd(d);
    labels.push(dateStr);
    const kwh = kwhMap[dateStr] || 0;
    kwhData.push(kwh);
    costData.push(kwh * costPerKwh);
  }
  if (usageChart) usageChart.destroy();
  chartBox.classList.add('show');
  
  // Chart theming hook
  const isDark = document.body.classList.contains('dark-mode');
  const gridColor = isDark ? '#666' : '#e5e5e5';
  const labelColor = isDark ? '#f5f5f7' : '#212529';
  
  usageChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'kWh Usage', data: kwhData, borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.1)', yAxisID: 'y' },
        { label: 'Daily Cost ($)', data: costData, borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.1)', yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { 
          position: 'top',
          labels: { color: labelColor }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return 'Date: ' + context[0].label;
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label.includes('kWh')) {
                return label + ': ' + value.toFixed(2) + ' kWh';
              } else if (label.includes('Cost')) {
                return label + ': $' + value.toFixed(2);
              }
              return label + ': ' + value;
            },
            footer: function(context) {
              if (context.length > 1) {
                const kwhValue = context.find(item => item.dataset.label.includes('kWh'))?.parsed.y || 0;
                const costValue = context.find(item => item.dataset.label.includes('Cost'))?.parsed.y || 0;
                return `Rate: $${(costValue / kwhValue || 0).toFixed(3)}/kWh`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: { 
          grid: { color: gridColor }, 
          ticks: { color: labelColor } 
        },
        y: { 
          type: 'linear', 
          display: true, 
          position: 'left', 
          title: { display: true, text: 'kWh' },
          grid: { color: gridColor }, 
          ticks: { color: labelColor }
        },
        y1: { 
          type: 'linear', 
          display: true, 
          position: 'right', 
          title: { display: true, text: 'Cost ($)' }, 
          grid: { drawOnChartArea: false, color: gridColor }, 
          ticks: { color: labelColor }
        }
      }
    }
  });
}
  // Update chart and summary on data change
['input', 'change'].forEach(evt => {
  document.addEventListener(evt, function(e) {
    if (e.target.classList.contains('dailyKwh') || e.target.id === 'costPerKwh' || e.target.id === 'startDate' || e.target.id === 'endDate') {
      renderUsageChart();
      updateSummary();
    }
  });
});
window.addEventListener('DOMContentLoaded', renderUsageChart);
window.addEventListener('DOMContentLoaded', updateSummary);

// Function to check if both dates are selected and generate fields automatically
function checkAndGenerateFields() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  
  // Only proceed if both dates are provided
  if (!startDateStr || !endDateStr) {
    return;
  }
  
  // Parse dates more carefully to avoid timezone issues
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  
  // Validate date format (should be YYYY-MM-DD)
  if (startParts.length !== 3 || endParts.length !== 3) {
    return;
  }
  
  const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  
  if (isNaN(startDate) || isNaN(endDate)) {
    return;
  }
  
  // Validate that start date is before or equal to end date
  if (startDate > endDate) {
    return;
  }
  
  // All validations passed, automatically generate the fields
  generateKwhFields();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
  // Initialize tooltips for existing elements
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Feedback Form Functionality
let selectedRating = 0;

function initializeFeedbackForm() {
  const stars = document.querySelectorAll('.star');
  const ratingText = document.getElementById('ratingText');
  
  // Star rating event listeners
  stars.forEach((star, index) => {
    // Make stars focusable for keyboard accessibility
    star.setAttribute('tabindex', '0');
    star.setAttribute('role', 'button');
    star.setAttribute('aria-label', `Rate ${index + 1} out of 5 stars`);
    
    star.addEventListener('click', function() {
      selectedRating = parseInt(this.getAttribute('data-rating'));
      updateStarDisplay();
      updateRatingText();
    });
    
    star.addEventListener('mouseenter', function() {
      const hoverRating = parseInt(this.getAttribute('data-rating'));
      highlightStars(hoverRating);
    });
    
    // Keyboard support
    star.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
  
  // Reset to selected rating on mouse leave
  document.getElementById('starRating').addEventListener('mouseleave', function() {
    updateStarDisplay();
  });
  
  // Reset form when modal opens
  document.getElementById('contactModal').addEventListener('show.bs.modal', function() {
    resetFeedbackForm();
    initializeTooltips(); // Re-initialize tooltips for modal content
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    star.classList.remove('active', 'hover');
    if (index < rating) {
      star.classList.add('hover');
    }
  });
}

function updateStarDisplay() {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    star.classList.remove('active', 'hover');
    if (index < selectedRating) {
      star.classList.add('active');
    }
  });
}

function updateRatingText() {
  const ratingText = document.getElementById('ratingText');
  const ratingMessages = {
    0: 'Click the stars to rate your experience',
    1: '⭐ Poor - Needs significant improvement',
    2: '⭐⭐ Fair - Has room for improvement',
    3: '⭐⭐⭐ Good - Meets expectations',
    4: '⭐⭐⭐⭐ Very Good - Exceeds expectations',
    5: '⭐⭐⭐⭐⭐ Excellent - Outstanding experience!'
  };
  
  ratingText.textContent = ratingMessages[selectedRating];
  ratingText.style.color = selectedRating >= 4 ? '#28a745' : selectedRating >= 3 ? '#ffc107' : selectedRating >= 1 ? '#fd7e14' : '';
}

function submitFeedback() {
  const feedbackType = document.getElementById('feedbackType').value;
  const feedbackMessage = document.getElementById('feedbackMessage').value.trim();
  const userInfo = document.getElementById('userInfo').value.trim();
  const submitBtn = document.getElementById('submitFeedbackBtn');
  
  // Basic validation
  if (!feedbackMessage) {
    alert('Please enter your feedback message before submitting.');
    document.getElementById('feedbackMessage').focus();
    return;
  }
  
  // Generate email content
  const subject = generateEmailSubject(feedbackType, selectedRating);
  const body = generateEmailBody(feedbackType, feedbackMessage, userInfo, selectedRating);
  
  // Create mailto link
  const mailtoLink = `mailto:caleb.ohara@siemens.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Show loading state
  const originalContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Opening email...';
  submitBtn.disabled = true;
  
  // Open email client
  setTimeout(() => {
    window.location.href = mailtoLink;
    
    // Reset form after email opens
    setTimeout(() => {
      resetFeedbackForm();
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
      modal.hide();
      
      // Show success message
      showFeedbackSuccess();
    }, 1000);
  }, 300);
}

function generateEmailSubject(type, rating) {
  const typeLabels = {
    'feature': 'Feature Request',
    'bug': 'Bug Report', 
    'improvement': 'Improvement Suggestion',
    'question': 'Question',
    'compliment': 'Compliment',
    'other': 'Feedback'
  };
  
  const ratingStr = rating > 0 ? ` (${rating}/5 stars)` : '';
  return `EV kWh App - ${typeLabels[type]}${ratingStr}`;
}

function generateEmailBody(type, message, userInfo, rating) {
  const timestamp = new Date().toLocaleString();
  const appVersion = '1.9.0'; // Current app version
  
  let body = `Hi Caleb,\n\n`;
  
  if (rating > 0) {
    body += `App Rating: ${rating}/5 stars ⭐\n`;
  }
  
  body += `Feedback Type: ${document.getElementById('feedbackType').selectedOptions[0].text}\n\n`;
  body += `Message:\n${message}\n\n`;
  
  if (userInfo) {
    body += `From: ${userInfo}\n`;
  }
  
  body += `\n---\n`;
  body += `Sent from: EV kWh Reimbursement App v${appVersion}\n`;
  body += `Timestamp: ${timestamp}\n`;
  body += `User Agent: ${navigator.userAgent}`;
  
  return body;
}

function resetFeedbackForm() {
  selectedRating = 0;
  updateStarDisplay();
  updateRatingText();
  document.getElementById('feedbackType').value = 'feature';
  document.getElementById('feedbackMessage').value = '';
  document.getElementById('userInfo').value = '';
}

function showFeedbackSuccess() {
  // Create a temporary success notification
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show position-fixed" style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
      <i class="bi bi-check-circle-fill"></i> <strong>Thank you!</strong> Your feedback has been prepared for sending.
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Button Loading State Helpers
function showButtonLoading(button, loadingText = 'Loading...') {
  if (!button) return;
  
  // Store original content
  button.dataset.originalContent = button.innerHTML;
  
  // Show loading state
  button.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    ${loadingText}
  `;
  button.disabled = true;
}

function resetButtonLoading(button, originalContent = null) {
  if (!button) return;
  
  // Restore original content
  const content = originalContent || button.dataset.originalContent || button.innerHTML;
  button.innerHTML = content;
  button.disabled = false;
  
  // Clean up stored data
  delete button.dataset.originalContent;
}

// Update Dashboard Summary
function updateSummary() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
  const summaryBox = document.getElementById('summaryBox');
  
  // Hide summary if basic data is missing
  if (!startDateStr || !endDateStr || isNaN(costPerKwh)) {
    summaryBox.classList.remove('show');
    return;
  }
  
  // Parse dates carefully to avoid timezone issues
  const startParts = startDateStr.split('-');
  const endParts = endDateStr.split('-');
  const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
  const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
  
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    summaryBox.classList.remove('show');
    return;
  }
  
  // Calculate total days in billing period
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get all daily kWh inputs
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let totalKwh = 0;
  let daysWithData = 0;
  
  dailyKwhInputs.forEach(input => {
    const value = parseFloat(input.value || 0);
    if (value > 0) {
      totalKwh += value;
      daysWithData++;
    }
  });
  
  // Calculate metrics
  const totalCost = totalKwh * costPerKwh;
  const avgDaily = daysWithData > 0 ? totalKwh / daysWithData : 0;
  const completeness = totalDays > 0 ? Math.round((daysWithData / totalDays) * 100) : 0;
  
  // Update display elements
  document.getElementById('totalKwh').textContent = totalKwh.toFixed(2);
  document.getElementById('totalCost').textContent = '$' + totalCost.toFixed(2);
  document.getElementById('avgDaily').textContent = avgDaily.toFixed(2);
  document.getElementById('completeness').textContent = completeness + '%';
  document.getElementById('daysWithData').textContent = daysWithData;
  document.getElementById('totalDays').textContent = totalDays;
  
  // Update progress bar
  const progressBar = document.getElementById('progressBar');
  progressBar.style.width = completeness + '%';
  progressBar.setAttribute('aria-valuenow', completeness);
  
  // Add color coding to progress bar based on completeness
  progressBar.className = 'progress-bar';
  if (completeness >= 90) {
    progressBar.classList.add('bg-success');
  } else if (completeness >= 70) {
    progressBar.classList.add('bg-info');
  } else if (completeness >= 50) {
    progressBar.classList.add('bg-warning');
  } else {
    progressBar.classList.add('bg-danger');
  }
  
  // Show the summary box with smooth animation
  if (!summaryBox.classList.contains('show')) {
    // Add a brief delay for smooth appearance if first time showing
    setTimeout(() => {
      summaryBox.classList.add('show');
    }, 100);
  } else {
    summaryBox.classList.add('show');
  }
}

