import { authHeaders, workerEnv } from "@/lib/triage-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const { base, secret } = workerEnv();
  const res = await fetch(`${base}/budget`, {
    headers: authHeaders(secret),
    cache: "no-store",
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
