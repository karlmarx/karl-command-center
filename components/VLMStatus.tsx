'use client';

import { useEffect, useState, useCallback } from 'react';
import { Video, ExternalLink, AlertCircle } from 'lucide-react';

type VLMStatus = {
  ts: string;
  video_count: number;
  gif_count: number;
  exercises: Record<string, number>;
  worker_running: boolean;
  worker_pid: number | null;
  worker_uptime: string | null;
  last_iteration: string | null;
  last_processed: string | null;
  last_log_mtime: string | null;
  ram_available_gb: number;
  ram_percent_used: number;
  delta: {
    first_run?: boolean;
    videos_delta?: number;
    gifs_delta?: number;
    since?: string;
  };
  log_tail: string[];
  gallery_url: string;
};

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function VLMStatus() {
  const [data, setData] = useState<VLMStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/vlm-status.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: VLMStatus = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 300_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !data) {
    return (
      <div className="rounded-xl bg-zinc-950 border border-zinc-900 p-4 h-[120px] animate-pulse" />
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-zinc-950 border border-zinc-900 px-4 py-3.5 flex items-center gap-2 text-zinc-500 text-sm">
        <AlertCircle size={16} className="text-amber-400" />
        VLM status unavailable {error && <span className="font-mono text-xs">({error})</span>}
      </div>
    );
  }

  const dotColor = data.worker_running
    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
    : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
  const dataAge = formatRelative(data.ts);
  const logAge = formatRelative(data.last_log_mtime);
  const exerciseCount = Object.keys(data.exercises).length;
  const sortedExercises = Object.entries(data.exercises).sort((a, b) => b[1] - a[1]);

  const videosDelta = data.delta?.first_run ? null : data.delta?.videos_delta;
  const gifsDelta = data.delta?.first_run ? null : data.delta?.gifs_delta;

  return (
    <div className="rounded-xl bg-zinc-950 border border-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left active:bg-zinc-900 transition-colors"
      >
        <span aria-hidden className="shrink-0 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900/70">
          <Video size={20} className="text-emerald-400" />
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-zinc-100 text-base font-medium">VLM Pipeline</span>
          <span className="text-[11px] text-zinc-500 font-mono truncate">
            {data.video_count} videos
            {videosDelta != null && videosDelta !== 0 && (
              <span className="text-emerald-400"> {videosDelta >= 0 ? '+' : ''}{videosDelta}</span>
            )}
            {' · '}
            {data.gif_count} gifs
            {gifsDelta != null && gifsDelta !== 0 && (
              <span className="text-emerald-400"> {gifsDelta >= 0 ? '+' : ''}{gifsDelta}</span>
            )}
            {' · '}
            data {dataAge}
          </span>
        </div>
        <span aria-label={data.worker_running ? 'running' : 'stopped'} className={`shrink-0 w-3 h-3 rounded-full ${dotColor}`} />
      </button>

      {expanded && (
        <div className="border-t border-zinc-900 px-4 py-3 space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-400 font-mono">
            <div>worker</div>
            <div className="text-zinc-200">
              {data.worker_running ? `up ${data.worker_uptime ?? ''}` : 'STOPPED'}
              {data.worker_pid != null && <span className="text-zinc-500"> · pid {data.worker_pid}</span>}
            </div>
            <div>RAM</div>
            <div className="text-zinc-200">{data.ram_available_gb} GB free · {data.ram_percent_used}% used</div>
            <div>last iter</div>
            <div className="text-zinc-200 truncate">{data.last_iteration ?? '—'}</div>
            <div>last log</div>
            <div className="text-zinc-200">{logAge}</div>
            <div>exercises</div>
            <div className="text-zinc-200">
              {exerciseCount} ({sortedExercises.slice(0, 3).map(([n, c]) => `${n}×${c}`).join(', ')}
              {sortedExercises.length > 3 && ', …'})
            </div>
          </div>

          {data.log_tail.length > 0 && (
            <div className="rounded-lg bg-black border border-zinc-900 p-2.5 max-h-56 overflow-y-auto">
              <pre className="text-[11px] leading-snug font-mono text-zinc-400 whitespace-pre-wrap break-all">
                {data.log_tail.slice(-15).join('\n')}
              </pre>
            </div>
          )}

          <a
            href={data.gallery_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-400 active:text-emerald-300 text-sm"
          >
            Browse gallery <ExternalLink size={13} />
          </a>
        </div>
      )}
    </div>
  );
}
