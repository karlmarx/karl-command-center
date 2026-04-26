'use client';

import { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';

interface Run {
  repo: string;
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
  error?: string;
}

export default function CIStatus() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ci-status');
      const data = await res.json();
      setRuns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (run: Run) => {
    if (run.status === 'in_progress' || run.status === 'queued') {
      return <Clock size={16} className="text-blue-400 animate-pulse" />;
    }
    if (run.conclusion === 'success') {
      return <CheckCircle2 size={16} className="text-emerald-400" />;
    }
    if (run.conclusion === 'failure') {
      return <XCircle size={16} className="text-red-400" />;
    }
    return <Play size={16} className="text-zinc-500" />;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg">
          <Play size={20} className="text-blue-500" />
          CI Status
        </div>
        <button 
          onClick={fetchRuns}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && runs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {runs.map((run, idx) => (
            <div 
              key={run.repo + idx} 
              className="bg-zinc-800/30 border border-zinc-800/50 p-4 rounded-lg hover:bg-zinc-800/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-100 font-medium text-sm">{run.repo}</span>
                <a 
                  href={run.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              
              {run.error ? (
                <div className="text-red-400 text-[10px]">{run.error}</div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run)}
                    <span className="text-zinc-400 text-xs truncate max-w-[140px]">
                      {run.name || 'Workflow'}
                    </span>
                  </div>
                  <span className="text-zinc-600 text-[10px]">
                    {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
