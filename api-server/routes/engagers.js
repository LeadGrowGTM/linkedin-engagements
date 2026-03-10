const { Router } = require('express');
const { supabase } = require('../lib/supabase');
const { computeLeadScore } = require('../lib/lead-scoring');
const { deliverToWebhook, formatLeadPayload } = require('../lib/webhook');
const { validate } = require('../middleware/validate');
const { engagerQuerySchema } = require('../schemas/engagers');

const router = Router();

// GET /api/engagers - Get engagers with webhook delivery
router.get('/', validate(engagerQuerySchema, 'query'), async (req, res, next) => {
  try {
    const {
      parent_profile, days, min_score, lead_status,
      industry, location, limit, offset,
      webhook, include_data,
    } = req.validated;

    // Build query
    let query = supabase.from('enriched_profiles').select('*');

    if (parent_profile) {
      query = query.eq('parent_profile', parent_profile);
    }

    // Time range filter (only if days specified)
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte('created_at', cutoff.toISOString());
    }

    if (industry) query = query.ilike('company_industry', `%${industry}%`);
    if (location) query = query.ilike('location', `%${location}%`);

    query = query.order('created_at', { ascending: false });

    const { data: engagers, error } = await query;
    if (error) throw error;

    // Compute lead scores
    const scored = (engagers || []).map(e => {
      const score = computeLeadScore(e);
      return { ...e, ...score };
    });

    // Apply score filters (post-query since scores are computed)
    let filtered = scored;
    if (min_score !== undefined) {
      filtered = filtered.filter(e => e.lead_score >= min_score);
    }
    if (lead_status) {
      filtered = filtered.filter(e => e.lead_status === lead_status);
    }

    // Paginate
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    // Determine webhook URLs
    let webhookUrls = [];
    if (webhook) {
      webhookUrls = [webhook];
    } else if (parent_profile) {
      // Look up profile's stored webhooks
      const { data: profile } = await supabase
        .from('linkedin_profiles')
        .select('webhooks')
        .eq('profile_url', parent_profile)
        .maybeSingle();

      if (profile && Array.isArray(profile.webhooks)) {
        webhookUrls = profile.webhooks.filter(u => u && u.trim());
      }
    }

    // Deliver to webhooks (only if webhooks are configured)
    let webhookResults = null;
    if (webhookUrls.length > 0) {
      webhookResults = { total_sent: 0, successful: 0, failed: 0, errors: [] };

      for (const engager of page) {
        const payload = formatLeadPayload(engager, {
          lead_score: engager.lead_score,
          lead_status: engager.lead_status,
        });

        for (const url of webhookUrls) {
          webhookResults.total_sent++;
          const result = await deliverToWebhook(url, payload);
          if (result.success) {
            webhookResults.successful++;
          } else {
            webhookResults.failed++;
            webhookResults.errors.push(
              `${engager.full_name || engager.profile_url}: ${result.error}`
            );
          }
        }
      }

      // Cap errors in response
      if (webhookResults.errors.length > 10) {
        webhookResults.errors = webhookResults.errors.slice(0, 10);
        webhookResults.errors.push('... and more');
      }
    }

    const formatEngager = (e) => ({
      profile_url: e.profile_url,
      full_name: e.full_name,
      headline: e.headline,
      company_name: e.company_name,
      company_industry: e.company_industry,
      company_size: e.company_size,
      location: e.location,
      connections: e.connections,
      followers: e.followers,
      lead_score: e.lead_score,
      lead_status: e.lead_status,
      engagement_type: e.engagement_type,
      parent_profile: e.parent_profile,
      created_at: e.created_at,
    });

    const response = {
      success: true,
      count: total,
      page_size: page.length,
      offset,
      data: page.map(formatEngager),
    };

    if (webhookUrls.length > 0) {
      response.webhook_urls = webhookUrls;
      response.webhook_results = webhookResults;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// GET /api/engagers/:profileUrl - Single engager detail
router.get('/:profileUrl', async (req, res, next) => {
  try {
    const profileUrl = decodeURIComponent(req.params.profileUrl);

    const { data: engager, error } = await supabase
      .from('enriched_profiles')
      .select('*')
      .eq('profile_url', profileUrl)
      .maybeSingle();

    if (error) throw error;
    if (!engager) {
      return res.status(404).json({ success: false, error: 'Engager not found' });
    }

    const score = computeLeadScore(engager);

    // Get engagement history
    const { data: engagements } = await supabase
      .from('post_engagements')
      .select('post_url, post_text, engagement_type, created_at')
      .eq('engager_profile_url', profileUrl)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      data: {
        ...engager,
        ...score,
        engagements: engagements || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
