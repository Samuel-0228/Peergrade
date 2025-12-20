
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const SupportChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; isError?: boolean }[]>([
    { role: 'bot', text: 'Welcome to Savvy Research. How can I assist you with your academic data insights today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (!process.env.API_KEY) {
        throw new Error("UNAVAILABLE");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `
            You are the Savvy Support Assistant. Help users interpret academic survey data dashboards.
            - Explain that Savvy visualizes anonymized Google Forms response data.
            - Help users understand charts like "categorical clusters" or "distributions".
            - Be concise, academic, and professional.
            - If asked about missing summaries, explain that some automated analyses are excluded to maintain data integrity.
          `,
          temperature: 0.7,
        }
      });

      const botText = response.text || "I'm sorry, I couldn't process that request at this time.";
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error: any) {
      console.error("Internal Service Error:", error);
      // Generic error message for all failures to maintain clean UI
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: "The support system is temporarily unavailable. Please try again later.",
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-[100] ${
          isOpen ? 'bg-slate-800 rotate-90 scale-90 border border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-110 shadow-indigo-500/20'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>

      <div className={`fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform z-[100] ${
        isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}>
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-academic font-bold text-white leading-none">Savvy Support</h3>
              <p className="text-[10px] text-indigo-400 font-mono-academic font-bold uppercase tracking-widest mt-1">
                AI Research Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : msg.isError 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-bl-none flex gap-2 items-start'
                : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'
              }`}>
                {msg.isError && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 p-3 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                <span className="text-[10px] text-slate-400 font-mono-academic">Synthesizing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for data insights..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 opacity-40">
            <Info className="w-2.5 h-2.5 text-slate-500" />
            <p className="text-[8px] text-slate-500 font-mono-academic uppercase tracking-tighter">
              Institutional AI Hub • Savvy Society
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportChatbot;
