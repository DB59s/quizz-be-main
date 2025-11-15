/**
 * In-memory session store for quiz generation
 * Stores partial responses and allows chunked retrieval
 */
class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Create a new session
   * @param {string} sessionId - Unique session ID
   * @param {Object} data - Session data
   * @returns {Object} Created session
   */
  createSession(sessionId, data) {
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      status: 'pending', // pending, processing, completed, error
      ...data
    };

    this.sessions.set(sessionId, session);
    console.log(`[SessionStore] Created session: ${sessionId}`);
    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session or null if not found
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (session) {
      session.lastAccessedAt = Date.now();
      return session;
    }

    return null;
  }

  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated session or null
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);

    if (!session) {
      return null;
    }

    Object.assign(session, updates);
    session.lastAccessedAt = Date.now();

    this.sessions.set(sessionId, session);
    console.log(`[SessionStore] Updated session: ${sessionId}`);
    return session;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`[SessionStore] Deleted session: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessedAt > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SessionStore] Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get all active sessions count
   * @returns {number} Number of active sessions
   */
  getActiveSessionsCount() {
    return this.sessions.size;
  }
}

module.exports = new SessionStore();
