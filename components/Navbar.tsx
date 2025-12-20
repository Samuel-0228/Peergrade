
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, ShieldCheck, Database } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-indigo-600 rounded-lg group-hover:bg-indigo-500 transition-colors">
                <Database className="w-5 h-5 text-white" />
              </div>
              <span className="font-academic font-bold text-xl tracking-tight text-white">SAVVY</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <>
                <Link to="/admin" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
                <button 
                  onClick={() => { onLogout(); navigate('/'); }}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                <ShieldCheck className="w-4 h-4" />
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
