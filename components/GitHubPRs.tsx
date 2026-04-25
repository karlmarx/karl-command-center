'use client';

import { useEffect, useState } from 'react';
import { GitPullRequest, ExternalLink, RefreshCw } from 'lucide-react';

export default function GitHubPRs() {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github-prs');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg">
          <GitPullRequest size={20} className="text-blue-400" />
          GitHub PRs
        </div>
        <button 
          onClick={fetchPRs}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && prs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{error}</div>
      ) : prs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">No open PRs</div>
      ) : (
        <ul className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
          {prs.map((pr) => (
            <li key={pr.id} className="group border-b border-zinc-800 pb-3 last:border-0">
              <a 
                href={pr.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:bg-zinc-800/50 p-2 rounded-lg transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-200 text-sm font-medium line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">
                    {pr.title}
                  </span>
                  <ExternalLink size={14} className="text-zinc-600 shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    {pr.repo}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(pr.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
