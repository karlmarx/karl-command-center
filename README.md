# karl-command-center

Personal operations dashboard at **command.93.fyi**, gated by Cloudflare Access. Next.js 16 App Router, deployed on Vercel. The full design spec lives in `karl-infra/infra/command-center.md`.

## Routes

| Route | What it shows |
|---|---|
| `/` | Home grid — GitHub PRs, reminders, subdomain health, CI status, links to Timeline and Triage |
| `/timeline` | **Activity timeline** — unified chronological feed of place visits (where.93.fyi), completed Todoist tasks, GitHub activity, and Vercel deploys, plus an AI-written "daily story" |
| `/status` | Mobile-first PWA status grid (subdomains + VLM pipeline) |
| `/triage` | Email triage dashboard (reads from Supabase, written by the Mac-local runner) |

## Timeline

The timeline aggregates four sources server-side (`lib/timeline/`), with per-source error isolation — a missing token or a down service degrades that source only, never the feed.

| Source | Endpoint | Env var |
|---|---|---|
| GitHub activity | `api.github.com/users/$GITHUB_USER/events` | `GITHUB_TOKEN` (+ optional `GITHUB_USER`, default `karlmarx`) |
| Todoist completed tasks | `api.todoist.com/api/v1/tasks/completed/by_completion_date` | `TODOIST_API_TOKEN` |
| Place visits | `where.93.fyi/api/visits` (falls back to `/api/location` `today_places` until the worker update ships) | — (optional `WHERE_BASE_URL`) |
| Vercel deploys | `api.vercel.com/v6/deployments` | `VERCEL_TOKEN` |

The **daily story** (`/api/timeline/story?date=YYYY-MM-DD`) sends the day's events to Claude and returns a 2-4 sentence second-person narrative. Requires `ANTHROPIC_API_KEY`; model defaults to `claude-opus-4-8`, override with `TIMELINE_STORY_MODEL`. Day boundaries use `TIMELINE_TZ` (default `America/New_York`).

## Environment variables

```
GITHUB_TOKEN=            # GitHub PRs card + timeline
TODOIST_API_TOKEN=       # timeline (completed tasks)
VERCEL_TOKEN=            # timeline (deploys)
ANTHROPIC_API_KEY=       # daily story (optional — story card hides without it)
TIMELINE_STORY_MODEL=    # optional, default claude-opus-4-8
TIMELINE_TZ=             # optional, default America/New_York
WHERE_BASE_URL=          # optional, default https://where.93.fyi
SUPABASE_URL=            # triage dashboard
SUPABASE_SERVICE_ROLE_KEY=
```

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

Deploys automatically on push to `main` via Vercel.
