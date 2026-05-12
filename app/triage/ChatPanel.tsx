"use client";

import { useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface ChatApiResponse {
  reply: string;
  toolTrace: Array<{ name: string; input: unknown; result: unknown; ok: boolean }>;
  costUsd: number;
}

export function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<ChatApiResponse["toolTrace"]>([]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/triage/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const data = (await res.json()) as ChatApiResponse;
      setMsgs([...next, { role: "assistant", content: data.reply || "(no text)" }]);
      setTrace(data.toolTrace);
    } catch (e) {
      setMsgs([
        ...next,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : String(e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col h-[70vh]">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">MCP gateway chat</h2>
        <p className="text-xs text-zinc-500">Hits the same tools as triage. Drafts are safe; ask before destructive actions.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <div className="text-zinc-600 text-sm italic">
            Try: &ldquo;label the latest unread message from me as triaged/test&rdquo; or &ldquo;list my last 3 messages.&rdquo;
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-zinc-200" : "text-zinc-300"}>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
              {m.role}
            </div>
            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
          </div>
        ))}
        {trace.length > 0 && (
          <details className="text-xs text-zinc-500">
            <summary className="cursor-pointer">tool trace ({trace.length})</summary>
            <pre className="mt-2 overflow-x-auto bg-zinc-950 p-3 rounded border border-zinc-800">
              {JSON.stringify(trace, null, 2)}
            </pre>
          </details>
        )}
      </div>
      <div className="border-t border-zinc-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything..."
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          disabled={busy}
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
        >
          {busy ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
