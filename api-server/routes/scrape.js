const { Router } = require('express');

const router = Router();

const N8N_POSTS_WEBHOOK = process.env.N8N_SCRAPE_POSTS_WEBHOOK
  || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-posts';
const N8N_ENGAGERS_WEBHOOK = process.env.N8N_SCRAPE_ENGAGERS_WEBHOOK
  || 'https://lgn8nwebhookv2.up.railway.app/hook/linkedin-scrape-engagers';

async function triggerN8n(webhookUrl, extra = {}) {
  const payload = { trigger: 'api', timestamp: new Date().toISOString(), ...extra };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { success: false, status: response.status, error: text || `HTTP ${response.status}` };
  }

  return { success: true, status: response.status };
}

// POST /api/scrape/posts - Trigger Part 1 (post scraping)
router.post('/posts', async (req, res, next) => {
  try {
    const extra = {};
    if (req.body.profile_url) extra.profile_url = req.body.profile_url;

    const result = await triggerN8n(N8N_POSTS_WEBHOOK, extra);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: 'Failed to trigger n8n workflow',
        details: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Post scraping workflow triggered',
      workflow: 'Part 1 - Scrape Profiles',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({
        success: false,
        error: 'n8n webhook timed out',
      });
    }
    next(err);
  }
});

// POST /api/scrape/engagers - Trigger Part 2 (engager scraping)
router.post('/engagers', async (req, res, next) => {
  try {
    const extra = {};
    if (req.body.post_url) extra.post_url = req.body.post_url;

    const result = await triggerN8n(N8N_ENGAGERS_WEBHOOK, extra);

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: 'Failed to trigger n8n workflow',
        details: result.error,
      });
    }

    res.json({
      success: true,
      message: 'Engager scraping workflow triggered',
      workflow: 'Part 2 - Scrape Engagers',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return res.status(504).json({
        success: false,
        error: 'n8n webhook timed out',
      });
    }
    next(err);
  }
});

module.exports = router;
