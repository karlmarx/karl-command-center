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

          {/* Placeholder for future expansion */}
          <motion.div 
            variants={item}
            className="bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-xl p-6 flex items-center justify-center text-zinc-700 min-h-[200px]"
          >
            <span className="text-sm italic">More modules coming soon...</span>
          </motion.div>
        </motion.div>
      </div>
      
      <footer className="mt-12 text-center text-zinc-600 text-xs">
        Karl's Command Center &bull; v1.0.0 &bull; Built with Next.js & Framer Motion
      </footer>
    </div>
  );
}
