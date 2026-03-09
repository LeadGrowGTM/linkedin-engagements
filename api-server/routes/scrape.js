const { Router } = require('express');
const { fork } = require('child_process');
const path = require('path');
const { supabase } = require('../lib/supabase');

const router = Router();

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2/acts';

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const child = fork(scriptPath, [], { silent: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({ success: false, output: stdout, error: stderr || `Exit code ${code}` });
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

// POST /api/scrape/posts - Trigger Part 1 (post scraping)
router.post('/posts', async (req, res, next) => {
  try {
    // Fire and forget -- respond immediately, script runs in background
    const child = fork(path.join(SCRIPTS_DIR, 'scrape-posts.js'), [], { silent: true, detached: true });
    child.unref();

    res.json({
      success: true,
      message: 'Post scraping workflow triggered',
      workflow: 'Part 1 - Scrape Posts',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/engagers - Trigger Part 2+3 (engager scraping + enrichment)
router.post('/engagers', async (req, res, next) => {
  try {
    const child = fork(path.join(SCRIPTS_DIR, 'scrape-engagers.js'), [], { silent: true, detached: true });
    child.unref();

    res.json({
      success: true,
      message: 'Engager scraping workflow triggered',
      workflow: 'Part 2+3 - Scrape Engagers & Enrich',
      triggered_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/direct - Scrape recent posts for a single profile (synchronous)
// Does NOT require the profile to be in the monitoring list.
// Body: { "profile_url": "https://www.linkedin.com/in/...", "limit": 3 }
router.post('/direct', async (req, res, next) => {
  try {
    const { profile_url, limit = 3 } = req.body;

    if (!profile_url) {
      return res.status(400).json({ success: false, error: 'profile_url is required' });
    }

    if (!APIFY_TOKEN) {
      return res.status(500).json({ success: false, error: 'APIFY_TOKEN not configured' });
    }

    // Call Apify synchronously
    const url = `${APIFY_BASE}/supreme_coder~linkedin-post/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`;
    const apifyRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deepScrape: true,
        limitPerSource: Math.min(limit, 10),
        rawData: false,
        urls: [profile_url],
      }),
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

    // Filter out reposts
    const posts = (items || [])
      .filter((item) => item.post_type !== 'repost')
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
