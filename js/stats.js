/**
 * EV Impact + Stats for Nerds — environmental stats and nerdy data.
 */

import { getProfiles, getStorageUsage } from './storage.js';

const APP_VERSION = '3.7.2';
const CO2_KG_PER_KWH = 0.42;   // net CO₂ savings: EV vs gasoline equivalent (US avg)
const MILES_PER_KWH = 3.5;      // average EV efficiency
const TREES_KG_PER_YEAR = 22;   // kg CO₂ absorbed per tree per year

/** Gather all kWh: current inputs + all archived history across all profiles. */
function getAllTimeData() {
  let totalKwh = 0;
  let totalDays = 0;
  let dataPoints = 0;
  let totalCost = 0;

  // Current session kWh from input fields
  document.querySelectorAll('.dailyKwh').forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) {
      totalKwh += val;
      dataPoints++;
    }
    totalDays++;
  });

  // All archived history across ALL profiles
  const profiles = getProfiles();
  profiles.forEach(profileName => {
    const raw = localStorage.getItem(`${profileName}__history`);
    let history = [];
    try { history = raw ? JSON.parse(raw) : []; } catch { history = []; }
    history.forEach(entry => {
      if (entry.totalKwh) totalKwh += entry.totalKwh;
      if (entry.totalCost) totalCost += entry.totalCost;
      if (entry.dailyData) {
        const days = Object.keys(entry.dailyData);
        totalDays += days.length;
        dataPoints += days.filter(d => {
          const v = parseFloat(entry.dailyData[d]);
          return !isNaN(v) && v > 0;
        }).length;
      }
    });
  });

  return { totalKwh, totalDays, dataPoints, totalCost };
}

function getTotalArchivedPeriods() {
  let count = 0;
  getProfiles().forEach(profileName => {
    const raw = localStorage.getItem(`${profileName}__history`);
    let history = [];
    try { history = raw ? JSON.parse(raw) : []; } catch { history = []; }
    count += history.length;
  });
  return count;
}

function createStatCard(icon, value, label, detail) {
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.setAttribute('role', 'figure');
  card.setAttribute('aria-label', `${label}: ${value}`);

  const iconEl = document.createElement('div');
  iconEl.className = 'stat-icon';
  const iconI = document.createElement('i');
  iconI.className = `bi bi-${icon}`;
  iconEl.appendChild(iconI);

  const valueEl = document.createElement('div');
  valueEl.className = 'stat-value';
  valueEl.textContent = value;

  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;

  const detailEl = document.createElement('div');
  detailEl.className = 'stat-detail';
  detailEl.textContent = detail;

  card.append(iconEl, valueEl, labelEl, detailEl);
  return card;
}

function fmt(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return n.toFixed(1);
}

export function updateStats() {
  const data = getAllTimeData();
  const { totalKwh, totalDays, dataPoints, totalCost } = data;
  const co2Saved = totalKwh * CO2_KG_PER_KWH;
  const milesPowered = totalKwh * MILES_PER_KWH;
  const treesEquiv = co2Saved > 0 ? (co2Saved / TREES_KG_PER_YEAR) : 0;

  // ── EV Impact ──
  const impactContainer = document.getElementById('statsContent');
  if (impactContainer) {
    const statsBox = document.getElementById('statsBox');
    if (statsBox) statsBox.classList.add('show');

    impactContainer.innerHTML = '';

    impactContainer.appendChild(createStatCard(
      'cloud-sun',
      `${fmt(co2Saved)} kg`,
      'CO₂ Saved',
      `≈ ${fmt(treesEquiv)} tree-months of absorption`
    ));

    impactContainer.appendChild(createStatCard(
      'ev-front',
      `${fmt(milesPowered)} mi`,
      'Miles Powered',
      `From ${fmt(totalKwh)} kWh total usage`
    ));
  }

  // ── Stats for Nerds ──
  const nerdsContainer = document.getElementById('nerdsContent');
  if (nerdsContainer) {
    const nerdsBox = document.getElementById('nerdsBox');
    if (nerdsBox) nerdsBox.classList.add('show');

    nerdsContainer.innerHTML = '';

    // Total Days Tracked
    nerdsContainer.appendChild(createStatCard(
      'calendar-range',
      totalDays.toLocaleString(),
      'Days Tracked',
      `Across all profiles and archived periods`
    ));

    // Avg Daily Usage
    const avgDaily = dataPoints > 0 ? totalKwh / dataPoints : 0;
    nerdsContainer.appendChild(createStatCard(
      'bar-chart-line',
      `${fmt(avgDaily)} kWh`,
      'Avg Daily Usage',
      dataPoints > 0 ? `Over ${dataPoints.toLocaleString()} days with data` : 'No usage data yet'
    ));

    // Cost per Mile
    const costPerMile = milesPowered > 0 ? totalCost / milesPowered : 0;
    nerdsContainer.appendChild(createStatCard(
      'currency-dollar',
      costPerMile > 0 ? `$${costPerMile.toFixed(3)}` : '—',
      'Cost per Mile',
      costPerMile > 0 ? `Based on $${fmt(totalCost)} total cost` : 'Archive a period to calculate'
    ));

    // Data Points
    nerdsContainer.appendChild(createStatCard(
      'hash',
      dataPoints.toLocaleString(),
      'Data Points',
      `${totalDays.toLocaleString()} total days · ${dataPoints} with entries`
    ));

    // Build Info
    const profiles = getProfiles();
    const archivedPeriods = getTotalArchivedPeriods();
    const { bytes } = getStorageUsage();
    const storageStr = bytes < 1024 ? `${bytes} B`
      : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    nerdsContainer.appendChild(createStatCard(
      'info-circle',
      `v${APP_VERSION}`,
      'Build Info',
      `${profiles.length} profile${profiles.length !== 1 ? 's' : ''} · ${archivedPeriods} archived · ${storageStr}`
    ));
  }
}
