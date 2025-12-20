
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react';
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
      <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
        <p className="text-slate-500">No data sessions available currently.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <div key={session.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-academic font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{session.title}</h3>
              {isAdminView && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => onTogglePublic?.(session.id)}
                    className={`p-1.5 rounded-md transition-colors ${session.isPublic ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}
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
            
            <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10">{session.description}</p>
            
            <div className="flex items-center gap-4 text-xs font-mono-academic text-slate-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{session.responseCount} Responses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <Link 
            to={`/session/${session.id}`} 
            className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-t border-slate-800 group-hover:bg-slate-800 transition-colors text-xs font-bold uppercase tracking-widest text-indigo-400"
          >
            Access Insights
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
};

export default SessionList;
