"use client";

import { useEffect, useState } from "react";
import type { ActivityEvent, EventKind } from "./types";

const KIND_COLORS: Record<EventKind, string> = {
  "poll.start": "text-zinc-500",
  "poll.skip": "text-zinc-600",
  "poll.match": "text-blue-400",
  "triage.start": "text-indigo-400",
  "triage.tool": "text-emerald-400",
  "triage.done": "text-emerald-300",
  "triage.incomplete": "text-amber-400",
  "triage.error": "text-red-400",
  "budget.exceeded": "text-amber-400",
};

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/triage/activity?limit=200", {
          cache: "no-store",
        });
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
    const t = setInterval(tick, 3000);
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
      <div className="max-h-[75vh] overflow-y-auto divide-y divide-zinc-800/50 font-mono text-xs">
        {events.length === 0 && (
          <div className="px-4 py-6 text-zinc-600 italic">
            No activity yet. The Mac runner writes here every minute.
          </div>
        )}
        {events.map((e) => (
          <Row key={e.id} ev={e} />
        ))}
      </div>
    </div>
  );
}

function Row({ ev }: { ev: ActivityEvent }) {
  const time = new Date(ev.ts).toLocaleTimeString("en-US", { hour12: false });
  return (
    <div className="px-4 py-2 hover:bg-zinc-900/60">
      <div className="flex items-baseline gap-2">
        <span className="text-zinc-600 tabular-nums w-20 shrink-0">{time}</span>
        <span className={`w-32 shrink-0 ${KIND_COLORS[ev.kind] ?? "text-zinc-400"}`}>
          {ev.kind}
        </span>
        <span className="text-zinc-300 truncate">{describe(ev)}</span>
      </div>
    </div>
  );
}

function describe(e: ActivityEvent): string {
  if (e.kind === "triage.tool") {
    const result = (e.payload?.result ?? null) as unknown;
    const error = (e.payload?.error ?? null) as string | null;
    const status = error ? `err: ${error}` : "ok";
    return `${e.tool_name} → ${status}${result ? " " + summary(result) : ""}`;
  }
  if (e.kind === "triage.done" || e.kind === "triage.incomplete") {
    const tier = (e.payload?.tier ?? "?") as string;
    const cost =
      e.cost_usd != null ? ` $${Number(e.cost_usd).toFixed(4)}` : "";
    return `[${tier}] ${e.subject ?? "(no subject)"}${cost}`;
  }
  if (e.kind === "poll.match" || e.kind === "triage.start") {
    return `${e.from_addr ?? ""} — ${e.subject ?? ""}`;
  }
  if (e.kind === "poll.skip") {
    const reason = (e.payload?.reason ?? "") as string;
    return `${e.from_addr ?? ""} ${reason ? `(${reason})` : ""}`;
  }
  if (e.kind === "triage.error") {
    const error = (e.payload?.error ?? "") as string;
    return error;
  }
  if (e.kind === "budget.exceeded") {
    return (e.payload?.reason as string) ?? "cap hit";
  }
  return "";
}

function summary(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as Record<string, unknown>;
  if ("url" in r && typeof r.url === "string") return `→ ${r.url}`;
  if ("labeled" in r) return `(${r.labeled})`;
  if ("draft_id" in r) return `(draft)`;
  if ("sid" in r) return `(sms ${r.status})`;
  return "";
}
