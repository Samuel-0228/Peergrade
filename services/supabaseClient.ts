
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration.
 * Environment variables are preferred for deployment, with defaults for development and data continuity.
 */

const getEnv = (key: string): string | undefined => {
  try {
    const viteKey = `VITE_${key}`;
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      if (env[viteKey]) return env[viteKey];
      if (env[key]) return env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[viteKey] || process.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL') ;
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') ;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Diagnostic tool to check if the Supabase REST API is reachable from the current browser environment.
 */
export const checkSupabaseConnectivity = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const start = Date.now();
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: { 'apikey': supabaseAnonKey }
    });
    const latency = Date.now() - start;
    
    if (response.ok) {
      return { ok: true, message: `Connected successfully (${latency}ms).` };
    } else {
      return { ok: false, message: `API responded with status: ${response.status} ${response.statusText}` };
    }
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      return { 
        ok: false, 
        message: "Network Error: 'Failed to fetch'. This usually means the request was blocked by an Adblocker, a VPN, or a Firewall." 
      };
    }
    return { ok: false, message: `Connectivity Error: ${err.message}` };
  }
};
