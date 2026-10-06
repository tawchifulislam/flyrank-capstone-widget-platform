const pool = require('../db/pool');

async function create({ widgetId, ownerId, data, ip }) {
  const result = await pool.query(
    `INSERT INTO submissions (widget_id, owner_id, data, ip)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [widgetId, ownerId, JSON.stringify(data), ip],
  );
  return result.rows[0];
}

module.exports = { create };
