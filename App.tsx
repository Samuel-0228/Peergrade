
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell as RechartsCell
} from 'recharts';
import { MOCK_USERS } from './constants';
import { Session, SessionStatus, User, RawResponse, SurveyColumn, AppTheme, AccentColor, BackgroundStyle, UserRole } from './types';
import { generateQuestionDescriptions, chatWithCompanion } from './geminiService';

// --- Assets & Configuration ---
const THEME_ACCENTS: Record<AccentColor, string> = {
  sky: '#0ea5e9',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6'
};

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'
];

const BIRD_LOGO = (className = "w-6 h-6") => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.17 0-2.39.15-3.5.5V19c1.11-.35 2.33-.5 3.5-.5 1.95 0 4.05.4 5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.17 0-2.39.15-3.5.5V5z" />
    <path d="M12 6c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" className="opacity-40" />
    <circle cx="17.5" cy="8.5" r="1.5" className="opacity-80" />
  </svg>
);

// --- Robust Persistent Registry Architecture ---
const RegistryStore = {
  STORAGE_KEY: 'savvy_registry_core_v15',

  async sync(): Promise<Session[]> {
    try {
      const localData = localStorage.getItem(this.STORAGE_KEY);
      let sessions: Session[] = localData ? JSON.parse(localData) : [];

      // Seed from JSON if available
      const response = await fetch('./sessions.json');
      if (response.ok) {
        const seedData = await response.json();
        const seedIds = new Set(seedData.map((s: Session) => s.id));
        const filteredLocal = sessions.filter(s => !seedIds.has(s.id));
        sessions = [...seedData, ...filteredLocal];
      }
      
      this.save(sessions);
      return sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    } catch (e) {
      console.error("Registry Sync Failure", e);
      return [];
    }
  },

  save(sessions: Session[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
  },

  async commit(session: Session) {
    const current = await this.sync();
    this.save([session, ...current]);
  },

  async update(id: string, updates: Partial<Session>) {
    const current = await this.sync();
    const updated = current.map(s => s.id === id ? { ...s, ...updates } : s);
    this.save(updated);
    return updated;
  },

  async detach(id: string) {
    const current = await this.sync();
    this.save(current.filter(s => s.id !== id));
  }
};

// --- Data Parsers ---
const parseCSV = (csv: string): { columns: SurveyColumn[], responses: RawResponse[] } => {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return { columns: [], responses: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  // Exclude common timestamp headers
  const filteredHeaders = headers.filter(h => !h.toLowerCase().includes('timestamp'));
  
  const columns: SurveyColumn[] = filteredHeaders.map((h, i) => ({
    id: `q${i}`,
    label: h,
    type: 'categorical',
    isVisualizable: true
  }));

  const responses: RawResponse[] = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const response: RawResponse = {};
    // Match filtered headers back to indices
    headers.forEach((h, originalIndex) => {
      const col = columns.find(c => c.label === h);
      if (col) {
        response[col.id] = values[originalIndex] || '';
      }
    });
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

// --- Core UI Components ---

const MetadataBanner: React.FC<{ session: Session, accent: string }> = ({ session, accent }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full animate-in fade-in slide-in-from-top-4 duration-700">
    <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Source Identification</p>
      <p className="text-[13px] font-mono-plex text-white truncate font-semibold">{session.sourceName || "Internal Protocol"}</p>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Registry Lifecycle</p>
      <p className="text-[13px] font-mono-plex text-white">{new Date(session.lastUpdated).toLocaleDateString()} — {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Response Population</p>
      <p className="text-[13px] font-mono-plex text-white font-bold">{session.participationCount.toLocaleString()} Analyzed Rows</p>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.02]">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Availability State</p>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${session.isPublic ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <p className={`text-[11px] font-mono-plex uppercase font-black tracking-widest ${session.isPublic ? 'text-emerald-400' : 'text-rose-400'}`}>
          {session.isPublic ? 'Global_Public' : 'Node_Private'}
        </p>
      </div>
    </div>
  </div>
);

const ChartLegend: React.FC<{ data: any[], accent: string }> = ({ data, accent }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full px-10 pb-4">
    {data.map((entry, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors group cursor-default">
        <div className="w-3 h-3 rounded shadow-md transition-transform group-hover:scale-125" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest truncate">{entry.name}</span>
          <span className="text-[9px] font-mono-plex" style={{ color: accent }}>{entry.percentage}% (n={entry.value})</span>
        </div>
      </div>
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, accent }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass px-5 py-4 rounded-2xl border-white/10 shadow-2xl backdrop-blur-3xl">
        <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{data.name}</p>
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-mono-plex font-black" style={{ color: accent }}>{data.percentage}%</span>
          <span className="text-[10px] text-slate-500 font-mono-plex">n={data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const DashboardItem: React.FC<{ col: SurveyColumn, responses: RawResponse[], description: string, theme: AppTheme }> = ({ col, responses, description, theme }) => {
  const { data, totalValid } = useMemo(() => getColumnDist(responses, col.id), [responses, col.id]);
  const accent = THEME_ACCENTS[theme.accent];
  const isMany = data.length > 8;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="border-b border-white/5 pb-6">
        <h4 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">{col.label}</h4>
        <p className="text-[9px] text-slate-600 font-mono-plex uppercase tracking-[0.4em]">{totalValid.toLocaleString()} samples distributed</p>
      </div>

      <div className="glass py-16 rounded-[4rem] border-white/5 flex flex-col items-center gap-12 shadow-2xl relative overflow-hidden">
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            {!isMany ? (
              <PieChart>
                <Pie 
                  data={data} innerRadius={120} outerRadius={170} paddingAngle={6} dataKey="value" stroke="none"
                  animationBegin={0} animationDuration={1000}
                >
                  {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip accent={accent} />} />
              </PieChart>
            ) : (
              <BarChart data={data} layout="vertical" margin={{ left: 30, right: 60, bottom: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800, textAnchor: 'end' }} width={160} />
                <Tooltip content={<CustomTooltip accent={accent} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={30}>
                   {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <ChartLegend data={data} accent={accent} />
      </div>

      <div className="pl-12 border-l-4 py-6 bg-white/[0.03] rounded-r-3xl shadow-inner border-l-sky-500/50" style={{ borderLeftColor: `${accent}80` }}>
        <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-6xl tracking-tight italic">
          {description || "Awaiting structural analysis of this data segment..."}
        </p>
      </div>
    </div>
  );
};

// --- Main Views ---

const Navbar: React.FC<{ user: User | null; theme: AppTheme; onLogin: () => void; onLogout: () => void }> = ({ user, theme, onLogin, onLogout }) => {
  const accentColor = THEME_ACCENTS[theme.accent];
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 px-10 py-7 flex items-center justify-between backdrop-blur-3xl">
      <Link to="/" className="flex items-center gap-4 group">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black shadow-2xl transition-all group-hover:scale-110" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-6 h-6")}</div>
        <span className="text-white font-black tracking-[0.4em] font-mono-plex text-[12px] uppercase">Savvy_Hub</span>
      </Link>
      <div className="flex items-center gap-10">
        <Link to="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Registry</Link>
        {user ? (
          <>
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Admin_Panel</Link>
            <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400">Disconnect</button>
          </>
        ) : (
          <button onClick={onLogin} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all">Authorize</button>
        )}
      </div>
    </nav>
  );
};

const HomePage: React.FC<{ sessions: Session[], theme: AppTheme, user: User | null }> = ({ sessions, theme, user }) => {
  const accent = THEME_ACCENTS[theme.accent];
  // Admins see all sessions, visitors see only public
  const visibleSessions = useMemo(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.OWNER)) return sessions;
    return sessions.filter(s => s.isPublic);
  }, [sessions, user]);

  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-32">
      <header className="space-y-12">
        <div className="flex items-center gap-10">
          <span className="w-20 h-1 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[14px] font-black uppercase tracking-[1em]" style={{ color: accent }}>Registry Hub</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9] max-w-5xl">Structural Insights <br/>Node Portal.</h1>
          <p className="text-slate-500 text-2xl max-w-4xl font-light leading-relaxed tracking-tight italic">
            Neutral operational mapping of academic cohorts. All sessions in this registry are read-only summary nodes based on collective freshman data.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {visibleSessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="group glass p-14 rounded-[4.5rem] border-white/5 hover:border-white/20 transition-all duration-700 hover:-translate-y-4 flex flex-col h-full shadow-2xl relative overflow-hidden">
            {!s.isPublic && <div className="absolute top-10 left-10 text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/20">Private Node</div>}
            <h3 className="text-3xl font-black text-white mb-6 group-hover:text-sky-400 transition-colors leading-[1.0] mt-6">{s.title}</h3>
            <p className="text-slate-500 text-lg mb-16 flex-1 line-clamp-3 leading-relaxed font-medium italic opacity-80">{s.description}</p>
            <div className="pt-12 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white font-mono-plex tracking-tighter">{s.participationCount.toLocaleString()}</span>
                <span className="text-[9px] text-slate-700 uppercase font-black tracking-[0.4em] mt-1">Registry Samples</span>
              </div>
              <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all shadow-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        ))}
        {visibleSessions.length === 0 && (
          <div className="col-span-full py-48 text-center border-4 border-dashed border-white/5 rounded-[5rem] flex flex-col items-center justify-center gap-6">
            <p className="text-slate-800 font-black text-lg uppercase tracking-[0.8em]">Operational nodes undetected</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SessionView: React.FC<{ sessions: Session[], theme: AppTheme, user: User | null }> = ({ sessions, theme, user }) => {
  const { id } = useParams<{ id: string }>();
  const session = useMemo(() => sessions.find(s => s.id === id), [sessions, id]);
  const accent = THEME_ACCENTS[theme.accent];

  if (!session) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-black text-white uppercase tracking-[1em]">Node_Offline</h1></div>;
  
  // Only display columns marked as visualizable by Admin
  const visualColumns = session.columns.filter(c => c.isVisualizable);

  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-40">
      <header className="space-y-12">
        <div className="flex items-center gap-10">
          <Link to="/" className="text-slate-600 hover:text-white transition-all hover:scale-110 p-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <span className="w-20 h-1.5 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[14px] font-black uppercase tracking-[1.4em]" style={{ color: accent }}>Node Discovery</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[1.0]">{session.title}</h1>
          <p className="text-slate-500 text-2xl max-w-5xl font-medium leading-relaxed italic">{session.description}</p>
        </div>
        
        <MetadataBanner session={session} accent={accent} />
      </header>

      <div className="space-y-64">
        {visualColumns.map(col => (
          <DashboardItem 
            key={col.id} col={col} responses={session.responses} 
            description={session.columnDescriptions?.[col.id] || ""} 
            theme={theme} 
          />
        ))}
        {visualColumns.length === 0 && (
          <div className="glass p-20 rounded-[4rem] text-center">
            <p className="text-slate-600 font-bold uppercase tracking-widest italic">All structural visualizers for this node have been restricted by Registry Control.</p>
          </div>
        )}
      </div>
      
      {/* Optional Companion Interface (Read-Only context) */}
      <CompanionChat session={session} theme={theme} />
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
        // Analysis generated ONCE per session creation
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
          isPublic: false, // Default to private until published
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
    } catch (e) { alert("Registry synchronization failure."); } finally { setLoading(false); }
  };

  const toggleVisibility = async (session: Session) => {
    await RegistryStore.update(session.id, { isPublic: !session.isPublic });
    onRefresh();
  };

  const toggleColumnVisibility = async (session: Session, columnId: string) => {
    const updatedCols = session.columns.map(c => c.id === columnId ? { ...c, isVisualizable: !c.isVisualizable } : c);
    await RegistryStore.update(session.id, { columns: updatedCols });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Detach this node from the global registry permanently?")) {
      await RegistryStore.detach(id);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-10 py-32 space-y-24">
      <div className="flex justify-between items-center border-b border-white/10 pb-12">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white font-mono-plex tracking-tighter uppercase leading-none">Registry_Control</h1>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.5em]">Central Operational Authority</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl bg-white text-black hover:scale-105 active:scale-95">Inject Node</button>
      </div>

      {isCreating && (
        <div className="glass p-16 rounded-[4.5rem] border-white/10 space-y-12 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Node Label</label>
                <input placeholder="Cohort Title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-white outline-none focus:border-white/30 font-bold" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-6">Structural Summary</label>
                <textarea placeholder="Describe analytical context..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-white outline-none h-40 resize-none font-medium italic" />
              </div>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[4.5rem] p-16 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-8 ${selectedFile ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`} style={selectedFile ? { borderColor: accent } : {}}>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="p-8 rounded-3xl bg-black/40" style={{ color: accent }}>{BIRD_LOGO("w-14 h-14")}</div>
              <p className="text-3xl font-black text-white">{selectedFile ? selectedFile.name : 'Upload Matrix'}</p>
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.4em]">CSV Required — Headers Auto-Parsed</p>
            </div>
          </div>
          <div className="flex gap-8 pt-6">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[12px] transition-all disabled:opacity-20 shadow-2xl bg-sky-500 text-black">{loading ? 'Synthesizing...' : 'Sync to Registry'}</button>
            <button onClick={() => setIsCreating(false)} className="px-12 text-slate-700 font-black text-[11px] uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          </div>
        </div>
      )}

      <div className="grid gap-10">
        {sessions.map(s => (
          <div key={s.id} className="glass p-12 rounded-[4rem] flex flex-col gap-10 border-white/5 hover:border-white/10 transition-all shadow-xl group">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-3">
                <h4 className="text-3xl font-black text-white tracking-tighter uppercase">{s.title}</h4>
                <div className="flex items-center gap-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{s.participationCount} Samples</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full border ${s.isPublic ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/20 text-rose-500 bg-rose-500/5'}`}>
                      {s.isPublic ? 'Public_Registry' : 'Private_Node'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => toggleVisibility(s)} className={`px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${s.isPublic ? 'bg-rose-500 text-black' : 'bg-emerald-500 text-black'}`}>
                  {s.isPublic ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-6 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-[2.5rem] p-8 space-y-6">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 pb-4 ml-4">Structural Component Control</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {s.columns.map(col => (
                  <button 
                    key={col.id} 
                    onClick={() => toggleColumnVisibility(s, col.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${col.isVisualizable ? 'border-white/10 bg-white/5' : 'border-white/5 opacity-40 bg-black/40'}`}
                  >
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-[140px]">{col.label}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest ml-4 ${col.isVisualizable ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {col.isVisualizable ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- App Root Logic ---

const CompanionChat: React.FC<{ session: Session, theme: AppTheme }> = ({ session, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Node Protocol: ${session.title}. Operational analysis active. Request structural data point synthesis.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const accentColor = THEME_ACCENTS[theme.accent];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    history.push({ role: 'user', parts: [{ text: userMsg }] });
    const aiResponse = await chatWithCompanion(history, "Summary Dataset Map", "{}", session.title);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse || "Service interruption detected." }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-[1000]">
      {isOpen && (
        <div className="glass w-[360px] sm:w-[480px] h-[600px] mb-6 rounded-[3rem] overflow-hidden flex flex-col border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="p-7 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white">{BIRD_LOGO("w-5 h-5")}</div>
              <span className="text-black font-black text-xs uppercase tracking-[0.2em]">Savvy_Bot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black/60 hover:text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-7 space-y-7 bg-black/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[13px] leading-relaxed ${m.role === 'user' ? 'text-black font-bold shadow-xl' : 'bg-white/5 border border-white/5 text-slate-300'}`} style={m.role === 'user' ? { backgroundColor: accentColor } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white/5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: accentColor }}>Analyzing Matrix...</div></div>}
          </div>
          <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Query patterns..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:border-white/30"
            />
            <button onClick={handleSend} className="p-4 rounded-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: accentColor }}>
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-18 h-18 rounded-[2.5rem] flex items-center justify-center text-black shadow-2xl hover:scale-110 active:scale-95 transition-all animate-float" style={{ backgroundColor: accentColor, width: '72px', height: '72px' }}>
        {BIRD_LOGO("w-9 h-9")}
      </button>
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
  }, [theme]);
  
  return (
    <div className="min-h-screen transition-all duration-1000 selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <Navbar user={user} theme={theme} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
      
      {registryLoading && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center backdrop-blur-xl">
          <div className="flex flex-col items-center gap-8">
            <div className="w-20 h-20 border-[6px] border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-[12px] font-black uppercase tracking-[0.8em] text-white animate-pulse">Synchronizing Global Registry...</p>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-12 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass p-20 rounded-[5rem] w-full max-w-xl text-center border-white/10 shadow-2xl">
            <h2 className="text-6xl font-black text-white mb-16 tracking-tighter uppercase font-mono-plex">Node_Auth</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              const pass = (e.target as any).pass.value;
              if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') { setUser(MOCK_USERS[0]); setShowLogin(false); }
              else alert("Security protocol failure.");
            }} className="space-y-8">
              <input name="email" placeholder="Identifier" className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-10 py-8 text-white outline-none focus:border-white/30 font-bold text-center tracking-widest text-xs uppercase" />
              <input name="pass" type="password" placeholder="Key Sequence" className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-10 py-8 text-white outline-none focus:border-white/30 font-bold text-center tracking-widest text-xs" />
              <button type="submit" className="w-full bg-white text-black font-black py-8 rounded-[3rem] uppercase tracking-[0.6em] text-[13px] mt-10 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl">Authorize Cluster</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="mt-16 text-slate-800 text-[11px] uppercase font-black tracking-widest hover:text-slate-500 transition-colors">Abort Access</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage sessions={sessions} theme={theme} user={user} />} />
        <Route path="/session/:id" element={<SessionView sessions={sessions} theme={theme} user={user} />} />
        <Route path="/admin" element={user ? <AdminPanel sessions={sessions} onRefresh={refreshRegistry} theme={theme} /> : <Navigate to="/" />} />
      </Routes>

      <footer className="mt-96 border-t border-white/5 py-64 px-12 bg-black/80 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-40">
          <div className="space-y-20">
            <div className="flex items-center gap-10">
              <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-black font-black text-5xl shadow-2xl" style={{ backgroundColor: THEME_ACCENTS[theme.accent] }}>S</div>
              <span className="text-white font-black tracking-[0.6em] font-mono-plex uppercase text-4xl">Savvy_Sys</span>
            </div>
            <p className="text-slate-600 text-2xl max-w-xl leading-relaxed font-medium italic opacity-60">Integrated structural intelligence hub mirroring cohort trajectories. Providing architectural transparency via neutral mapping protocols.</p>
          </div>
          <div className="space-y-24 max-w-3xl">
            <div className="space-y-12">
              <p className="text-slate-700 text-sm uppercase font-black tracking-[0.05em] border-l-2 border-white/5 pl-10 italic">Admission results and structural outcomes are exclusively published via <a href="https://t.me/Savvy_Society" className="text-white hover:underline transition-all">t.me/Savvy_Society</a>.</p>
              <div className="flex gap-16 pt-10">
                 <a href="https://t.me/Savvy_Society" className="text-[14px] font-black uppercase tracking-[0.5em] transition-all hover:opacity-70" style={{ color: THEME_ACCENTS[theme.accent] }}>Telegram_Node</a>
                 <a href="#" className="text-[14px] font-black text-slate-800 uppercase tracking-[0.5em] hover:text-slate-500 transition-all">Registry_Core</a>
              </div>
            </div>
            <p className="text-slate-800 text-[13px] font-mono-plex font-black uppercase tracking-[0.8em] opacity-30">© 2024 SAVVY SOCIETY :: REGISTRY NODE 15.0 :: PATTERNS NEUTRALIZED</p>
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
