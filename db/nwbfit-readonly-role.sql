-- Read-only Neon role for the /api/mcp `lookup_nwbfit_user_activity` tool.
--
-- Run against the nwb-plan PRODUCTION database (neondb) as an admin role
-- (e.g. neondb_owner), either via psql:
--     psql "<neondb_owner connection string>" -f db/nwbfit-readonly-role.sql
-- or by pasting into the Neon SQL Editor.
--
-- The role can ONLY SELECT from workout_sessions. Combined with the read-only
-- transaction the endpoint already wraps every query in
-- (lib/triage-adapters/nwbfit.ts), this is defense in depth: a leaked
-- MCP_BEARER_TOKEN can read one table and nothing else.

-- 1. Set a real password first:  openssl rand -base64 24
CREATE ROLE nwbfit_readonly WITH LOGIN PASSWORD 'CHANGE_ME_BEFORE_RUNNING';

-- 2. Minimal grants: connect, see the schema, read the one table.
GRANT CONNECT ON DATABASE neondb                 TO nwbfit_readonly;
GRANT USAGE   ON SCHEMA   public                 TO nwbfit_readonly;
GRANT SELECT  ON TABLE    public.workout_sessions TO nwbfit_readonly;

-- 3. Verify (expect t, then f):
--   SELECT has_table_privilege('nwbfit_readonly', 'public.workout_sessions', 'SELECT');
--   SELECT has_table_privilege('nwbfit_readonly', 'public.workout_sessions', 'INSERT');
--
-- To rotate later:
--   ALTER ROLE nwbfit_readonly WITH PASSWORD '<new>';
-- To revoke entirely:
--   DROP ROLE nwbfit_readonly;  -- (REVOKE the grants first if it complains)
