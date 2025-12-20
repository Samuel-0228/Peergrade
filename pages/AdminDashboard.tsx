
import React, { useState, useEffect } from 'react';
import { getSessions, saveSession, deleteSession, togglePublishSession } from '../services/storageService';
import { generateAcademicSummary } from '../services/geminiService';
import { Session, QuestionAnalysis, DataPoint } from '../types';

const AdminDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Parsing dataset...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
        
        // Exclude timestamp column (usually the first one)
        const dataStartIndex = headers[0].toLowerCase().includes('timestamp') ? 1 : 0;
        const questions = headers.slice(dataStartIndex);
        const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1')));

        const analyses: QuestionAnalysis[] = [];

        for (let i = 0; i < questions.length; i++) {
          const colIndex = i + dataStartIndex;
          const questionText = questions[i];
          setUploadStatus(`Analyzing: ${questionText.slice(0, 30)}...`);

          const counts: Record<string, number> = {};
          rows.forEach(row => {
            const val = row[colIndex] || 'No Response';
            counts[val] = (counts[val] || 0) + 1;
          });

          const total = rows.length;
          const dataPoints: DataPoint[] = Object.entries(counts).map(([label, count]) => ({
            label,
            count,
            percentage: Math.round((count / total) * 100)
          })).sort((a, b) => b.count - a.count);

          // Summarization call
          const summary = await generateAcademicSummary(questionText, dataPoints);

          analyses.push({
            id: crypto.randomUUID(),
            questionText,
            chartType: dataPoints.length > 5 ? 'bar' : 'pie',
            data: dataPoints,
            summary
          });
        }

        const newSession: Session = {
          id: crypto.randomUUID(),
          title: file.name.replace('.csv', '').toUpperCase(),
          createdAt: Date.now(),
          responseCount: rows.length,
          analyses,
          isPublic: false,
          csvContent: text
        };

        saveSession(newSession);
        setSessions(getSessions());
        setUploadStatus('Processing Complete.');
        setTimeout(() => setIsUploading(false), 2000);
      } catch (err) {
        console.error(err);
        setUploadStatus('Error processing CSV.');
        setTimeout(() => setIsUploading(false), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">Admin Terminal</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized Session Management</p>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden" 
            id="csv-upload" 
          />
          <label 
            htmlFor="csv-upload"
            className={`flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-800 transition-all shadow-lg ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {uploadStatus}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Deploy New Session (CSV)
              </>
            )}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sessions.sort((a, b) => b.createdAt - a.createdAt).map(session => (
          <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:border-slate-300 transition-all">
            <div className="bg-slate-50 p-4 rounded-lg flex-shrink-0">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-1">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{session.title}</h3>
                {session.isPublic ? (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-green-200">Public</span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-slate-200">Draft</span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>{session.responseCount} Responses</span>
                <span>Created {new Date(session.createdAt).toLocaleString()}</span>
                <span className="mono text-[10px]">{session.id}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => {
                  togglePublishSession(session.id);
                  setSessions(getSessions());
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${session.isPublic ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}
              >
                {session.isPublic ? 'Withdraw Publication' : 'Approve & Publish'}
              </button>
              <button 
                onClick={() => window.location.hash = `#/session/${session.id}`}
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Review
              </button>
              <button 
                onClick={() => {
                  if (confirm('Permanently delete this session? This cannot be undone.')) {
                    deleteSession(session.id);
                    setSessions(getSessions());
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="py-32 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No active datasets</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Upload a CSV to begin analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
