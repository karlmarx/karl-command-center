"use client";

import { useState } from "react";

export function TriggerButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const trigger = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/triage/trigger", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status}`);
      setMsg("Triggered. Watch the activity feed.");
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={trigger}
        disabled={busy}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {busy ? "Triggering..." : "Trigger triage now"}
      </button>
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
    </div>
  );
}
