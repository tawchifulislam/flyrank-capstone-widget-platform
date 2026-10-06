require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL,
  corsAllowOrigins: (process.env.CORS_ALLOW_ORIGINS || '')
    .split(',')
    .filter(Boolean),
  geoProviderAUrl: process.env.GEO_PROVIDER_A_URL,
  geoProviderBUrl: process.env.GEO_PROVIDER_B_URL,
  geoProviderAEnabled: process.env.GEO_PROVIDER_A_ENABLED !== 'false',
  geoProviderBEnabled: process.env.GEO_PROVIDER_B_ENABLED !== 'false',
  emailSideEffectFail: process.env.EMAIL_SIDE_EFFECT_FAIL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3001',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 10000,
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 5,
  ipRateLimitWindowMs: Number(process.env.IP_RATE_LIMIT_WINDOW_MS) || 60000,
  ipRateLimitMax: Number(process.env.IP_RATE_LIMIT_MAX) || 60,
  geoMode: process.env.GEO_MODE || 'real',
  geoTimeoutMs: Number(process.env.GEO_TIMEOUT_MS) || 2000,
  emailMode: process.env.EMAIL_MODE || 'mock',
};
