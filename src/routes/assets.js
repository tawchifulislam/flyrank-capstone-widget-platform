const express = require('express');
const assets = require('../services/assetService');

const router = express.Router();

router.get('/widget.js', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.type('application/javascript');
  res.send(assets.loaderSource);
});

router.get('/assets/:file', (req, res) => {
  const match = /^widget\.([a-f0-9]{10})\.js$/.exec(req.params.file);
  if (!match || match[1] !== assets.bundleHash) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.type('application/javascript');
  res.send(assets.bundleSource);
});

module.exports = router;
