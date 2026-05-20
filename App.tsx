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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 lg:px-8 xl:max-w-screen-2xl bg-black font-sans">
      {/* Aesthetic Hero Section */}
      <header className="fade-up relative overflow-hidden rounded-none border border-neutral-800 bg-black px-6 py-16 md:px-12 md:py-24">
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-transform hover:bg-neutral-800">
            <Sparkles className="h-4 w-4" />
            AI-Powered Research Intelligence
          </div>
          <h1 className="text-white text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            Insights at the Speed of Thought.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-neutral-400 md:text-xl">
            Transform raw survey data into stunning, interactive visualizations. Discover hidden patterns, compare distributions, and turn feedback into actionable signals instantly.
          </p>
          
          {/* Quick Stats Grid inside Hero */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-none border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:bg-neutral-800">
              <span className="text-3xl font-bold text-white">{isLoading ? '...' : sessions.length}</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Published Reports</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-none border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:bg-neutral-800">
              <span className="text-3xl font-bold text-white">24/7</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Data Availability</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center rounded-none border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:bg-neutral-800">
              <span className="text-3xl font-bold text-white">100%</span>
              <span className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Signal Clarity</span>
            </div>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <section className="fade-up mt-24 mb-16" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-neutral-400">From raw data to beautiful insights in three simple steps.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12 relative">
          {/* Connecting Lines for Desktop */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[1px] bg-neutral-800 z-0"></div>
          
          <div className="group relative z-10 flex flex-col items-center text-center bg-black">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-black border border-neutral-800 transition-colors duration-300 group-hover:bg-white group-hover:text-black text-white">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-white tracking-tight uppercase">1. Data Collection</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              Gather responses using your preferred tools. Export your survey results or datasets into a structured CSV format.
            </p>
          </div>

          <div className="group relative z-10 flex flex-col items-center text-center bg-black">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-black border border-neutral-800 transition-colors duration-300 group-hover:bg-white group-hover:text-black text-white">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-white tracking-tight uppercase">2. Feed to Platform</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              Upload the CSV file directly into our web platform. Our engine automatically parses and structures the data for analysis.
            </p>
          </div>

          <div className="group relative z-10 flex flex-col items-center text-center bg-black">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-black border border-neutral-800 transition-colors duration-300 group-hover:bg-white group-hover:text-black text-white">
              <LineChartIcon className="h-8 w-8" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-white tracking-tight uppercase">3. Visualize & Analyze</h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              Instantly explore vibrant, interactive charts and receive AI-generated summaries that highlight key trends.
            </p>
          </div>
        </div>
      </section>

      {/* Published Sessions Section */}
      <section className="fade-up mt-24 rounded-none border border-neutral-800 bg-black p-6 sm:p-10" style={{ animationDelay: '0.2s' }}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-neutral-900 border border-neutral-800 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter text-white">Explore Research Sessions</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-none bg-neutral-900 px-4 py-1.5 text-xs font-semibold uppercase text-neutral-300 border border-neutral-800">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
            {isLoading ? 'Syncing...' : `${sessions.length} Available`}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-neutral-800 py-32 bg-black">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-white" />
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Synchronizing research workspace...</p>
          </div>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </section>

      {/* Features Grid */}
      <div className="fade-up mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: '0.3s' }}>
        <div className="col-span-1 rounded-none border border-neutral-800 bg-neutral-950 p-8 lg:col-span-2 transition-colors hover:bg-neutral-900">
          <h3 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight uppercase">
            <Cpu className="h-5 w-5 text-white" /> Built for insight over decoration
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Savvy presents collective survey patterns in a format designed for quick comprehension. Every published session emphasizes signal clarity, descriptive summaries, and transparent access to underlying distributions. Our strict visualization engine ensures the data is both starkly beautiful and highly readable.
          </p>
        </div>
        <div className="col-span-1 flex flex-col justify-between rounded-none border border-neutral-800 bg-neutral-950 p-8 transition-colors hover:bg-neutral-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Data Trust</p>
            <h3 className="mt-3 flex items-center gap-2 text-lg font-bold text-white tracking-tight uppercase">
              <ShieldCheck className="h-5 w-5 text-white" />
              Verified Records
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              Anonymized response collections with descriptive analytics for internal learning and strategic planning.
            </p>
          </div>
          <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-none bg-white px-4 py-3 text-sm font-bold uppercase text-black transition-colors hover:bg-neutral-200">
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
    <footer className="mt-20 border-t border-neutral-800 bg-black font-sans">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Database className="h-4 w-4 text-white" />
            <span className="text-lg font-bold tracking-tight text-white uppercase">Savvy Research</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            © {new Date().getFullYear()} Savvy Research. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <a
            href="https://t.me/savvy_society"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-none border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm text-neutral-300 transition-colors hover:bg-white hover:text-black"
          >
            <Send className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Join our Telegram channel</span>
          </a>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            Real-time updates on institutional research
          </p>
        </div>

        <div className="text-center md:text-right">
          <p className="mb-1 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-neutral-500 md:justify-end">
            Built with <Heart className="h-3 w-3 fill-white text-white" /> by
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-white">
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
      <div className="app-shell flex min-h-screen flex-col selection:bg-white selection:text-black bg-black text-white font-sans">
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
