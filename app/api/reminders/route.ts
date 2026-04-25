import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'reminders.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return db;
}

export async function GET() {
  try {
    const db = getDb();
    const reminders = db.prepare('SELECT * FROM reminders ORDER BY createdAt DESC').all();
    return NextResponse.json(reminders);
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    const db = getDb();
    const info = db.prepare('INSERT INTO reminders (text) VALUES (?)').run(text);
    return NextResponse.json({ id: info.lastInsertRowid, text, completed: 0 });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed } = body;
    const db = getDb();
    db.prepare('UPDATE reminders SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const db = getDb();
    db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
