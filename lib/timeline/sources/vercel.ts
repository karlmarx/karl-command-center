import type { TimelineEvent } from '../types';

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  createdAt: number; // ms
  meta?: { githubCommitMessage?: string };
}

export async function fetchVercelDeployments(since: Date): Promise<TimelineEvent[]> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN not set');

  const res = await fetch(`https://api.vercel.com/v6/deployments?limit=100&since=${since.getTime()}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Vercel API ${res.status}`);

  const data = (await res.json()) as { deployments: VercelDeployment[] };
  const events: TimelineEvent[] = [];

  for (const d of data.deployments ?? []) {
    if (d.createdAt < since.getTime()) continue;
    if (d.state !== 'READY' && d.state !== 'ERROR') continue;
    events.push({
      id: `vercel:${d.uid}`,
      source: 'vercel',
      ts: new Date(d.createdAt).toISOString(),
      icon: d.state === 'READY' ? '🚀' : '🔥',
      title: d.state === 'READY' ? `Deployed ${d.name}` : `Deploy failed: ${d.name}`,
      detail: d.meta?.githubCommitMessage?.split('\n')[0],
      url: `https://${d.url}`,
    });
  }

  return events;
}
