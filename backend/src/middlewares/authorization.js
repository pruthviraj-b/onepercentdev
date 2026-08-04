module.exports = function authorization(predicate) {
  return (req, res, next) => {
    if (typeof predicate !== 'function' || predicate(req)) return next();
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden', requestId: req.requestId } });
  };
};
