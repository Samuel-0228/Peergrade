
import React, { useState, useEffect } from 'react';
import { Upload, Plus, AlertCircle, Loader2, Database, LayoutPanelTop } from 'lucide-react';
import { storageService } from '../services/storageService';
import { parseCSVData } from '../services/csvService';
import { Session } from '../types';
import SessionList from './SessionList';

const AdminPanel: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessions(storageService.getSessions());
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

        storageService.saveSession(newSession);
        setSessions(storageService.getSessions());
        setNewTitle('');
        setNewDescription('');
        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (err) {
      setError("Failed to process CSV file. Ensure it is a valid Google Forms export.");
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      storageService.deleteSession(id);
      setSessions(storageService.getSessions());
    }
  };

  const handleTogglePublic = (id: string) => {
    storageService.togglePublicStatus(id);
    setSessions(storageService.getSessions());
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <LayoutPanelTop className="w-8 h-8 text-indigo-500" />
        <h1 className="text-3xl font-academic font-bold text-white">Administrative Controller</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-academic font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              New Research Session
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Session Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                  placeholder="e.g., Freshman Satisfaction 2024"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                  placeholder="Provide context for this data group..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Google Forms Export (CSV)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isUploading}
                  />
                  <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950 transition-colors ${isUploading ? 'opacity-50' : 'hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}>
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-600 mb-2" />
                    )}
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
                      {isUploading ? "Analyzing Data..." : "Upload CSV"}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-2 items-start p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-academic font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Existing Analysis Archives
            </h2>
            <span className="text-xs font-mono-academic text-slate-500 uppercase tracking-widest font-bold">
              {sessions.length} Records
            </span>
          </div>
          
          <SessionList 
            sessions={sessions} 
            isAdminView={true} 
            onDelete={handleDelete}
            onTogglePublic={handleTogglePublic}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
