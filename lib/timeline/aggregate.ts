import type { SourceStatus, TimelineEvent, TimelineResponse, TimelineSource } from './types';
import { fetchGitHubEvents } from './sources/github';
import { fetchTodoistCompleted } from './sources/todoist';
import { fetchLocationEvents } from './sources/location';
import { fetchVercelDeployments } from './sources/vercel';

const ADAPTERS: Record<TimelineSource, (since: Date) => Promise<TimelineEvent[]>> = {
  github: fetchGitHubEvents,
  todoist: fetchTodoistCompleted,
  location: fetchLocationEvents,
  vercel: fetchVercelDeployments,
};

/** Aggregate all sources with per-source error isolation — one bad token never kills the feed. */
export async function getTimeline(days: number): Promise<TimelineResponse> {
  const since = new Date(Date.now() - days * 86_400_000);
  const names = Object.keys(ADAPTERS) as TimelineSource[];

  const results = await Promise.allSettled(names.map((name) => ADAPTERS[name](since)));

  const events: TimelineEvent[] = [];
  const sources = {} as Record<TimelineSource, SourceStatus>;

  names.forEach((name, i) => {
    const r = results[i];
    if (r.status === 'fulfilled') {
      sources[name] = { ok: true, count: r.value.length };
      events.push(...r.value);
    } else {
      sources[name] = {
        ok: false,
        count: 0,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    }
  });

  events.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  return { events, sources, generatedAt: new Date().toISOString() };
}
