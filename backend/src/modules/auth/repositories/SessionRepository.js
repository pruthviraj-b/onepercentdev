class SessionRepository {
  async listByUser() { return []; }
  async revoke() { return { revoked: true }; }
  async revokeAll() { return { revoked: true }; }
}

module.exports = SessionRepository;
