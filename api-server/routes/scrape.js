const { Router } = require('express');
const { supabase } = require('../lib/supabase');
const { scrapePosts } = require('../lib/apify');
const { processEngagers, runFullPipeline, savePosts } = require('../lib/pipeline');

const router = Router();

// POST /api/scrape/posts - Scrape posts for one or all enabled profiles
router.post('/posts', async (req, res, next) => {
  try {
    const { profile_url, limit = 3, min_date } = req.body;

    let profiles;
    if (profile_url) {
      profiles = [{ profile_url }];
    } else {
      const { data, error } = await supabase
        .from('linkedin_profiles')
        .select('profile_url')
        .eq('is_enabled', true);
      if (error) throw error;
      profiles = data || [];
    }

    if (profiles.length === 0) {
      return res.json({ success: true, message: 'No enabled profiles found', results: [] });
    }

    const results = [];
    for (const profile of profiles) {
      try {
        const rawPosts = await scrapePosts(profile.profile_url, { limit, minDate: min_date });
        const saved = await savePosts(rawPosts, profile.profile_url);
        results.push({
          profile_url: profile.profile_url,
          posts_scraped: saved.length,
        });
      } catch (err) {
        results.push({
          profile_url: profile.profile_url,
          error: err.message,
        });
      }
    }

    const totalPosts = results.reduce((sum, r) => sum + (r.posts_scraped || 0), 0);

    res.json({
      success: true,
      profiles_processed: profiles.length,
      total_posts_scraped: totalPosts,
      results,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/engagers - Scrape engagers for pending posts
router.post('/engagers', async (req, res, next) => {
  try {
    const { post_url, profile_url } = req.body;

    const options = {};
    if (post_url) options.postUrls = [post_url];
    if (profile_url) options.profileUrl = profile_url;

    const result = await processEngagers(options);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/pipeline - Full pipeline: scrape posts + engagers + enrich for a single profile
router.post('/pipeline', async (req, res, next) => {
  try {
    const { profile_url, limit = 5, min_date } = req.body;

    if (!profile_url) {
      return res.status(400).json({ success: false, error: 'profile_url is required' });
    }

    const result = await runFullPipeline(profile_url, { limit, minDate: min_date });

    res.json({
      success: true,
      profile_url,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scrape/direct - Scrape recent posts for a single profile (kept for backward compat)
router.post('/direct', async (req, res, next) => {
  try {
    const { profile_url, limit = 3, min_date } = req.body;

    if (!profile_url) {
      return res.status(400).json({ success: false, error: 'profile_url is required' });
    }

    const rawPosts = await scrapePosts(profile_url, { limit, minDate: min_date });
    const saved = await savePosts(rawPosts, profile_url);

    // Map to the existing response format
    res.json({
      success: true,
      profile_url,
      post_count: saved.length,
      has_recent_posts: saved.length > 0,
      posts: saved.map(p => ({
        post_url: p.post_url,
        post_text: p.post_text,
        posted_at: p.posted_at_timestamp,
        post_type: null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
