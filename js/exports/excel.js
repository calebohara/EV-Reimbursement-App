/**
 * Excel export using SheetJS (XLSX).
 */

import { ymd, parseLocalDate, forEachDay } from '../utils/dates.js';
import { isUsingTieredRates, validateTierInputs, computeTieredDailyCostsMap, getAdditionalCharges } from '../billing.js';
import { showButtonLoading, resetButtonLoading, scrollToAndHighlight } from '../ui.js';

export function exportToExcel() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwhInput = document.getElementById('costPerKwh');
  const costPerKwhBox = costPerKwhInput.closest('.billing-box');
  const exportBtn = document.querySelector('[data-action="export-excel"]');
  const costPerKwh = parseFloat(costPerKwhInput.value);
  const tiersOk = isUsingTieredRates() && validateTierInputs(true);

  if (!startDateStr || !endDateStr) {
    alert('Please select the billing period start and end dates first.');
    return;
  }

  if (!tiersOk && isNaN(costPerKwh)) {
    alert('Please enter a valid cost per kWh.');
    costPerKwhInput.classList.add('is-invalid');
    scrollToAndHighlight(costPerKwhBox);
    costPerKwhInput.focus();
    return;
  }
  costPerKwhInput.classList.remove('is-invalid');

  showButtonLoading(exportBtn, 'Generating Excel...');

  setTimeout(() => {
    const startDate = parseLocalDate(startDateStr);
    const endDate = parseLocalDate(endDateStr);

    if (!startDate || !endDate || startDate > endDate) {
      alert('Please enter valid billing period dates.');
      resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-excel-fill"></i> Export to Excel');
      return;
    }

    const data = [];
    const tierResult = computeTieredDailyCostsMap(isNaN(costPerKwh) ? 0 : costPerKwh, startDate, endDate);
    let totalKwh = tierResult.totalKwh;
    let totalCost = 0;

    forEachDay(startDate, endDate, (d) => {
      const dateStr = ymd(d);
      const kwh = tierResult.kwhMap[dateStr] || 0;
      const dailyCost = tierResult.dailyCostMap[dateStr] || 0;
      totalCost += dailyCost;
      const effectiveRate = kwh > 0 ? (dailyCost / kwh) : '';
      data.push({
        'Date': dateStr,
        'kWh Usage': kwh,
        'Cost per kWh': typeof effectiveRate === 'number' ? effectiveRate : '',
        'Daily Cost': dailyCost
      });
    });

    // Additional charges
    const charges = getAdditionalCharges();
    for (const charge of charges) {
      totalCost += charge.amount;
      data.push({
        'Date': charge.name,
        'kWh Usage': '',
        'Cost per kWh': '',
        'Daily Cost': charge.amount
      });
    }

    data.push({
      'Date': 'TOTAL',
      'kWh Usage': totalKwh,
      'Cost per kWh': '',
      'Daily Cost': totalCost
    });

    const ws = XLSX.utils.json_to_sheet(data, { header: ['Date', 'kWh Usage', 'Cost per kWh', 'Daily Cost'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reimbursement');

    // Format currency columns
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 1; R <= range.e.r; ++R) {
      const dailyCostCell = ws[XLSX.utils.encode_cell({ c: 3, r: R })];
      if (dailyCostCell) dailyCostCell.z = '$0.00';
      const costPerKwhCell = ws[XLSX.utils.encode_cell({ c: 2, r: R })];
      if (costPerKwhCell) costPerKwhCell.z = '$0.000';
    }

    const fileName = `ev_reimbursement_${startDateStr}_to_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);

    resetButtonLoading(exportBtn, '<i class="bi bi-file-earmark-excel-fill"></i> Export to Excel');
  }, 300);
}
