
import React from 'react';

interface DashboardHeaderProps {
  isAdmin?: boolean;
  onLogout?: () => void;
  onLogin?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ isAdmin, onLogout, onLogin }) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-2 rounded">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-slate-900 uppercase">Savvy</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Academic Insight System</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-6">
          <a href="#/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-tight">Overview</a>
          {isAdmin ? (
            <>
              <a href="#/admin" className="text-sm font-medium text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-tight">Management</a>
              <button 
                onClick={onLogout}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 font-semibold uppercase tracking-wider text-slate-600"
              >
                Log Out
              </button>
            </>
          ) : (
            <button 
              onClick={onLogin}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 font-semibold uppercase tracking-wider text-slate-600"
            >
              Admin Access
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default DashboardHeader;
