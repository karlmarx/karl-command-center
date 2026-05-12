import { authHeaders, workerEnv } from "@/lib/triage-env";

export const dynamic = "force-dynamic";

export async function POST() {
  const { base, secret } = workerEnv();
  const res = await fetch(`${base}/trigger`, {
    method: "POST",
    headers: authHeaders(secret),
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
