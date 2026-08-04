module.exports = function rateLimiter({ windowMs = 60_000, max = 120 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) buckets.set(key, { startedAt: now, count: 1 });
    else if (++bucket.count > max) return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests', requestId: req.requestId } });
    next();
  };
};
