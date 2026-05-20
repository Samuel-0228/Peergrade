
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
      <div className="rounded-none border border-dashed border-neutral-800 bg-black py-20 text-center font-sans">
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">No data sessions available currently.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-5 font-sans">
      {sessions.map((session) => (
        <div key={session.id} className="fade-up col-span-12 md:col-span-6 xl:col-span-4">
          <div className="group relative overflow-hidden rounded-none border border-neutral-800 bg-black transition-colors hover:bg-neutral-950">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-none border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    <BarChart3 className="h-3 w-3 text-white" />
                    Published insight
                  </div>
                  <h3 className="line-clamp-2 text-lg font-bold uppercase tracking-tight text-white transition-colors group-hover:text-neutral-300">{session.title}</h3>
                </div>
                {isAdminView && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onTogglePublic?.(session.id)}
                      className={`rounded-none p-1.5 transition-colors border ${session.isPublic ? 'bg-white text-black border-white' : 'bg-black text-neutral-500 border-neutral-800 hover:text-white'}`}
                      title={session.isPublic ? "Publicly Visible" : "Private"}
                    >
                      {session.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => onDelete?.(session.id)}
                      className="p-1.5 rounded-none border border-neutral-800 text-neutral-500 bg-black hover:text-white hover:border-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <p className="mb-6 min-h-12 text-sm leading-6 text-neutral-400">{session.description}</p>
              
              <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
                <div className="rounded-none border border-neutral-800 bg-neutral-950 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-neutral-500">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Responses</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-white">{session.responseCount}</span>
                </div>
                <div className="rounded-none border border-neutral-800 bg-neutral-950 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-neutral-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-bold uppercase tracking-widest text-[10px]">Updated</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-white">{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <Link 
              to={`/session/${session.id}`} 
              className="flex items-center justify-between border-t border-neutral-800 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
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
