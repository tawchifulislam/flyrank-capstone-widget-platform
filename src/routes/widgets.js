const express = require('express');
const requireAuth = require('../middleware/auth');
const widgetService = require('../services/widgetService');

const router = express.Router();

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const widget = await widgetService.create(req.ownerId, req.body);
    res.status(201).json(widget);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    res.json(await widgetService.list(req.ownerId));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await widgetService.get(req.ownerId, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    res.json(await widgetService.update(req.ownerId, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await widgetService.remove(req.ownerId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
