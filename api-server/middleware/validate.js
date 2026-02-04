function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, error: 'Validation failed', details });
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
