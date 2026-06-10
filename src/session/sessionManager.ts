import config from '../utils/config';
import logger from '../utils/logger';

export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Session {
  id: string; // WhatsApp number
  history: MessageHistory[];
  lastActive: number;
}

export class SessionManager {
  private sessions: Map<string, Session>;
  private maxHistory: number;
  private ttlMs: number;

  constructor() {
    this.sessions = new Map<string, Session>();
    this.maxHistory = config.session.maxHistoryMessages;
    this.ttlMs = config.session.ttlMinutes * 60 * 1000;
  }

  getSession(id: string): Session {
    this.cleanupOldSessions();
    
    let session = this.sessions.get(id);
    if (!session) {
      session = {
        id,
        history: [],
        lastActive: Date.now()
      };
      this.sessions.set(id, session);
      logger.info(`Created new session for ${id}`);
    } else {
      session.lastActive = Date.now();
    }
    
    return session;
  }

  addMessage(id: string, role: 'user' | 'assistant', content: string): void {
    const session = this.getSession(id);
    
    session.history.push({
      role,
      content,
      timestamp: Date.now()
    });
    
    if (session.history.length > this.maxHistory) {
      // Keep only the most recent messages (from the end of the array)
      session.history = session.history.slice(-this.maxHistory);
    }
    
    this.sessions.set(id, session);
  }

  getHistory(id: string): MessageHistory[] {
    const session = this.getSession(id);
    return session.history;
  }

  resetSession(id: string): void {
    this.sessions.delete(id);
    logger.info(`Reset session for ${id}`);
  }

  private cleanupOldSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.ttlMs) {
        this.sessions.delete(id);
        logger.info(`Cleaned up expired session for ${id}`);
      }
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
