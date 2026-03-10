require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const { errorHandler } = require('./middleware/error-handler');
const profilesRouter = require('./routes/profiles');
const scrapeRouter = require('./routes/scrape');
const engagersRouter = require('./routes/engagers');
const postsRouter = require('./routes/posts');
const searchRouter = require('./routes/search');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json({ limit: '10mb' }));

// Public endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'linkedin-dashboard-api',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health',
      'POST /api/profiles',
      'GET  /api/profiles',
      'GET  /api/profiles/:profileUrl',
      'PATCH /api/profiles/:profileUrl',
      'DELETE /api/profiles/:profileUrl',
      'POST /api/scrape/posts',
      'POST /api/scrape/engagers',
      'POST /api/scrape/pipeline',
      'POST /api/scrape/direct',
      'GET  /api/engagers',
      'GET  /api/engagers/:profileUrl',
      'GET  /api/posts',
      'GET  /api/search',
      'GET  /api/export/engagers',
    ],
  });
});

app.get('/api/health', async (req, res) => {
  const { supabase } = require('./lib/supabase');
  try {
    const { error } = await supabase.from('linkedin_profiles').select('id').limit(1);
    res.json({
      status: error ? 'degraded' : 'healthy',
      supabase: error ? `error: ${error.message}` : 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({ status: 'unhealthy', supabase: err.message, timestamp: new Date().toISOString() });
  }
});

// Protected endpoints
app.use(authenticate);
app.use('/api/profiles', profilesRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/engagers', engagersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/search', searchRouter);
app.use('/api/export', exportRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`LinkedIn Dashboard API running on port ${PORT}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? 'configured' : 'NOT SET'}`);
  console.log(`API keys: ${(process.env.API_KEYS || '').split(',').filter(Boolean).length} configured`);
});
