const express = require('express');
const config = require('./config');
const authRoutes = require('./routes/auth');
const widgetRoutes = require('./routes/widgets');
const publicCors = require('./middleware/publicCors');
const submissionRoutes = require('./routes/submissions');
const { ipLimiter, widgetLimiter } = require('./middleware/rateLimit');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use('/submissions', publicCors, ipLimiter, widgetLimiter, submissionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/widgets', widgetRoutes);

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
