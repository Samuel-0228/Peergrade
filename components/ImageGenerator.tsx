
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { ImageGenParams } from '../types';

const ImageGenerator: React.FC = () => {
  const [params, setParams] = useState<ImageGenParams>({
    prompt: '',
    aspectRatio: '16:9',
    imageSize: '1K'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const gemini = useRef(new GeminiService());

  const handleGenerate = async () => {
    if (!params.prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await gemini.current.generateVisualization(
        params.prompt, 
        params.aspectRatio, 
        params.imageSize
      );
      setResultImage(imageUrl);
    } catch (err: any) {
      if (err.message?.includes('Requested entity was not found')) {
        setError('API Key validation failed. Please re-authenticate.');
      } else {
        setError('Generation threshold exceeded or system error occurred.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const checkAuthAndGenerate = async () => {
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      handleGenerate();
    } else {
      handleGenerate();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-blue-400">Visualization Engine</h3>
            <p className="text-xs text-gray-500">Generate high-fidelity conceptual diagrams for academic presentations.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Contextual Prompt</label>
              <textarea
                value={params.prompt}
                onChange={(e) => setParams(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[120px]"
                placeholder="Describe the research concept (e.g., 'A neural network mapping the relationship between grade averages and socio-economic variables')..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Aspect Ratio</label>
                <select
                  value={params.aspectRatio}
                  onChange={(e) => setParams(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
                  <option value="4:3">4:3 Standard</option>
                  <option value="3:4">3:4 Document</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Output Fidelity</label>
                <select
                  value={params.imageSize}
                  onChange={(e) => setParams(prev => ({ ...prev, imageSize: e.target.value as any }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="1K">1K Standard</option>
                  <option value="2K">2K Professional</option>
                  <option value="4K">4K Ultra HD</option>
                </select>
              </div>
            </div>

            <button
              onClick={checkAuthAndGenerate}
              disabled={isGenerating}
              className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-4 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Synthesizing...' : 'Initialize Synthesis'}
            </button>
            
            <p className="text-[9px] text-gray-600 text-center uppercase">
              Powered by Gemini 3 Pro Image. Requires Paid Tier API Key.
              <br />
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-gray-400">Billing Docs</a>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-2xl min-h-[400px] flex items-center justify-center relative overflow-hidden group">
          {isGenerating ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <p className="text-sm font-mono tracking-widest animate-pulse">Rendering Visualization...</p>
                <p className="text-[10px] text-gray-500 italic">Iterating through latent representations</p>
              </div>
            </div>
          ) : resultImage ? (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img src={resultImage} alt="Generated Visualization" className="max-h-full rounded shadow-2xl accent-glow" />
              <button 
                onClick={() => window.open(resultImage, '_blank')}
                className="absolute top-6 right-6 bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </button>
            </div>
          ) : (
            <div className="text-center p-12 opacity-30 select-none">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p className="text-lg font-heading tracking-widest">Awaiting Visualization Prompt</p>
              <p className="text-xs font-mono uppercase mt-2">Engine: Nano Banana Pro / G3-Image</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md p-8 text-center">
              <div className="space-y-4 max-w-sm">
                <div className="text-red-500 font-bold uppercase tracking-widest text-xs">Terminal Fault</div>
                <p className="text-gray-300 text-sm">{error}</p>
                <button 
                  onClick={() => (window as any).aistudio.openSelectKey()}
                  className="px-6 py-2 border border-white/20 text-xs font-mono uppercase hover:bg-white hover:text-black transition-all"
                >
                  Configure Key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
