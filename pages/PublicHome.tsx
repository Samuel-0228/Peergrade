
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSessions } from '../services/storageService';
import { Session } from '../types';

const PublicHome: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(getSessions().filter(s => s.isPublic));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl uppercase mb-6">
          Institutional Insights
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed font-medium">
          Welcome to the public dashboard for aggregated academic survey results. 
          Savvy provides high-level visualizations of student trends and distributions 
          collected through official institutional surveys.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wider border border-slate-200">
            <span className="relative flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
            </span>
            Real-time Aggregated Data
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Active Research Sessions</h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{sessions.length} Published Datasets</span>
        </div>
        
        {sessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <Link 
                key={session.id} 
                to={`/session/${session.id}`}
                className="group flex items-center p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {session.title}
                    </h4>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                      Dataset v1.0
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {session.responseCount} Respondents
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-wider">No Sessions Published</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium uppercase">Datasets are currently under institutional review.</p>
          </div>
        )}
      </div>

      <div className="mt-16 bg-slate-900 rounded-2xl p-8 md:p-12 text-white">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">Academic Disclaimer</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              Savvy is a non-prescriptive data visualization tool. The summaries provided are purely descriptive of the sampled data and do not constitute professional advice or success predictions. Students should consult official academic advisors for individual path planning.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-800 rounded-lg">
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aggregated</div>
            </div>
            <div className="p-4 border border-slate-800 rounded-lg">
              <div className="text-2xl font-bold mb-1">No AI Advice</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Purely Descriptive</div>
            </div>
            <div className="p-4 border border-slate-800 rounded-lg">
              <div className="text-2xl font-bold mb-1">Neutral</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Research-Grade</div>
            </div>
            <div className="p-4 border border-slate-800 rounded-lg">
              <div className="text-2xl font-bold mb-1">Public</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Open Transparency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
