
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration.
 * Project ref: zaztjiljqvpmxjcdten
 */

const rawUrl = process.env.SUPABASE_URL || 'https://zaztjiljqvpmxjcdten.supabase.co';
// Recovery logic: Ensure the URL is a valid Supabase endpoint format
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : `https://zaztjiljqvpmxjcdten.supabase.co`;

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphenRqaWxqanF2cG14amNkdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjI0NjcsImV4cCI6MjA3ODQzODQ2N30.kmXhS5DOr-k3Tx_FOGLr7IXa-Df8QtTNaxpzBMU-0JA';

if (!supabaseUrl || supabaseUrl.includes('sb_publishable')) {
  console.error("CRITICAL CONFIG ERROR: The provided Supabase URL appears invalid. Check your Vercel Environment Variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
