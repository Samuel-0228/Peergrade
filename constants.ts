
// Helper to safely access environment variables in Vite/Browser environments
const getEnv = (key: string): string | undefined => {
  try {
    // Vite specific check (requires VITE_ prefix for client-side access)
    const viteKey = `VITE_${key}`;
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      if (env[viteKey]) return env[viteKey];
      if (env[key]) return env[key];
    }
    // Standard process.env check
    if (typeof process !== 'undefined' && process.env) {
      return process.env[viteKey] || process.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const ADMIN_CREDENTIALS = {
  email: getEnv('ADMIN_EMAIL') ,
  password: getEnv('ADMIN_PASSWORD') 
};

export const COLORS = [
  '#0ea5e9', // Sky Blue
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
];

export const CHART_COLORS_MAP = {
  indigo: '#6366f1',
  slate: '#475569',
  border: '#1e293b'
};
