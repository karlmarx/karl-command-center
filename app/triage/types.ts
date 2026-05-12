export interface ActivityEvent {
  id: string;
  ts: number;
  kind:
    | "poll.start"
    | "poll.skip"
    | "poll.match"
    | "triage.start"
    | "triage.tool"
    | "triage.done"
    | "triage.error"
    | "budget.exceeded"
    | "limit.exceeded";
  emailId?: string;
  from?: string;
  subject?: string;
  toolName?: string;
  toolInput?: unknown;
  toolResult?: { ok: boolean; result?: unknown; error?: string };
  message?: string;
  usage?: { input_tokens: number; output_tokens: number };
  costUsd?: number;
}

export interface Budget {
  date: string;
  spentUsd: number;
  triageCount: number;
}
