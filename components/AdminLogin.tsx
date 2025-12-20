
import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prompt-provided credentials
    if (email === 'savvysocietyteam@gmail.com' && password === 'SavvyisHard') {
      onLogin(true);
    } else {
      setError('Invalid authorization credentials.');
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">Admin Terminal</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Restricted Access Protocol</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Institutional Email</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            placeholder="admin@savvysociety.org"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Access Key</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && (
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 p-2 rounded text-center border border-red-100">
            {error}
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg"
        >
          Initialize Login
        </button>
        
        <p className="text-[10px] text-slate-400 text-center uppercase font-medium leading-relaxed mt-4">
          All login attempts are logged for security. <br/>
          Unauthorized access is strictly prohibited.
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;
