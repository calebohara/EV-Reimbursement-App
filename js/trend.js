/**
 * Month-over-month trend chart — compares archived billing periods.
 */

import * as storage from './storage.js';

let trendChart = null;

/**
 * Render the trend comparison chart from history data.
 * Shows only when 2+ history records exist.
 */
export function renderTrendChart() {
  const trendBox = document.getElementById('trendBox');
  const canvas = document.getElementById('trendChart');
  const insightDiv = document.getElementById('trendInsight');
  if (!trendBox || !canvas) return;

  const history = storage.getHistory();

  if (history.length < 2) {
    trendBox.classList.remove('show');
    if (insightDiv) insightDiv.textContent = '';
    return;
  }

  trendBox.classList.add('show');

  // Sort by start date ascending
  const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const labels = sorted.map(h => h.label);
  const kwhData = sorted.map(h => h.totalKwh);
  const costData = sorted.map(h => h.totalCost);

  // Calculate average daily kWh for each period
  const avgDailyData = sorted.map(h => {
    const days = Object.keys(h.dailyKwhData || {}).length || 1;
    return h.totalKwh / days;
  });

  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#e0e0e0' : '#333';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  // Destroy existing chart
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }

  const ctx = canvas.getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total kWh',
          data: kwhData,
          backgroundColor: isDark ? 'rgba(54, 162, 235, 0.6)' : 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Total Cost ($)',
          data: costData,
          backgroundColor: isDark ? 'rgba(75, 192, 192, 0.6)' : 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
          order: 1
        },
        {
          label: 'Avg Daily kWh',
          data: avgDailyData,
          type: 'line',
          borderColor: isDark ? '#ff9800' : '#ff6600',
          backgroundColor: 'transparent',
          pointBackgroundColor: isDark ? '#ff9800' : '#ff6600',
          borderWidth: 2,
          pointRadius: 4,
          yAxisID: 'y',
          order: 0,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: textColor, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              if (ctx.dataset.label === 'Total Cost ($)') {
                return `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`;
              }
              return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'kWh', color: textColor },
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Cost ($)', color: textColor },
          ticks: {
            color: textColor,
            callback: (val) => `$${val.toFixed(0)}`
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  // Generate insight text
  if (insightDiv && sorted.length >= 2) {
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const kwhChange = prev.totalKwh > 0
      ? ((latest.totalKwh - prev.totalKwh) / prev.totalKwh * 100)
      : 0;

    const avgCost = sorted.reduce((sum, h) => sum + h.totalCost, 0) / sorted.length;

    const direction = kwhChange > 0 ? 'higher' : 'lower';
    const changeStr = Math.abs(kwhChange).toFixed(0);

    insightDiv.textContent = `${latest.label} usage was ${changeStr}% ${direction} than ${prev.label}. Average monthly cost: $${avgCost.toFixed(2)}`;
  }
}
