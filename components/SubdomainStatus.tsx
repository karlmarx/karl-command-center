'use client';

import { useEffect, useState } from 'react';
import { Globe, Activity, AlertCircle } from 'lucide-react';

export default function SubdomainStatus() {
  const [subdomains, setSubdomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/subdomains');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubdomains(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col min-h-[400px]">
      <div className="flex items-center gap-2 text-zinc-100 font-semibold text-lg mb-4">
        <Globe size={20} className="text-emerald-400" />
        Infrastructure Status
      </div>

      {loading && subdomains.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400 text-sm gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subdomains.map((sub) => (
              <a 
                key={sub.name}
                href={sub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-zinc-800/30 border border-zinc-800/50 hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex flex-col">
                  <span className="text-zinc-300 text-xs font-medium truncate max-w-[100px] group-hover:text-zinc-100">
                    {sub.name}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {sub.latency ? `${sub.latency}ms` : '--'}
                  </span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'up' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
