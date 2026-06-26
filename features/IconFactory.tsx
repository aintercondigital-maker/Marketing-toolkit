
import React, { useState } from 'react';
import { generateSvgFromPrompt } from '../services/geminiService';
import { GeneratedSvg, GenerationStatus, ApiError } from '../types';

export const IconFactory: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentSvg, setCurrentSvg] = useState<GeneratedSvg | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || status === GenerationStatus.LOADING) return;
    
    setStatus(GenerationStatus.LOADING);
    setError(null);
    setCurrentSvg(null);

    try {
      const svgContent = await generateSvgFromPrompt(prompt);
      
      // Basic validation: ensure it looks like an SVG
      if (!svgContent.toLowerCase().includes('<svg')) {
        throw new Error("Generated content is not a valid SVG.");
      }

      const newSvg: GeneratedSvg = {
        id: crypto.randomUUID(),
        content: svgContent,
        prompt: prompt,
        timestamp: Date.now()
      };
      
      setCurrentSvg(newSvg);
      setStatus(GenerationStatus.SUCCESS);
    } catch (err: any) {
      console.error("SVG Generation Error:", err);
      setStatus(GenerationStatus.ERROR);
      setError({
        message: "Generation Failed",
        details: err.message || "An unexpected error occurred while contacting Gemini."
      });
    }
  };

  const copyToClipboard = () => {
    if (currentSvg) {
      navigator.clipboard.writeText(currentSvg.content);
      // Removed alert
    }
  };

  const downloadSvg = () => {
    if (!currentSvg) return;
    const blob = new Blob([currentSvg.content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `advantech-icon-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
            <i className="fa-solid fa-shapes"></i>
          </div>
          <div>
            <h2 className="text-4xl font-black text-[#004E9A] uppercase tracking-tighter">Vector Icon Factory</h2>
            <p className="text-slate-500 font-medium">Generate industrial SVG assets for campaigns & UI</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. A sleek industrial router icon with 5G connectivity lines"
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700"
          />
          <button
            onClick={handleGenerate}
            disabled={status === GenerationStatus.LOADING || !prompt.trim()}
            className="bg-[#004E9A] text-white px-8 py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === GenerationStatus.LOADING ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-sparkles"></i>}
            Create Icon
          </button>
        </div>
      </div>

      {/* Result Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[550px]">
        {/* Preview Area */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-800 flex flex-col items-center justify-center p-12">
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
           
           {status === GenerationStatus.LOADING ? (
             <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">Forging Vector Data...</p>
             </div>
           ) : currentSvg ? (
             <div className="w-full h-full flex items-center justify-center animate-fadeIn">
                <div className="w-72 h-72 bg-slate-800 rounded-[3rem] p-12 flex items-center justify-center shadow-2xl relative group border border-slate-700/50">
                   {/* We wrap the content and forcecurrentColor to be indigo-400 or blue-500 */}
                   <div 
                      dangerouslySetInnerHTML={{ __html: currentSvg.content }} 
                      className="w-full h-full text-indigo-400 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block" 
                   />
                   <div className="absolute bottom-6 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      {currentSvg.prompt}
                   </div>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 opacity-20">
                <i className="fa-solid fa-vector-square text-8xl text-indigo-200"></i>
                <p className="text-indigo-100 font-black uppercase tracking-widest text-xs">Preview Area</p>
             </div>
           )}
        </div>

        {/* Code / Actions Area */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col p-8 md:p-12 overflow-hidden">
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-red-500">
               <i className="fa-solid fa-circle-exclamation text-6xl"></i>
               <h4 className="font-black uppercase tracking-tight">{error.message}</h4>
               <p className="text-slate-400 text-sm max-w-xs">{error.details}</p>
               <button onClick={handleGenerate} className="mt-4 px-6 py-2 bg-red-50 rounded-xl text-xs font-bold border border-red-100">Try Again</button>
            </div>
          ) : currentSvg ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                 <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Asset Source Code</h4>
                 <div className="flex gap-2">
                    <button onClick={copyToClipboard} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-slate-600 border border-slate-200" title="Copy Code">
                       <i className="fa-solid fa-copy"></i>
                    </button>
                    <button onClick={downloadSvg} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100" title="Download SVG">
                       <i className="fa-solid fa-download"></i>
                    </button>
                 </div>
              </div>
              <div className="flex-1 relative overflow-hidden rounded-2xl">
                <pre className="absolute inset-0 bg-slate-900 p-6 text-indigo-300 font-mono text-[10px] overflow-auto custom-scrollbar leading-relaxed">
                  {currentSvg.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-slate-300">
               <i className="fa-solid fa-code text-6xl opacity-20"></i>
               <p className="font-black uppercase tracking-widest text-xs">Code will be generated here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
