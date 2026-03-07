/**
 * Profile-scoped localStorage wrapper.
 * All get/set operations are automatically scoped to the current profile.
 * Includes backward compatibility for unscoped keys (pre-profile data).
 */

const PROFILE_LIST_KEY = 'profiles';
const CURRENT_PROFILE_KEY = 'currentProfile';
const DEFAULT_PROFILE = 'Default';
const FORM_KEYS = ['startDate', 'endDate', 'costPerKwh', 'dailyKwhData',
  'useTieredRates', 'tier1Limit', 'tier1Rate', 'tier2Rate',
  'useAdditionalCharges', 'additionalChargesData'];

// --- Profile management ---

export function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_LIST_KEY) || '["Default"]');
  } catch {
    return ['Default'];
  }
}

export function setProfiles(profiles) {
  localStorage.setItem(PROFILE_LIST_KEY, JSON.stringify(profiles));
}

export function getCurrentProfile() {
  return localStorage.getItem(CURRENT_PROFILE_KEY) || DEFAULT_PROFILE;
}

export function setCurrentProfile(name) {
  localStorage.setItem(CURRENT_PROFILE_KEY, name);
}

// --- Scoped get/set ---

function profileKey(key) {
  return `${getCurrentProfile()}__${key}`;
}

export function getItem(key) {
  // Try profile-scoped key first, then fall back to unscoped (backward compat)
  let val = localStorage.getItem(profileKey(key));
  if (val === null) {
    val = localStorage.getItem(key);
  }
  return val;
}

export function setItem(key, value) {
  localStorage.setItem(profileKey(key), value);
}

export function removeItem(key) {
  localStorage.removeItem(profileKey(key));
  localStorage.removeItem(key); // also clear unscoped for clean migration
}

// --- Bulk form operations ---

export function saveFormData() {
  const data = {};

  // Simple inputs
  ['startDate', 'endDate', 'costPerKwh'].forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });

  // Tiered rates
  const useTieredEl = document.getElementById('useTieredRates');
  data.useTieredRates = useTieredEl?.checked ? 'true' : 'false';
  ['tier1Limit', 'tier1Rate', 'tier2Rate'].forEach(id => {
    const el = document.getElementById(id);
    data[id] = el?.value || '';
  });

  // Additional charges
  const useChargesEl = document.getElementById('useAdditionalCharges');
  data.useAdditionalCharges = useChargesEl?.checked ? 'true' : 'false';
  const chargeRows = document.querySelectorAll('.additional-charge-row');
  const charges = [];
  chargeRows.forEach(row => {
    const name = row.querySelector('.charge-name')?.value || '';
    const amount = parseFloat(row.querySelector('.charge-amount')?.value) || 0;
    if (name || amount) charges.push({ name, amount });
  });
  data.additionalChargesData = JSON.stringify(charges);

  // Daily kWh data from input fields
  const dailyKwhInputs = document.querySelectorAll('.dailyKwh');
  const dailyKwhData = {};
  dailyKwhInputs.forEach(input => {
    dailyKwhData[input.getAttribute('data-date')] = input.value;
  });
  data.dailyKwhData = JSON.stringify(dailyKwhData);

  // Write all to storage
  for (const [key, val] of Object.entries(data)) {
    setItem(key, val);
  }
}

export function loadFormData() {
  const startDate = getItem('startDate');
  const endDate = getItem('endDate');
  const costPerKwh = getItem('costPerKwh');

  if (startDate) document.getElementById('startDate').value = startDate;
  if (endDate) document.getElementById('endDate').value = endDate;
  if (costPerKwh) document.getElementById('costPerKwh').value = costPerKwh;

  // Tiered rates
  const useTiered = getItem('useTieredRates') === 'true';
  const useTieredEl = document.getElementById('useTieredRates');
  if (useTieredEl) useTieredEl.checked = useTiered;

  ['tier1Limit', 'tier1Rate', 'tier2Rate'].forEach(id => {
    const el = document.getElementById(id);
    const val = getItem(id);
    if (el && val) el.value = val;
  });

  // Additional charges
  const useCharges = getItem('useAdditionalCharges') === 'true';
  const useChargesEl = document.getElementById('useAdditionalCharges');
  if (useChargesEl) useChargesEl.checked = useCharges;

  return { startDate, endDate, costPerKwh };
}

export function getDailyKwhData() {
  const raw = getItem('dailyKwhData');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearFormData() {
  FORM_KEYS.forEach(key => removeItem(key));
}

export function deleteProfileData(profileName) {
  FORM_KEYS.forEach(key => {
    localStorage.removeItem(`${profileName}__${key}`);
  });
  localStorage.removeItem(`${profileName}__history`);
}

// --- History (profile-scoped) ---

export function getHistory() {
  const raw = localStorage.getItem(profileKey('history'));
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(snapshot) {
  const history = getHistory();
  history.push(snapshot);
  localStorage.setItem(profileKey('history'), JSON.stringify(history));
}

export function deleteFromHistory(id) {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(profileKey('history'), JSON.stringify(history));
}

export function loadFromHistory(id) {
  return getHistory().find(h => h.id === id) || null;
}

// --- Rate Presets (global, not profile-scoped) ---

const PRESETS_KEY = 'ratePresets';

export function getRatePresets() {
  const raw = localStorage.getItem(PRESETS_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setRatePresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function saveRatePreset(preset) {
  const presets = getRatePresets();
  presets.push(preset);
  setRatePresets(presets);
}

export function deleteRatePreset(id) {
  const presets = getRatePresets().filter(p => p.id !== id);
  setRatePresets(presets);
}

// --- Storage usage ---

export function getStorageUsage() {
  let totalBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    totalBytes += key.length + (localStorage.getItem(key) || '').length;
  }
  // JS strings are UTF-16 (2 bytes per char)
  totalBytes *= 2;
  return { bytes: totalBytes, keys: localStorage.length };
}

export function clearAllData() {
  localStorage.clear();
}

// --- Dark mode (not profile-scoped) ---

export function getDarkMode() {
  return localStorage.getItem('darkMode') === 'true';
}

export function setDarkMode(enabled) {
  localStorage.setItem('darkMode', enabled ? 'true' : 'false');
}
