import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getTimeline } from '@/lib/timeline/aggregate';
import type { TimelineEvent } from '@/lib/timeline/types';

const TZ = process.env.TIMELINE_TZ ?? 'America/New_York';
const MODEL = process.env.TIMELINE_STORY_MODEL ?? 'claude-opus-4-8';

// Per-instance cache; today's story refreshes every 30 min, past days are stable.
const storyCache = new Map<string, { story: string; cachedAt: number }>();
const TODAY_TTL_MS = 30 * 60_000;

const SYSTEM_PROMPT = `You write a 2-4 sentence "daily story" for Karl's personal dashboard from a list of timestamped events (places visited, tasks completed, code shipped, deploys). Write in second person ("You biked to the gym…"), warm but matter-of-fact, past tense for finished things. Weave events into one narrative — don't enumerate them all; pick what made the day. If the day is sparse, keep it to one or two sentences without padding. Output only the story text.`;

function dayKey(ts: string): string {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
}

function eventLine(e: TimelineEvent): string {
  const time = new Date(e.ts).toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${time} [${e.source}] ${e.title}${e.detail ? ` — ${e.detail}` : ''}`;
}

export async function GET(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'story unavailable: ANTHROPIC_API_KEY not set' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const today = dayKey(new Date().toISOString());
  const date = searchParams.get('date') ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  }

  const cached = storyCache.get(date);
  if (cached && (date !== today || Date.now() - cached.cachedAt < TODAY_TTL_MS)) {
    return NextResponse.json({ date, story: cached.story, cached: true });
  }

  try {
    const daysBack = Math.min(
      14,
      Math.max(1, Math.ceil((Date.now() - new Date(`${date}T00:00:00`).getTime()) / 86_400_000) + 1),
    );
    const timeline = await getTimeline(daysBack);
    const dayEvents = timeline.events.filter((e) => dayKey(e.ts) === date);

    if (dayEvents.length === 0) {
      return NextResponse.json({ date, story: null, events: 0 });
    }

    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Events for ${date}:\n${dayEvents.slice().reverse().map(eventLine).join('\n')}`,
        },
      ],
    });

    const story = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    storyCache.set(date, { story, cachedAt: Date.now() });
    return NextResponse.json({ date, story, events: dayEvents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
