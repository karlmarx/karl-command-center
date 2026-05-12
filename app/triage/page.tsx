import { ActivityFeed } from "./ActivityFeed";
import { BudgetBar } from "./BudgetBar";
import { TriggerButton } from "./TriggerButton";
import { ChatPanel } from "./ChatPanel";

export const dynamic = "force-dynamic";

export default function TriagePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
              Email Triage
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Event-driven Gmail triage via the MCP gateway. Sender-allowlisted, budget-capped.
            </p>
          </div>
          <TriggerButton />
        </header>

        <BudgetBar />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed />
          <ChatPanel />
        </div>

        <footer className="text-center text-zinc-600 text-xs pt-6">
          Triage worker at <code className="text-zinc-500">triage-worker</code> · Cron every 1 min · Claude Haiku 4.5
        </footer>
      </div>
    </div>
  );
}
