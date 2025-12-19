
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell as RechartsCell
} from 'recharts';
import { INITIAL_SESSIONS, MOCK_USERS } from './constants';
import { Session, SessionStatus, UserRole, User, RawResponse, SurveyColumn } from './types';
import { generateQuestionDescriptions, chatWithCompanion } from './geminiService';

// --- CSV Helper ---
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
      if (char === '"' && line[i + 1] === '"') {
        current += '"'; i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });

  const columns: SurveyColumn[] = [];
  const validIndices: number[] = [];

  rawHeaders.forEach((h, i) => {
    if (h.toLowerCase() === 'timestamp') return;

    // Analyze values in this column to check eligibility (isVisualizable)
    const valuesInCol = tempResponses.map(row => (row[i] || '').trim()).filter(v => v !== '');
    const uniqueValues = new Set(valuesInCol);
    const totalResponsesInCol = valuesInCol.length;
    const uniqueCount = uniqueValues.size;

    // Eligibility Heuristics:
    // 1. Not empty
    // 2. More than 1 unique value (needs a distribution)
    // 3. Not mostly unique (ID/Email check: if unique count > 80% of total and total > 5, exclude)
    // 4. Not extremely long text (Average length < 100 chars)
    const avgLen = totalResponsesInCol > 0 ? valuesInCol.reduce((s, v) => s + v.length, 0) / totalResponsesInCol : 0;
    const isIDOrEmail = totalResponsesInCol > 5 && (uniqueCount / totalResponsesInCol > 0.8);
    const isLongText = avgLen > 100;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const looksLikeEmails = totalResponsesInCol > 0 && valuesInCol.slice(0, 10).every(v => emailRegex.test(v));

    const isVisualizable = totalResponsesInCol > 1 && 
                           uniqueCount > 1 && 
                           !isIDOrEmail && 
                           !isLongText && 
                           !looksLikeEmails &&
                           uniqueCount < 50; // Safety cap for huge categorical sets

    validIndices.push(i);
    columns.push({
      id: `col_${i}`,
      label: h,
      type: 'categorical',
      isVisualizable
    });
  });

  const responses: RawResponse[] = tempResponses.map(values => {
    const row: RawResponse = {};
    validIndices.forEach((csvIdx, colIdx) => {
      row[columns[colIdx].id] = values[csvIdx] || '';
    });
    return row;
  });

  return { columns, responses };
};

// --- Analytic Helper ---
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
      name, 
      value,
      percentage: totalValid > 0 ? ((value / totalValid) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value),
    totalValid
  };
};

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#f43f5e', '#14b8a6', '#6366f1', '#22d3ee'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass px-3 py-2 rounded-lg border-white/10 shadow-xl">
        <p className="text-xs font-bold text-white mb-1">{data.name}</p>
        <p className="text-[10px] text-sky-400">Count: {data.value}</p>
        <p className="text-[10px] text-emerald-400">{data.percentage}%</p>
      </div>
    );
  }
  return null;
};

