class SessionService {
  constructor({ repository } = {}) { this.repository = repository; }

  async listSessions(userId) { return this.repository?.listByUser(userId) || []; }
  async revokeSession(userId, sessionId) { return this.repository?.revoke(userId, sessionId); }
  async revokeAll(userId) { return this.repository?.revokeAll(userId); }
}

module.exports = SessionService;
