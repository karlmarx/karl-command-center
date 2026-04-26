import { NextResponse } from 'next/server';

// In-memory mock for Vercel deployment (Vercel has read-only filesystem)
let reminders = [
  { id: 1, text: 'Analyze photo-memory catalog', completed: 0, createdAt: new Date().toISOString() },
  { id: 2, text: 'Check command.93.fyi deployment', completed: 1, createdAt: new Date().toISOString() },
  { id: 3, text: 'Gemma-4 local testing', completed: 0, createdAt: new Date().toISOString() }
];

export async function GET() {
  return NextResponse.json(reminders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const newReminder = {
      id: Date.now(),
      text,
      completed: 0,
      createdAt: new Date().toISOString()
    };
    reminders = [newReminder, ...reminders];
    return NextResponse.json(newReminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed } = body;
    reminders = reminders.map(r => r.id === id ? { ...r, completed: completed ? 1 : 0 } : r);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    reminders = reminders.filter(r => r.id.toString() !== id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
