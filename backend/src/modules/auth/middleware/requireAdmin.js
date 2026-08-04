const crypto = require('crypto');

function createRequireAdmin(adminPassword) {
  return function requireAdmin(req, res, next) {
    const supplied = req.headers['x-admin-password'];
    if (!adminPassword || typeof supplied !== 'string') return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized', requestId: req.requestId } });
    const expectedBuffer = Buffer.from(adminPassword);
    const suppliedBuffer = Buffer.from(supplied);
    if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized', requestId: req.requestId } });
    }
    req.auth = { ...(req.auth || {}), adminAuthenticated: true };
    next();
  };
}

module.exports = createRequireAdmin;
