
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell as RechartsCell, Legend
} from 'recharts';
import { INITIAL_SESSIONS, MOCK_USERS } from './constants';
import { Session, SessionStatus, UserRole, User, RawResponse, SurveyColumn, AppTheme, AccentColor, BackgroundStyle } from './types';
import { generateQuestionDescriptions, chatWithCompanion } from './geminiService';

// --- Constants & Assets ---
const BIRD_LOGO = (className = "w-6 h-6") => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5-1.17 0-2.39.15-3.5.5V19c1.11-.35 2.33-.5 3.5-.5 1.95 0 4.05.4 5.5 1.5 1.45-1.1 3.55-1.5 5.5-1.5 1.17 0-2.39.15-3.5.5V5z" />
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

// --- Persistence & Sync ---
const STORAGE_KEY = 'savvy_sessions_node_v4';
const PUBLIC_REGISTRY_KEY = 'savvy_public_registry'; // Simulated global registry

const Persistence = {
  save: (sessions: Session[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },
  load: (): Session[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_SESSIONS;
  },
  // Simulates publishing to a "Global Feed"
  broadcastToRegistry: (session: Session) => {
    const publicData = localStorage.getItem(PUBLIC_REGISTRY_KEY);
    const registry: Session[] = publicData ? JSON.parse(publicData) : [];
    // Update or add
    const index = registry.findIndex(s => s.id === session.id);
    if (index > -1) registry[index] = session;
    else registry.unshift(session);
    localStorage.setItem(PUBLIC_REGISTRY_KEY, JSON.stringify(registry));
  },
  loadPublicRegistry: (): Session[] => {
    const data = localStorage.getItem(PUBLIC_REGISTRY_KEY);
    return data ? JSON.parse(data) : [];
  }
};

const parseCSV = (csv: string): { columns: SurveyColumn[], responses: RawResponse[] } => {
  const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 1) return { columns: [], responses: [] };
  const rawHeaders = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim());
  const tempResponses: string[][] = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++; } 
      else if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; } 
      else current += char;
    }
    values.push(current.trim());
    return values;
  });
  const columns: SurveyColumn[] = [];
  const validIndices: number[] = [];
  rawHeaders.forEach((h, i) => {
    if (h.toLowerCase() === 'timestamp') return;
    const valuesInCol = tempResponses.map(row => (row[i] || '').trim()).filter(v => v !== '');
    const uniqueCount = new Set(valuesInCol).size;
    const totalResponsesInCol = valuesInCol.length;
    const isVisualizable = totalResponsesInCol > 1 && uniqueCount > 1 && (uniqueCount / totalResponsesInCol < 0.9);
    validIndices.push(i);
    columns.push({ id: `col_${i}`, label: h, type: 'categorical', isVisualizable });
  });
  const responses: RawResponse[] = tempResponses.map(values => {
    const row: RawResponse = {};
    validIndices.forEach((csvIdx, colIdx) => { row[columns[colIdx].id] = values[csvIdx] || ''; });
    return row;
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

const calculateCorrelationMap = (responses: RawResponse[], columns: SurveyColumn[]): string => {
  const map: Record<string, Record<string, Record<string, number>>> = {};
  const targetCols = columns.filter(c => c.isVisualizable).slice(0, 8);
  for (let i = 0; i < targetCols.length; i++) {
    for (let j = i + 1; j < targetCols.length; j++) {
      const colA = targetCols[i];
      const colB = targetCols[j];
      const pairKey = `${colA.label} x ${colB.label}`;
      map[pairKey] = {};
      responses.forEach(r => {
        const valA = String(r[colA.id] || 'Unknown');
        const valB = String(r[colB.id] || 'Unknown');
        if (!map[pairKey][valA]) map[pairKey][valA] = {};
        map[pairKey][valA][valB] = (map[pairKey][valA][valB] || 0) + 1;
      });
    }
  }
  return JSON.stringify(map);
};

// --- Sub-Components ---

const CompanionChat: React.FC<{ session: Session, theme: AppTheme }> = ({ session, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Node protocol active. I am Savvy Companion. Analyzing "${session.title}" datasets.` }
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
    const visualColumns = session.columns.filter(c => c.isVisualizable);
    const dataSummary = visualColumns.slice(0, 15).map(c => {
      const { data } = getColumnDist(session.responses, c.id);
      return `${c.label}: ${data.slice(0, 10).map(d => `${d.name}(${d.value})`).join(', ')}`;
    }).join('; ');
    const aiResponse = await chatWithCompanion(history, dataSummary, session.correlationData || "{}", session.title);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse || "Communication array timed out." }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      {isOpen && (
        <div className={`glass w-[340px] sm:w-[450px] h-[650px] mb-6 rounded-[3rem] overflow-hidden flex flex-col border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500`}>
          <div className="p-6 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-sm">{BIRD_LOGO("w-5 h-5")}</div>
              <span className="text-black font-black text-xs uppercase tracking-[0.2em]">Companion Node</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black/60 hover:text-black"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'text-black font-bold shadow-lg' : 'bg-white/5 border border-white/5 text-slate-300'}`} style={m.role === 'user' ? { backgroundColor: accentColor } : {}}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white/5 px-5 py-3 rounded-2xl text-xs font-bold animate-pulse" style={{ color: accentColor }}>Synchronizing Matrix...</div></div>}
          </div>
          <div className="p-6 bg-black/30 border-t border-white/5 flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask for cross-column counts..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-white/30 transition-all" />
            <button onClick={handleSend} className="p-4 rounded-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: accentColor }}><svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 rounded-[2rem] flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-all animate-float" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-8 h-8")}</button>
    </div>
  );
};

const DashboardItem: React.FC<{ col: SurveyColumn, responses: RawResponse[], description: string, theme: AppTheme }> = ({ col, responses, description, theme }) => {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const { data, totalValid } = useMemo(() => getColumnDist(responses, col.id), [responses, col.id]);
  const accent = THEME_ACCENTS[theme.accent];
  const isMany = data.length > 8;

  const renderLegend = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-5xl px-10">
      {data.slice(0, 10).map((entry, i) => (
        <div key={i} className="flex items-center gap-2 group cursor-default">
          <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate group-hover:text-white transition-colors">{entry.name}</span>
        </div>
      ))}
      {data.length > 10 && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0 bg-slate-800" />
          <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">+ {data.length - 10} More</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h4 className="text-3xl font-black text-white leading-tight tracking-tight">{col.label}</h4>
          <p className="text-[10px] text-slate-500 font-mono-plex uppercase tracking-[0.2em]">{totalValid.toLocaleString()} valid samples tracked</p>
        </div>
        <button onClick={() => setShowDeepDive(!showDeepDive)} className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full border transition-all" style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }}>
          {showDeepDive ? 'Hide Breakdown' : 'See Breakdown'}
        </button>
      </div>

      <div className={`glass py-16 rounded-[4rem] border-white/5 flex flex-col items-center gap-16 shadow-2xl relative transition-all duration-500 ${showDeepDive ? 'scale-[1.01] border-white/20' : ''}`}>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {!isMany ? (
              <PieChart>
                <Pie data={data} innerRadius={100} outerRadius={155} paddingAngle={4} dataKey="value" stroke="none">
                  {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<div className="glass px-4 py-2 rounded-xl text-xs text-white border-white/10">Value: {data[0]?.value}</div>} />
              </PieChart>
            ) : (
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={160} />
                <Bar dataKey="value" fill={accent} radius={[0, 8, 8, 0]} barSize={32}>
                  {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend Mapping Section */}
        {renderLegend()}

        {showDeepDive && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-10 pt-16 border-t border-white/5 animate-in fade-in zoom-in-95 duration-500">
            {data.map((entry, i) => (
              <div key={i} className="flex flex-col gap-2 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[10px] text-slate-400 truncate font-black uppercase tracking-widest">{entry.name}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-white">{entry.value}</span>
                  <span className="text-[10px] font-mono-plex mb-1" style={{ color: accent }}>{entry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="pl-10 border-l-4 py-6 bg-white/5 rounded-r-[3rem]" style={{ borderLeftColor: `${accent}40` }}>
        <p className="text-slate-400 text-lg italic font-medium leading-relaxed max-w-4xl">{description}</p>
      </div>
    </div>
  );
};

// --- Views ---

const Navbar: React.FC<{ 
  user: User | null; theme: AppTheme; setTheme: (t: AppTheme) => void; onLogin: () => void; onLogout: () => void 
}> = ({ user, theme, setTheme, onLogin, onLogout }) => {
  const [showThemePanel, setShowThemePanel] = useState(false);
  const accentColor = THEME_ACCENTS[theme.accent];
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 px-10 py-6 flex items-center justify-between backdrop-blur-3xl">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xl transition-all group-hover:scale-110" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-6 h-6")}</div>
        <span className="text-white font-black tracking-[0.4em] font-mono-plex text-sm uppercase">Savvy</span>
      </Link>
      <div className="flex items-center gap-10">
        <div className="relative">
          <button onClick={() => setShowThemePanel(!showThemePanel)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: accentColor }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />Theme Studio
          </button>
          {showThemePanel && (
            <div className="absolute top-12 right-0 glass p-6 rounded-3xl w-64 space-y-6 shadow-2xl animate-in zoom-in-95 border-white/10 z-[1001]">
              <div className="space-y-3"><p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Accent Spectrum</p><div className="flex gap-3">{(Object.keys(THEME_ACCENTS) as AccentColor[]).map(a => (<button key={a} onClick={() => setTheme({ ...theme, accent: a })} className={`w-6 h-6 rounded-full border-2 transition-all ${theme.accent === a ? 'border-white scale-125' : 'border-transparent'}`} style={{ backgroundColor: THEME_ACCENTS[a] }} />))}</div></div>
              <div className="space-y-3"><p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Surface Logic</p><div className="grid grid-cols-1 gap-2">{(Object.keys(THEME_BGS) as BackgroundStyle[]).map(b => (<button key={b} onClick={() => setTheme({ ...theme, bgStyle: b })} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-left border transition-all ${theme.bgStyle === b ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent text-slate-600'}`}>{b} Strategy</button>))}</div></div>
            </div>
          )}
        </div>
        <div className="h-6 w-px bg-white/10"></div>
        {user ? (
          <div className="flex items-center gap-8">
            <Link to="/admin" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Console</Link>
            <button onClick={onLogout} className="text-[11px] font-black uppercase tracking-widest text-red-500/80">Exit</button>
          </div>
        ) : (
          <button onClick={onLogin} className="text-[11px] font-black uppercase tracking-widest text-sky-500">Authorize</button>
        )}
      </div>
    </nav>
  );
};

const SessionView: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const { id } = useParams<{ id: string }>();
  const session = sessions.find(s => s.id === id);
  const accent = THEME_ACCENTS[theme.accent];
  if (!session) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-black text-white tracking-tighter">NODE_OFFLINE</h1></div>;
  const visualColumns = session.columns.filter(c => c.isVisualizable);
  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-32">
      <header className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="flex items-center gap-8"><Link to="/" className="text-slate-500 hover:text-white transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg></Link><span className="w-20 h-1.5 rounded-full" style={{ backgroundColor: accent }}></span><span className="text-[13px] font-black uppercase tracking-[1em]" style={{ color: accent }}>Structural_Metrics</span></div>
        <div className="space-y-6"><h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[1.1]">{session.title}</h1><p className="text-slate-500 text-2xl max-w-4xl font-medium leading-relaxed">{session.description}</p></div>
        <div className="flex gap-16 pt-8">
          <div className="flex flex-col gap-2"><span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Aggregate Samples</span><span className="text-4xl font-black text-white font-mono-plex">{session.participationCount.toLocaleString()}</span></div>
          <div className="flex flex-col gap-2"><span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Protocol Sync</span><span className="text-4xl font-black text-emerald-500 font-mono-plex">Live</span></div>
        </div>
      </header>
      <div className="space-y-40">{visualColumns.map(col => (<DashboardItem key={col.id} col={col} responses={session.responses} description={session.columnDescriptions?.[col.id] || "Synthesizing descriptive patterns..."} theme={theme} />))}</div>
      <CompanionChat session={session} theme={theme} />
    </div>
  );
};

const AdminPanel: React.FC<{ sessions: Session[]; onCreate: (s: Session) => void; onDelete: (id: string) => void, theme: AppTheme }> = ({ sessions, onCreate, onDelete, theme }) => {
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
        const correlationData = calculateCorrelationMap(responses, columns);
        const newSession: Session = { id: `sav-${Date.now()}`, title: form.title, description: form.description, sourceName: selectedFile.name, participationCount: responses.length, lastUpdated: new Date().toISOString(), status: SessionStatus.LIVE, isPublic: true, columns, responses, showCharts: true, showAiInsights: true, enableCsvDownload: true, columnDescriptions: descriptions, correlationData };
        onCreate(newSession);
        // "Automatic" broadcast simulation
        Persistence.broadcastToRegistry(newSession);
        setIsCreating(false);
        setForm({ title: '', description: '' });
        setSelectedFile(null);
      };
      reader.readAsText(selectedFile);
    } catch (e) { alert("Analysis initialization failed."); } finally { setLoading(false); }
  };

  const publishToRegistry = (session: Session) => {
    Persistence.broadcastToRegistry(session);
    alert("Node synced to Global Registry. Visitors can now discover this protocol automatically on their dashboard.");
  };

  return (
    <div className="max-w-6xl mx-auto px-10 py-24 space-y-16">
      <div className="flex justify-between items-center">
        <div className="space-y-2"><h1 className="text-5xl font-black text-white font-mono-plex tracking-tighter uppercase">Cluster_Control</h1><p className="text-slate-500 text-xs font-mono-plex uppercase tracking-widest">Operational Core</p></div>
        <button onClick={() => setIsCreating(true)} className="px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl" style={{ backgroundColor: accent, color: '#000' }}>Initialize Node</button>
      </div>
      {isCreating && (
        <div className="glass p-12 rounded-[4rem] border-white/10 space-y-10 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <input placeholder="Cohort Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-white/30" />
              <textarea placeholder="Analytical abstract..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none h-40 resize-none" />
            </div>
            <div onClick={() => fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[3.5rem] p-16 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-6 ${selectedFile ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/10 hover:border-white/30'}`} style={selectedFile ? { borderColor: accent } : {}}>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="p-6 rounded-3xl bg-black/40" style={{ color: accent }}>{BIRD_LOGO("w-12 h-12")}</div>
              <p className="text-xl font-black text-white">{selectedFile ? selectedFile.name : 'Select CSV Dataset'}</p>
            </div>
          </div>
          <div className="flex gap-6 pt-10">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all disabled:opacity-20 shadow-2xl" style={{ backgroundColor: accent, color: '#000' }}>{loading ? 'Synthesizing...' : 'Sync Dataset'}</button>
            <button onClick={() => setIsCreating(false)} className="px-12 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-white">Abort</button>
          </div>
        </div>
      )}
      <div className="grid gap-8">
        {sessions.map(s => (
          <div key={s.id} className="glass p-10 rounded-[3.5rem] flex items-center justify-between group hover:border-white/20 transition-all duration-500">
            <div className="space-y-3">
              <h4 className="text-3xl font-black text-white tracking-tight">{s.title}</h4>
              <div className="flex items-center gap-6"><span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>{s.participationCount} Samples Tracked</span></div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => publishToRegistry(s)} className="p-5 text-sky-500 hover:bg-sky-500/10 rounded-[2rem] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">Sync to Global registry</button>
              <button onClick={() => onDelete(s.id)} className="p-5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-[2rem] transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const accent = THEME_ACCENTS[theme.accent];
  
  // Combine local and simulated public sessions
  const publicRegistry = Persistence.loadPublicRegistry();
  const allPublic = useMemo(() => {
    const combined = [...sessions, ...publicRegistry];
    // De-dupe by ID
    return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [sessions, publicRegistry]);

  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-32">
      <header className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="flex items-center gap-8"><span className="w-20 h-1.5 rounded-full" style={{ backgroundColor: accent }}></span><span className="text-[13px] font-black uppercase tracking-[1.2em]" style={{ color: accent }}>Operational Registry</span></div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[1.0] select-none">Collective Analysis.</h1>
        <p className="text-slate-500 text-2xl max-w-4xl font-light leading-relaxed tracking-tight italic">Integrated operational structural intelligence mirroring cohort trajectories. Select an active protocol below to begin synthesis.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {allPublic.length > 0 ? allPublic.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="group glass p-14 rounded-[5rem] hover:border-white/30 transition-all duration-1000 hover:-translate-y-6 flex flex-col h-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-14 right-14 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/5" style={{ color: `${accent}80` }}>Node_{s.status}</div>
            <h3 className="text-3xl font-black text-white mb-10 group-hover:text-white leading-[1.1] tracking-tighter mt-6 transition-all">{s.title}</h3>
            <p className="text-slate-500 text-lg mb-20 flex-1 leading-relaxed font-medium line-clamp-3">{s.description}</p>
            <div className="pt-14 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col"><span className="text-4xl font-black text-white font-mono-plex tracking-tighter">{s.participationCount.toLocaleString()}</span><span className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mt-3">Samples tracked</span></div>
              <div className="w-16 h-16 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all shadow-2xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></div>
            </div>
          </Link>
        )) : (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[5rem]">
            <p className="text-slate-700 font-black text-xs uppercase tracking-[0.5em]">No active discovery nodes detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(Persistence.load());
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState<AppTheme>({ accent: 'sky', bgStyle: 'deep' });
  const [searchParams] = useSearchParams();

  // URL Injection Logic (Automatic Cross-User Sharing)
  useEffect(() => {
    const injectData = searchParams.get('inject');
    if (injectData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(injectData))));
        setSessions(prev => {
          if (prev.find(s => s.id === decoded.id)) return prev;
          const updated = [decoded, ...prev];
          return updated;
        });
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      } catch (e) { console.error("Injection failed", e); }
    }
  }, [searchParams]);

  useEffect(() => { Persistence.save(sessions); }, [sessions]);
  useEffect(() => { const root = document.documentElement; root.style.setProperty('--accent-color', THEME_ACCENTS[theme.accent]); root.style.setProperty('--bg-gradient', THEME_BGS[theme.bgStyle]); }, [theme]);
  
  return (
    <div className="min-h-screen transition-all duration-1000 selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <Navbar user={user} theme={theme} setTheme={setTheme} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass p-20 rounded-[5rem] w-full max-w-lg text-center border-white/10 shadow-2xl">
            <div className="mb-12 flex justify-center" style={{ color: THEME_ACCENTS[theme.accent] }}>{BIRD_LOGO("w-20 h-20")}</div>
            <h2 className="text-6xl font-black text-white mb-12 tracking-tighter uppercase font-mono-plex">Access_Gate</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              const pass = (e.target as any).pass.value;
              if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') { setUser(MOCK_USERS[0]); setShowLogin(false); }
            }} className="space-y-6">
              <input name="email" placeholder="Node identifier" className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-white outline-none focus:border-white/30 font-bold" />
              <input name="pass" type="password" placeholder="Protocol Key" className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-white outline-none focus:border-white/30 font-bold" />
              <button type="submit" className="w-full bg-white text-black font-black py-7 rounded-[2rem] uppercase tracking-[0.4em] text-[12px] mt-8 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl">Authorize Link</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="mt-12 text-slate-700 text-[11px] uppercase font-black tracking-widest hover:text-slate-400">Abort</button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage sessions={sessions} theme={theme} />} />
        <Route path="/session/:id" element={<SessionView sessions={sessions} theme={theme} />} />
        <Route path="/admin" element={<AdminPanel sessions={sessions} theme={theme} onCreate={s => setSessions(p => [s, ...p])} onDelete={id => setSessions(p => p.filter(x => x.id !== id))} />} />
      </Routes>
      <footer className="mt-80 border-t border-white/5 py-48 px-10 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-32">
          <div className="space-y-12">
            <div className="flex items-center gap-6"><div className="w-14 h-14 rounded-3xl flex items-center justify-center text-black font-black text-3xl shadow-2xl" style={{ backgroundColor: THEME_ACCENTS[theme.accent] }}>S</div><span className="text-white font-black tracking-[0.6em] font-mono-plex uppercase text-2xl">Savvy_Hub</span></div>
            <p className="text-slate-600 text-xl max-w-md leading-relaxed font-medium italic">Operational structural intelligence mirroring cohort trajectories. Structural transparency via mapping protocols.</p>
          </div>
          <div className="space-y-16 max-w-3xl">
            <div className="space-y-8">
              <p className="text-slate-700 text-sm uppercase font-black tracking-tight leading-relaxed italic">Official results and outcomes are strictly published via <a href="https://t.me/Savvy_Society" className="text-white hover:underline">t.me/Savvy_Society</a>.</p>
              <div className="flex gap-12 pt-6"><a href="https://t.me/Savvy_Society" className="text-[12px] font-black uppercase tracking-widest transition-all" style={{ color: THEME_ACCENTS[theme.accent] }}>Telegram Operational Hub</a></div>
            </div>
            <p className="text-slate-800 text-[12px] font-mono-plex font-black uppercase tracking-[0.5em]">© 2024 SAVVY SOCIETY :: ANALYTIC NODE 9.9 :: PATTERNS NEUTRALIZED</p>
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
