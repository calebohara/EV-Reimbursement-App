/**
 * Chart.js visualization — dual-axis kWh usage and cost line chart.
 */

import { ymd, parseLocalDate, forEachDay } from './utils/dates.js';
import { isUsingTieredRates, validateTierInputs, computeTieredDailyCostsMap } from './billing.js';

let usageChart = null;

export function renderUsageChart() {
  const ctx = document.getElementById('usageChart');
  const chartBox = document.getElementById('chartBox');
  if (!ctx || !chartBox) return;

  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value);
  const tiersOk = isUsingTieredRates() && validateTierInputs(false);

  if (!startDateStr || !endDateStr || (!tiersOk && isNaN(costPerKwh))) {
    if (usageChart) { usageChart.destroy(); usageChart = null; }
    chartBox.classList.remove('show');
    return;
  }

  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);

  if (!startDate || !endDate || startDate > endDate) {
    if (usageChart) { usageChart.destroy(); usageChart = null; }
    chartBox.classList.remove('show');
    return;
  }

  const labels = [];
  const kwhData = [];
  const costData = [];
  const tierResult = computeTieredDailyCostsMap(costPerKwh, startDate, endDate);

  forEachDay(startDate, endDate, (d) => {
    const dateStr = ymd(d);
    labels.push(dateStr);
    kwhData.push(tierResult.kwhMap[dateStr] || 0);
    costData.push(tierResult.dailyCostMap[dateStr] || 0);
  });

  if (usageChart) usageChart.destroy();
  chartBox.classList.add('show');

  const isDark = document.body.classList.contains('dark-mode');
  const gridColor = isDark ? '#666' : '#e5e5e5';
  const labelColor = isDark ? '#f5f5f7' : '#212529';

  usageChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'kWh Usage',
          data: kwhData,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0,123,255,0.1)',
          yAxisID: 'y'
        },
        {
          label: 'Daily Cost ($)',
          data: costData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40,167,69,0.1)',
          yAxisID: 'y1'
        }
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
            title: (context) => 'Date: ' + context[0].label,
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label.includes('kWh')) return label + ': ' + value.toFixed(2) + ' kWh';
              if (label.includes('Cost')) return label + ': $' + value.toFixed(2);
              return label + ': ' + value;
            },
            footer: (context) => {
              if (context.length > 1) {
                const kwh = context.find(i => i.dataset.label.includes('kWh'))?.parsed.y || 0;
                const cost = context.find(i => i.dataset.label.includes('Cost'))?.parsed.y || 0;
                return `Rate: $${(cost / kwh || 0).toFixed(3)}/kWh`;
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
