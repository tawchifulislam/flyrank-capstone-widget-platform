const pool = require('../db/pool');

async function create(widget) {
  const result = await pool.query(
    `INSERT INTO widgets (id, owner_id, type, title, description, button_text, fields, display_options)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      widget.id,
      widget.ownerId,
      widget.type,
      widget.title,
      widget.description,
      widget.buttonText,
      JSON.stringify(widget.fields),
      JSON.stringify(widget.displayOptions),
    ],
  );
  return result.rows[0];
}

async function listByOwner(ownerId) {
  const result = await pool.query(
    'SELECT * FROM widgets WHERE owner_id = $1 ORDER BY created_at DESC',
    [ownerId],
  );
  return result.rows;
}

async function findByIdForOwner(id, ownerId) {
  const result = await pool.query(
    'SELECT * FROM widgets WHERE id = $1 AND owner_id = $2',
    [id, ownerId],
  );
  return result.rows[0] || null;
}

async function findPublicById(id) {
  const result = await pool.query('SELECT * FROM widgets WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function update(id, ownerId, widget) {
  const result = await pool.query(
    `UPDATE widgets
     SET type = $3, title = $4, description = $5, button_text = $6,
         fields = $7, display_options = $8, version = version + 1, updated_at = now()
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [
      id,
      ownerId,
      widget.type,
      widget.title,
      widget.description,
      widget.buttonText,
      JSON.stringify(widget.fields),
      JSON.stringify(widget.displayOptions),
    ],
  );
  return result.rows[0] || null;
}

async function remove(id, ownerId) {
  const result = await pool.query(
    'DELETE FROM widgets WHERE id = $1 AND owner_id = $2',
    [id, ownerId],
  );
  return result.rowCount > 0;
}

module.exports = {
  create,
  listByOwner,
  findByIdForOwner,
  findPublicById,
  update,
  remove,
};
