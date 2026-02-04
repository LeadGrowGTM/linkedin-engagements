function errorHandler(err, req, res, _next) {
  console.error(`[${req.method} ${req.path}]`, err.message || err);

  // Supabase errors
  if (err.code && err.details) {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      details: err.message,
    });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    details: err.details || null,
  });
}

module.exports = { errorHandler };
