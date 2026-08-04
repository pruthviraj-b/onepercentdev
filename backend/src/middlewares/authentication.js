module.exports = function authentication(req, res, next) {
  if (req.userId) return next();
  return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required', requestId: req.requestId } });
};
