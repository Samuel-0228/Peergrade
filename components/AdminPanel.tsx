
import React, { useState, useEffect } from 'react';
import { Upload, Plus, AlertCircle, Loader2, Database, LayoutPanelTop, Wifi, WifiOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { storageService } from '../services/storageService';
import { parseCSVData } from '../services/csvService';
import { checkSupabaseConnectivity } from '../services/supabaseClient';
import { Session } from '../types';
import SessionList from './SessionList';

const AdminPanel: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectivity, setConnectivity] = useState<{ ok: boolean; message: string; checking: boolean }>({ ok: true, message: 'Checking API...', checking: true });

  const runConnectivityCheck = async () => {
    setConnectivity(prev => ({ ...prev, checking: true }));
    const result = await checkSupabaseConnectivity();
    setConnectivity({ ...result, checking: false });
  };

  const loadSessions = async () => {
    setIsLoading(true);
    const data = await storageService.getSessions();
    setSessions(data);
    setIsLoading(false);
  };

  useEffect(() => {
    runConnectivityCheck();
    loadSessions();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newTitle) {
      setError("Please provide a session title before uploading.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const { responseCount, analyses } = await parseCSVData(content);

        const newSession: Session = {
          id: crypto.randomUUID(),
          title: newTitle,
          description: newDescription || "No description provided.",
          createdAt: new Date().toISOString(),
          responseCount,
          isPublic: false,
          analyses
        };

        const result = await storageService.saveSession(newSession, file);
        if (result.success) {
          await loadSessions();
          setNewTitle('');
          setNewDescription('');
          setError(null);
          // Clear file input
          e.target.value = '';
        } else {
          setError(result.error || "Failed to save research session to cloud storage.");
        }
        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      setError(`Failed to process CSV file: ${err.message}`);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone and will be removed from universal storage.")) {
      await storageService.deleteSession(id);
      await loadSessions();
    }
  };

  const handleTogglePublic = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      await storageService.togglePublicStatus(id, session.isPublic);
      await loadSessions();
    }
  };

  const isRlsError = error?.includes('Policy Error') || error?.includes('security policy');

  return (
    <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8 xl:max-w-screen-2xl font-sans bg-black text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <LayoutPanelTop className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase">Administrative Controller</h1>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-none border text-xs font-mono font-bold uppercase tracking-widest transition-colors ${
          connectivity.checking ? 'bg-neutral-900 border-neutral-800 text-neutral-400' :
          connectivity.ok ? 'bg-neutral-900 border-neutral-800 text-white' :
          'bg-black border-white text-white'
        }`}>
          {connectivity.checking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 
           connectivity.ok ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="max-w-[200px] truncate">{connectivity.message}</span>
          {!connectivity.checking && (
            <button onClick={runConnectivityCheck} className="ml-2 hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-black border border-neutral-800 rounded-none p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Plus className="w-5 h-5 text-white" />
              New Research Session
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Session Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-none py-2.5 px-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-sm font-bold placeholder:text-neutral-600"
                  placeholder="e.g., Freshman Satisfaction 2024"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Session Description</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-none py-2.5 px-4 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors text-sm min-h-[100px] placeholder:text-neutral-600"
                  placeholder="Brief context for the study..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Upload Dataset (.CSV)</label>
                <div className="relative border border-dashed border-neutral-800 rounded-none p-8 text-center hover:border-white transition-colors group cursor-pointer bg-neutral-950">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                      <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Processing & Indexing...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-neutral-600 mb-2 group-hover:text-white transition-colors" />
                      <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Select or Drop CSV File</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="space-y-4">
                  <div className="flex gap-2 p-3 bg-black border border-white rounded-none">
                    <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    <p className="text-white text-xs font-bold uppercase tracking-wide">{error}</p>
                  </div>
                  
                  {isRlsError && (
                    <div className="p-4 bg-neutral-900 border border-neutral-700 rounded-none">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-white" />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Quick Setup Guide</h4>
                      </div>
                      <p className="text-neutral-400 text-[10px] leading-relaxed">
                        1. Go to your Supabase Dashboard.<br/>
                        2. Navigate to <strong>Storage</strong> (for bucket) or <strong>Database</strong> (for tables).<br/>
                        3. Find 'csv-archives' or 'sessions' table.<br/>
                        4. Click <strong>Policies</strong> &#8594; <strong>New Policy</strong>.<br/>
                        5. Enable <strong>INSERT</strong> and <strong>SELECT</strong> for the <strong>anon</strong> role.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-black border border-neutral-800 rounded-none p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Database className="w-5 h-5 text-white" />
              Existing Archives
            </h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-neutral-950 border border-neutral-800">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Fetching cloud archives...</p>
              </div>
            ) : (
              <SessionList 
                sessions={sessions} 
                isAdminView={true} 
                onDelete={handleDelete}
                onTogglePublic={handleTogglePublic}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
