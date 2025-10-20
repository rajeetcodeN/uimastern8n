import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'rag_session_id';

export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
}

export class SessionManager {
  private static instance: SessionManager;
  private currentSession: SessionData | null = null;

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private loadSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentSession = {
          sessionId: parsed.sessionId,
          createdAt: new Date(parsed.createdAt),
          lastActivity: new Date(parsed.lastActivity)
        };
      }
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
      this.createNewSession();
    }
  }

  private saveSession(): void {
    if (this.currentSession) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          sessionId: this.currentSession.sessionId,
          createdAt: this.currentSession.createdAt.toISOString(),
          lastActivity: this.currentSession.lastActivity.toISOString()
        }));
      } catch (error) {
        console.warn('Failed to save session to localStorage:', error);
      }
    }
  }

  public getSessionId(): string {
    if (!this.currentSession) {
      this.createNewSession();
    }
    return this.currentSession!.sessionId;
  }

  public createNewSession(): string {
    const newSessionId = uuidv4();
    this.currentSession = {
      sessionId: newSessionId,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.saveSession();
    return newSessionId;
  }

  public updateActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      this.saveSession();
    }
  }

  public getSessionInfo(): SessionData | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
}

export const sessionManager = SessionManager.getInstance();
