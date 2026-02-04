const { Router } = require('express');
const { supabase } = require('../lib/supabase');
const { computeLeadScore } = require('../lib/lead-scoring');

const router = Router();

function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_COLUMNS = [
  'profile_url', 'full_name', 'first_name', 'last_name', 'headline', 'about',
  'company_name', 'company_industry', 'company_size', 'location',
  'connections', 'followers', 'lead_score', 'lead_status',
  'engagement_type', 'engagement_value', 'parent_profile',
  'created_at', 'last_enriched_at',
];

// GET /api/export/engagers - CSV download
router.get('/engagers', async (req, res, next) => {
  try {
    let query = supabase.from('enriched_profiles').select('*');

    if (req.query.parent_profile) {
      query = query.eq('parent_profile', req.query.parent_profile);
    }

    const days = parseInt(req.query.days) || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('created_at', cutoff.toISOString());

    if (req.query.industry) {
      query = query.ilike('company_industry', `%${req.query.industry}%`);
    }
    if (req.query.location) {
      query = query.ilike('location', `%${req.query.location}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: engagers, error } = await query;
    if (error) throw error;

    // Score and filter
    let rows = (engagers || []).map(e => ({ ...e, ...computeLeadScore(e) }));

    if (req.query.min_score) {
      const min = parseInt(req.query.min_score);
      rows = rows.filter(e => e.lead_score >= min);
    }
    if (req.query.lead_status) {
      rows = rows.filter(e => e.lead_status === req.query.lead_status);
    }

    // Build CSV
    const header = CSV_COLUMNS.map(escapeCSV).join(',');
    const lines = rows.map(row =>
      CSV_COLUMNS.map(col => escapeCSV(row[col])).join(',')
    );
    const csv = [header, ...lines].join('\n');

    const filename = `engagers-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