// --- Companion Chat Bot Component ---
const CompanionChat: React.FC<{ session: Session }> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Greetings. I am Savvy Companion. How can I assist with patterns in the ${session.title} dataset?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const visualColumns = session.columns.filter(c => c.isVisualizable);
    const dataSummary = visualColumns.slice(0, 15).map(c => {
      const { data } = getColumnDist(session.responses, c.id);
      return `${c.label}: ${data.slice(0, 5).map(d => `${d.name}(${d.value})`).join(', ')}`;
    }).join('; ');

    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    history.push({ role: 'user', parts: [{ text: userMsg }] });

    const aiResponse = await chatWithCompanion(history, dataSummary, session.title);
    setMessages(prev => [...prev, { role: 'model', text: aiResponse || "I'm having trouble connecting. For official results visit t.me/Savvy_Society." }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {isOpen && (
        <div className="glass w-[320px] sm:w-[380px] h-[500px] mb-4 rounded-3xl overflow-hidden flex flex-col border-sky-500/30 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <div className="bg-sky-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-sky-500 font-bold text-xs">S</div>
              <span className="text-black font-bold text-xs uppercase tracking-widest">Savvy Companion</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-black/60 hover:text-black">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-sky-500 text-black font-semibold' : 'bg-white/10 text-slate-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white/5 px-4 py-2 rounded-2xl text-xs text-slate-500 animate-pulse">Syncing...</div></div>}
          </div>
          <div className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about data or trends..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
            />
            <button onClick={handleSend} className="bg-sky-500 text-black p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center text-black shadow-lg shadow-sky-500/40 hover:scale-110 transition-transform">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
    </div>
  );
};

// --- Views ---

const Navbar: React.FC<{ user: User | null; onLogin: () => void; onLogout: () => void }> = ({ user, onLogin, onLogout }) => (
  <nav className="glass sticky top-0 z-50 border-b border-white/5 px-6 py-4 flex items-center justify-between">
    <Link to="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-black font-bold">S</div>
      <span className="text-white font-bold tracking-widest font-mono-plex">SAVVY</span>
    </Link>
    <div className="flex items-center gap-6">
      <Link to="/" className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Insights</Link>
      {user && <Link to="/admin" className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Console</Link>}
      <div className="h-4 w-px bg-white/10"></div>
      {user ? (
        <button onClick={onLogout} className="text-xs font-bold uppercase text-red-400">Exit</button>
      ) : (
        <button onClick={onLogin} className="text-xs font-bold uppercase text-sky-500">Login</button>
      )}
    </div>
  </nav>
);

const SessionView: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  const { id } = useParams();
  const session = sessions.find(s => s.id === id);

  if (!session) return <div className="p-20 text-center text-slate-500 uppercase tracking-widest">DATA_NODE_NOT_FOUND</div>;

  const visualColumns = session.columns.filter(c => c.isVisualizable);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
      {/* Header Block */}
      <div className="space-y-4">
        <Link to="/" className="text-sky-500 text-xs font-bold uppercase tracking-widest hover:underline">← HUB_OVERVIEW</Link>
        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">{session.title}</h1>
        <p className="text-slate-400 text-lg leading-relaxed">{session.description}</p>
        <div className="pt-4 flex items-center gap-6">
          <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-full">{session.status}</div>
          <div className="text-slate-500 text-xs font-mono-plex">{session.participationCount.toLocaleString()} total responses</div>
        </div>
      </div>

      {/* Google-Summary-Style Block List */}
      <section className="space-y-24">
        {visualColumns.map((col, idx) => {
          const { data, totalValid } = getColumnDist(session.responses, col.id);
          const isMany = data.length > 8;
          const description = session.columnDescriptions?.[col.id] || "No descriptive pattern available.";

          return (
            <div key={idx} className="space-y-8 animate-in fade-in duration-500">
              {/* Question & Response Count */}
              <div className="space-y-1">
                <h4 className="text-2xl font-bold text-white leading-tight">{col.label}</h4>
                <p className="text-xs text-slate-500 font-mono-plex uppercase">{totalValid.toLocaleString()} responses</p>
              </div>

              {/* Single Chart Block */}
              <div className="glass p-10 rounded-[2.5rem] border-white/5 flex flex-col items-center gap-10 shadow-2xl relative overflow-hidden group">
                <div className="w-full h-[320px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {!isMany ? (
                      <PieChart>
                        <Pie 
                          data={data} 
                          innerRadius={80} 
                          outerRadius={130} 
                          paddingAngle={3} 
                          dataKey="value" 
                          stroke="none"
                        >
                          {data.map((_, i) => <RechartsCell key={`c-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    ) : (
                      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 60 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          width={140} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24}>
                           {data.map((_, i) => <RechartsCell key={`b-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Legend as table breakdown (Matches Google Summary feel) */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 pt-6 border-t border-white/5">
                  {data.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 sm:last:border-b">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[data.findIndex(d => d.name === entry.name) % CHART_COLORS.length] }} />
                        <span className="text-[11px] text-slate-400 truncate font-medium">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 font-mono-plex text-[10px]">
                        <span className="font-bold text-sky-400">{entry.value}</span>
                        <span className="text-slate-600 w-10 text-right">{entry.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Short Neutral Description Block */}
              <div className="pl-6 border-l-2 border-sky-500/40 py-2">
                <p className="text-slate-400 text-sm italic font-medium leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          );
        })}

        {visualColumns.length === 0 && (
          <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
            <p className="text-slate-500 uppercase tracking-widest text-xs">No categorical patterns found for visualization.</p>
          </div>
        )}
      </section>

      <CompanionChat session={session} />
    </div>
  );
};

const AdminPanel: React.FC<{ sessions: Session[]; onCreate: (s: Session) => void; onDelete: (id: string) => void }> = ({ sessions, onCreate, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async () => {
    if (!selectedFile || !form.title) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;
        const { columns, responses } = parseCSV(csvData);
        
        // Filter for Gemini description logic as well
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
        onCreate(newSession);
        setIsCreating(false);
        setForm({ title: '', description: '' });
        setSelectedFile(null);
      };
      reader.readAsText(selectedFile);
    } catch (e) {
      alert("Error processing CSV file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-white font-mono-plex tracking-tighter uppercase">Cluster_Console</h1>
        <button onClick={() => setIsCreating(true)} className="bg-sky-500 text-black font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-widest">Add Node</button>
      </div>

      {isCreating && (
        <div className="glass p-10 rounded-[2.5rem] border-sky-500/20 mb-10 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <input placeholder="Cohort Title (e.g., Spring 2025 Admissions)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-sky-500" />
          <textarea placeholder="Cohort Contextual Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none h-32 resize-none" />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-white/10 rounded-3xl p-14 text-center cursor-pointer transition-all hover:bg-white/5 hover:border-sky-500/40 ${selectedFile ? 'bg-sky-500/5 border-sky-500/30 shadow-[0_0_40px_rgba(14,165,233,0.1)]' : 'bg-white/5'}`}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-3">
              <svg className={`w-10 h-10 mx-auto ${selectedFile ? 'text-sky-500' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-base font-bold text-white">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Attach CSV Google Forms Export'}
              </p>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Only .csv files permitted. Questions are filtered automatically for summary blocks.</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={handleFileUpload} disabled={loading || !selectedFile || !form.title} className="flex-1 bg-sky-500 hover:bg-sky-400 text-black font-bold py-5 rounded-2xl uppercase tracking-widest text-xs transition-all disabled:opacity-30">{loading ? 'Filtering & Mapping...' : 'Generate Dashboard'}</button>
            <button onClick={() => setIsCreating(false)} className="px-8 text-slate-500 uppercase font-bold text-xs hover:text-white">Abort</button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {sessions.map(s => (
          <div key={s.id} className="glass p-8 rounded-[2rem] flex items-center justify-between group hover:border-white/20 transition-all">
            <div>
              <h4 className="text-white font-bold text-xl mb-1">{s.title}</h4>
              <p className="text-slate-500 text-xs font-mono-plex">{s.participationCount} samples tracked · {s.columns.filter(c => c.isVisualizable).length} charted questions</p>
            </div>
            <button onClick={() => onDelete(s.id)} className="p-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage: React.FC<{ sessions: Session[] }> = ({ sessions }) => (
  <div className="max-w-7xl mx-auto px-6 py-24 space-y-24">
    <header className="space-y-6">
      <div className="flex items-center gap-4"><span className="w-12 h-px bg-sky-500"></span><span className="text-sky-500 text-[11px] font-bold uppercase tracking-[0.6em]">Academic Intelligence Node</span></div>
      <h1 className="text-8xl sm:text-9xl font-bold text-white tracking-tighter uppercase leading-[0.8] mb-8">Collective <br/>Patterns.</h1>
      <p className="text-slate-500 text-2xl max-w-2xl font-light leading-relaxed">Filtered, neutral academic data summaries mirroring official cohort summaries. Integrated insights for collective transparency.</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {sessions.filter(s => s.isPublic).map(s => (
        <Link key={s.id} to={`/session/${s.id}`} className="group glass p-10 rounded-[3.5rem] hover:border-sky-500/40 transition-all duration-700 hover:-translate-y-4 flex flex-col h-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-10 right-10 text-[10px] text-slate-600 uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-white/5">NODE :: {s.status}</div>
          <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-sky-400 transition-colors leading-tight">{s.title}</h3>
          <p className="text-slate-500 text-sm mb-12 flex-1 leading-relaxed line-clamp-4">{s.description}</p>
          <div className="pt-10 border-t border-white/5 flex justify-between items-center">
            <span className="text-3xl font-mono-plex text-white font-bold">{s.participationCount.toLocaleString()} <span className="text-[10px] text-slate-700 block uppercase font-bold tracking-tighter mt-1">Samples</span></span>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-sky-500 group-hover:text-black transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-sky-500 selection:text-black">
        <Navbar user={user} onLogin={() => setShowLogin(true)} onLogout={() => setUser(null)} />
        
        {showLogin && (
          <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="glass p-12 rounded-[2.5rem] w-full max-w-sm text-center border-sky-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-3xl font-bold text-white mb-10 tracking-tight uppercase font-mono-plex">Admin_Gate</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const email = (e.target as any).email.value;
                const pass = (e.target as any).pass.value;
                if (email === 'savvysocietyteam@gmail.com' && pass === 'SavvyisHard') {
                   setUser(MOCK_USERS[0]);
                   setShowLogin(false);
                }
              }} className="space-y-5">
                <input name="email" placeholder="Identifier" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-500 transition-all" />
                <input name="pass" type="password" placeholder="Key" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-sky-500 transition-all" />
                <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs mt-4 shadow-lg shadow-sky-500/20">Authorize</button>
              </form>
              <button onClick={() => setShowLogin(false)} className="mt-8 text-slate-600 text-[10px] uppercase font-bold tracking-widest hover:text-slate-400 transition-colors">Disconnect</button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<HomePage sessions={sessions} />} />
          <Route path="/session/:id" element={<SessionView sessions={sessions} />} />
          <Route path="/admin" element={<AdminPanel sessions={sessions} onCreate={s => setSessions(p => [s, ...p])} onDelete={id => setSessions(p => p.filter(x => x.id !== id))} />} />
        </Routes>

        <footer className="mt-60 border-t border-white/5 py-32 px-6 bg-black/40">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-black font-black text-sm">S</div>
                <span className="text-white font-bold tracking-widest font-mono-plex uppercase text-lg">SAVVY_SYSTEM</span>
              </div>
              <p className="text-slate-600 text-sm max-w-sm leading-relaxed font-medium">Filtered academic intelligence node mirroring official cohort analytics. strictly non-prescriptive data only.</p>
            </div>
            <div className="space-y-8 max-w-xl">
              <div className="space-y-4">
                <p className="text-slate-700 text-[11px] uppercase font-bold tracking-tighter italic leading-relaxed">
                  Official results, admission lists, and individual outcomes are available ONLY via <a href="https://t.me/Savvy_Society" className="text-sky-500 hover:underline">t.me/Savvy_Society</a>. 
                  Savvy provides pattern summaries and does not provide individual evaluations or success predictions.
                </p>
                <div className="flex gap-6 pt-2">
                   <a href="https://t.me/Savvy_Society" className="text-[10px] font-bold text-sky-500 uppercase tracking-widest border-b border-sky-500/20 pb-1">Telegram Community</a>
                </div>
              </div>
              <p className="text-slate-800 text-[10px] font-mono-plex font-bold uppercase tracking-widest">© 2024 SAVVY SOCIETY :: PATTERNS NEUTRALIZED</p>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
