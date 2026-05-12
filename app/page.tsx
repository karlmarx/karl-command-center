'use client';

import { motion } from 'framer-motion';
import GitHubPRs from '@/components/GitHubPRs';
import Reminders from '@/components/Reminders';
import SubdomainStatus from '@/components/SubdomainStatus';
import CIStatus from '@/components/CIStatus';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-400 font-sans p-6 md:p-12 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-4xl font-bold text-zinc-100 tracking-tight"
            >
              Command Center
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500 mt-2"
            >
              Welcome back, Karl. Everything is running smoothly.
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-right"
          >
            <div className="text-sm font-medium text-zinc-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </motion.div>
        </header>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={item} className="lg:col-span-2 lg:row-span-2">
            <GitHubPRs />
          </motion.div>
          
          <motion.div variants={item} className="lg:row-span-2">
            <Reminders />
          </motion.div>

          <motion.div variants={item}>
            <SubdomainStatus />
          </motion.div>

          <motion.div variants={item}>
            <CIStatus />
          </motion.div>

          <motion.div variants={item}>
            <a
              href="/triage"
              className="block bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/60 rounded-xl p-6 transition-colors min-h-[200px] flex flex-col justify-between"
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-emerald-400 mb-2">
                  New
                </div>
                <div className="text-lg font-semibold text-zinc-100">
                  Email Triage
                </div>
                <p className="text-sm text-zinc-500 mt-2">
                  Mac-local runner triages Gmail via MCP. Allowlisted, budget-capped, writes to Supabase.
                </p>
              </div>
              <div className="text-xs text-zinc-600 mt-4">Open dashboard →</div>
            </a>
          </motion.div>
        </motion.div>
      </div>
      
      <footer className="mt-12 text-center text-zinc-600 text-xs">
        Karl's Command Center &bull; v1.0.0 &bull; Built with Next.js & Framer Motion
      </footer>
    </div>
  );
}
