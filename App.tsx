
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck, Info, Database } from 'lucide-react';
import Navbar from './components/Navbar';
import SessionList from './components/SessionList';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import SessionDashboard from './components/SessionDashboard';
import { storageService } from './services/storageService';
import { AuthState, Session } from './types';

const Home: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(storageService.getPublicSessions());
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <header className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 animate-pulse">
          Institutional Insight Dashboard
        </div>
        <h1 className="text-5xl md:text-7xl font-academic font-bold text-white mb-6 tracking-tighter">
          SAVVY <span className="text-indigo-600">RESEARCH</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Aggregated survey insights for academic communities. 
          Discover patterns, distributions, and collective trends in freshman academic preferences.
        </p>
      </header>

      <section className="mb-20">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-academic font-bold text-white tracking-tight">Active Published Insights</h2>
          </div>
          <p className="text-xs font-mono-academic text-slate-500 uppercase tracking-widest font-bold">
            {sessions.length} Available Collections
          </p>
        </div>
        <SessionList sessions={sessions} />
      </section>

      <div className="max-w-4xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Info className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-academic font-bold text-white mb-2">Academic Transparency Disclaimer</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Savvy is a public academic insight platform designed for descriptive data visualization. 
              The system presents collective student patterns based on anonymized Google Forms response data. 
              The information provided is for institutional awareness and collective insight only.
            </p>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Institutional Data
            </p>
          </div>
        </div>
      </div>
    </div>
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
      <div className="min-h-screen bg-[#0a0a0c] selection:bg-indigo-500 selection:text-white">
        <Navbar isAdmin={auth.isAdmin} onLogout={handleLogout} />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={auth.isAdmin ? <Navigate to="/admin" /> : <AdminLogin onLogin={handleLogin} />} />
            <Route path="/admin" element={auth.isAdmin ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/session/:id" element={<SessionDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
