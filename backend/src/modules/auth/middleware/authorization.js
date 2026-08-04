function requireRole(role) {
  return (req, res, next) => req.auth?.roles?.includes(role)
    ? next()
    : res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Required role is missing', requestId: req.requestId } });
}

function requirePermission(permission) {
  return (req, res, next) => req.auth?.permissions?.includes(permission)
    ? next()
    : res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Required permission is missing', requestId: req.requestId } });
}

function requireSubscription() { return (_req, _res, next) => next(); }
function requireCourseAccess() { return (_req, _res, next) => next(); }
function requireInstructor() { return requireRole('instructor'); }
function requireEnterprise() { return requireRole('enterprise_manager'); }

module.exports = { requireRole, requirePermission, requireSubscription, requireCourseAccess, requireInstructor, requireEnterprise };
