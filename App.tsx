import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck, Database, Loader2, Send, Heart, ArrowUpRight, BarChart3, Sparkles, Activity } from 'lucide-react';
import Navbar from './components/Navbar';
import SessionList from './components/SessionList';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import SessionDashboard from './components/SessionDashboard';
import SupportChatbot from './components/SupportChatbot';
import { storageService } from './services/storageService';
import { AuthState, Session } from './types';

const Home: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const data = await storageService.getPublicSessions();
      setSessions(data);
      setIsLoading(false);
    };

    fetchSessions();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <header className="fade-up relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(17,24,39,0.72)] px-6 py-8 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:px-8 md:py-10">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_58%)]" />
        <div className="relative grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Modern research workspace
            </div>
            <h1 className="max-w-4xl text-4xl font-academic font-semibold tracking-tight text-white md:text-6xl">
              Insight infrastructure for faster academic decisions.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
              Review published research sessions through a calm, structured interface built for scanning patterns, comparing distributions, and turning raw responses into usable signals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                <BarChart3 className="h-4 w-4 text-indigo-300" />
                Research summaries, charts, and exports
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                <Activity className="h-4 w-4 text-indigo-300" />
                Signal-first dashboards for published sessions
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Collections</p>
                <p className="mt-2 font-mono-academic text-3xl font-semibold text-white">{isLoading ? '...' : sessions.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Visibility</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Published and ready for review</p>
              </div>
              <div className="col-span-2 rounded-lg border border-white/10 bg-[#0f172a]/70 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">System note</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Each session is organized as a compact analytics workspace with visual comparisons, key findings, and downloadable source data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="fade-up mt-6" style={{ animationDelay: '0.08s' }}>
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-indigo-300" />
            <h2 className="text-xl font-academic font-semibold tracking-tight text-white">Published research sessions</h2>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {isLoading ? 'Syncing' : `${sessions.length} available`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[rgba(17,24,39,0.48)] py-20">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-500">Synchronizing research sessions...</p>
          </div>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </section>

      <div className="fade-up mt-6 grid grid-cols-12 gap-6" style={{ animationDelay: '0.16s' }}>
        <div className="col-span-12 rounded-xl border border-white/10 bg-[rgba(17,24,39,0.72)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.2)] lg:col-span-8">
          <h3 className="text-lg font-academic font-semibold text-white">Built for insight over decoration</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Savvy presents collective survey patterns in a format designed for quick comprehension. Every published session emphasizes signal clarity, descriptive summaries, and transparent access to underlying distributions.
          </p>
        </div>
        <div className="col-span-12 rounded-xl border border-white/10 bg-[rgba(17,24,39,0.72)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.2)] lg:col-span-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Data trust</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-indigo-200">
            <ShieldCheck className="h-4 w-4" />
            Verified institutional records
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Anonymized response collections with descriptive analytics for internal learning and planning.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
            Explore workspace
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[rgba(11,15,20,0.78)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-300" />
            <span className="font-academic text-lg font-semibold tracking-tight text-white">Savvy Research</span>
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            © {new Date().getFullYear()} Savvy Research. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <a
            href="https://t.me/savvy_society"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-5 py-3 text-sm text-indigo-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/35 hover:bg-indigo-500/20"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.18em]">Join our Telegram channel</span>
          </a>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
            Real-time updates on institutional research
          </p>
        </div>

        <div className="text-center md:text-right">
          <p className="mb-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 md:justify-end">
            Built with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> by
          </p>
          <p className="font-academic text-sm font-semibold tracking-tight text-indigo-200">
            Savvy Society Team
          </p>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('savvy_auth');
    return saved ? JSON.parse(saved) : { isAdmin: false, email: null };
  });

  const handleLogin = (email: string) => {
    const newState = { isAdmin: true, email };
    setAuth(newState);
    localStorage.setItem('savvy_auth', JSON.stringify(newState));
  };

  const handleLogout = () => {
    const newState = { isAdmin: false, email: null };
    setAuth(newState);
    localStorage.removeItem('savvy_auth');
  };

  return (
    <Router>
      <div className="app-shell flex min-h-screen flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar isAdmin={auth.isAdmin} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={auth.isAdmin ? <Navigate to="/admin" /> : <AdminLogin onLogin={handleLogin} />} />
            <Route path="/admin" element={auth.isAdmin ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/session/:id" element={<SessionDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <SupportChatbot />
      </div>
    </Router>
  );
};

export default App;
