/**
 * Billing period history — archive, list, restore, delete past periods.
 */

import * as storage from './storage.js';
import { parseLocalDate, forEachDay, ymd } from './utils/dates.js';
import { computeCostsFromData, getTierSettings, isUsingTieredRates, getAdditionalCharges } from './billing.js';
import { showButtonLoading, resetButtonLoading } from './ui.js';
import { exportReceiptFromSnapshot } from './exports/receipt.js';

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDateRange(isoDate) {
  const d = parseLocalDate(isoDate);
  if (!d) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

let onHistoryChange = null;
export function setOnHistoryChange(fn) { onHistoryChange = fn; }

function fireHistoryChange() {
  if (onHistoryChange) onHistoryChange();
}

/**
 * Archive the current billing period to history.
 */
export function archiveCurrentPeriod() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const costPerKwh = document.getElementById('costPerKwh').value;

  if (!startDate || !endDate) {
    alert('Please select billing period dates before archiving.');
    return;
  }

  const dailyKwhData = {};
  document.querySelectorAll('.dailyKwh').forEach(input => {
    const val = parseFloat(input.value || 0) || 0;
    if (val > 0) {
      dailyKwhData[input.getAttribute('data-date')] = val;
    }
  });

  const baseRate = parseFloat(costPerKwh) || 0;
  const useTieredRates = isUsingTieredRates();

  // Use the same tier validation as billing.js — handles fallback to base rate
  const tierSettings = getTierSettings(baseRate);

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const result = computeCostsFromData(dailyKwhData, tierSettings, baseRate, start, end);

  let totalCost = 0;
  forEachDay(start, end, (d) => {
    totalCost += result.dailyCostMap[ymd(d)] || 0;
  });

  // Additional charges
  const additionalCharges = getAdditionalCharges();
  const additionalChargesTotal = additionalCharges.reduce((sum, c) => sum + c.amount, 0);
  totalCost += additionalChargesTotal;

  // Generate label from date range
  const startMonth = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const label = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

  const snapshot = {
    id: crypto.randomUUID(),
    label,
    savedAt: new Date().toISOString(),
    startDate,
    endDate,
    costPerKwh: baseRate,
    useTieredRates: tierSettings.useTiers,
    tier1Limit: tierSettings.tier1Limit,
    tier1Rate: tierSettings.tier1Rate,
    tier2Rate: tierSettings.tier2Rate,
    additionalCharges,
    dailyKwhData,
    totalKwh: result.totalKwh,
    totalCost
  };

  storage.saveToHistory(snapshot);
  alert(`Archived "${label}" (${result.totalKwh.toFixed(1)} kWh, $${totalCost.toFixed(2)})`);
  fireHistoryChange();
}

/**
 * Render the history list in #historyList.
 */
