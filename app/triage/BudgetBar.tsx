"use client";

import { useEffect, useState } from "react";
import type { Budget } from "./types";
import { DAILY_CAP_USD, DAILY_COUNT_CAP } from "./types";

export function BudgetBar() {
  const [b, setB] = useState<Budget | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/triage/budget", { cache: "no-store" });
        if (res.ok && !cancelled) setB(await res.json());
      } catch {
        // ignore
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const spent = Number(b?.spent_usd ?? 0);
  const count = Number(b?.triage_count ?? 0);
  const pctSpend = Math.min(100, (spent / DAILY_CAP_USD) * 100);
  const pctCount = Math.min(100, (count / DAILY_COUNT_CAP) * 100);
  const warn = pctSpend > 75 || pctCount > 75;

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Daily budget</h2>
        <span className="text-xs text-zinc-500">{b?.date ?? "—"} UTC</span>
      </div>
      <Row
        label="spend"
        value={`$${spent.toFixed(4)} / $${DAILY_CAP_USD.toFixed(2)}`}
        pct={pctSpend}
        warn={warn}
      />
      <Row
        label="triages"
        value={`${count} / ${DAILY_COUNT_CAP}`}
        pct={pctCount}
        warn={warn}
      />
    </div>
  );
}

function Row({
  label,
  value,
  pct,
  warn,
}: {
  label: string;
  value: string;
  pct: number;
  warn: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
        <div
          className={`h-full transition-all ${warn ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
