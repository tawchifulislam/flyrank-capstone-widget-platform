const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo-password-123';
const DEMO_WIDGET_ID = 'demo-widget';

const DEMO_FIELDS = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'message', label: 'Message', type: 'textarea', required: true },
];

async function seed() {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    DEMO_EMAIL,
  ]);
  let ownerId;
  if (existing.rows.length > 0) {
    ownerId = existing.rows[0].id;
  } else {
    ownerId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [ownerId, DEMO_EMAIL, passwordHash],
    );
  }
  await pool.query(
    `INSERT INTO widgets (id, owner_id, type, title, description, button_text, fields, display_options)
     VALUES ($1, $2, 'contact', 'Contact us', 'Send us a message', 'Send', $3, '{}')
     ON CONFLICT (id) DO NOTHING`,
    [DEMO_WIDGET_ID, ownerId, JSON.stringify(DEMO_FIELDS)],
  );
  console.log(`Seeded owner ${DEMO_EMAIL} and widget ${DEMO_WIDGET_ID}`);
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
