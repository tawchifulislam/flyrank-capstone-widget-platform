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
};
