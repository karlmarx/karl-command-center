export type TimelineSource = 'github' | 'todoist' | 'location' | 'vercel';

export interface TimelineEvent {
  id: string;
  source: TimelineSource;
  ts: string; // ISO 8601
  title: string;
  detail?: string;
  url?: string;
  icon?: string;
}

export interface SourceStatus {
  ok: boolean;
  count: number;
  error?: string;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  sources: Record<TimelineSource, SourceStatus>;
  generatedAt: string;
}
