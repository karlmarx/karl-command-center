import type { TimelineEvent } from '../types';

const WHERE_BASE = process.env.WHERE_BASE_URL ?? 'https://where.93.fyi';

interface Visit {
  name: string;
  type?: string;
  icon?: string | null;
  start_ts: number; // unix seconds
  end_ts: number;
}

const PLACE_ICONS: Record<string, string> = {
  home: '🏠', gym: '💪', yoga: '🧘', pilates: '🤸', work: '💼', food: '🍽️',
  coffee: '☕', bar: '🍸', store: '🛍️', park: '🌳', school: '🎓', dental: '🦷',
  ortho: '🦴', doctor: '🩺', pickleball: '🏓', tennis: '🎾', beach: '🏖️',
  pool: '🏊', place: '📍',
};

function fmtDwell(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Place visits from where.93.fyi. Prefers the /api/visits endpoint
 * (timestamped segments); falls back to /api/location's today_places
 * (ordered names, no timestamps) until the worker update is deployed.
 */
export async function fetchLocationEvents(since: Date): Promise<TimelineEvent[]> {
  const visits = await fetchVisits();
  if (visits !== null) {
    return visits
      .filter((v) => v.end_ts * 1000 >= since.getTime())
      .map((v) => {
        const dwellMin = Math.round((v.end_ts - v.start_ts) / 60);
        return {
          id: `location:${v.name}:${v.start_ts}`,
          source: 'location' as const,
          ts: new Date(v.start_ts * 1000).toISOString(),
          icon: v.icon || PLACE_ICONS[v.type ?? 'place'] || PLACE_ICONS.place,
          title: `Arrived at ${v.name}`,
          detail: dwellMin >= 1 ? `${fmtDwell(dwellMin)} there` : undefined,
        };
      });
  }
  return fetchTodayPlacesFallback();
}

async function fetchVisits(): Promise<Visit[] | null> {
  try {
    const res = await fetch(`${WHERE_BASE}/api/visits`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { visits?: Visit[] };
    return Array.isArray(body.visits) ? body.visits : null;
  } catch {
    return null;
  }
}

async function fetchTodayPlacesFallback(): Promise<TimelineEvent[]> {
  const res = await fetch(`${WHERE_BASE}/api/location`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`where.93.fyi ${res.status}`);
  const d = (await res.json()) as {
    active?: boolean;
    place?: { name: string; icon?: string | null; type?: string } | null;
    today_places?: string[];
  };

  const events: TimelineEvent[] = [];
  const now = new Date().toISOString();
  if (d.today_places && d.today_places.length > 1) {
    events.push({
      id: `location:path:${d.today_places.join('>')}`,
      source: 'location',
      ts: now,
      icon: '🗺️',
      title: "Today's path",
      detail: d.today_places.join(' → '),
    });
  }
  if (d.active && d.place) {
    events.push({
      id: `location:now:${d.place.name}`,
      source: 'location',
      ts: now,
      icon: d.place.icon || PLACE_ICONS[d.place.type ?? 'place'] || PLACE_ICONS.place,
      title: `Now at ${d.place.name}`,
      url: 'https://where.93.fyi',
    });
  }
  return events;
}
