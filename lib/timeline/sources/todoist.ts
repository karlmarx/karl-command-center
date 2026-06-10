import type { TimelineEvent } from '../types';

interface TodoistCompletedItem {
  id: string;
  content: string;
  completed_at: string;
  project_id?: string;
}

const COMPLETED_URL = 'https://api.todoist.com/api/v1/tasks/completed/by_completion_date';

export async function fetchTodoistCompleted(since: Date): Promise<TimelineEvent[]> {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) throw new Error('TODOIST_API_TOKEN not set');

  const events: TimelineEvent[] = [];
  let cursor: string | null = null;

  // Cursor-paginated; the endpoint caps the window at 3 months, far beyond our range.
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      since: since.toISOString(),
      until: new Date().toISOString(),
      limit: '100',
    });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${COMPLETED_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Todoist API ${res.status}`);

    const body = (await res.json()) as { items: TodoistCompletedItem[]; next_cursor: string | null };
    for (const item of body.items ?? []) {
      events.push({
        id: `todoist:${item.id}:${item.completed_at}`,
        source: 'todoist',
        ts: item.completed_at,
        icon: '✅',
        title: 'Completed task',
        detail: item.content,
      });
    }
    cursor = body.next_cursor;
    if (!cursor) break;
  }

  return events;
}
