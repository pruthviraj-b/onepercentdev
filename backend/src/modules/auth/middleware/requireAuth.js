const TokenService = require('../services/TokenService');

function createRequireAuth({ supabase, hasSupabaseConfig, isProduction }) {
  const tokenService = new TokenService({ supabase });
  return async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization || '';
    if (hasSupabaseConfig && authorization.startsWith('Bearer ')) {
      const identity = await tokenService.verifyAccessToken(authorization.slice(7));
      if (identity) {
        req.auth = identity;
        req.userId = identity.userId;
        req.userEmail = identity.email;
        return next();
      }
    }

    // Compatibility path for the current local-development API contract.
    if (!isProduction && process.env.ALLOW_INSECURE_DEV_AUTH !== 'false') {
      const userId = String(req.headers['x-user-id'] || 'local');
      req.auth = { userId, email: String(req.headers['x-user-email'] || ''), provider: 'legacy-header', roles: ['student'] };
      req.userId = userId;
      req.userEmail = req.auth.email;
      return next();
    }
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'A valid bearer token is required', requestId: req.requestId } });
  };
}

module.exports = createRequireAuth;
