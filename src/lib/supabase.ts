import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drakpjckolwbjbgaorvp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYWtwamNrb2x3YmpiZ2FvcnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNTUxODIsImV4cCI6MjEwNzczMTE4Mn0.MUqc7REwUR5LvW_VdW0r-4fsLrkatIantxp1L4i_W6M';

export const supabaseEnvConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _supabase: SupabaseClient | null = null;

if (supabaseEnvConfigured) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

const noopError = {
  message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
} as Error;

function noopResult() {
  return Promise.resolve({ data: null, error: noopError, count: null, status: 0, statusText: '' });
}

const noopQueryProxy = new Proxy(
  noopResult,
  {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve(noopResult());
        }
        if (prop === 'catch') {
          return () => noopResult();
        }
        if (prop === 'finally') {
          return (cb: () => void) => { cb(); return noopResult(); };
        }
      }
      return () => noopQueryProxy;
    },
  }
);

export const supabase: SupabaseClient = _supabase
  ? _supabase
  : (new Proxy(
      {} as SupabaseClient,
      {
        get(_target, prop) {
          if (prop === 'channel' || prop === 'removeChannel') {
            if (prop === 'channel') {
              return () => ({
                on: () => ({ subscribe: () => {} }),
                subscribe: () => {},
              });
            }
            return () => {};
          }
          return () => noopQueryProxy;
        },
      }
    ) as unknown as SupabaseClient);
