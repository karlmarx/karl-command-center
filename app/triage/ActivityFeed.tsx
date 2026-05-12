"use client";

import { useEffect, useState } from "react";
import type { ActivityEvent } from "./types";

const KIND_COLORS: Record<ActivityEvent["kind"], string> = {
  "poll.start": "text-zinc-500",
  "poll.skip": "text-zinc-600",
  "poll.match": "text-blue-400",
  "triage.start": "text-indigo-400",
  "triage.tool": "text-emerald-400",
  "triage.done": "text-emerald-300",
  "triage.error": "text-red-400",
  "budget.exceeded": "text-amber-400",
  "limit.exceeded": "text-amber-400",
};

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/triage/activity?limit=200", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = (await res.json()) as ActivityEvent[];
        if (!cancelled) {
          setEvents(data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    };
    tick();
    const t = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Activity</h2>
        <span className="text-xs text-zinc-500">
          {err ? `error: ${err}` : `${events.length} events`}
        </span>
      </div>
      <div className="max-h-[70vh] overflow-y-auto divide-y divide-zinc-800/50 font-mono text-xs">
        {events.length === 0 && (
          <div className="px-4 py-6 text-zinc-600 italic">No activity yet.</div>
        )}
        {events.map((e) => (
          <div key={e.id} className="px-4 py-2 hover:bg-zinc-900/60">
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-600 tabular-nums w-16 shrink-0">
                {new Date(e.ts).toLocaleTimeString("en-US", { hour12: false })}
              </span>
              <span className={`w-32 shrink-0 ${KIND_COLORS[e.kind]}`}>{e.kind}</span>
              <span className="text-zinc-300 truncate">{describe(e)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function describe(e: ActivityEvent): string {
  if (e.kind === "triage.tool") {
    const r = e.toolResult;
    const status = r?.ok ? "ok" : `err: ${r?.error ?? "?"}`;
    return `${e.toolName} → ${status}`;
  }
  if (e.kind === "triage.done") {
    const cost = e.costUsd != null ? ` $${e.costUsd.toFixed(4)}` : "";
    return `${e.subject ?? "(no subject)"}${cost}`;
  }
  if (e.kind === "poll.match" || e.kind === "triage.start") {
    return `${e.from ?? ""} — ${e.subject ?? ""}`;
  }
  if (e.kind === "poll.skip") {
    return `${e.from ?? ""} ${e.message ? `(${e.message})` : ""}`;
  }
  return e.message ?? "";
}
