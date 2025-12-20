
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration.
 * Using the corrected project ref: zaztjiljjqvpmxjcdten
 */

const supabaseUrl = 'https://zaztjiljjqvpmxjcdten.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphenRqaWxqanF2cG14amNkdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjI0NjcsImV4cCI6MjA3ODQzODQ2N30.kmXhS5DOr-k3Tx_FOGLr7IXa-Df8QtTNaxpzBMU-0JA';

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
