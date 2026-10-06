const jwt = require('jsonwebtoken');
const config = require('../config');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.ownerId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Missing or invalid token' });
  }
}

module.exports = requireAuth;
