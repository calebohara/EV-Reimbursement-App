/**
 * Billing logic — tiered rate calculations and cost computation.
 */

import { ymd, parseLocalDate, forEachDay } from './utils/dates.js';

// --- Tiered rate helpers ---

export function isUsingTieredRates() {
  return !!document.getElementById('useTieredRates')?.checked;
}

export function getTierSettings(baseRate) {
  if (!isUsingTieredRates()) {
    return { useTiers: false, tier1Limit: 0, tier1Rate: baseRate, tier2Rate: baseRate };
  }

  const tier1Limit = parseFloat(document.getElementById('tier1Limit')?.value || '0') || 0;
  const tier1Rate = parseFloat(document.getElementById('tier1Rate')?.value || `${baseRate}`);
  const tier2RateInput = document.getElementById('tier2Rate')?.value;
  const tier2Rate = tier2RateInput === '' ? baseRate : (parseFloat(tier2RateInput) || baseRate);

  if (!validateTierInputs(false)) {
    return { useTiers: false, tier1Limit: 0, tier1Rate: baseRate, tier2Rate: baseRate };
  }

  return { useTiers: true, tier1Limit, tier1Rate, tier2Rate };
}

export function validateTierInputs(showAlerts = false) {
  if (!isUsingTieredRates()) return true;

  const limitEl = document.getElementById('tier1Limit');
  const rate1El = document.getElementById('tier1Rate');
  const rate2El = document.getElementById('tier2Rate');
  if (!limitEl || !rate1El || !rate2El) return true;

  const errors = [];
  const limitVal = parseFloat(limitEl.value);
  const rate1Val = parseFloat(rate1El.value);
  const rate2Val = rate2El.value === '' ? null : parseFloat(rate2El.value);

  [limitEl, rate1El, rate2El].forEach(el => el.classList.remove('is-invalid'));

  let valid = true;
  if (isNaN(limitVal) || limitVal < 0) {
    valid = false;
    limitEl.classList.add('is-invalid');
    errors.push('Tier 1 Limit must be a non-negative number.');
  }
  if (isNaN(rate1Val) || rate1Val < 0) {
    valid = false;
    rate1El.classList.add('is-invalid');
    errors.push('Tier 1 Rate must be a non-negative number.');
  }
  if (rate2Val !== null && (isNaN(rate2Val) || rate2Val < 0)) {
    valid = false;
    rate2El.classList.add('is-invalid');
    errors.push('Tier 2 Rate must be a non-negative number.');
  }
  if (!valid && showAlerts && errors.length) {
    alert('Please fix tiered rate settings:\n- ' + errors.join('\n- '));
  }
  return valid;
}

/**
 * Read additional charges from DOM inputs.
 * Returns array of { name, amount }.
 */
export function getAdditionalCharges() {
  const useCharges = document.getElementById('useAdditionalCharges')?.checked;
  if (!useCharges) return [];

  const charges = [];
  document.querySelectorAll('.additional-charge-row').forEach(row => {
    const name = row.querySelector('.charge-name')?.value?.trim() || '';
    const amount = parseFloat(row.querySelector('.charge-amount')?.value) || 0;
    if (name && amount > 0) charges.push({ name, amount });
  });
  return charges;
}

/**
 * Toggle additional charges fields visibility.
 */
export function updateAdditionalChargesState() {
  const enabled = document.getElementById('useAdditionalCharges')?.checked;
  const container = document.getElementById('additionalChargesFields');
  if (container) {
    if (enabled) container.classList.add('show');
    else container.classList.remove('show');
  }
}

export function updateTierInputsState() {
  const enabled = isUsingTieredRates();
  ['tier1Limit', 'tier1Rate', 'tier2Rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
  validateTierInputs(true);
}

/**
 * Compute daily costs from a plain kwhMap object (data-driven, no DOM access).
 * Used by history, receipt, and trend modules.
 * tierSettings: { useTiers, tier1Limit, tier1Rate, tier2Rate }
 * Returns { dailyCostMap, kwhMap, totalKwh }
 */
export function computeCostsFromData(kwhMap, tierSettings, baseRate, startDate, endDate) {
  const dailyCostMap = {};
  let cumulative = 0;
  let totalKwh = 0;

  forEachDay(startDate, endDate, (d) => {
    const dateStr = ymd(d);
    const kwh = kwhMap[dateStr] || 0;
    totalKwh += kwh;

    if (!tierSettings.useTiers) {
      dailyCostMap[dateStr] = kwh * baseRate;
      return;
    }

    const remainingTier1 = Math.max(0, tierSettings.tier1Limit - cumulative);
    const tier1KwhToday = Math.min(remainingTier1, kwh);
    const tier2KwhToday = kwh - tier1KwhToday;
    dailyCostMap[dateStr] = tier1KwhToday * tierSettings.tier1Rate + tier2KwhToday * tierSettings.tier2Rate;
    cumulative += kwh;
  });

  return { dailyCostMap, kwhMap, totalKwh };
}

/**
 * Compute daily costs with cumulative tiered billing across the period.
 * Reads kWh data from DOM inputs. Returns { dailyCostMap, kwhMap, totalKwh }
 */
export function computeTieredDailyCostsMap(baseRate, startDate, endDate) {
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  const kwhMap = {};
  dailyKwhInputs.forEach(input => {
    kwhMap[input.getAttribute('data-date')] = parseFloat(input.value || 0) || 0;
  });

  const settings = getTierSettings(baseRate);
  return computeCostsFromData(kwhMap, settings, baseRate, startDate, endDate);
}

/**
 * Compute totals over the entire billing period.
 * Returns { totalKwh, totalCost }
 */
export function computeTieredTotals(baseRate) {
  const startDateStr = document.getElementById('startDate').value;
  const endDateStr = document.getElementById('endDate').value;
  if (!startDateStr || !endDateStr) return { totalKwh: 0, totalCost: 0 };

  const startDate = parseLocalDate(startDateStr);
  const endDate = parseLocalDate(endDateStr);
  if (!startDate || !endDate) return { totalKwh: 0, totalCost: 0 };

  const result = computeTieredDailyCostsMap(baseRate, startDate, endDate);
  let totalCost = 0;

  forEachDay(startDate, endDate, (d) => {
    totalCost += result.dailyCostMap[ymd(d)] || 0;
  });

  // Add additional charges
  const charges = getAdditionalCharges();
  const additionalChargesTotal = charges.reduce((sum, c) => sum + c.amount, 0);
  totalCost += additionalChargesTotal;

  return { totalKwh: result.totalKwh, totalCost, additionalCharges: charges, additionalChargesTotal };
}
