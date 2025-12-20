
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell as RechartsCell
} from 'recharts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { MOCK_USERS } from './constants';
import { Session, SessionStatus, User, RawResponse, SurveyColumn, AppTheme, AccentColor, BackgroundStyle, UserRole } from './types';
import { generateQuestionDescriptions, chatWithCompanion } from './geminiService';

// --- Supabase Configuration ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Visual Constants ---
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

// --- Persistent Supabase Registry Store ---
const SupabaseStore = {
  /**
   * Fetches sessions from Supabase.
   * If isAdmin is false, only fetches sessions where is_public is true.
   */
  async sync(isAdmin: boolean = false): Promise<Session[]> {
    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        sourceName: s.source_name,
        participationCount: s.participation_count,
        lastUpdated: s.last_updated,
        status: s.status as SessionStatus,
        isPublic: s.is_public,
        columns: s.columns as SurveyColumn[],
        responses: s.responses as RawResponse[],
        columnDescriptions: s.column_descriptions as Record<string, string>,
        showCharts: true,
        showAiInsights: true,
        enableCsvDownload: true
      }));
    } catch (e) {
      console.error("Supabase Sync Failure", e);
      return [];
    }
  },

  async commit(session: Session) {
    const { error } = await supabase
      .from('sessions')
      .insert([{
        id: session.id,
        title: session.title,
        description: session.description,
        source_name: session.sourceName,
        participation_count: session.participationCount,
        last_updated: session.lastUpdated,
        status: session.status,
        is_public: session.isPublic,
        columns: session.columns,
        responses: session.responses,
        column_descriptions: session.columnDescriptions
      }]);
    
    if (error) throw error;
  },

  async updateVisibility(id: string, isPublic: boolean) {
    const { error } = await supabase
      .from('sessions')
      .update({ is_public: isPublic })
      .eq('id', id);
    
    if (error) throw error;
  },

  async detach(id: string) {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// --- Data Parsers & Utilities ---
const parseCSV = (csv: string): { columns: SurveyColumn[], responses: RawResponse[] } => {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return { columns: [], responses: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const filteredHeaders = headers.filter(h => {
    const lower = h.toLowerCase();
    return !lower.includes('timestamp') && !lower.includes('name') && !lower.includes('email');
  });
  
  const columns: SurveyColumn[] = filteredHeaders.map((h, i) => ({
    id: `q${i}`,
    label: h,
    type: 'categorical',
    isVisualizable: true
  }));

  const responses: RawResponse[] = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const response: RawResponse = {};
    headers.forEach((h, originalIdx) => {
      const col = columns.find(c => c.label === h);
      if (col) {
        response[col.id] = values[originalIdx] || '';
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
      const sVal = String(val).trim();
      dist[sVal] = (dist[sVal] || 0) + 1;
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

// --- Specialized UI Components ---

const MetadataModule: React.FC<{ session: Session, accent: string }> = ({ session, accent }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-in fade-in slide-in-from-top-4 duration-1000">
    <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Source</span>
      <span className="text-white font-mono-plex text-sm truncate">{session.sourceName || "Internal Registry"}</span>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Registry Sync Date</span>
      <span className="text-white font-mono-plex text-sm">{new Date(session.lastUpdated).toLocaleDateString()}</span>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sample Population</span>
      <span className="text-white font-mono-plex text-sm font-bold">{session.participationCount.toLocaleString()} Entries</span>
    </div>
    <div className="glass p-6 rounded-3xl border-white/5 flex flex-col gap-2">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Node Visibility</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${session.isPublic ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${session.isPublic ? 'text-emerald-500' : 'text-rose-500'}`}>
          {session.isPublic ? 'Published' : 'Hidden'}
        </span>
      </div>
    </div>
  </div>
);

const MatrixLegend: React.FC<{ data: any[], accent: string }> = ({ data, accent }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full px-10 pb-8 mt-10">
    {data.map((entry, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-default">
        <div 
          className="w-4 h-4 rounded shadow-lg transition-transform group-hover:scale-125 shrink-0" 
          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} 
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-300 font-black uppercase tracking-tighter truncate">{entry.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-plex font-bold" style={{ color: accent }}>{entry.percentage}%</span>
            <span className="text-[9px] text-slate-600 font-mono-plex">n={entry.value}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, accent }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass px-6 py-4 rounded-2xl border-white/10 shadow-2xl backdrop-blur-3xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{data.name}</p>
        <div className="flex items-baseline gap-4">
          <span className="text-2xl font-mono-plex font-black" style={{ color: accent }}>{data.percentage}%</span>
          <span className="text-[10px] text-slate-500 font-mono-plex">n={data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticalReportItem: React.FC<{ 
  col: SurveyColumn, 
  responses: RawResponse[], 
  description: string, 
  theme: AppTheme 
}> = ({ col, responses, description, theme }) => {
  const { data, totalValid } = useMemo(() => getColumnDist(responses, col.id), [responses, col.id]);
  const accent = THEME_ACCENTS[theme.accent];
  const isMany = data.length > 8;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="border-b border-white/5 pb-8">
        <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">{col.label}</h4>
        <p className="text-[10px] text-slate-600 font-mono-plex uppercase tracking-[0.5em]">{totalValid.toLocaleString()} data points synchronized</p>
      </div>

      <div className="glass py-24 rounded-[5rem] border-white/5 flex flex-col items-center gap-10 shadow-2xl relative overflow-hidden bg-white/[0.01]">
        <div className="w-full h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            {!isMany ? (
              <PieChart>
                <Pie 
                  data={data} innerRadius={130} outerRadius={190} paddingAngle={8} dataKey="value" stroke="none"
                  animationBegin={0} animationDuration={1200}
                >
                  {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip accent={accent} />} />
              </PieChart>
            ) : (
              <BarChart data={data} layout="vertical" margin={{ left: 40, right: 80, bottom: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900, textAnchor: 'end' }} width={180} />
                <Tooltip content={<CustomTooltip accent={accent} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 16, 16, 0]} barSize={34}>
                   {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <MatrixLegend data={data} accent={accent} />
      </div>

      <div className="pl-14 border-l-4 py-8 bg-white/[0.03] rounded-r-[3rem] shadow-sm italic" style={{ borderLeftColor: `${accent}90` }}>
        <p className="text-slate-400 text-2xl font-medium leading-relaxed max-w-6xl tracking-tight">
          {description || "Awaiting structural synthesis of this specific cohort segment..."}
        </p>
      </div>
    </div>
  );
};

// --- Main Page Views ---

const Navbar: React.FC<{ user: User | null; theme: AppTheme; onLogin: () => void; onLogout: () => void }> = ({ user, theme, onLogin, onLogout }) => {
  const accentColor = THEME_ACCENTS[theme.accent];
  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 px-12 py-8 flex items-center justify-between backdrop-blur-3xl">
      <Link to="/" className="flex items-center gap-5 group">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black shadow-2xl transition-all group-hover:scale-110" style={{ backgroundColor: accentColor }}>{BIRD_LOGO("w-7 h-7")}</div>
        <span className="text-white font-black tracking-[0.5em] font-mono-plex text-[14px] uppercase">Savvy_Hub</span>
      </Link>
      <div className="flex items-center gap-12">
        <Link to="/" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Registry</Link>
        {user ? (
          <>
            <Link to="/admin" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Admin_Core</Link>
            <button onClick={onLogout} className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500/80 hover:text-rose-500">Detach</button>
          </>
        ) : (
          <button onClick={onLogin} className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.3em] text-sky-500 hover:bg-white/10 transition-all">Authorize Access</button>
        )}
      </div>
    </nav>
  );
};

const HomePage: React.FC<{ sessions: Session[], theme: AppTheme, user: User | null }> = ({ sessions, theme, user }) => {
  const accent = THEME_ACCENTS[theme.accent];
  return (
    <div className="max-w-7xl mx-auto px-12 py-40 space-y-48">
      <header className="space-y-16 animate-in fade-in slide-in-from-left-12 duration-1000">
        <div className="flex items-center gap-12">
          <span className="w-24 h-1 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[16px] font-black uppercase tracking-[1.4em]" style={{ color: accent }}>Global Registry</span>
        </div>
        <div className="space-y-10">
          <h1 className="text-7xl sm:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] max-w-6xl">
            Structural <br/>Cohort Intelligence.
          </h1>
          <p className="text-slate-500 text-3xl max-w-5xl font-light leading-relaxed tracking-tight italic opacity-90">
            A public dashboard for visualizing aggregated freshman preferences and academic benchmarks. All sessions are neutral, descriptive analytical nodes.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
        {sessions.map(s => (
          <Link key={s.id} to={`/session/${s.id}`} className="group glass p-16 rounded-[5rem] hover:border-white/30 transition-all duration-1000 hover:-translate-y-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
            {!s.isPublic && <div className="absolute top-10 left-10 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/10">Private Node</div>}
            <h3 className="text-4xl font-black text-white mb-10 group-hover:text-white leading-[1.0] tracking-tighter mt-12 transition-all">{s.title}</h3>
            <p className="text-slate-500 text-xl mb-24 flex-1 leading-relaxed font-medium line-clamp-3 italic opacity-70 group-hover:opacity-100 transition-opacity">{s.description}</p>
            <div className="pt-16 border-t border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-6xl font-black text-white font-mono-plex tracking-tighter">{s.participationCount.toLocaleString()}</span>
                <span className="text-[11px] text-slate-700 uppercase font-black tracking-[0.5em] mt-4">Verified Samples</span>
              </div>
              <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black transition-all shadow-2xl">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </div>
          </Link>
        ))}
        {sessions.length === 0 && (
          <div className="col-span-full py-64 text-center border-4 border-dashed border-white/5 rounded-[6rem] flex flex-col items-center justify-center gap-10">
            <p className="text-slate-800 font-black text-2xl uppercase tracking-[0.6em] italic">No discovery nodes detected in registry.</p>
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

  if (!session) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-black text-white tracking-[0.5em] uppercase">Node_Offline</h1></div>;
  
  const visualColumns = session.columns.filter(c => c.isVisualizable);

  return (
    <div className="max-w-7xl mx-auto px-12 py-40 space-y-48">
      <header className="space-y-16 animate-in fade-in slide-in-from-left-8 duration-1000">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-slate-600 hover:text-white transition-all hover:scale-125 p-2 rounded-full hover:bg-white/5">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          </Link>
          <span className="w-24 h-2 rounded-full" style={{ backgroundColor: accent }}></span>
          <span className="text-[16px] font-black uppercase tracking-[1.6em]" style={{ color: accent }}>Operational Node</span>
        </div>
        <div className="space-y-10">
          <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">{session.title}</h1>
          <p className="text-slate-500 text-3xl max-w-6xl font-medium leading-relaxed italic opacity-90">{session.description}</p>
        </div>
        
        <MetadataModule session={session} accent={accent} />
      </header>

      <div className="space-y-80">
        {visualColumns.map(col => (
          <AnalyticalReportItem 
            key={col.id} 
            col={col} 
            responses={session.responses} 
            description={session.columnDescriptions?.[col.id] || "Synthesizing structural patterns..."} 
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
          isPublic: false, 
          columns, 
          responses, 
          showCharts: true, 
          showAiInsights: true, 
          enableCsvDownload: true, 
          columnDescriptions: descriptions
        };
        await SupabaseStore.commit(newSession);
        onRefresh();
        setIsCreating(false);
        setForm({ title: '', description: '' });
        setSelectedFile(null);
      };
      reader.readAsText(selectedFile);
    } catch (e) { alert("Registry synchronization failure."); } finally { setLoading(false); }
  };

  const toggleVisibility = async (session: Session) => {
    await SupabaseStore.updateVisibility(session.id, !session.isPublic);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Detach analysis node from global registry?")) {
      await SupabaseStore.detach(id);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-12 py-32 space-y-24">
      <div className="flex justify-between items-center border-b border-white/10 pb-16">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white font-mono-plex tracking-tighter uppercase leading-none">Registry_Control</h1>
          <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.6em]">Node Operational Cluster</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-16 py-8 rounded-[3rem] font-black text-[12px] uppercase tracking-[0.5em] transition-all shadow-2xl bg-white text-black hover:scale-105 active:scale-95">Inject Node</button>
      </div>

      {isCreating && (
        <div className="glass p-20 rounded-[6rem] border-white/10 space-y-16 animate-in zoom-in-95 duration-1000">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-8">Cohort Label</label>
                <input placeholder="Analytical Title..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-12 py-8 text-white outline-none focus:border-white/40 font-bold" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-8">Analytical Summary</label>
                <textarea placeholder="Describe structural context..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[3rem] px-12 py-8 text-white outline-none h-48 resize-none font-medium italic" />
              </div>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className={`border-4 border-dashed rounded-[6rem] p-24 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-12 ${selectedFile ? 'bg-white/10 border-white/50' : 'bg-white/5 border-white/10 hover:border-white/30'}`} style={selectedFile ? { borderColor: accent } : {}}>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <div className="p-10 rounded-[3rem] bg-black/50" style={{ color: accent }}>{BIRD_LOGO("w-20 h-20")}</div>
              <p className="text-4xl font-black text-white">{selectedFile ? selectedFile.name : 'Upload Matrix'}</p>
              <p className="text-[12px] text-slate-700 font-bold uppercase tracking-[0.4em]">CSV Source Matrix Required</p>
            </div>
          </div>
          <div className="flex gap-10 pt-10">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 py-10 rounded-[4rem] font-black uppercase tracking-[0.6em] text-[15px] transition-all disabled:opacity-20 shadow-2xl bg-sky-500 text-black">{loading ? 'Synthesizing...' : 'Sync to Registry'}</button>
            <button onClick={() => setIsCreating(false)} className="px-20 text-slate-700 font-black text-[13px] uppercase tracking-widest hover:text-white transition-colors">Abort</button>
          </div>
        </div>
      )}

      <div className="grid gap-16">
        {sessions.map(s => (
          <div key={s.id} className="glass p-16 rounded-[6rem] flex items-center justify-between group hover:border-white/30 transition-all duration-1000 shadow-xl border-white/5">
            <div className="space-y-6 ml-10">
              <h4 className="text-4xl font-black text-white tracking-tighter uppercase">{s.title}</h4>
              <div className="flex items-center gap-12">
                <span className="text-[12px] font-black uppercase tracking-[0.3em]" style={{ color: accent }}>{s.participationCount} Samples</span>
                <span className={`text-[11px] font-black uppercase tracking-[0.4em] border px-6 py-2.5 rounded-full ${s.isPublic ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-rose-500/20 text-rose-500 bg-rose-500/5'}`}>
                  {s.isPublic ? 'Published Discovery' : 'Private Node'}
                </span>
                <span className="text-[10px] text-slate-700 font-mono-plex uppercase">{new Date(s.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-8 mr-6">
              <button 
                onClick={() => toggleVisibility(s)}
                className={`px-12 py-5 rounded-full font-black text-[11px] uppercase tracking-widest transition-all ${s.isPublic ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' : 'bg-emerald-500 text-black'}`}
              >
                {s.isPublic ? 'Unpublish' : 'Publish'}
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-10 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all hover:scale-125">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
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

  const refreshRegistry = async (isAdmin: boolean) => {
    setRegistryLoading(true);
    const data = await SupabaseStore.sync(isAdmin);
    setSessions(data);
    setRegistryLoading(false);
  };

  useEffect(() => {
    refreshRegistry(!!user);
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', THEME_ACCENTS[theme.accent]);
  }, [theme]);
  
  return (
    <div className="min-h-screen transition-all duration-1000 selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <Navbar user={user} theme={theme} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
      
      {registryLoading && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-10">
            <div className="w-24 h-24 border-[8px] border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-[14px] font-black uppercase tracking-[1em] text-white animate-pulse">Synchronizing Registry Core...</p>
          </div>
        </div>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-12 backdrop-blur-3xl animate-in fade-in duration-700">
          <div className="glass p-24 rounded-[7rem] w-full max-w-2xl text-center border-white/10 shadow-2xl bg-white/[0.01]">
            <h2 className="text-7xl font-black text-white mb-20 tracking-tighter uppercase font-mono-plex">Admin_Gate</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              const pass = (e.target as any).pass.value;
              if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') { setUser(MOCK_USERS[0]); setShowLogin(false); }
              else alert("Security Protocol Failure.");
            }} className="space-y-10">
              <input name="email" placeholder="Identifier" className="w-full bg-white/5 border border-white/10 rounded-[3.5rem] px-12 py-10 text-white outline-none focus:border-white/40 font-bold text-center tracking-[0.4em] uppercase text-xs" />
              <input name="pass" type="password" placeholder="Key Sequence" className="w-full bg-white/5 border border-white/10 rounded-[3.5rem] px-12 py-10 text-white outline-none focus:border-white/40 font-bold text-center tracking-[0.4em] text-xs" />
              <button type="submit" className="w-full bg-white text-black font-black py-10 rounded-[3.5rem] uppercase tracking-[0.8em] text-[16px] mt-16 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl">Authorize Cluster</button>
            </form>
            <button onClick={() => setShowLogin(false)} className="mt-20 text-slate-800 text-[14px] uppercase font-black tracking-[0.5em] hover:text-slate-500 transition-colors">Abort Session</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage sessions={sessions} theme={theme} user={user} />} />
        <Route path="/session/:id" element={<SessionView sessions={sessions} theme={theme} user={user} />} />
        <Route path="/admin" element={user ? <AdminPanel sessions={sessions} onRefresh={() => refreshRegistry(true)} theme={theme} /> : <Navigate to="/" />} />
      </Routes>

      <footer className="mt-96 border-t border-white/5 py-80 px-12 bg-black/90 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-48">
          <div className="space-y-28">
            <div className="flex items-center gap-12">
              <div className="w-24 h-24 rounded-[3.5rem] flex items-center justify-center text-black font-black text-6xl shadow-2xl" style={{ backgroundColor: THEME_ACCENTS[theme.accent] }}>S</div>
              <span className="text-white font-black tracking-[1em] font-mono-plex uppercase text-5xl">Savvy_Hub</span>
            </div>
            <p className="text-slate-600 text-3xl max-w-2xl leading-relaxed font-medium italic opacity-50">Integrated structural intelligence nodes mirroring cohort trajectories. Neutral operational mapping for admission transparency.</p>
          </div>
          <div className="space-y-32 max-w-3xl">
            <div className="space-y-20">
              <p className="text-slate-700 text-[13px] uppercase font-black tracking-[0.1em] leading-relaxed italic border-l-4 border-white/5 pl-12 opacity-60">Admission protocols and final cohort lists are exclusively released via <a href="https://t.me/Savvy_Society" className="text-white hover:underline transition-all">t.me/Savvy_Society</a>.</p>
              <div className="flex gap-20 pt-10">
                 <a href="https://t.me/Savvy_Society" className="text-[16px] font-black uppercase tracking-[0.6em] transition-all hover:opacity-70" style={{ color: THEME_ACCENTS[theme.accent] }}>Telegram_Core</a>
                 <a href="#" className="text-[16px] font-black text-slate-800 uppercase tracking-[0.6em] hover:text-slate-500 transition-all">Registry_Transparency</a>
              </div>
            </div>
            <p className="text-slate-800 text-[14px] font-mono-plex font-black uppercase tracking-[1em] opacity-30">© 2024 SAVVY SOCIETY :: REGISTRY 17.0 :: SUPABASE PERSISTENCE ACTIVE</p>
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
