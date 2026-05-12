import { authHeaders, workerEnv } from "@/lib/triage-env";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { base, secret } = workerEnv();
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "100";
  const res = await fetch(`${base}/activity?limit=${limit}`, {
    headers: authHeaders(secret),
    cache: "no-store",
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
