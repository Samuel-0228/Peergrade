import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck, Database, Loader2, Send, Heart, ArrowUpRight, BarChart3, Sparkles, Activity, UploadCloud, Cpu, LineChart as LineChartIcon } from 'lucide-react';
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:px-8 xl:max-w-screen-2xl">
      {/* Aesthetic Hero Section */}
      <header className="fade-up relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a]/90 via-[#1e1b4b]/80 to-[#0f172a]/90 px-6 py-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md md:px-12 md:py-24">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[30rem] h-[30rem] bg-cyan-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.2)] backdrop-blur-sm transition-transform hover:scale-105">
            <Sparkles className="h-4 w-4" />
            AI-Powered Research Intelligence
          </div>
          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-200 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
            Insights at the Speed of Thought.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Transform raw survey data into stunning, interactive visualizations. Discover hidden patterns, compare distributions, and turn feedback into actionable signals instantly.
          </p>
          
          {/* Quick Stats Grid inside Hero */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
              <span className="text-3xl font-bold text-white">{isLoading ? '...' : sessions.length}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-slate-400">Published Reports</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
              <span className="text-3xl font-bold text-white">24/7</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-slate-400">Data Availability</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
              <span className="text-3xl font-bold text-white">100%</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-slate-400">Signal Clarity</span>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="fade-up mt-24 mb-16" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-slate-400">From raw data to beautiful insights in three simple steps.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12 relative">
          {/* Connecting Lines for Desktop */}
          <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent z-0"></div>
          
          <div className="group relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_30px_rgba(56,189,248,0.15)] ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(56,189,248,0.3)] group-hover:ring-sky-400/50">
              <Database className="h-10 w-10 text-sky-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">1. Data Collection</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Gather responses using your preferred tools. Export your survey results or datasets into a structured CSV format.
            </p>
          </div>

          <div className="group relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_30px_rgba(217,70,239,0.15)] ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(217,70,239,0.3)] group-hover:ring-fuchsia-400/50">
              <UploadCloud className="h-10 w-10 text-fuchsia-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">2. Feed to Platform</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Upload the CSV file directly into our web platform. Our engine automatically parses and structures the data for analysis.
            </p>
          </div>

          <div className="group relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] group-hover:ring-emerald-400/50">
              <LineChartIcon className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-white">3. Visualize & Analyze</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Instantly explore vibrant, interactive charts and receive AI-generated summaries that highlight key trends.
            </p>
          </div>
        </div>
      </section>

      {/* Published Sessions Section */}
      <section className="fade-up mt-24 rounded-2xl border border-white/5 bg-[rgba(15,23,42,0.4)] p-6 shadow-2xl backdrop-blur-xl sm:p-10" style={{ animationDelay: '0.2s' }}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Explore Research Sessions</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            {isLoading ? 'Syncing...' : `${sessions.length} Available`}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-32">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-400">Synchronizing research workspace...</p>
          </div>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </section>

      {/* Features Grid */}
      <div className="fade-up mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: '0.3s' }}>
        <div className="col-span-1 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-8 shadow-lg backdrop-blur-sm lg:col-span-2 transition-all hover:border-indigo-500/30">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Cpu className="h-5 w-5 text-indigo-400" /> Built for insight over decoration
          </h3>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Savvy presents collective survey patterns in a format designed for quick comprehension. Every published session emphasizes signal clarity, descriptive summaries, and transparent access to underlying distributions. Our vibrant visualization engine ensures the data is both beautiful and highly readable.
          </p>
        </div>
        <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-white/5 bg-gradient-to-bl from-indigo-900/20 to-slate-900/50 p-8 shadow-lg backdrop-blur-sm transition-all hover:border-fuchsia-500/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Data Trust</p>
            <h3 className="mt-3 flex items-center gap-2 text-lg font-semibold text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Verified Records
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Anonymized response collections with descriptive analytics for internal learning and strategic planning.
            </p>
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20">
            Explore workspace
            <ArrowUpRight className="h-4 w-4" />
          </button>
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
