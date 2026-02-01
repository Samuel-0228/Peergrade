
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
  '#6366f1', // Indigo 500
  '#a855f7', // Purple 500
  '#ec4899', // Pink 500
  '#f43f5e', // Rose 500
  '#10b981', // Emerald 500
  '#3b82f6', // Blue 500
  '#eab308', // Yellow 500
  '#f97316', // Orange 500
];

export const CHART_COLORS_MAP = {
  indigo: '#6366f1',
  slate: '#475569',
  border: '#1e293b'
};
