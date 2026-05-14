import { Client } from "pg";

const URL = process.env.NWB_POSTGRES_URL;

// Counts + 7d/30d windows in one query. workout_sessions.user_id is the
// email (per nwb-plan/db/schema.sql), so direct lookup with parameterized
// binding -- SQL injection-safe.
const QUERY = `
SELECT
  COUNT(*)::int                                  AS total_workouts,
  MAX(started_at)::bigint                        AS last_workout_at_ms,
  COUNT(*) FILTER (
    WHERE started_at >= (extract(epoch from now() - interval '7 days') * 1000)::bigint
  )::int                                         AS workouts_last_7d,
  COUNT(*) FILTER (
    WHERE started_at >= (extract(epoch from now() - interval '30 days') * 1000)::bigint
  )::int                                         AS workouts_last_30d
FROM workout_sessions
WHERE user_id = $1
`;

export async function lookupUserActivity(email: string) {
  if (!URL) throw new Error("NWB_POSTGRES_URL not configured");

  const client = new Client({ connectionString: URL });
  await client.connect();
  try {
    const { rows } = await client.query(QUERY, [email]);
    const r = (rows[0] ?? {}) as {
      total_workouts?: number;
      last_workout_at_ms?: string | number | null;
      workouts_last_7d?: number;
      workouts_last_30d?: number;
    };
    const lastMs = r.last_workout_at_ms ? Number(r.last_workout_at_ms) : null;
    const last30 = Number(r.workouts_last_30d ?? 0);
    return {
      email,
      total_workouts: Number(r.total_workouts ?? 0),
      last_workout_at: lastMs ? new Date(lastMs).toISOString() : null,
      workouts_last_7d: Number(r.workouts_last_7d ?? 0),
      workouts_last_30d: last30,
      is_active_user: last30 > 0,
    };
  } finally {
    await client.end();
  }
}
