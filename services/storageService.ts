
import { Session } from "../types";

const STORAGE_KEY = 'savvy_sessions_v1';

export const getSessions = (): Session[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSession = (session: Session) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const deleteSession = (id: string) => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const togglePublishSession = (id: string) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index >= 0) {
    sessions[index].isPublic = !sessions[index].isPublic;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
};
