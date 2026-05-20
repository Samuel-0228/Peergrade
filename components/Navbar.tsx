
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Database } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(11,15,20,0.84)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-indigo-400/40 group-hover:bg-indigo-500/10">
                <Database className="w-4.5 h-4.5 text-indigo-300" />
              </div>
              <div>
                <span className="block font-academic text-lg font-semibold tracking-tight text-slate-50">Savvy Research</span>
                <span className="block text-[10px] uppercase tracking-[0.24em] text-slate-500">Insight Console</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <Link to="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition-all duration-300 hover:border-indigo-400/30 hover:bg-white/[0.03] hover:text-white">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
                <button 
                  onClick={() => { onLogout(); navigate('/'); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition-all duration-300 hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ):null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
