const express = require('express');
const { authorizeToken, requireRole } = require('../auth-service');
const { isMaintenanceEnabled, setMaintenance } = require('../services/settings-service');

const router = express.Router();

router.get('/maintenance', authorizeToken, requireRole('admin'), async (req, res) => {
  const enabled = await isMaintenanceEnabled();
  res.json({ success: true, enabled });
});

router.post('/maintenance', authorizeToken, requireRole('admin'), async (req, res) => {
  const enabled = req.body.enabled === true || req.body.enabled === 'true';
  const value = await setMaintenance(enabled);
  res.json({ success: true, enabled: value });
});

module.exports = router;
