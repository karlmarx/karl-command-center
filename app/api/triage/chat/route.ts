import { authHeaders, workerEnv } from "@/lib/triage-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { base, secret } = workerEnv();
  const body = await req.text();
  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { ...authHeaders(secret), "content-type": "application/json" },
    body,
  });
  return new Response(res.body, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
