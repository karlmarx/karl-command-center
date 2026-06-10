import Link from 'next/link';
import Timeline from '@/components/Timeline';

export const metadata = {
  title: 'Timeline — Command Center',
};

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-6 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Command Center
          </Link>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mt-2">Timeline</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Everything that happened — places, tasks, commits, deploys — in one feed.
          </p>
        </header>
        <Timeline />
      </div>
    </div>
  );
}
