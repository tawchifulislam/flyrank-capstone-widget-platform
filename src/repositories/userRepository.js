const pool = require('../db/pool');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  return result.rows[0] || null;
}

async function create({ id, email, passwordHash }) {
  const result = await pool.query(
    'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, created_at',
    [id, email, passwordHash],
  );
  return result.rows[0];
}

module.exports = { findByEmail, create };
