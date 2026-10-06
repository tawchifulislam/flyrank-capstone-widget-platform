const express = require('express');
const submissionService = require('../services/submissionService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await submissionService.submit(req.body, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
