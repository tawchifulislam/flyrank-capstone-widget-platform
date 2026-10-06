const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../config');

const tooManyRequests = { error: 'Too many requests' };

const ipLimiter = rateLimit({
  windowMs: config.ipRateLimitWindowMs,
  limit: config.ipRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
});

const widgetLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests,
  keyGenerator: req => {
    const widgetId = String((req.body && req.body.widgetId) || 'none').slice(
      0,
      64,
    );
    return `${ipKeyGenerator(req.ip)}:${widgetId}`;
  },
});

module.exports = { ipLimiter, widgetLimiter };
