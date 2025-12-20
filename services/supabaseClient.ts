
import { createClient } from '@supabase/supabase-js';

/**
 * Configure your Supabase credentials.
 * Use environment variables for deployment.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'sb_publishable_vtVEXIfHvh3_lNp7cudJsQ_3iQzrCUc';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphenRqaWxqanF2cG14amNkdGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjI0NjcsImV4cCI6MjA3ODQzODQ2N30.kmXhS5DOr-k3Tx_FOGLr7IXa-Df8QtTNaxpzBMU-0JA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
