const API_KEYS = (process.env.API_KEYS || '').split(',').filter(Boolean);

function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || !API_KEYS.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      hint: 'Include x-api-key header with a valid API key',
    });
  }

  next();
}

module.exports = { authenticate };
