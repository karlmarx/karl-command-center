export type EventKind =
  | "poll.start"
  | "poll.skip"
  | "poll.match"
  | "triage.start"
  | "triage.tool"
  | "triage.done"
  | "triage.incomplete"
  | "triage.error"
  | "budget.exceeded";

export interface ActivityEvent {
  id: string;
  ts: string;
  kind: EventKind;
  email_id: string | null;
  from_addr: string | null;
  subject: string | null;
  tool_name: string | null;
  payload: Record<string, unknown>;
  cost_usd: number | null;
}

export interface Budget {
  date: string;
  spent_usd: number;
  triage_count: number;
}

export const DAILY_CAP_USD = 1.0;
export const DAILY_COUNT_CAP = 50;
