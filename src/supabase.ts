import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const defaultUrl = 'https://bunwfktdkfgcokvvqhwc.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bndma3Rka2ZnY29rdnZxaHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTM3MjAsImV4cCI6MjEwNTAyOTcyMH0.f-D07N_sOT9Rc9P7f38RmSTl3Sd4mvrxbaIaIR7ODRw';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  accessToken: async () => {
    try {
      const user = auth?.currentUser;
      if (!user) return null;
      return await user.getIdToken(false);
    } catch {
      return null;
    }
  },
});

