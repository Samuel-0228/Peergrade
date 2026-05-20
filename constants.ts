
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
  '#ff007a', // Vibrant Pink
  '#7928ca', // Deep Purple
  '#00dfd8', // Cyan
  '#f5a623', // Bright Orange
  '#10b981', // Emerald Green
  '#3b82f6', // Bright Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#14b8a6', // Teal
];

export const CHART_COLORS_MAP = {
  indigo: '#6366f1',
  slate: '#475569',
  border: '#1e293b'
};
