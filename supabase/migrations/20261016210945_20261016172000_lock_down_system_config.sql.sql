/*
# Lock down system configuration secrets

1. Purpose
- Prevent API credentials stored in `system_config` from being readable or writable through the browser-facing data API.

2. Existing Table
- `system_config` remains unchanged and continues to store server-only key/value configuration.
- No columns are added, removed, renamed, or retyped.

3. Security Changes
- Remove all public and authenticated CRUD policies from `system_config`.
- The Edge Function continues to access this table through the server service role, which bypasses row-level security.

4. Important Notes
- This migration preserves all existing configuration rows.
- The browser does not need direct access to this table because configuration is consumed by the server function.
*/

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_config" ON public.system_config;
DROP POLICY IF EXISTS "anon_insert_config" ON public.system_config;
DROP POLICY IF EXISTS "anon_update_config" ON public.system_config;
DROP POLICY IF EXISTS "anon_delete_config" ON public.system_config;
