
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const getEnv = (key: string): string | undefined => {
  try {
    const viteKey = `VITE_${key}`;
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const env = (import.meta as any).env;
      if (env[viteKey]) return env[viteKey];
      if (env[key]) return env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[viteKey] || process.env[key];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

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
      const apiKey = getEnv('API_KEY');
      if (!apiKey) {
        throw new Error("UNAVAILABLE");
      }

      const ai = new GoogleGenAI({ apiKey });
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
      let errorMsg = "The support system is temporarily unavailable. Please try again later.";
      
      if (error.message === "UNAVAILABLE") {
        errorMsg = "Configuration Alert: API_KEY is missing from the server environment. Staff: Please verify Vercel environment variables.";
      }

      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: errorMsg,
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
        className={`fixed bottom-6 right-6 p-4 rounded-none shadow-none transition-colors z-[100] ${
          isOpen ? 'bg-white text-black border border-white' : 'bg-black text-white border border-white hover:bg-white hover:text-black'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      <div className={`fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-black border border-neutral-800 rounded-none shadow-none flex flex-col overflow-hidden transition-all duration-300 transform z-[100] font-sans ${
        isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}>
        <div className="p-4 bg-black border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none border border-neutral-800 bg-neutral-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-none uppercase tracking-tight">Savvy Support</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                AI Research Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-none border border-neutral-800 bg-black">
            <span className="w-1.5 h-1.5 rounded-none bg-white animate-pulse" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-none text-xs leading-relaxed shadow-none border ${
                msg.role === 'user' 
                ? 'bg-white text-black border-white' 
                : msg.isError 
                ? 'bg-black text-white border-white flex gap-2 items-start'
                : 'bg-black text-neutral-300 border-neutral-800'
              }`}>
                {msg.isError && <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-950 p-3 rounded-none border border-neutral-800 flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Synthesizing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-black border-t border-neutral-800">
          <div className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for data insights..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-none py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors placeholder:text-neutral-600"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-white disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 opacity-40">
            <Info className="w-2.5 h-2.5 text-neutral-500" />
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">
              Institutional AI Hub • Savvy Society
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportChatbot;
