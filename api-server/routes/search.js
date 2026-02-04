const { Router } = require('express');
const { supabase } = require('../lib/supabase');

const router = Router();

// GET /api/search?keyword=...&grouped=true
router.get('/', async (req, res, next) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'keyword query param is required (min 2 characters)',
      });
    }

    const grouped = req.query.grouped === 'true';
    const rpcName = grouped
      ? 'search_engagers_by_keyword_grouped'
      : 'search_engagers_by_keyword';

    const { data, error } = await supabase.rpc(rpcName, {
      search_keyword: keyword.trim(),
    });

    if (error) throw error;

    res.json({
      success: true,
      keyword: keyword.trim(),
      grouped,
      count: (data || []).length,
      data: data || [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
