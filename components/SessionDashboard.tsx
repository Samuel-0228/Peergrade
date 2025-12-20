
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Info, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { Session } from '../types';
import ChartComponent from './ChartComponent';

const SessionDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await storageService.getSessionById(id);
      setSession(data);
      setIsLoading(false);
    };
    fetchSession();
  }, [id]);

  const handleDownload = async () => {
    if (!session || !id) return;
    setDownloadError(null);
    
    const { data, error } = await supabase
      .from('sessions')
      .select('csv_url')
      .eq('id', id)
      .single();

    if (error || !data?.csv_url) {
      setDownloadError("No downloadable dataset reference found in database.");
      return;
    }

    setIsDownloading(true);
    try {
      const { data: fileData, error: storageError } = await supabase.storage
        .from('csv-archives')
        .download(data.csv_url);

      if (storageError) {
        if (storageError.message.includes('Bucket not found')) {
          throw new Error("The 'csv-archives' storage bucket was not found. Please contact the administrator.");
        }
        throw storageError;
      }

      const url = window.URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${session.title.replace(/\s+/g, '_')}_data.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      console.error("Download error:", err);
      setDownloadError(err.message || "Failed to retrieve the dataset from storage.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-academic uppercase tracking-widest text-sm font-bold">Retrieving Academic Data...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Session Not Found</h1>
        <p className="text-slate-400 mb-8">The requested academic insight session does not exist or has been retracted from universal storage.</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-xs">Back to Archives</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
        <ArrowLeft className="w-4 h-4" />
        Archives
      </Link>

      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-academic font-bold text-white mb-4 tracking-tight">
              {session.title}
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              {session.description}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Total Population</p>
                <p className="text-xl font-mono-academic font-bold text-white leading-none">{session.responseCount} Subjects</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Research Date</p>
                <p className="text-xl font-mono-academic font-bold text-white leading-none">{new Date(session.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-4 items-start">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed italic">
            Savvy is a public academic insight dashboard designed to visualize aggregated survey responses. 
            The data presented reflects collective patterns and distributions. This system provides descriptive 
            observations and does not constitute guidance or personalized advice.
          </p>
        </div>
      </header>

      <div className="space-y-12">
        {session.analyses.map((analysis, index) => (
          <section key={index} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-colors">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-xl font-academic font-bold text-white leading-tight">
                    {analysis.question}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl">
                    <p className="text-slate-300 leading-relaxed text-sm font-academic">
                      {analysis.summary}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {analysis.data.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono-academic font-bold text-indigo-400 uppercase">
                        {item.name}: {item.percentage}%
                      </span>
                    ))}
                    {analysis.data.length > 3 && (
                      <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-mono-academic font-bold text-slate-400 uppercase">
                        +{analysis.data.length - 3} others
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                <ChartComponent analysis={analysis} />
              </div>
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-20 pt-8 border-t border-slate-800 text-center">
        <p className="text-slate-500 text-sm mb-4">All researchers may access the raw collective data for further institutional study.</p>
        
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {isDownloading ? "Preparing Dataset..." : "Download Dataset (.CSV)"}
          </button>
          
          {downloadError && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-medium bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              {downloadError}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default SessionDashboard;
