
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell as RechartsCell
} from 'recharts';
import { MOCK_USERS } from './constants';
import { Session, SessionStatus, UserRole, User, RawResponse, SurveyColumn, AppTheme, AccentColor, BackgroundStyle } from './types';
import { generateQuestionDescriptions, chatWithCompanion } from './geminiService';

// --- Assets ---
const BIRD_LOGO = (className = "w-6 h-6") => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.17 0-2.39.15-3.5.5V19c1.11-.35 2.33-.5 3.5-.5 1.95 0 4.05.4 5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.17 0-2.39.15-3.5.5V5z" />
    <path d="M12 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" className="opacity-40" />
    <circle cx="17.5" cy="8.5" r="1.5" className="opacity-80" />
  </svg>
);

const THEME_ACCENTS: Record<AccentColor, string> = {
  sky: '#0ea5e9',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6'
};

const THEME_BGS: Record<BackgroundStyle, string> = {
  deep: 'radial-gradient(circle at top right, #030712, #000000)',
  gradient: 'radial-gradient(circle at 0% 0%, #0f172a 0%, #020617 100%)',
  minimal: '#0a0a0a'
};

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'
];

// --- Persistent Global Registry Store ---
const RegistryStore = {
  STORAGE_KEY: 'savvy_global_registry_v12',

  /**
   * Synchronizes the local node state with the master registry.
   */
  async sync(): Promise<Session[]> {
    try {
      const localData = localStorage.getItem(this.STORAGE_KEY);
      let sessions: Session[] = localData ? JSON.parse(localData) : [];

      // Always try to fetch seed data from sessions.json to ensure baseline is present
      const response = await fetch('./sessions.json');
      if (response.ok) {
        const seedData = await response.json();
        // Merge seed data with local data, preventing duplicates by ID
        const seedIds = new Set(seedData.map((s: Session) => s.id));
        const filteredLocal = sessions.filter(s => !seedIds.has(s.id));
        sessions = [...seedData, ...filteredLocal];
      }
      
      this.save(sessions);
      return sessions;
    } catch (e) {
      console.error("Registry Sync Failure:", e);
      return [];
    }
  },

  save(sessions: Session[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  },

  async commit(session: Session): Promise<Session[]> {
    const current = await this.sync();
    const updated = [session, ...current];
    this.save(updated);
    return updated;
  },

  async detach(id: string): Promise<Session[]> {
    const current = await this.sync();
    const updated = current.filter(s => s.id !== id);
    this.save(updated);
    return updated;
  }
};

// --- Data Parsers ---
const parseCSV = (csv: string): { columns: SurveyColumn[], responses: RawResponse[] } => {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return { columns: [], responses: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const columns: SurveyColumn[] = headers.map((h, i) => ({
    id: `q${i}`,
    label: h,
    type: 'categorical',
    isVisualizable: true
  }));
  const responses: RawResponse[] = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const response: RawResponse = {};
    columns.forEach((col, i) => { response[col.id] = values[i] || ''; });
    return response;
  });
  return { columns, responses };
};

