import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const db = supabaseAdmin();
  const today = todayUtc();
  const { data, error } = await db
    .from("triage_budget")
    .select("date, spent_usd, triage_count")
    .eq("date", today)
    .maybeSingle();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(
    data ?? { date: today, spent_usd: 0, triage_count: 0 },
    { headers: { "cache-control": "no-store" } },
  );
}
