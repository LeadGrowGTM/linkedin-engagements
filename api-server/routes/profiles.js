const { Router } = require('express');
const { supabase } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { createProfileSchema, updateProfileSchema } = require('../schemas/profiles');

const router = Router();

// POST /api/profiles - Add profile
router.post('/', validate(createProfileSchema), async (req, res, next) => {
  try {
    const { profile_url, webhooks, description, category, is_enabled } = req.validated;

    // Check if already exists
    const { data: existing } = await supabase
      .from('linkedin_profiles')
      .select('profile_url')
      .eq('profile_url', profile_url)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Profile already exists',
        profile_url,
      });
    }

    const { data, error } = await supabase
      .from('linkedin_profiles')
      .insert({
        profile_url,
        webhooks,
        Webhook: webhooks[0] || null, // Legacy column
        description,
        category,
        is_enabled,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/profiles - List profiles
router.get('/', async (req, res, next) => {
  try {
    let query = supabase
      .from('linkedin_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.enabled === 'true') query = query.eq('is_enabled', true);
    if (req.query.enabled === 'false') query = query.eq('is_enabled', false);
    if (req.query.category) query = query.eq('category', req.query.category);

    const { data: profiles, error } = await query;
    if (error) throw error;

    // Get counts per profile
    const profileUrls = profiles.map(p => p.profile_url);

    const { data: postCounts } = await supabase
      .from('linkedin_posts')
      .select('profile_url')
      .in('profile_url', profileUrls);

    const { data: engagerCounts } = await supabase
      .from('enriched_profiles')
      .select('parent_profile')
      .in('parent_profile', profileUrls);

    const postCountMap = {};
    (postCounts || []).forEach(p => {
      postCountMap[p.profile_url] = (postCountMap[p.profile_url] || 0) + 1;
    });

    const engagerCountMap = {};
    (engagerCounts || []).forEach(e => {
      engagerCountMap[e.parent_profile] = (engagerCountMap[e.parent_profile] || 0) + 1;
    });

    const data = profiles.map(p => ({
      ...p,
      post_count: postCountMap[p.profile_url] || 0,
      engager_count: engagerCountMap[p.profile_url] || 0,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/profiles/:profileUrl - Single profile
router.get('/:profileUrl', async (req, res, next) => {
  try {
    const profileUrl = decodeURIComponent(req.params.profileUrl);

    const { data: profile, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('profile_url', profileUrl)
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    const { count: postCount } = await supabase
      .from('linkedin_posts')
      .select('*', { count: 'exact', head: true })
      .eq('profile_url', profileUrl);

    const { count: engagerCount } = await supabase
      .from('enriched_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('parent_profile', profileUrl);

    res.json({
      success: true,
      data: { ...profile, post_count: postCount || 0, engager_count: engagerCount || 0 },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/profiles/:profileUrl - Update profile
router.patch('/:profileUrl', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const profileUrl = decodeURIComponent(req.params.profileUrl);
    const updates = { ...req.validated };

    // Keep legacy Webhook column in sync
    if (updates.webhooks) {
      updates.Webhook = updates.webhooks[0] || null;
    }

    const { data, error } = await supabase
      .from('linkedin_profiles')
      .update(updates)
      .eq('profile_url', profileUrl)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/profiles/:profileUrl
router.delete('/:profileUrl', async (req, res, next) => {
  try {
    const profileUrl = decodeURIComponent(req.params.profileUrl);

    const { data, error } = await supabase
      .from('linkedin_profiles')
      .delete()
      .eq('profile_url', profileUrl)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, message: 'Profile deleted', profile_url: profileUrl });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
