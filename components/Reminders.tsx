'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      const data = await res.json();
      setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newReminder }),
      });
      const data = await res.json();
      setReminders([data, ...reminders]);
      setNewReminder('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReminder = async (id: number, completed: boolean) => {
    try {
      await fetch('/api/reminders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed }),
      });
      setReminders(reminders.map(r => r.id === id ? { ...r, completed: !completed } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg mb-4">
        <Bell size={20} className="text-yellow-400" />
        Reminders
      </div>

      <form onSubmit={addReminder} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newReminder}
          onChange={(e) => setNewReminder(e.target.value)}
          placeholder="New reminder..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-all"
        />
        <button 
          type="submit"
          className="bg-yellow-400 text-black rounded-lg p-2 hover:bg-yellow-300 transition-colors"
        >
          <Plus size={18} />
        </button>
      </form>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">No reminders</div>
      ) : (
        <ul className="space-y-2 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
          {reminders.map((reminder) => (
            <li 
              key={reminder.id} 
              className="group flex items-center gap-3 bg-zinc-800/30 border border-zinc-800/50 p-3 rounded-lg hover:border-zinc-700 transition-all"
            >
              <button 
                onClick={() => toggleReminder(reminder.id, !!reminder.completed)}
                className="text-zinc-500 hover:text-yellow-400 transition-colors shrink-0"
              >
                {reminder.completed ? (
                  <CheckCircle2 size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} />
                )}
              </button>
              <span className={`flex-1 text-sm ${reminder.completed ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                {reminder.text}
              </span>
              <button 
                onClick={() => deleteReminder(reminder.id)}
                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
