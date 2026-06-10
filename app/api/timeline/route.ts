import { NextResponse } from 'next/server';
import { getTimeline } from '@/lib/timeline/aggregate';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(14, Math.max(1, Number(searchParams.get('days')) || 3));

  try {
    const timeline = await getTimeline(days);
    return NextResponse.json(timeline);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
