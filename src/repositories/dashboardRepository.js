const pool = require('../db/pool');

async function listSubmissions({ ownerId, widgetId, limit, offset }) {
  const params = [ownerId];
  let where = 's.owner_id = $1';
  if (widgetId) {
    params.push(widgetId);
    where += ` AND s.widget_id = $${params.length}`;
  }
  const countResult = await pool.query(
    `SELECT count(*)::int AS total FROM submissions s WHERE ${where}`,
    params,
  );
  const listParams = [...params, limit, offset];
  const rows = await pool.query(
    `SELECT s.id, s.widget_id, s.data, s.country, s.city, s.created_at
     FROM submissions s
     WHERE ${where}
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );
  return { total: countResult.rows[0].total, rows: rows.rows };
}

async function totalInWindow(ownerId, days) {
  const result = await pool.query(
    `SELECT count(*)::int AS total
     FROM submissions
     WHERE owner_id = $1 AND created_at >= now() - make_interval(days => $2::int)`,
    [ownerId, days],
  );
  return result.rows[0].total;
}

async function countsPerDay(ownerId, days) {
  const result = await pool.query(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*)::int AS count
     FROM submissions
     WHERE owner_id = $1 AND created_at >= now() - make_interval(days => $2::int)
     GROUP BY 1
     ORDER BY 1`,
    [ownerId, days],
  );
  return result.rows;
}

async function countsPerWidget(ownerId, days) {
  const result = await pool.query(
    `SELECT w.id, w.title, count(s.id)::int AS count
     FROM widgets w
     LEFT JOIN submissions s
       ON s.widget_id = w.id AND s.created_at >= now() - make_interval(days => $2::int)
     WHERE w.owner_id = $1
     GROUP BY w.id, w.title
     ORDER BY count DESC, w.title`,
    [ownerId, days],
  );
  return result.rows;
}

async function countsPerCountry(ownerId, days) {
  const result = await pool.query(
    `SELECT COALESCE(country, 'Unknown') AS country, count(*)::int AS count
     FROM submissions
     WHERE owner_id = $1 AND created_at >= now() - make_interval(days => $2::int)
     GROUP BY 1
     ORDER BY count DESC, country`,
    [ownerId, days],
  );
  return result.rows;
}

module.exports = {
  listSubmissions,
  totalInWindow,
  countsPerDay,
  countsPerWidget,
  countsPerCountry,
};
