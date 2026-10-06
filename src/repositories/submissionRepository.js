const pool = require('../db/pool');

async function create({ widgetId, ownerId, data, ip, country, city }) {
  const result = await pool.query(
    `INSERT INTO submissions (widget_id, owner_id, data, ip, country, city)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [widgetId, ownerId, JSON.stringify(data), ip, country, city],
  );
  return result.rows[0];
}

module.exports = { create };
