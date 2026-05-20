
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, Mail } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../constants';

interface AdminLoginProps {
  onLogin: (email: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      onLogin(email);
      navigate('/secret');
    } else {
      setError('Invalid administrative credentials provided.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full bg-black border border-neutral-800 rounded-none p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-neutral-900 rounded-none border border-neutral-800">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-2 uppercase">Staff Access</h2>
        <p className="text-center text-neutral-400 text-sm mb-8">Access the Savvy Administrative Insight Controller.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-none py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600"
                placeholder="admin@savvysociety.org"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-none py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-white text-xs font-bold uppercase tracking-widest bg-black p-3 rounded-none border border-white">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest py-3 rounded-none transition-colors"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
