
// Added missing useMemo import
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { Message, AdmissionData } from '../types';
import { MOCK_ADMISSIONS } from '../constants';
import { DataService } from '../services/dataService';

const ResearchAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Operational research portal active. I am available to provide neutral, descriptive summaries of current admission trends based on the active dataset. Please state your analytical query.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gemini = useRef(new GeminiService());
  // Fix: useMemo is now imported from 'react' to resolve "Cannot find name 'useMemo'" error
  const dataService = useMemo(() => new DataService(), []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Fetch latest data context to ensure AI sees current numbers
    let currentData: AdmissionData[] = MOCK_ADMISSIONS;
    const savedUrl = localStorage.getItem('admission_sheet_url');
    if (savedUrl) {
      try {
        currentData = await dataService.fetchExternalAdmissions(savedUrl);
      } catch (e) { console.warn("Context fetch failed, using fallback."); }
    }

    const dataContextStr = JSON.stringify(currentData);
    const contextPrompt = `Analyze this dataset: ${dataContextStr}. Question: ${input}`;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const response = await gemini.current.generateAnalysis(contextPrompt, messages);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col glass-panel rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h3 className="text-sm font-semibold tracking-widest uppercase">Research Analysis Portal</h3>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-mono text-gray-500">SYNC: {localStorage.getItem('admission_sheet_url') ? 'EXTERNAL' : 'INTERNAL'}</span>
           <span className="text-[10px] font-mono text-gray-500">VER 2.6.4</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              m.role === 'user' 
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50' 
                : 'bg-white/5 border border-white/10 text-gray-300'
            }`}>
              <div className="text-xs font-mono uppercase mb-2 opacity-50 tracking-tighter">
                {m.role === 'user' ? 'Inbound Query' : 'Synthesized Insight'}
              </div>
              <p className="text-sm leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-2 w-24 bg-white/10 rounded mb-2"></div>
              <div className="h-2 w-48 bg-white/10 rounded"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query current synchronized data..."
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all font-mono"
          >
            SND
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-600 mt-2 uppercase tracking-widest">
          Descriptive analytics mode enabled. Advice generation disabled.
        </p>
      </form>
    </div>
  );
};

export default ResearchAssistant;