export function renderHistoryList() {
  const container = document.getElementById('historyList');
  const historyBox = document.getElementById('historyBox');
  if (!container) return;

  const history = storage.getHistory();

  if (history.length === 0) {
    container.innerHTML = '<p class="text-muted small mb-0">No archived periods yet. Archive your current billing period to start tracking history.</p>';
    if (historyBox) historyBox.classList.add('show');
    return;
  }

  // Sort by savedAt descending (newest first) — clone to avoid mutating the retrieved array
  const sorted = [...history].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

  let html = '<div class="history-list">';
  for (const entry of sorted) {
    const savedDate = new Date(entry.savedAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    const startFmt = formatDateRange(entry.startDate);
    const endFmt = formatDateRange(entry.endDate);
    const hasCharges = entry.additionalCharges && entry.additionalCharges.length > 0;
    const chargesTotal = hasCharges ? entry.additionalCharges.reduce((s, c) => s + c.amount, 0) : 0;
    const kwhCost = entry.totalCost - chargesTotal;

    html += `
      <div class="history-item" data-history-id="${entry.id}">
        <div class="history-header">
          <div class="history-label">${escapeHTML(entry.label)}</div>
          <div class="history-meta">Archived ${savedDate}</div>
        </div>
        <div class="history-period">${startFmt} — ${endFmt}</div>
        <div class="history-breakdown">
          <div class="history-line">
            <span>kWh Usage (${entry.totalKwh.toFixed(1)} kWh)</span>
            <span>$${kwhCost.toFixed(2)}</span>
          </div>${hasCharges ? entry.additionalCharges.map(c => `
          <div class="history-line history-line-charge">
            <span>${escapeHTML(c.name)}</span>
            <span>$${c.amount.toFixed(2)}</span>
          </div>`).join('') : ''}
          <div class="history-line history-line-total">
            <span>Total Reimbursement</span>
            <span>$${entry.totalCost.toFixed(2)}</span>
          </div>
        </div>
        <div class="history-actions">
          <button class="btn-icon-sm" data-action="export-history-pdf" data-history-id="${entry.id}" title="Export PDF">
            <i class="bi bi-file-earmark-pdf"></i>
          </button>
          <button class="btn-icon-sm" data-action="restore-period" data-history-id="${entry.id}" title="Restore this period">
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
          <button class="btn-icon-sm btn-icon-danger" data-action="delete-period" data-history-id="${entry.id}" title="Delete this archive">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`;
  }
  html += '</div>';

  container.innerHTML = html;
  if (historyBox) historyBox.classList.add('show');
}

/**
 * Restore a period from history into the current form.
 */
export function restorePeriod(id) {
  const snapshot = storage.loadFromHistory(id);
  if (!snapshot) {
    alert('Could not find the archived period.');
    return;
  }

  if (!confirm(`Restore "${snapshot.label}"? This will replace your current billing period data.`)) return;

  // Set form values
  document.getElementById('startDate').value = snapshot.startDate;
  document.getElementById('endDate').value = snapshot.endDate;
  document.getElementById('costPerKwh').value = snapshot.costPerKwh || '';

  const tieredCheckbox = document.getElementById('useTieredRates');
  if (tieredCheckbox) tieredCheckbox.checked = snapshot.useTieredRates || false;

  if (snapshot.useTieredRates) {
    document.getElementById('tier1Limit').value = snapshot.tier1Limit || '';
    document.getElementById('tier1Rate').value = snapshot.tier1Rate || '';
    document.getElementById('tier2Rate').value = snapshot.tier2Rate || '';
  }

  // Additional charges
  const chargesCheckbox = document.getElementById('useAdditionalCharges');
  const hasCharges = snapshot.additionalCharges && snapshot.additionalCharges.length > 0;
  if (chargesCheckbox) chargesCheckbox.checked = hasCharges;
  if (hasCharges) {
    storage.setItem('additionalChargesData', JSON.stringify(snapshot.additionalCharges));
    storage.setItem('useAdditionalCharges', 'true');
  } else {
    storage.setItem('additionalChargesData', '[]');
    storage.setItem('useAdditionalCharges', 'false');
  }

  // Save form data to storage
  storage.saveFormData();

  // Store daily kWh data so it can be loaded after field generation
  storage.setItem('dailyKwhData', JSON.stringify(snapshot.dailyKwhData));

  alert(`Restored "${snapshot.label}". Fields will regenerate with your data.`);

  // Trigger a page-level refresh to regenerate fields with restored data
  fireHistoryChange();
}

/**
 * Export a history entry as a receipt PDF.
 */
export function exportHistoryPDF(id) {
  const snapshot = storage.loadFromHistory(id);
  if (!snapshot) {
    alert('Could not find the archived period.');
    return;
  }
  exportReceiptFromSnapshot(snapshot);
}

/**
 * Delete a period from history.
 */
export function deletePeriod(id) {
  const snapshot = storage.loadFromHistory(id);
  if (!snapshot) return;

  if (!confirm(`Delete archived period "${snapshot.label}"?`)) return;

  storage.deleteFromHistory(id);
  fireHistoryChange();
}
