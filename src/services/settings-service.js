const { getSetting, upsertSetting } = require('../database');

async function isMaintenanceEnabled() {
  const value = await getSetting('maintenance_mode');
  return value === 'true';
}

async function setMaintenance(enabled) {
  const normalized = enabled ? 'true' : 'false';
  await upsertSetting('maintenance_mode', normalized);
  return normalized === 'true';
}

module.exports = {
  isMaintenanceEnabled,
  setMaintenance,
};
