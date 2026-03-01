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

export function updateTierInputsState() {
  const enabled = isUsingTieredRates();
  ['tier1Limit', 'tier1Rate', 'tier2Rate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
  validateTierInputs(true);
}

/**
 * Compute daily costs with cumulative tiered billing across the period.
 * Returns { dailyCostMap, kwhMap, totalKwh }
 */
export function computeTieredDailyCostsMap(baseRate, startDate, endDate) {
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  const kwhMap = {};
  dailyKwhInputs.forEach(input => {
    kwhMap[input.getAttribute('data-date')] = parseFloat(input.value || 0) || 0;
  });

  const settings = getTierSettings(baseRate);
  const dailyCostMap = {};
  let cumulative = 0;
  let totalKwh = 0;

  forEachDay(startDate, endDate, (d) => {
    const dateStr = ymd(d);
    const kwh = kwhMap[dateStr] || 0;
    totalKwh += kwh;

    if (!settings.useTiers) {
      dailyCostMap[dateStr] = kwh * baseRate;
      return;
    }

    const remainingTier1 = Math.max(0, settings.tier1Limit - cumulative);
    const tier1KwhToday = Math.min(remainingTier1, kwh);
    const tier2KwhToday = kwh - tier1KwhToday;
    dailyCostMap[dateStr] = tier1KwhToday * settings.tier1Rate + tier2KwhToday * settings.tier2Rate;
    cumulative += kwh;
  });

  return { dailyCostMap, kwhMap, totalKwh };
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

  return { totalKwh: result.totalKwh, totalCost };
}
