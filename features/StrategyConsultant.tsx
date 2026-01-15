
import React, { useState, useRef, useEffect } from 'react';
import { KBEntry, ChatMessage, Language } from '../types';
import { getGeminiMarketingResponse } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props {
  kb: KBEntry[];
  language: Language;
}

export const StrategyConsultant: React.FC<Props> = ({ kb: initialKb, language }) => {
  const [localKb, setLocalKb] = useState<KBEntry[]>(() => {
    const saved = localStorage.getItem('advantech_marketing_assets_v3');
    return saved ? JSON.parse(saved) : initialKb;
  });
  
  const [showLibrary, setShowLibrary] = useState(false);
  const [history, setHistory] = useState<(ChatMessage & { grounding?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('advantech_marketing_assets_v3', JSON.stringify(localKb));
  }, [localKb]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = localKb.map(entry => `[DOC: ${entry.source}]\n${entry.content}`).join("\n\n---\n\n");
    
    try {
      const res = await getGeminiMarketingResponse(userMsg, context, language);
      setHistory(prev => [...prev, { role: 'ai', content: res.text, grounding: res.grounding }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "Failed to analyze internal context. Please check if the documents are too large." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#F8FAFC] overflow-hidden">
      <div className={`flex-1 flex flex-col transition-all duration-500 ${showLibrary ? 'mr-[420px]' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#004E9A] rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-book-open"></i>
             </div>
             <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Internal Knowledge Center</h2>
                <div className="flex items-center gap-2">
                   <span className={`flex h-1.5 w-1.5 rounded-full ${localKb.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {localKb.length > 0 ? `${localKb.length} Context Docs Loaded` : 'No Context Loaded'}
                   </span>
                </div>
             </div>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#004E9A] transition-colors p-2 bg-slate-50 rounded-lg border border-slate-100">
            <i className="fa-solid fa-layer-group mr-2"></i> {showLibrary ? 'Close Library' : 'Manage Context'}
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-10 pb-12">
            {history.length === 0 && (
               <div className="text-center py-20">
                  <div className="w-16 h-16 bg-blue-50 text-[#004E9A] rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-file-magnifying text-2xl"></i>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Context-First <span className="text-blue-600 italic">Advisor</span></h3>
                  <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto font-bold uppercase tracking-widest">Querying internal records before external search</p>
               </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-4 animate-fadeIn`}>
                <div className={`flex gap-4 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-8 rounded-3xl shadow-xl ${
                    msg.role === 'user' 
                    ? 'bg-slate-200 text-slate-800 rounded-tr-none border border-slate-300' 
                    : 'bg-[#004E9A] text-white rounded-tl-none shadow-blue-900/20'
                  } w-fit max-w-[90%] overflow-x-auto transition-colors`}>
                    <div className={msg.role === 'ai' ? 'prose-invert' : ''}>
                      <MarkdownView content={msg.content} />
                    </div>
                    
                    {msg.grounding && msg.grounding.some(c => c.web) && (
                      <div className={`mt-8 pt-6 border-t ${msg.role === 'ai' ? 'border-white/10' : 'border-slate-300'}`}>
                         <div className={`text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${msg.role === 'ai' ? 'text-blue-200' : 'text-slate-500'}`}>
                           <i className="fa-solid fa-globe"></i> Fallback Web Sources
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {msg.grounding.map((chunk, idx) => chunk.web && (
                               <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener" className={`text-[10px] border px-3 py-1 rounded-full font-bold transition-colors ${
                                 msg.role === 'ai' 
                                 ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                                 : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50'
                               }`}>
                                 {chunk.web.title}
                               </a>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                 <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
                   <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                   </div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning Internal Knowledge...</span>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-8 bg-white border-t border-slate-200">
           <div className="max-w-4xl mx-auto flex gap-4">
              <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Query technical specs, roadmaps, or case studies from eBook..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium text-slate-700 shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-[#004E9A] text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-blue-800 shadow-lg disabled:opacity-50 transition-all"
              >
                 <i className="fa-solid fa-paper-plane"></i>
              </button>
           </div>
        </div>
      </div>

      {/* Side Library */}
      <div className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-500 flex flex-col ${showLibrary ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Active <span className="text-blue-600 italic">Context</span></h3>
            <button onClick={() => setShowLibrary(false)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
         </div>
         <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-400 group"
            >
               <i className="fa-solid fa-file-circle-plus text-xl group-hover:scale-110 transition-transform"></i>
               <span className="text-[10px] font-black uppercase tracking-widest">Append Knowledge</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={e => {
               const file = e.target.files?.[0];
               if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                     const text = ev.target?.result as string;
                     setLocalKb(prev => [{ id: `ext_${Date.now()}`, source: file.name, content: text }, ...prev]);
                  };
                  reader.readAsText(file);
               }
            }} />
            
            <div className="space-y-3 mt-4">
              {localKb.map(doc => (
                 <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl relative group hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                       <i className="fa-solid fa-file-contract text-blue-500 text-xs"></i>
                       <div className="text-[10px] font-black text-slate-700 uppercase truncate">{doc.source}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 font-medium">{doc.content}</div>
                    <button onClick={() => setLocalKb(prev => prev.filter(d => d.id !== doc.id))} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><i className="fa-solid fa-trash text-[10px]"></i></button>
                 </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
};
