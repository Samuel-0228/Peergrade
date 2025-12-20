
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSessions } from '../services/storageService';
import { Session } from '../types';
import AcademicChart from '../components/AcademicChart';

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSessions().find(x => x.id === id);
    if (s) setSession(s);
  }, [id]);

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-slate-900 uppercase">Dataset Not Found</h2>
        <Link to="/" className="text-indigo-600 font-bold uppercase text-sm mt-4 inline-block">Return to Directory</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center mb-6">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Directory
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight">{session.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <span className="bg-slate-900 text-white px-2 py-0.5 rounded tracking-tighter">Session {session.id.slice(0, 8)}</span>
              <span>{session.responseCount} Total Responses</span>
              <span>Published {new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {session.csvContent && (
            <button 
              onClick={() => {
                const blob = new Blob([session.csvContent || ''], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', `${session.title.replace(/\s+/g, '_')}_data.csv`);
                a.click();
              }}
              className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Raw Dataset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {session.analyses.map((analysis) => (
          <div key={analysis.id} className="flex flex-col gap-6 group">
            <div className="flex-grow">
              <AcademicChart 
                type={analysis.chartType} 
                data={analysis.data} 
                title={analysis.questionText} 
              />
            </div>
            <div className="bg-slate-900 p-6 rounded-lg text-slate-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <svg className="w-8 h-8 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Academic Summary</h4>
              <p className="text-sm font-medium leading-relaxed italic">
                "{analysis.summary}"
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 border-t border-slate-200 pt-10">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="bg-slate-100 p-4 rounded-full">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">Research Methodology</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              This data was collected via institutional surveys. Participants were anonymized at source. 
              Visualization represents the collective distribution and does not reflect individual trajectories. 
              The AI-generated summaries are descriptive in nature, intended to highlight high-level patterns 
              without subjective interpretation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
