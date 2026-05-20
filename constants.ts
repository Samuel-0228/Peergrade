
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
  '#7c83ff', // Indigo 400
  '#14b8a6', // Teal 500
  '#38bdf8', // Sky 400
  '#22c55e', // Green 500
  '#f59e0b', // Amber 500
  '#f97316', // Orange 500
  '#a78bfa', // Violet 400
];

export const CHART_COLORS_MAP = {
  indigo: '#6366f1',
  slate: '#475569',
  border: '#1e293b'
};
