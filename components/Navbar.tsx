
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
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-black font-sans">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-none border border-neutral-800 bg-neutral-950 transition-colors group-hover:bg-white group-hover:text-black text-white">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tighter text-white uppercase">Savvy Research</span>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Insight Console</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <Link to="/admin" className="inline-flex items-center gap-2 rounded-none border border-neutral-800 px-3 py-2 text-xs font-bold uppercase tracking-widest text-neutral-300 transition-colors hover:border-white hover:bg-white hover:text-black">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
                <button 
                  onClick={() => { onLogout(); navigate('/'); }}
                  className="inline-flex items-center gap-2 rounded-none border border-neutral-800 px-3 py-2 text-xs font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:border-white hover:text-white"
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
