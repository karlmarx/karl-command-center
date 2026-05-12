import { ActivityFeed } from "./ActivityFeed";
import { BudgetBar } from "./BudgetBar";

export const dynamic = "force-dynamic";

export default function TriagePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
            Email Triage
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            A local runner on the Mac Studio reads Gmail via MCP every minute, agents through Claude Opus 4.7, and writes to Supabase. This view is read-only.
          </p>
        </header>

        <BudgetBar />
        <ActivityFeed />

        <footer className="text-center text-zinc-600 text-xs pt-6">
          Runner: <code className="text-zinc-500">karl-infra/services/email-triage</code> · launchd every 60s · Sender-allowlisted, $1/day cap
        </footer>
      </div>
    </div>
  );
}
