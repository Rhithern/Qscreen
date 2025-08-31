import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase = createSupabaseClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const createClient = () => {
  return createSupabaseClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const createServiceClient = () => {
  return createSupabaseClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export const createAnonClient = () => {
  return createSupabaseClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
