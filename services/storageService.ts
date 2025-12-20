
import { Session } from '../types';

const STORAGE_KEY = 'savvy_sessions';

export const storageService = {
  getSessions: (): Session[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  getPublicSessions: (): Session[] => {
    return storageService.getSessions().filter(s => s.isPublic);
  },

  getSessionById: (id: string): Session | undefined => {
    return storageService.getSessions().find(s => s.id === id);
  },

  saveSession: (session: Session) => {
    const sessions = storageService.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index !== -1) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  deleteSession: (id: string) => {
    const sessions = storageService.getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  togglePublicStatus: (id: string) => {
    const sessions = storageService.getSessions();
    const session = sessions.find(s => s.id === id);
    if (session) {
      session.isPublic = !session.isPublic;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }
};
