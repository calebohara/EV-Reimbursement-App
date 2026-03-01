/**
 * Dashboard summary card — auto-updating stats display.
 */

import { parseLocalDate, dayCount } from './utils/dates.js';
import { computeTieredTotals } from './billing.js';

export function updateSummary() {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
  const summaryBox = document.getElementById('summaryBox');

  if (!startDateStr || !endDateStr || isNaN(costPerKwh)) {
    summaryBox.classList.remove('show');
    return;
  }

  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);

  if (!startDate || !endDate || startDate > endDate) {
    summaryBox.classList.remove('show');
    return;
  }

  const totalDays = dayCount(startDate, endDate);

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

  const tierTotals = computeTieredTotals(costPerKwh);
  const totalCost = tierTotals.totalCost;
  const avgDaily = daysWithData > 0 ? totalKwh / daysWithData : 0;
  const completeness = totalDays > 0 ? Math.round((daysWithData / totalDays) * 100) : 0;

  // Update display
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

  progressBar.className = 'progress-bar';
  if (completeness >= 90) progressBar.classList.add('bg-success');
  else if (completeness >= 70) progressBar.classList.add('bg-info');
  else if (completeness >= 50) progressBar.classList.add('bg-warning');
  else progressBar.classList.add('bg-danger');

  // Show with smooth animation
  if (!summaryBox.classList.contains('show')) {
    setTimeout(() => summaryBox.classList.add('show'), 100);
  }
}
