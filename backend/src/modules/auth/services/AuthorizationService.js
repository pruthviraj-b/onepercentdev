class AuthorizationService {
  hasRole(identity, role) { return identity?.roles?.includes(role) || false; }
  hasPermission(identity, permission) { return identity?.permissions?.includes(permission) || false; }
}

module.exports = AuthorizationService;
