const crypto = require('crypto');

module.exports = function requestContext(req, res, next) {
  req.requestId = String(req.headers['x-request-id'] || crypto.randomUUID());
  req.startedAt = Date.now();
  res.setHeader('x-request-id', req.requestId);
  res.on('finish', () => { req.requestDurationMs = Date.now() - req.startedAt; });
  next();
};
