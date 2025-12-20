
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Info, FileSpreadsheet, Loader2, AlertTriangle, Sparkles, Database, FileX } from 'lucide-react';
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
        <p className="text-slate-400 mb-8">The requested academic insight session does not exist or has been retracted.</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-xs">Back to Archives</Link>
      </div>
    );
  }

  const isSummaryMissing = (summary?: string) => {
    return !summary || 
           summary.includes("No summary available") || 
           summary.includes("not available") ||
           summary.includes("could not be generated");
  };

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
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-4 rounded-2xl shadow-inner">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Population</p>
                <p className="text-xl font-mono-academic font-bold text-white leading-none">{session.responseCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-4 rounded-2xl shadow-inner">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Archived</p>
                <p className="text-xl font-mono-academic font-bold text-white leading-none">{new Date(session.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-4 items-start shadow-sm">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed italic">
            Savvy presents descriptive observations derived from collective survey responses. 
            All insights are aggregated to ensure privacy and institutional clarity.
          </p>
        </div>
      </header>

      <div className="space-y-12">
        {session.analyses.map((analysis, index) => {
          const summaryUnavailable = isSummaryMissing(analysis.summary);
          
          return (
            <section key={index} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 hover:border-slate-700/80 transition-all group shadow-xl shadow-black/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-400 font-mono-academic">
                      0{index + 1}
                    </span>
                    <h3 className="text-xl font-academic font-bold text-white leading-tight group-hover:text-indigo-400 transition-colors">
                      {analysis.question}
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className={`p-6 rounded-2xl border transition-all ${
                      summaryUnavailable 
                        ? 'bg-rose-500/5 border-rose-500/10' 
                        : 'bg-slate-950/40 border-slate-800 shadow-inner'
                    }`}>
                      {summaryUnavailable ? (
                        <div className="flex items-start gap-4 text-slate-500">
                          <FileX className="w-5 h-5 text-rose-500/40 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-[10px] font-bold text-rose-500/60 uppercase tracking-[0.2em] mb-1">Data Insight Note</h4>
                            <p className="text-xs font-mono-academic italic text-slate-500 leading-relaxed">
                              An automated analytical summary was not available during the data ingestion phase for this question. 
                              Please refer to the distribution chart for manual interpretation.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                           <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-1 opacity-60" />
                           <p className="text-slate-300 leading-relaxed text-sm font-academic">
                             {analysis.summary}
                           </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {analysis.data.slice(0, 4).map((item, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono-academic font-bold text-slate-400 uppercase tracking-wider">
                          <span className="text-indigo-500">{item.percentage}%</span> {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                  <ChartComponent analysis={analysis} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-24 py-12 border-t border-slate-800/50 text-center">
        <p className="text-slate-500 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
          Access to the underlying raw dataset is available for authorized institutional research.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl transition-all text-xs font-bold uppercase tracking-[0.15em] text-indigo-400 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isDownloading ? "Retrieving..." : "Export Raw Dataset"}
          </button>
          
          {downloadError && (
            <div className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest bg-rose-500/5 px-4 py-2 rounded-full border border-rose-500/10 animate-shake">
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
