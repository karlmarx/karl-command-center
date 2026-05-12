export function workerEnv() {
  const base = process.env.TRIAGE_WORKER_URL;
  const secret = process.env.TRIAGE_WORKER_SECRET;
  if (!base || !secret) {
    throw new Error("TRIAGE_WORKER_URL and TRIAGE_WORKER_SECRET must be set");
  }
  return { base: base.replace(/\/$/, ""), secret };
}

export function authHeaders(secret: string): HeadersInit {
  return { authorization: `Bearer ${secret}` };
}
