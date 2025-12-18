
import React, { useState, useEffect, createContext, useContext } from 'react';
import { ViewState } from './types';
import Dashboard from './components/Dashboard';
import ResearchAssistant from './components/ResearchAssistant';
import ImageGenerator from './components/ImageGenerator';
import AdminControl from './components/AdminControl';

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const NavItem = ({ view, label, icon }: { view: ViewState, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-5 py-3 text-[10px] font-mono uppercase tracking-widest transition-all border-b-2 ${
        activeView === view 
          ? 'border-blue-500 text-blue-500 bg-blue-500/5' 
          : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className="min-h-screen flex flex-col">
        <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center rounded font-black text-xl italic`}>
              S
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-lg font-bold tracking-tighter uppercase">Savvy</h1>
              <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">Academic Intelligence</span>
            </div>
          </div>

          <div className="flex h-full">
            <NavItem view={ViewState.DASHBOARD} label="Repository" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>} />
            <NavItem view={ViewState.RESEARCH_ASSISTANT} label="Assistant" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
            <NavItem view={ViewState.VISUALIZATION_GEN} label="Visualize" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>} />
            <NavItem view={ViewState.ADMIN} label="Admin" icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>} />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/5 transition-colors border border-white/10"
              title="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M14.5 12a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              )}
            </button>
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
          {activeView === ViewState.DASHBOARD && <Dashboard />}
          {activeView === ViewState.RESEARCH_ASSISTANT && <ResearchAssistant />}
          {activeView === ViewState.VISUALIZATION_GEN && <ImageGenerator />}
          {activeView === ViewState.ADMIN && <AdminControl />}
        </main>

        <footer className="glass-panel border-t border-white/10 px-8 py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 space-y-4">
               <div className="flex items-center gap-2">
                 <div className={`w-6 h-6 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center rounded font-black text-sm italic`}>S</div>
                 <h2 className="text-xl font-bold uppercase tracking-tighter">Savvy</h2>
               </div>
               <p className="text-gray-500 text-xs max-w-sm leading-relaxed">
                 A specialized academic intelligence engine designed for complex institutional analysis. 
                 Savvy provides a neutral observational layer over longitudinal admission datasets.
               </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-blue-500">Framework</h4>
              <ul className="text-xs text-gray-500 space-y-2 font-mono uppercase tracking-tighter">
                <li>Institutional API</li>
                <li>Neural Analysis</li>
                <li>Visual Core</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-blue-500">Network</h4>
              <ul className="text-xs text-gray-500 space-y-2 font-mono uppercase tracking-tighter">
                <li>Public Gateway</li>
                <li>Admin Terminal</li>
                <li>Data Standards</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
              &copy; 2024 Savvy Society Team // Integrated Intelligence System
            </p>
            <div className="flex gap-6">
              <div className="text-[9px] font-mono text-blue-500/50 uppercase tracking-widest animate-pulse">System Status: Optimal</div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
