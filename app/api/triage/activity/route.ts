import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "100", 10),
    500,
  );
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("triage_events")
    .select("id, ts, kind, email_id, from_addr, subject, tool_name, payload, cost_usd")
    .order("ts", { ascending: false })
    .limit(limit);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data ?? [], {
    headers: { "cache-control": "no-store" },
  });
}