const getColumnDist = (responses: RawResponse[], columnId: string) => {
  const dist: Record<string, number> = {};
  let totalValid = 0;
  responses.forEach(r => {
    const val = r[columnId];
    if (val !== undefined && val !== null && val !== '') {
      const stringVal = String(val).trim();
      dist[stringVal] = (dist[stringVal] || 0) + 1;
      totalValid++;
    }
  });
  return {
    data: Object.entries(dist).map(([name, value]) => ({ 
      name, value, percentage: totalValid > 0 ? ((value / totalValid) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value),
    totalValid
  };
};

// --- UI Sub-Components ---

const CustomTooltip = ({ active, payload, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const accent = THEME_ACCENTS[theme.accent];
    return (
      <div className="glass px-5 py-3 rounded-3xl border-white/10 shadow-2xl backdrop-blur-2xl">
        <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{data.name}</p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono-plex" style={{ color: accent }}>n={data.value}</span>
          <span className="text-[10px] text-emerald-400 font-mono-plex">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const DashboardItem: React.FC<{ col: SurveyColumn, responses: RawResponse[], description: string, theme: AppTheme }> = ({ col, responses, description, theme }) => {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const { data, totalValid } = useMemo(() => getColumnDist(responses, col.id), [responses, col.id]);
  const accent = THEME_ACCENTS[theme.accent];
  const isMany = data.length > 8;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h4 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{col.label}</h4>
          <p className="text-[10px] text-slate-500 font-mono-plex uppercase tracking-[0.3em]">{totalValid.toLocaleString()} samples verified</p>
        </div>
        <button 
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-xl"
          style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}08` }}
        >
          {showDeepDive ? 'Collapse Matrix' : 'Full Breakdown'}
        </button>
      </div>

      <div className={`glass py-20 rounded-[4.5rem] border-white/5 flex flex-col items-center gap-16 shadow-2xl relative transition-all duration-700 ${showDeepDive ? 'border-white/20' : ''}`}>
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            {!isMany ? (
              <PieChart>
                <Pie 
                  data={data} 
                  innerRadius={115} 
                  outerRadius={165} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} />
              </PieChart>
            ) : (
              <BarChart data={data} layout="vertical" margin={{ left: 30, right: 60, bottom: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800, textAnchor: 'end' }} 
                  width={150} 
                />
                <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={30}>
                   {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Color Mapped Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full px-12 pb-4">
          {data.map((entry, i) => (
            <div key={i} className="flex items-center gap-4 group cursor-default">
              <div className="w-3.5 h-3.5 rounded-lg shadow-lg transition-transform group-hover:scale-125" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest truncate">{entry.name}</span>
                <span className="text-[9px] font-mono-plex text-slate-600">{entry.percentage}%</span>
              </div>
            </div>
          ))}
        </div>

        {showDeepDive && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-12 pt-16 border-t border-white/5 animate-in fade-in slide-in-from-top-6 duration-700">
            {data.map((entry, i) => (
              <div key={i} className="flex flex-col gap-2 p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[10px] text-slate-400 truncate font-black uppercase tracking-widest">{entry.name}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-white">{entry.value}</span>
                  <span className="text-[11px] font-mono-plex" style={{ color: accent }}>{entry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pl-12 border-l-4 py-8 bg-white/5 rounded-r-[3rem] shadow-sm" style={{ borderLeftColor: `${accent}80` }}>
        <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-5xl tracking-tight italic">{description}</p>
      </div>
    </div>
  );
};

// --- View Pages ---

const Navbar: React.FC<{ 
  user: User | null; theme: AppTheme; onLogin: () => void; onLogout: () => void 
}> = ({ user, theme, onLogin, onLogout }) => {
  const accentColor = THEME_ACCENTS[theme.accent];
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 px-12 py-7 flex items-center justify-between backdrop-blur-3xl">
      <Link to="/" className="flex items-center gap-4 group">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black shadow-2xl transition-all group-hover:scale-110" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-6 h-6")}</div>
        <span className="text-white font-black tracking-[0.5em] font-mono-plex text-[13px] uppercase">Savvy_Hub</span>
      </Link>
      <div className="flex items-center gap-10">
        {user ? (
          <div className="flex items-center gap-10">
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Cluster_Control</Link>
            <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500/70 hover:text-red-500">Disconnect</button>
          </div>
        ) : (
          <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-500 hover:text-sky-400">Admin_Gate</button>
        )}
      </div>
    </nav>
  );
};

const HomePage: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const accent = THEME_ACCENTS[theme.accent];
  const publicSessions = useMemo(() => sessions.filter(s => s.isPublic), [sessions]);

  return (
    <div className="max-w-7xl mx-auto px-12 py-40 space-y-48">
      <header className="space-y-14 animate-in fade-in slide-in-from-left-12 duration-1000">
        <div className="flex items-center gap-10">
          <span className="w-24 h-1 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[15px] font-black uppercase tracking-[1.2em]" style={{ color: accent }}>Registry Active</span>
        </div>
        <div className="space-y-8">
          <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9] max-w-5xl select-none">
            Structural <br/>Discovery Hub.
          </h1>
          <p className="text-slate-500 text-3xl max-w-4xl font-light leading-relaxed tracking-tight italic opacity-90">
            Global operational registry for academic cohort analysis. Select an active node to begin structural synthesis.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {publicSessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="group glass p-16 rounded-[5rem] hover:border-white/30 transition-all duration-1000 hover:-translate-y-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-16 right-16 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border border-white/5" style={{ color: `${accent}90` }}>Node_{s.status}</div>
            <h3 className="text-3xl font-black text-white mb-10 group-hover:text-white leading-[1.1] tracking-tighter mt-8 transition-all">{s.title}</h3>
            <p className="text-slate-500 text-xl mb-24 flex-1 leading-relaxed font-medium line-clamp-3 italic opacity-70 group-hover:opacity-100 transition-opacity">{s.description}</p>
            <div className="pt-16 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-5xl font-black text-white font-mono-plex tracking-tighter">{s.participationCount.toLocaleString()}</span>
                <span className="text-[11px] text-slate-700 uppercase font-black tracking-[0.5em] mt-4">Verified Samples</span>
              </div>
              <div className="w-18 h-18 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all shadow-2xl" style={{ width: '72px', height: '72px' }}>
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const SessionView: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const { id } = useParams<{ id: string }>();
  const session = useMemo(() => sessions.find(s => s.id === id), [sessions, id]);
  const accent = THEME_ACCENTS[theme.accent];

  if (!session) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-black text-white tracking-[0.5em] uppercase">Node_Offline</h1></div>;
  
  const visualColumns = session.columns.filter(c => c.isVisualizable);

  return (
    <div className="max-w-7xl mx-auto px-12 py-40 space-y-48">
      <header className="space-y-14 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-slate-600 hover:text-white transition-all hover:scale-110">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <span className="w-24 h-1.5 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[15px] font-black uppercase tracking-[1.4em]" style={{ color: accent }}>Operational Node</span>
        </div>
        <div className="space-y-8">
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[1.0]">{session.title}</h1>
          <p className="text-slate-500 text-3xl max-w-5xl font-medium leading-relaxed italic opacity-90">{session.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pt-10">
           <div className="glass p-8 rounded-[3rem] border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Source Protocol</p>
             <p className="text-[12px] font-mono-plex text-white truncate">{session.sourceName || "Manual Injection"}</p>
           </div>
           <div className="glass p-8 rounded-[3rem] border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Registry Sync</p>
             <p className="text-[12px] font-mono-plex text-white">{new Date(session.lastUpdated).toLocaleString()}</p>
           </div>
           <div className="glass p-8 rounded-[3rem] border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sample Volume</p>
             <p className="text-[12px] font-mono-plex text-white">{session.participationCount.toLocaleString()} Entries</p>
           </div>
           <div className="glass p-8 rounded-[3rem] border-white/5">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Discovery State</p>
             <p className="text-[12px] font-mono-plex text-emerald-400 uppercase font-black">Global Public</p>
           </div>
        </div>
      </header>

      <div className="space-y-64">
        {visualColumns.map(col => (
          <DashboardItem 
            key={col.id} 
            col={col} 
            responses={session.responses} 
            description={session.columnDescriptions?.[col.id] || "Synthesizing descriptive patterns for this structural node segment..."} 
            theme={theme} 
          />
        ))}
      </div>
    </div>
  );
};

const AdminPanel: React.FC<{ sessions: Session[]; onRefresh: () => void, theme: AppTheme }> = ({ sessions, onRefresh, theme }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accent = THEME_ACCENTS[theme.accent];

  const handleFileUpload = async () => {
    if (!selectedFile || !form.title) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;
        const { columns, responses } = parseCSV(csvData);
        const visualColumns = columns.filter(c => c.isVisualizable);
        const descriptions = await generateQuestionDescriptions(responses, visualColumns);
        const newSession: Session = { 
          id: `sav-${Date.now()}`, 
          title: form.title, 
          description: form.description, 
          sourceName: selectedFile.name, 
          participationCount: responses.length, 
          lastUpdated: new Date().toISOString(), 
          status: SessionStatus.LIVE, 
          isPublic: true, 
          columns, 
          responses, 
          showCharts: true, 
          showAiInsights: true, 
          enableCsvDownload: true, 
          columnDescriptions: descriptions
        };
        await RegistryStore.commit(newSession);
        onRefresh();
        setIsCreating(false);
        setForm({ title: '', description: '' });
        setSelectedFile(null);
      };
      reader.readAsText(selectedFile);
    } catch (e) { alert("Registry Commit failure."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Detach node from global registry?")) {
      await RegistryStore.detach(id);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-12 py-32 space-y-24">
      <div className="flex justify-between items-center border-b border-white/10 pb-16">
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-white font-mono-plex tracking-tighter uppercase">Registry_Admin</h1>
          <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.5em]">Node Operational Control</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-14 py-6 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl hover:scale-105 active:scale-95" style={{ backgroundColor: accent, color: '#000' }}>Inject Node</button>
      </div>

      {isCreating && (
        <div className="glass p-20 rounded-[5rem] border-white/10 space-y-14 animate-in zoom-in-95 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-10">
              <input placeholder="Cohort Identity" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-10 py-8 text-white outline-none focus:border-white/30 font-bold" />
              <textarea placeholder="Analytical context..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-10 py-8 text-white outline-none h-48 resize-none font-medium italic" />
            </div>
            <div onClick={() => fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[5rem] p-20 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-10 ${selectedFile ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/10 hover:border-white/30'}`} style={selectedFile ? { borderColor: accent } : {}}>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="p-8 rounded-[2.5rem] bg-black/40" style={{ color: accent }}>{BIRD_LOGO("w-16 h-16")}</div>
              <p className="text-3xl font-black text-white">{selectedFile ? selectedFile.name : 'Upload Data Matrix'}</p>
            </div>
          </div>
          <div className="flex gap-10 pt-10">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 py-8 rounded-[3rem] font-black uppercase tracking-[0.5em] text-[13px] transition-all disabled:opacity-20 shadow-2xl" style={{ backgroundColor: accent, color: '#000' }}>{loading ? 'Committing...' : 'Finalize Registry Commit'}</button>
            <button onClick={() => setIsCreating(false)} className="px-16 text-slate-700 font-black text-[12px] uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          </div>
        </div>
      )}

      <div className="grid gap-12">
        {sessions.map(s => (
          <div key={s.id} className="glass p-14 rounded-[5rem] flex items-center justify-between group hover:border-white/20 transition-all duration-700">
            <div className="space-y-5">
              <h4 className="text-3xl font-black text-white tracking-tighter uppercase">{s.title}</h4>
              <div className="flex items-center gap-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{s.participationCount} Samples</span>
                <span className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.2em] border border-emerald-500/20 px-5 py-2 rounded-full">Global Visibility Active</span>
              </div>
            </div>
            <button onClick={() => handleDelete(s.id)} className="p-8 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [theme] = useState<AppTheme>({ accent: 'sky', bgStyle: 'deep' });
  const [registryLoading, setRegistryLoading] = useState(true);

  const refreshRegistry = async () => {
    setRegistryLoading(true);
    const data = await RegistryStore.sync();
    setSessions(data);
    setRegistryLoading(false);
  };

  useEffect(() => {
    refreshRegistry();
    const root = document.documentElement;
    root.style.setProperty('--accent-color', THEME_ACCENTS[theme.accent]);
    root.style.setProperty('--bg-gradient', THEME_BGS[theme.bgStyle]);
  }, [theme]);
  
  return (
    <div className="min-h-screen transition-all duration-1000 selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <Navbar user={user} theme={theme} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
      
      {registryLoading && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center backdrop-blur-md">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Syncing Global Registry...</p>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-8 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass p-24 rounded-[6rem] w-full max-w-xl text-center border-white/10 shadow-2xl">
            <h2 className="text-6xl font-black text-white mb-16 tracking-tighter uppercase font-mono-plex">Node_Auth</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              const pass = (e.target as any).pass.value;
              if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') { setUser(MOCK_USERS[0]); setShowLogin(false); }
              else alert("Invalid Security Protocol.");
            }} className="space-y-8">
              <input name="email" placeholder="Identifier" className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-10 py-8 text-white outline-none focus:border-white/30 font-bold text-center tracking-widest" />
              <input name="pass" type="password" placeholder="Key Sequence" className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-10 py-8 text-white outline-none focus:border-white/30 font-bold text-center tracking-widest" />
              <button type="submit" className="w-full bg-white text-black font-black py-8 rounded-[3rem] uppercase tracking-[0.6em] text-[14px] mt-12 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl">Authorize Node</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="mt-16 text-slate-800 text-[12px] uppercase font-black tracking-widest hover:text-slate-500 transition-colors">Abort</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage sessions={sessions} theme={theme} />} />
        <Route path="/session/:id" element={<SessionView sessions={sessions} theme={theme} />} />
        <Route path="/admin" element={<AdminPanel sessions={sessions} onRefresh={refreshRegistry} theme={theme} />} />
      </Routes>

      <footer className="mt-96 border-t border-white/5 py-64 px-12 bg-black/70 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-40">
          <div className="space-y-20">
            <div className="flex items-center gap-10">
              <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-black font-black text-5xl shadow-2xl" style={{ backgroundColor: THEME_ACCENTS[theme.accent] }}>S</div>
              <span className="text-white font-black tracking-[0.8em] font-mono-plex uppercase text-4xl">Savvy_Sys</span>
            </div>
            <p className="text-slate-600 text-2xl max-w-xl leading-relaxed font-medium italic opacity-50">Integrated structural intelligence nodes mirroring cohort trajectories. Structural transparency via mapping protocols.</p>
          </div>
          <div className="space-y-24 max-w-3xl">
            <div className="space-y-12">
              <p className="text-slate-700 text-sm uppercase font-black tracking-[0.05em] leading-relaxed italic border-l-2 border-white/5 pl-10">Official results and outcomes are strictly published via <a href="https://t.me/Savvy_Society" className="text-white hover:underline transition-all">t.me/Savvy_Society</a>.</p>
              <div className="flex gap-16 pt-10">
                 <a href="https://t.me/Savvy_Society" className="text-[14px] font-black uppercase tracking-[0.5em] transition-all hover:opacity-70" style={{ color: THEME_ACCENTS[theme.accent] }}>Telegram Hub</a>
                 <a href="#" className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] hover:text-slate-500 transition-all">Registry Integrity</a>
              </div>
            </div>
            <p className="text-slate-800 text-[13px] font-mono-plex font-black uppercase tracking-[0.8em] opacity-30">© 2024 SAVVY SOCIETY :: CORE NODE 13.0 :: PATTERNS NEUTRALIZED</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RootApp = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default RootApp;
