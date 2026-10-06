const express = require('express');
const widgetService = require('../services/widgetService');

const router = express.Router();

router.get('/:id/config', async (req, res, next) => {
  try {
    const config = await widgetService.getPublicConfig(req.params.id);
    res.set('Cache-Control', 'public, max-age=60');
    res.json(config);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
