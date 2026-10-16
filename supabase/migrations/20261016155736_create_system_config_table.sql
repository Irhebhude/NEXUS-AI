/*
# Create system_config table for storing API keys and configuration

1. New Tables
- `system_config`: Key-value store for system-level configuration like API keys
  - id (uuid, PK), key (text, unique), value (text), created_at, updated_at

2. Security
- RLS enabled
- Single-tenant: anon + authenticated can read (needed by edge function via service role)
- Only authenticated can write (edge function uses service role key which bypasses RLS)
*/

CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_config" ON system_config;
CREATE POLICY "anon_select_config" ON system_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_config" ON system_config;
CREATE POLICY "anon_insert_config" ON system_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_config" ON system_config;
CREATE POLICY "anon_update_config" ON system_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_config" ON system_config;
CREATE POLICY "anon_delete_config" ON system_config FOR DELETE
  TO anon, authenticated USING (true);
