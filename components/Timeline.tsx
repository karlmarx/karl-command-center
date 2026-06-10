'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import type { TimelineEvent, TimelineResponse, TimelineSource } from '@/lib/timeline/types';

const TZ = 'America/New_York';

const SOURCE_META: Record<TimelineSource, { label: string; color: string }> = {
  github: { label: 'GitHub', color: 'text-blue-400 border-blue-400/30' },
  todoist: { label: 'Todoist', color: 'text-red-400 border-red-400/30' },
  location: { label: 'Where', color: 'text-emerald-400 border-emerald-400/30' },
  vercel: { label: 'Vercel', color: 'text-zinc-300 border-zinc-500/40' },
};

function dayKey(ts: string): string {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: TZ });
}

function dayLabel(key: string): string {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString());
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function timeLabel(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
}

export default function Timeline() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [storyAvailable, setStoryAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(3);

  const fetchTimeline = useCallback(async (d: number) => {
    try {
      const res = await fetch(`/api/timeline?days=${d}`, { cache: 'no-store' });
      const body = await res.json();
      if (body.error) throw new Error(body.error);
      setData(body);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStory = useCallback(async () => {
    try {
      const res = await fetch('/api/timeline/story', { cache: 'no-store' });
      if (res.status === 503) {
        setStoryAvailable(false);
        return;
      }
      const body = await res.json();
      setStory(body.story ?? null);
    } catch {
      setStory(null);
    }
  }, []);

  useEffect(() => {
    fetchTimeline(days);
  }, [days, fetchTimeline]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  const groups = new Map<string, TimelineEvent[]>();
  for (const ev of data?.events ?? []) {
    const key = dayKey(ev.ts);
    const list = groups.get(key);
    if (list) list.push(ev);
    else groups.set(key, [ev]);
  }

  return (
    <div className="space-y-6">
      {storyAvailable && story && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-2">
            <Sparkles size={18} className="text-amber-400" />
            Today&apos;s story
          </div>
          <p className="text-zinc-300 leading-relaxed">{story}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => {
                setLoading(true);
                setDays(d);
              }}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                days === d
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                  : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <div className="hidden md:flex gap-2">
              {(Object.keys(SOURCE_META) as TimelineSource[]).map((s) => {
                const status = data.sources[s];
                return (
                  <span
                    key={s}
                    title={status?.ok ? `${status.count} events` : status?.error}
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      status?.ok ? SOURCE_META[s].color : 'text-zinc-600 border-zinc-800 line-through'
                    }`}
                  >
                    {SOURCE_META[s].label}
                  </span>
                );
              })}
            </div>
          )}
          <button
            onClick={() => {
              setLoading(true);
              fetchTimeline(days);
              fetchStory();
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-zinc-500 text-center py-12">Loading…</div>
      ) : error ? (
        <div className="text-red-400 text-sm text-center py-12">{error}</div>
      ) : groups.size === 0 ? (
        <div className="text-zinc-500 text-center py-12">No events in this window</div>
      ) : (
        Array.from(groups.entries()).map(([key, events]) => (
          <section key={key}>
            <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3 sticky top-0 bg-black py-2">
              {dayLabel(key)}
              <span className="ml-2 text-zinc-700">{events.length}</span>
            </h2>
            <ul className="space-y-1 border-l border-zinc-800 ml-2">
              {events.map((ev) => {
                const meta = SOURCE_META[ev.source];
                const inner = (
                  <div className="flex items-start gap-3 pl-4 py-2 -ml-px border-l border-transparent hover:border-zinc-600 hover:bg-zinc-900/50 rounded-r-lg transition-colors">
                    <span className="text-base leading-6 shrink-0 w-6 text-center">{ev.icon ?? '•'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-zinc-200 text-sm font-medium">{ev.title}</span>
                        <span className={`text-[10px] px-1.5 rounded border ${meta.color}`}>{meta.label}</span>
                        <span className="text-[11px] text-zinc-600">{timeLabel(ev.ts)}</span>
                      </div>
                      {ev.detail && (
                        <p className="text-zinc-500 text-xs mt-0.5 truncate">{ev.detail}</p>
                      )}
                    </div>
                    {ev.url && <ExternalLink size={13} className="text-zinc-700 shrink-0 mt-1.5" />}
                  </div>
                );
                return (
                  <li key={ev.id}>
                    {ev.url ? (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="block">
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
