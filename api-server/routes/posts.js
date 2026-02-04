const { Router } = require('express');
const { supabase } = require('../lib/supabase');

const router = Router();

// GET /api/posts - List posts
router.get('/', async (req, res, next) => {
  try {
    let query = supabase
      .from('linkedin_posts')
      .select('*')
      .order('posted_at_timestamp', { ascending: false });

    if (req.query.profile_url) {
      query = query.eq('profile_url', req.query.profile_url);
    }
    if (req.query.status) {
      query = query.eq('status', req.query.status.toUpperCase());
    }

    const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
    const offset = parseInt(req.query.offset) || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: (data || []).length, data: data || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
