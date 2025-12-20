
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams } from 'react-router-dom';
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

// --- Persistence Service ---
const STORAGE_KEY = 'savvy_sessions_registry_v1';
const Persistence = {
  save: (sessions: Session[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },
  load: (): Session[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : INITIAL_SESSIONS;
  }
};

// --- Data Parsing Helper ---
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
    // Heuristic: If it has few unique values relative to size, it's categorical
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

// --- Custom Components ---

const CustomTooltip = ({ active, payload, theme }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const accent = THEME_ACCENTS[theme.accent];
    return (
      <div className="glass px-4 py-3 rounded-2xl border-white/10 shadow-2xl backdrop-blur-2xl">
        <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{data.name}</p>
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{col.label}</h4>
          <p className="text-[10px] text-slate-500 font-mono-plex uppercase tracking-[0.2em]">{totalValid.toLocaleString()} samples analyzed</p>
        </div>
        <button 
          onClick={() => setShowDeepDive(!showDeepDive)}
          className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full border transition-all"
          style={{ borderColor: `${accent}30`, color: accent, backgroundColor: `${accent}05` }}
        >
          {showDeepDive ? 'Collapse Synthesis' : 'Expand Data Breakdown'}
        </button>
      </div>

      <div className={`glass p-12 rounded-[3.5rem] border-white/5 flex flex-col items-center gap-14 shadow-2xl relative transition-all duration-500 ${showDeepDive ? 'border-white/20' : ''}`}>
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            {!isMany ? (
              <PieChart>
                <Pie 
                  data={data} 
                  innerRadius={110} 
                  outerRadius={160} 
                  paddingAngle={4} 
                  dataKey="value" 
                  stroke="none"
                >
                  {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip theme={theme} />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{value}</span>}
                />
              </PieChart>
            ) : (
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60, bottom: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700, textAnchor: 'end' }} 
                  width={160} 
                />
                <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={28}>
                   {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="rect"
                  formatter={(value) => <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{value}</span>}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {showDeepDive && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
            {data.map((entry, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[9px] text-slate-400 truncate font-black uppercase tracking-widest">{entry.name}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-white">{entry.value}</span>
                  <span className="text-[10px] font-mono-plex" style={{ color: accent }}>{entry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="pl-10 border-l-2 py-6 bg-white/5 rounded-r-3xl" style={{ borderLeftColor: `${accent}60` }}>
        <p className="text-slate-400 text-lg italic font-medium leading-relaxed max-w-4xl tracking-tight">
          {description}
        </p>
      </div>
    </div>
  );
};

const CompanionChat: React.FC<{ session: Session, theme: AppTheme }> = ({ session, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Node sequence initialized. Analyzing structural trends for "${session.title}". How can I assist?` }
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
              <span className="text-black font-black text-xs uppercase tracking-[0.2em]">Companion_Node</span>
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
            {loading && <div className="flex justify-start"><div className="bg-white/5 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse" style={{ color: accentColor }}>Querying Matrix...</div></div>}
          </div>
          <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about specific patterns..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-white/30 transition-all"
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

// --- Page Views ---

const Navbar: React.FC<{ user: User | null; theme: AppTheme; setTheme: (t: AppTheme) => void; onLogin: () => void; onLogout: () => void }> = ({ user, theme, setTheme, onLogin, onLogout }) => {
  const [showThemePanel, setShowThemePanel] = useState(false);
  const accentColor = THEME_ACCENTS[theme.accent];
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 px-10 py-6 flex items-center justify-between backdrop-blur-3xl">
      <Link to="/" className="flex items-center gap-4 group">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-xl transition-all group-hover:scale-110" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-6 h-6")}</div>
        <span className="text-white font-black tracking-[0.4em] font-mono-plex text-sm uppercase">Savvy_Hub</span>
      </Link>
      <div className="flex items-center gap-10">
        <div className="relative">
          <button onClick={() => setShowThemePanel(!showThemePanel)} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: accentColor }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />Interface Setup
          </button>
          {showThemePanel && (
            <div className="absolute top-12 right-0 glass p-7 rounded-3xl w-72 space-y-8 shadow-2xl animate-in zoom-in-95 border-white/10 z-[1001]">
              <div className="space-y-4">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Accent Logic</p>
                <div className="flex gap-4">
                  {(Object.keys(THEME_ACCENTS) as AccentColor[]).map(a => (
                    <button key={a} onClick={() => setTheme({ ...theme, accent: a })} className={`w-7 h-7 rounded-full border-2 transition-all ${theme.accent === a ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-60'}`} style={{ backgroundColor: THEME_ACCENTS[a] }} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Surface Density</p>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(THEME_BGS) as BackgroundStyle[]).map(b => (
                    <button key={b} onClick={() => setTheme({ ...theme, bgStyle: b })} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-left border transition-all ${theme.bgStyle === b ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-slate-600'}`}>Protocol: {b}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="h-6 w-px bg-white/10"></div>
        {user ? (
          <div className="flex items-center gap-10">
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors">Cluster_Control</Link>
            <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 hover:text-red-500">Detach</button>
          </div>
        ) : (
          <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 hover:text-sky-400">Authorize</button>
        )}
      </div>
    </nav>
  );
};

const HomePage: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const accent = THEME_ACCENTS[theme.accent];
  const publicSessions = sessions.filter(s => s.isPublic);

  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-36">
      <header className="space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
        <div className="flex items-center gap-8">
          <span className="w-20 h-1 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[14px] font-black uppercase tracking-[1em]" style={{ color: accent }}>Registry Protocol Active</span>
        </div>
        <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[1.0] max-w-4xl select-none">
          Collective <br/>Structural Analysis.
        </h1>
        <p className="text-slate-500 text-3xl max-w-4xl font-light leading-relaxed tracking-tight italic">
          Neutral operational intelligence mirroring cohort trajectories. Select a synchronized protocol below to access structural synthesis.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
        {publicSessions.length > 0 ? publicSessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="group glass p-14 rounded-[4.5rem] hover:border-white/30 transition-all duration-1000 hover:-translate-y-6 flex flex-col h-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-14 right-14 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/5" style={{ color: `${accent}80` }}>Node_{s.status}</div>
            <h3 className="text-3xl font-black text-white mb-8 group-hover:text-white leading-[1.1] tracking-tighter mt-6 transition-all">{s.title}</h3>
            <p className="text-slate-500 text-lg mb-16 flex-1 leading-relaxed font-medium line-clamp-3 italic opacity-80">{s.description}</p>
            <div className="pt-14 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white font-mono-plex tracking-tighter">{s.participationCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mt-3">Samples Registered</span>
              </div>
              <div className="w-16 h-16 rounded-[2.2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all shadow-2xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        )) : (
          <div className="col-span-full py-48 text-center border-2 border-dashed border-white/5 rounded-[5rem]">
            <p className="text-slate-800 font-black text-xs uppercase tracking-[0.6em]">No active discovery nodes detected in perimeter</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SessionView: React.FC<{ sessions: Session[], theme: AppTheme }> = ({ sessions, theme }) => {
  const { id } = useParams<{ id: string }>();
  const session = sessions.find(s => s.id === id);
  const accent = THEME_ACCENTS[theme.accent];

  if (!session) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-3xl font-black text-white tracking-widest">PROTOCOL_MISMATCH</h1></div>;
  
  const visualColumns = session.columns.filter(c => c.isVisualizable);

  return (
    <div className="max-w-7xl mx-auto px-10 py-32 space-y-40">
      <header className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-slate-600 hover:text-white transition-colors">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <span className="w-20 h-1.5 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[14px] font-black uppercase tracking-[1em]" style={{ color: accent }}>Analysis Matrix</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-[1.0]">{session.title}</h1>
          <p className="text-slate-500 text-2xl max-w-5xl font-medium leading-relaxed italic">{session.description}</p>
        </div>
        <div className="flex gap-20 pt-10">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">Aggregated Samples</span>
            <span className="text-5xl font-black text-white font-mono-plex tracking-tighter">{session.participationCount.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">Integrity Level</span>
            <span className="text-5xl font-black text-emerald-500 font-mono-plex tracking-tighter">Certified</span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">Status</span>
            <span className="text-5xl font-black text-white font-mono-plex tracking-tighter">Live</span>
          </div>
        </div>
      </header>

      <div className="space-y-52">
        {visualColumns.map(col => (
          <DashboardItem 
            key={col.id} 
            col={col} 
            responses={session.responses} 
            description={session.columnDescriptions?.[col.id] || "Synthesizing descriptive patterns for this data segment..."} 
            theme={theme} 
          />
        ))}
      </div>
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
          columnDescriptions: descriptions, 
          correlationData 
        };
        onCreate(newSession);
        setIsCreating(false);
        setForm({ title: '', description: '' });
        setSelectedFile(null);
        alert("Node synchronized. The analysis is now automatically available on the discovery registry.");
      };
      reader.readAsText(selectedFile);
    } catch (e) { alert("Initialization error."); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-10 py-32 space-y-20">
      <div className="flex justify-between items-center border-b border-white/10 pb-12">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white font-mono-plex tracking-tighter uppercase">Cluster_Admin</h1>
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Integrated Operational Hub</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl hover:scale-105" style={{ backgroundColor: accent, color: '#000' }}>Add Cluster Node</button>
      </div>

      {isCreating && (
        <div className="glass p-16 rounded-[4rem] border-white/10 space-y-12 animate-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Node Identity</label>
                <input placeholder="Cohort Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white outline-none focus:border-white/30 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Protocol Abstract</label>
                <textarea placeholder="Analytical context..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white outline-none h-44 resize-none italic font-medium" />
              </div>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[4rem] p-20 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-8 ${selectedFile ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/10 hover:border-white/30'}`} style={selectedFile ? { borderColor: accent } : {}}>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="p-7 rounded-[2rem] bg-black/40" style={{ color: accent }}>{BIRD_LOGO("w-14 h-14")}</div>
              <p className="text-2xl font-black text-white">{selectedFile ? selectedFile.name : 'Inject CSV Dataset'}</p>
              <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Standard Sheet Format Required</p>
            </div>
          </div>
          <div className="flex gap-8 pt-6">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] transition-all disabled:opacity-20 shadow-2xl" style={{ backgroundColor: accent, color: '#000' }}>{loading ? 'Synthesizing...' : 'Initialize Registry Link'}</button>
            <button onClick={() => setIsCreating(false)} className="px-14 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:text-white">Abort</button>
          </div>
        </div>
      )}

      <div className="grid gap-10">
        {sessions.map(s => (
          <div key={s.id} className="glass p-12 rounded-[4rem] flex items-center justify-between group hover:border-white/20 transition-all duration-500">
            <div className="space-y-4">
              <h4 className="text-3xl font-black text-white tracking-tight uppercase">{s.title}</h4>
              <div className="flex items-center gap-8">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>{s.participationCount} Samples Tracked</span>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest border border-emerald-500/20 px-4 py-1.5 rounded-full">Public Discovery Active</span>
              </div>
            </div>
            <button onClick={() => onDelete(s.id)} className="p-7 text-slate-800 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(Persistence.load());
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState<AppTheme>({ accent: 'sky', bgStyle: 'deep' });

  useEffect(() => { Persistence.save(sessions); }, [sessions]);
  useEffect(() => { const root = document.documentElement; root.style.setProperty('--accent-color', THEME_ACCENTS[theme.accent]); root.style.setProperty('--bg-gradient', THEME_BGS[theme.bgStyle]); }, [theme]);
  
  return (
    <div className="min-h-screen transition-all duration-1000 selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <Navbar user={user} theme={theme} setTheme={setTheme} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass p-20 rounded-[5rem] w-full max-w-lg text-center border-white/10 shadow-2xl">
            <div className="mb-14 flex justify-center" style={{ color: THEME_ACCENTS[theme.accent] }}>{BIRD_LOGO("w-24 h-24")}</div>
            <h2 className="text-6xl font-black text-white mb-14 tracking-tighter uppercase font-mono-plex">Admin_Gate</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              const pass = (e.target as any).pass.value;
              if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') { setUser(MOCK_USERS[0]); setShowLogin(false); }
              else alert("Invalid Key Protocol.");
            }} className="space-y-6">
              <input name="email" placeholder="Identifier" className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-7 text-white outline-none focus:border-white/30 font-bold text-center" />
              <input name="pass" type="password" placeholder="Protocol Key" className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-8 py-7 text-white outline-none focus:border-white/30 font-bold text-center" />
              <button type="submit" className="w-full bg-white text-black font-black py-8 rounded-[2.5rem] uppercase tracking-[0.5em] text-[13px] mt-10 hover:scale-[1.03] active:scale-95 transition-all shadow-2xl">Authorize Cluster</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="mt-14 text-slate-700 text-[11px] uppercase font-black tracking-widest hover:text-slate-400">Abort Security Check</button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage sessions={sessions} theme={theme} />} />
        <Route path="/session/:id" element={<SessionView sessions={sessions} theme={theme} />} />
        <Route path="/admin" element={<AdminPanel sessions={sessions} theme={theme} onCreate={s => setSessions(p => [s, ...p])} onDelete={id => setSessions(p => p.filter(x => x.id !== id))} />} />
      </Routes>
      <footer className="mt-80 border-t border-white/5 py-56 px-10 bg-black/60 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-32">
          <div className="space-y-16">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center text-black font-black text-4xl shadow-2xl" style={{ backgroundColor: THEME_ACCENTS[theme.accent] }}>S</div>
              <span className="text-white font-black tracking-[0.6em] font-mono-plex uppercase text-3xl">Savvy_Sys</span>
            </div>
            <p className="text-slate-600 text-2xl max-w-lg leading-relaxed font-medium italic opacity-60">Integrated structural intelligence mirroring cohort trajectories. Structural transparency via mapping protocols.</p>
          </div>
          <div className="space-y-20 max-w-3xl">
            <div className="space-y-10">
              <p className="text-slate-700 text-sm uppercase font-black tracking-tight leading-relaxed italic border-l-2 border-white/5 pl-8">Official results, admission lists, and individual outcomes are strictly bound to <a href="https://t.me/Savvy_Society" className="text-white hover:underline transition-all">t.me/Savvy_Society</a>.</p>
              <div className="flex gap-14 pt-8">
                 <a href="https://t.me/Savvy_Society" className="text-[13px] font-black uppercase tracking-[0.4em] transition-all hover:opacity-80" style={{ color: THEME_ACCENTS[theme.accent] }}>Telegram Operational Hub</a>
                 <a href="#" className="text-[13px] font-black text-slate-800 uppercase tracking-[0.4em] hover:text-slate-400 transition-all">Registry Protocols</a>
              </div>
            </div>
            <p className="text-slate-800 text-[12px] font-mono-plex font-black uppercase tracking-[0.6em]">© 2024 SAVVY SOCIETY :: ANALYTIC NODE 10.0 :: PATTERNS NEUTRALIZED</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RootWrapper = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default RootWrapper;
