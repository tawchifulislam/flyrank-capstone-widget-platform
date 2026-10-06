const express = require('express');
const requireAuth = require('../middleware/auth');
const dashboardService = require('../services/dashboardService');

const router = express.Router();

router.use(requireAuth);

router.get('/submissions', async (req, res, next) => {
  try {
    res.json(await dashboardService.listSubmissions(req.ownerId, req.query));
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    res.json(await dashboardService.stats(req.ownerId, req.query));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
