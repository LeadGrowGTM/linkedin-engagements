const { Router } = require('express');
const { supabase } = require('../lib/supabase');

const router = Router();

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2/acts';

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

// POST /api/scrape/direct - Scrape recent posts for a single profile (synchronous)
// Does NOT require the profile to be in the monitoring list.
// Body: { "profile_url": "https://www.linkedin.com/in/...", "limit": 3, "min_date": "2026-01-01" }
// min_date: optional ISO date string — only return posts on or after this date
router.post('/direct', async (req, res, next) => {
  try {
    const { profile_url, limit = 3, min_date } = req.body;
    const minDateFilter = min_date ? new Date(min_date) : null;

    if (!profile_url) {
      return res.status(400).json({ success: false, error: 'profile_url is required' });
    }

    if (!APIFY_TOKEN) {
      return res.status(500).json({ success: false, error: 'APIFY_TOKEN not configured' });
    }

    // Call Apify synchronously
    const url = `${APIFY_BASE}/supreme_coder~linkedin-post/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`;
    const apifyInput = {
      deepScrape: true,
      limitPerSource: Math.min(limit, 10),
      rawData: false,
      urls: [profile_url],
    };
    if (min_date) {
      apifyInput.scrapeUntil = min_date; // e.g. "2026-01-01" — stops scraping at this date
    }
    const apifyRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apifyInput),
    });

    if (!apifyRes.ok) {
      const text = await apifyRes.text().catch(() => '');
      return res.status(502).json({
        success: false,
        error: `Apify scrape failed (${apifyRes.status})`,
        details: text.slice(0, 300),
      });
    }

    const items = await apifyRes.json();

    // Filter out reposts + apply date filter
    const posts = (items || [])
      .filter((item) => item.post_type !== 'repost')
      .filter((item) => {
        if (!minDateFilter || !item.postedAtTimestamp) return true;
        return new Date(item.postedAtTimestamp) >= minDateFilter;
      })
      .slice(0, limit);

    // Save to DB (upsert by post_url)
    const saved = [];
    for (const post of posts) {
      if (!post.url) continue;

      const postId = post.urn ? post.urn.split(':').pop() : null;
      const postedAt = post.postedAtTimestamp
        ? new Date(post.postedAtTimestamp).toISOString()
        : null;

      const record = {
        post_url: post.url,
        profile_url: post.inputUrl || profile_url,
        post_text: post.text || null,
        posted_at_timestamp: postedAt,
        post_id: postId,
        status: 'COMPLETED',
      };

      const { data: existing } = await supabase
        .from('linkedin_posts')
        .select('id')
        .eq('post_url', post.url)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('linkedin_posts')
          .update({ post_text: record.post_text, posted_at_timestamp: postedAt, updated_at: new Date().toISOString() })
          .eq('post_url', post.url);
      } else {
        await supabase.from('linkedin_posts').insert(record);
      }

      saved.push({
        post_url: post.url,
        post_text: post.text || null,
        posted_at: postedAt,
        post_type: post.post_type || null,
      });
    }

    res.json({
      success: true,
      profile_url,
      post_count: saved.length,
      has_recent_posts: saved.length > 0,
      posts: saved,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
