
import React, { useState } from 'react';
import { ViewState } from './types';
import Dashboard from './components/Dashboard';
import ResearchAssistant from './components/ResearchAssistant';
import ImageGenerator from './components/ImageGenerator';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.DASHBOARD);

  const NavItem = ({ view, label, icon }: { view: ViewState, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-3 px-6 py-3 text-xs font-mono uppercase tracking-widest transition-all border-b-2 ${
        activeView === view 
          ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
          : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-8 py-0 flex items-center justify-between">
        <div className="flex items-center gap-4 py-4">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
            <span className="text-black font-bold text-xl leading-none">A</span>
          </div>
          <h1 className="text-lg font-bold tracking-tighter uppercase leading-none hidden md:block">
            Academia Insight <span className="text-blue-500">Pro</span>
          </h1>
        </div>

        <div className="flex">
          <NavItem 
            view={ViewState.DASHBOARD} 
            label="Repository" 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>}
          />
          <NavItem 
            view={ViewState.RESEARCH_ASSISTANT} 
            label="Assistant" 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
          />
          <NavItem 
            view={ViewState.VISUALIZATION_GEN} 
            label="Visualize" 
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>}
          />
        </div>

        <div className="hidden lg:flex items-center gap-4 py-4">
          <div className="text-[10px] font-mono text-right text-gray-500 leading-tight uppercase">
            System Integrity: Nominal<br/>
            Neural Load: 12%
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {activeView === ViewState.DASHBOARD && <Dashboard />}
        {activeView === ViewState.RESEARCH_ASSISTANT && <ResearchAssistant />}
        {activeView === ViewState.VISUALIZATION_GEN && <ImageGenerator />}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/10 px-8 py-6 text-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            &copy; 2024 Global Academic Consortium // Internal Institutional Use Only
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[10px] font-mono text-gray-600 uppercase tracking-widest hover:text-gray-300">Privacy Protocol</a>
            <a href="#" className="text-[10px] font-mono text-gray-600 uppercase tracking-widest hover:text-gray-300">Data Standards</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
