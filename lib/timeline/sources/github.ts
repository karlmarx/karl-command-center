import type { TimelineEvent } from '../types';

interface GhCommit {
  sha: string;
  message: string;
}

interface GhEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    commits?: GhCommit[];
    ref_type?: string;
    ref?: string;
    action?: string;
    pull_request?: { title: string; html_url: string; merged?: boolean };
    issue?: { title: string; html_url: string };
    release?: { name?: string; tag_name: string; html_url: string };
  };
}

export async function fetchGitHubEvents(since: Date): Promise<TimelineEvent[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set');
  const user = process.env.GITHUB_USER ?? 'karlmarx';

  const res = await fetch(`https://api.github.com/users/${user}/events?per_page=100`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const data = (await res.json()) as GhEvent[];
  const events: TimelineEvent[] = [];

  for (const ev of data) {
    if (new Date(ev.created_at) < since) continue;
    const repo = ev.repo.name.split('/').pop() ?? ev.repo.name;
    const base = { id: `github:${ev.id}`, source: 'github' as const, ts: ev.created_at };

    switch (ev.type) {
      case 'PushEvent': {
        const commits = ev.payload.commits ?? [];
        if (commits.length === 0) break;
        const head = commits[commits.length - 1];
        events.push({
          ...base,
          icon: '🔨',
          title: commits.length === 1 ? `Pushed to ${repo}` : `Pushed ${commits.length} commits to ${repo}`,
          detail: head.message.split('\n')[0],
          url: `https://github.com/${ev.repo.name}/commit/${head.sha}`,
        });
        break;
      }
      case 'PullRequestEvent': {
        const pr = ev.payload.pull_request;
        if (!pr) break;
        const action = ev.payload.action === 'closed' ? (pr.merged ? 'Merged' : 'Closed') : 'Opened';
        if (ev.payload.action !== 'opened' && ev.payload.action !== 'closed') break;
        events.push({
          ...base,
          icon: action === 'Merged' ? '🟣' : '🔀',
          title: `${action} PR in ${repo}`,
          detail: pr.title,
          url: pr.html_url,
        });
        break;
      }
      case 'IssuesEvent': {
        if (ev.payload.action !== 'opened' || !ev.payload.issue) break;
        events.push({
          ...base,
          icon: '🐛',
          title: `Opened issue in ${repo}`,
          detail: ev.payload.issue.title,
          url: ev.payload.issue.html_url,
        });
        break;
      }
      case 'ReleaseEvent': {
        const rel = ev.payload.release;
        if (!rel) break;
        events.push({
          ...base,
          icon: '🏷️',
          title: `Released ${rel.name || rel.tag_name} in ${repo}`,
          url: rel.html_url,
        });
        break;
      }
      case 'CreateEvent': {
        if (ev.payload.ref_type !== 'repository') break;
        events.push({
          ...base,
          icon: '✨',
          title: `Created repo ${repo}`,
          url: `https://github.com/${ev.repo.name}`,
        });
        break;
      }
    }
  }

  return events;
}
