
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, ChevronRight, Eye, EyeOff, Trash2, BarChart3 } from 'lucide-react';
import { Session } from '../types';

interface SessionListProps {
  sessions: Session[];
  isAdminView?: boolean;
  onDelete?: (id: string) => void;
  onTogglePublic?: (id: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, isAdminView, onDelete, onTogglePublic }) => {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
        <p className="text-slate-500">No data sessions available currently.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      {sessions.map((session) => (
        <div key={session.id} className="fade-up col-span-12 md:col-span-6 xl:col-span-4">
          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[rgba(17,24,39,0.72)] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/30">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <BarChart3 className="h-3 w-3 text-indigo-300" />
                  Published insight
                </div>
                <h3 className="line-clamp-2 text-lg font-academic font-semibold text-white transition-colors group-hover:text-indigo-200">{session.title}</h3>
              </div>
              {isAdminView && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => onTogglePublic?.(session.id)}
                    className={`rounded-md p-1.5 transition-colors ${session.isPublic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
                    title={session.isPublic ? "Publicly Visible" : "Private"}
                  >
                    {session.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => onDelete?.(session.id)}
                    className="p-1.5 rounded-md text-slate-500 bg-slate-800 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <p className="mb-6 min-h-12 text-sm leading-6 text-slate-400">{session.description}</p>
            
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-slate-500">
                <Users className="w-3.5 h-3.5" />
                <span className="uppercase tracking-[0.18em] text-[10px]">Responses</span>
                </div>
                <span className="font-mono-academic text-sm font-semibold text-slate-100">{session.responseCount}</span>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-1 flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="uppercase tracking-[0.18em] text-[10px]">Updated</span>
                </div>
                <span className="font-mono-academic text-sm font-semibold text-slate-100">{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <Link 
            to={`/session/${session.id}`} 
            className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300 transition-colors group-hover:bg-white/[0.03]"
          >
            Access Insights
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        </div>
      ))}
    </div>
  );
};

export default SessionList;
