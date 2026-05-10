'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';
import VLMStatus from '@/components/VLMStatus';

type Sub = {
  name: string;
  url: string;
  status: 'up' | 'down';
  latency: number | null;
};

// order: higher = higher in the grid. Tiers: 3 daily, 2 apps, 1 infra, 0 unknown, -1 legacy.
// Within the same tier, items sort alphabetically by label.
const SUBDOMAIN_META: Record<string, { icon: string; label: string; order: number }> = {
  command:    { icon: '🎛️', label: 'Command Center', order: 3 },
  nfit:       { icon: '💪', label: 'NWB Fitness', order: 3 },
  nyoga:      { icon: '🧘', label: 'NWB Yoga', order: 3 },
  ortho:      { icon: '🦴', label: 'Ortho Appt', order: 3 },
  pwbpb:      { icon: '🏓', label: 'PWB Pickleball', order: 3 },
  mom:        { icon: '💌', label: "Mom's Hub", order: 3 },
  layover:    { icon: '✈️', label: 'Layover', order: 3 },

  progress:   { icon: '📈', label: 'Progress', order: 2 },
  auto:       { icon: '🗺️', label: 'Auto Map', order: 2 },
  contact:    { icon: '✉️', label: 'Contact', order: 2 },
  id:         { icon: '🪪', label: 'Identity Verify', order: 2 },

  ha:         { icon: '🏡', label: 'Home Assistant', order: 1 },
  house:      { icon: '🏠', label: 'House Tracker', order: 1 },
  root:       { icon: '🏠', label: '93.fyi (apex)', order: 1 },
  www:        { icon: '🌐', label: 'WWW', order: 1 },

  me:         { icon: '👤', label: 'Me', order: 0 },
  login:      { icon: '🔐', label: 'Login', order: 0 },
  todo:       { icon: '☑️', label: 'Todo', order: 0 },
  now:        { icon: '⏱️', label: 'Now', order: 0 },
  status:     { icon: '🔔', label: 'Status', order: 0 },
  seed:       { icon: '🌱', label: 'Seed', order: 0 },
  thumbfit:   { icon: '👍', label: 'ThumbFit', order: 0 },
  thumbyoga:  { icon: '🤸', label: 'ThumbYoga', order: 0 },

  ta:         { icon: '🛹', label: 'TrickAdvisor (legacy)', order: -1 },
  bedbug:     { icon: '🪲', label: 'Bedbug', order: -1 },
  fake:       { icon: '🎭', label: 'Fake', order: -1 },
};

function getMeta(name: string): { icon: string; label: string; order: number } {
  // dev.* prefixed records resolve to their parent's identity with a "(dev)" tag,
  // and one tier below the parent so dev versions cluster under prod.
  const isDev = name.startsWith('dev.');
  const key = isDev ? name.slice(4) : name;
  const m = SUBDOMAIN_META[key];
  if (m) return { icon: m.icon, label: isDev ? `${m.label} (dev)` : m.label, order: isDev ? m.order - 0.5 : m.order };
  return { icon: '🌐', label: name, order: -2 };
}

export default function StatusGrid() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/subdomains', { cache: 'no-store' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubs(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 300_000);
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchStatus]);

  const upCount = subs.filter((s) => s.status === 'up').length;
  const downCount = subs.length - upCount;

  return (
    <div className="min-h-[100dvh] bg-black text-zinc-200 flex flex-col">
      <header className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-900 px-5 py-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity size={22} className="text-emerald-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Status</h1>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            aria-label="Refresh"
            className="p-2 -m-2 text-zinc-400 active:text-emerald-400 disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="mt-1.5 text-xs text-zinc-500 font-mono">
          {loading
            ? 'loading…'
            : error
              ? <span className="text-red-400">error</span>
              : <>
                  <span className="text-emerald-400">{upCount} up</span>
                  {downCount > 0 && <> · <span className="text-red-400">{downCount} down</span></>}
                  {lastUpdated && <> · {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>}
                </>
          }
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-[max(env(safe-area-inset-bottom),1rem)] space-y-2.5">
        <VLMStatus />
        {error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-red-400">
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[...subs]
              .map((s) => ({ s, meta: getMeta(s.name) }))
              .sort((a, b) => b.meta.order - a.meta.order || a.meta.label.localeCompare(b.meta.label))
              .map(({ s, meta }) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-950 border border-zinc-900 active:bg-zinc-900 active:border-emerald-500/40 transition-colors min-h-[68px]"
                  >
                    <span aria-hidden className="shrink-0 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900/70">
                      {meta.icon}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-zinc-100 text-base font-medium truncate">{meta.label}</span>
                      <span className="text-[11px] text-zinc-500 font-mono truncate">
                        {s.name}
                        {s.latency != null && <> · {s.latency}ms</>}
                      </span>
                    </div>
                    <span
                      aria-label={s.status}
                      className={`shrink-0 w-3 h-3 rounded-full ${
                        s.status === 'up'
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                          : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                      }`}
                    />
                  </a>
                </li>
              ))}
            {loading && subs.length === 0 && (
              Array.from({ length: 6 }).map((_, i) => (
                <li key={`skel-${i}`} className="h-[68px] rounded-xl bg-zinc-950 border border-zinc-900 animate-pulse" />
              ))
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
