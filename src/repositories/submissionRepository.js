const pool = require('../db/pool');

async function findByIdempotencyKey(widgetId, idempotencyKey) {
  const result = await pool.query(
    'SELECT id FROM submissions WHERE widget_id = $1 AND idempotency_key = $2',
    [widgetId, idempotencyKey],
  );
  return result.rows[0] || null;
}

async function create({
  widgetId,
  ownerId,
  data,
  ip,
  country,
  city,
  idempotencyKey,
}) {
  const result = await pool.query(
    `INSERT INTO submissions (widget_id, owner_id, data, ip, country, city, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (widget_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
     RETURNING id`,
    [
      widgetId,
      ownerId,
      JSON.stringify(data),
      ip,
      country,
      city,
      idempotencyKey,
    ],
  );
  return result.rows[0] || null;
}

module.exports = { findByIdempotencyKey, create };
