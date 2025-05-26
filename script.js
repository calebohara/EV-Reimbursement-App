function generateCSVTemplate() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    alert('Please enter valid billing period dates.');
    return;
  }

  let csvContent = 'Date,kWh Usage\n';
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const formattedDate = d.toISOString().split('T')[0];
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
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
}

function generateKwhFields() {
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);
  const kwhFields = document.getElementById('kwhFields');
  const kwhFieldsBox = document.getElementById('kwhFieldsBox'); // Get the wrapper box
  kwhFields.innerHTML = '';

  if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
    alert('Please enter valid start and end dates.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show'); // Hide box if dates invalid
    return;
  }

  if (startDate > endDate) {
    alert('Start date must be before end date.');
    if (kwhFieldsBox) kwhFieldsBox.classList.remove('show'); // Hide box if dates invalid
    return;
  }

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const formattedDate = d.toISOString().split('T')[0];
    kwhFields.innerHTML += `
      <div class="mb-2">
        <label><i class="bi bi-battery-charging"></i> ${formattedDate} kWh Usage:</label>
        <input type="number" step="0.01" class="form-control dailyKwh" data-date="${formattedDate}" oninput="saveData()">
      </div>`;
  }

  if (kwhFieldsBox) kwhFieldsBox.classList.add('show'); // Show box after generating fields
  loadDailyKwh();
}

function importCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) {
    alert('Please select a CSV file to upload.');
    return;
  }
  if (!file.name.endsWith('.csv')) {
    alert('Please upload a valid .csv file.');
    return;
  }

  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const startDateISO = startDate.toISOString().split('T')[0];
  const endDateISO = endDate.toISOString().split('T')[0];
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
      const dateISO = !rowInvalid ? dateObj.toISOString().split('T')[0] : '';
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
  };
  reader.readAsText(file);
}

function calculateTotal() {
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
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
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  let total = 0;
  dailyKwhInputs.forEach(input => { total += parseFloat(input.value || 0); });
  const reimbursement = total * costPerKwh;
  const resultBox = document.getElementById('resultBox');
  document.getElementById('result').innerText = `Total Reimbursement: $${reimbursement.toFixed(2)}`;
  resultBox.classList.add('show');
  resultBox.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
}

function resetForm() {
  // Remove current profile's keys
  ['startDate','endDate','dailyKwhData'].forEach(key => localStorage.removeItem(getProfileKey(key)));
  // Also remove global keys
  ['startDate','endDate','dailyKwhData'].forEach(key => localStorage.removeItem(key));

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
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    alert('Please enter valid billing period dates.');
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
    const dateStr = d.toISOString().split('T')[0];
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
  const startDate = localStorage.getItem('startDate');
  const endDate = localStorage.getItem('endDate');
  const costPerKwh = localStorage.getItem('costPerKwh');
  const dailyKwhData = JSON.parse(localStorage.getItem('dailyKwhData')) || {};

  if (startDate) document.getElementById('startDate').value = startDate;
  if (endDate) document.getElementById('endDate').value = endDate;
  if (costPerKwh) document.getElementById('costPerKwh').value = costPerKwh;

  if (startDate && endDate) {
    generateKwhFields();
  }

  // Apply dark mode if saved
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
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
    input.oninput = function() { validateKwhInput(this); saveData(); };
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
  const startDateStr = startDateInput.value;
  const endDateStr = endDateInput.value;
  const costPerKwh = parseFloat(costPerKwhInput.value);
  let invalid = false;
  // Validate start date
  if (!startDateStr || isNaN(new Date(startDateStr))) {
    alert('Please select a valid billing period start date.');
    startDateInput.classList.add('is-invalid');
    startDateInput.focus();
    startDateInput.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    setTimeout(() => startDateInput.classList.remove('is-invalid'), 1500);
    invalid = true;
  } else {
    startDateInput.classList.remove('is-invalid');
  }
  // Validate end date
  if (!endDateStr || isNaN(new Date(endDateStr))) {
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
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    alert('Please enter valid billing period dates.');
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
    const dateStr = d.toISOString().split('T')[0];
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
    if (key === 'dailyKwhData') val = JSON.stringify(JSON.parse(localStorage.getItem('dailyKwhData')) || {});
    else val = document.getElementById(key)?.value || localStorage.getItem(key) || '';
    localStorage.setItem(getProfileKey(key), val);
  });
  origSaveData();
}
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
  };
}
window.addEventListener('DOMContentLoaded', setupProfileUI);

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
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
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
    const dateStr = d.toISOString().split('T')[0];
    labels.push(dateStr);
    const kwh = kwhMap[dateStr] || 0;
    costData.push(kwh * costPerKwh);
  }
  if (usageChart) usageChart.destroy();
  chartBox.classList.add('show');
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
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'kWh' } },
        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Cost ($)' }, grid: { drawOnChartArea: false } }
      }
    }
  });
}
// Update chart on data change
['input', 'change'].forEach(evt => {
  document.addEventListener(evt, function(e) {
    if (e.target.classList.contains('dailyKwh') || e.target.id === 'costPerKwh' || e.target.id === 'startDate' || e.target.id === 'endDate') {
      renderUsageChart();
    }
  });
});
window.addEventListener('DOMContentLoaded', renderUsageChart);

// Function to check if both dates are selected and generate fields
function checkAndGenerateFields() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  if (startDate && endDate) {
    generateKwhFields();
  }
}

// Disable right-click (context menu)
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Disable keyboard shortcuts for viewing source and developer tools
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
  }
  if (e.key === 'F12') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
  }
});