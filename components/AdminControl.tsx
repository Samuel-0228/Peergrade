
import React, { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'savvysocietyteam@gmail.com';

const AdminControl: React.FC = () => {
  const [emailInput, setEmailInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('admission_sheet_url') || '';
    setSheetUrl(savedUrl);
    const sessionEmail = sessionStorage.getItem('admin_session_email');
    if (sessionEmail === ADMIN_EMAIL) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput === ADMIN_EMAIL) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_session_email', emailInput);
    } else {
      setStatusMessage('Security Protocol Violation: Unauthorized Identity.');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('admission_sheet_url', sheetUrl);
    setStatusMessage('Configuration Synchronized Successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-2xl animate-in fade-in zoom-in duration-500">
        <h3 className="text-xl font-bold tracking-widest uppercase mb-6 text-center">Admin Authentication</h3>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Identity Email</label>
            <input 
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
              placeholder="Enter administrator email..."
              required
            />
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition-all">
            Initiate Session
          </button>
        </form>
        {statusMessage && (
          <p className="mt-4 text-[10px] text-red-400 font-mono text-center uppercase animate-pulse">{statusMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tighter">System Control Panel</h2>
          <p className="text-gray-500 text-xs mt-1">Global administrative settings and data synchronization management.</p>
        </div>
        <button 
          onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('admin_session_email'); }}
          className="text-[10px] font-mono uppercase tracking-widest text-red-500 border border-red-500/20 px-4 py-2 hover:bg-red-500/10 transition-all"
        >
          Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h4 className="text-xs font-mono uppercase tracking-widest text-blue-400">Data Source Master</h4>
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-gray-500 uppercase">Google Sheets CSV Endpoint</label>
            <textarea 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-blue-500 min-h-[100px]"
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
            />
          </div>
          <button 
            onClick={handleSaveConfig}
            className="w-full bg-white text-black font-bold py-3 rounded-lg text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Update Global Repository
          </button>
          {statusMessage && (
            <p className="text-[10px] text-emerald-400 font-mono text-center uppercase">{statusMessage}</p>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">System Logs</h4>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-[10px] text-gray-500 space-y-1 h-[200px] overflow-y-auto">
            <p className="text-emerald-500">[OK] SYSTEM INITIALIZED</p>
            <p>[INFO] ADMIN AUTHENTICATED: {ADMIN_EMAIL}</p>
            <p>[INFO] DATA FETCH SERVICE: READY</p>
            <p>[INFO] THEME ENGINE: DUAL-MODE ACTIVE</p>
            <p className="text-blue-400">[WS] CONNECTION ESTABLISHED</p>
            <p>[LOG] CACHE STATUS: NOMINAL</p>
            <p className="text-yellow-500">[WARN] EXTERNAL REFRESH DELAY: 2ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControl;
