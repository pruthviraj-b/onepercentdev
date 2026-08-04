module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      code: err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
      message: status >= 500 ? 'Unexpected server error' : err.message,
      details: err.details,
      requestId: req.requestId,
    },
  });
};
