import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseEnvConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _supabase: SupabaseClient | null = null;

if (supabaseEnvConfigured) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

// When env vars are missing, return a no-op client whose query builder
// chain resolves to { data: null, error: <Error> } so callers that check
// `error` fall through to their graceful-failure paths without throwing.
const noopError = {
  message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
} as Error;

function noopResult() {
  return Promise.resolve({ data: null, error: noopError, count: null, status: 0, statusText: '' });
}

// A self-referencing proxy that returns noopResult for any terminal call
// and itself for any chained method.
const noopQueryProxy = new Proxy(
  noopResult,
  {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        // Make it thenable — resolves to the noop result
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
      // Any method call returns the proxy itself (chainable)
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
            // Return no-op functions for realtime methods
            if (prop === 'channel') {
              return () => ({
                on: () => ({ subscribe: () => {} }),
                subscribe: () => {},
              });
            }
            return () => {};
          }
          // .from() and other query starters return the chainable noop proxy
          return () => noopQueryProxy;
        },
      }
    ) as unknown as SupabaseClient);
