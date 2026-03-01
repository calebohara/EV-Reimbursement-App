/**
 * Profile management — CRUD operations and dropdown UI.
 */

import * as storage from './storage.js';

// Callback for when profile changes (reload data, chart, summary)
let onProfileChange = null;
export function setOnProfileChange(fn) { onProfileChange = fn; }

function fireProfileChange() {
  if (onProfileChange) onProfileChange();
}

export function updateProfileDropdown() {
  const select = document.getElementById('profileSelect');
  const profiles = storage.getProfiles();
  select.innerHTML = profiles.map(p => `<option value="${p}">${p}</option>`).join('');
  select.value = storage.getCurrentProfile();
}

export function setupProfileUI() {
  updateProfileDropdown();

  // Profile switch
  document.getElementById('profileSelect').onchange = function () {
    storage.setCurrentProfile(this.value);
    fireProfileChange();
  };

  // Add profile
  document.getElementById('addProfileBtn').onclick = function () {
    const name = prompt('Enter new profile name:');
    if (!name) return;

    const profiles = storage.getProfiles();
    if (profiles.includes(name)) {
      alert('Profile already exists.');
      return;
    }

    profiles.push(name);
    storage.setProfiles(profiles);
    storage.setCurrentProfile(name);
    updateProfileDropdown();

    // Clear data for new profile
    storage.clearFormData();
    fireProfileChange();
  };

  // Delete profile
  document.getElementById('deleteProfileBtn').onclick = function () {
    const current = storage.getCurrentProfile();
    if (current === 'Default') {
      alert('Cannot delete Default profile.');
      return;
    }
    if (!confirm(`Delete profile '${current}'?`)) return;

    let profiles = storage.getProfiles().filter(p => p !== current);
    storage.setProfiles(profiles);
    storage.setCurrentProfile('Default');
    storage.deleteProfileData(current);
    updateProfileDropdown();
    fireProfileChange();
  };
}
