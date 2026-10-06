const express = require('express');
const submissionService = require('../services/submissionService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await submissionService.submit(req.body, req.ip, {
      mockGeoDown: req.get('x-mock-geo-down'),
      mockEmailFail: req.get('x-mock-email-fail'),
      idempotencyKey: req.get('idempotency-Key'),
    });
    res.status(result.replayed ? 200 : 201).json({ id: result.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
