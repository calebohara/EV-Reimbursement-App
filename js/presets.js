/**
 * Rate preset management — save, load, apply, delete utility rate configurations.
 */

import * as storage from './storage.js';

let onPresetApply = null;
export function setOnPresetApply(fn) { onPresetApply = fn; }

/**
 * Populate the preset dropdown from storage.
 */
export function initPresets() {
  const select = document.getElementById('ratePresetSelect');
  if (!select) return;

  const presets = storage.getRatePresets();
  select.innerHTML = '<option value="">Custom Rate</option>';
  presets.forEach(p => {
    const rateLabel = p.useTieredRates
      ? `Tiered (${p.tier1Rate}/${p.tier2Rate})`
      : `$${p.costPerKwh}/kWh`;
    select.innerHTML += `<option value="${p.id}">${p.name} — ${rateLabel}</option>`;
  });
}

/**
 * Apply a preset by ID — fills cost/tier fields from preset data.
 */
export function applyPreset(id) {
  if (!id) return; // "Custom Rate" selected

  const presets = storage.getRatePresets();
  const preset = presets.find(p => p.id === id);
  if (!preset) return;

  document.getElementById('costPerKwh').value = preset.costPerKwh || '';

  const tieredCheckbox = document.getElementById('useTieredRates');
  if (tieredCheckbox) {
    tieredCheckbox.checked = preset.useTieredRates || false;
    // Dispatch change event to trigger tier input state update
    tieredCheckbox.dispatchEvent(new Event('change'));
  }

  if (preset.useTieredRates) {
    document.getElementById('tier1Limit').value = preset.tier1Limit || '';
    document.getElementById('tier1Rate').value = preset.tier1Rate || '';
    document.getElementById('tier2Rate').value = preset.tier2Rate || '';
  }

  storage.saveFormData();
  if (onPresetApply) onPresetApply();
}

/**
 * Save the current rate configuration as a new preset.
 */
export function saveCurrentAsPreset() {
  const name = prompt('Enter a name for this rate preset (e.g., "PG&E E-TOU-D"):');
  if (!name) return;

  const existing = storage.getRatePresets();
  if (existing.some(p => p.name === name)) {
    alert('A preset with that name already exists.');
    return;
  }

  const costPerKwh = parseFloat(document.getElementById('costPerKwh').value) || 0;
  const useTieredRates = document.getElementById('useTieredRates')?.checked || false;

  const preset = {
    id: crypto.randomUUID(),
    name,
    costPerKwh,
    useTieredRates,
    tier1Limit: useTieredRates ? (parseFloat(document.getElementById('tier1Limit')?.value) || 0) : 0,
    tier1Rate: useTieredRates ? (parseFloat(document.getElementById('tier1Rate')?.value) || 0) : 0,
    tier2Rate: useTieredRates ? (parseFloat(document.getElementById('tier2Rate')?.value) || 0) : 0
  };

  storage.saveRatePreset(preset);
  initPresets();

  // Select the newly saved preset
  const select = document.getElementById('ratePresetSelect');
  if (select) select.value = preset.id;

  alert(`Rate preset "${name}" saved.`);
}

/**
 * Delete the currently selected preset.
 */
export function deleteSelectedPreset() {
  const select = document.getElementById('ratePresetSelect');
  if (!select || !select.value) {
    alert('Please select a preset to delete.');
    return;
  }

  const presets = storage.getRatePresets();
  const preset = presets.find(p => p.id === select.value);
  if (!preset) return;

  if (!confirm(`Delete rate preset "${preset.name}"?`)) return;

  storage.deleteRatePreset(preset.id);
  initPresets();
}
