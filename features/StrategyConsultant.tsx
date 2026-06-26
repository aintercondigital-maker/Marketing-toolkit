
import React, { useState, useRef, useEffect } from 'react';
import { KBEntry, ChatMessage, Language } from '../types';
import { getGeminiMarketingResponse } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props {
  kb: KBEntry[];
  language: Language;
}

interface VectorDoc {
  id: number;
  filename: string;
  upload_date: string;
}

export const StrategyConsultant: React.FC<Props> = ({ kb: initialKb, language }) => {
  const [vectorDocs, setVectorDocs] = useState<VectorDoc[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [history, setHistory] = useState<(ChatMessage & { grounding?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVectorDocs = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setVectorDocs(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch vector docs:", err);
    }
  };

  useEffect(() => {
    fetchVectorDocs();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await getGeminiMarketingResponse(userMsg, language);
      setHistory(prev => [...prev, { role: 'ai', content: res.text, grounding: res.grounding }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "Failed to analyze internal context. Please check if the documents are too large." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && file.type !== 'text/plain' && !file.name.endsWith('.md')) {
      setError('Please upload a PDF, TXT, or MD file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchVectorDocs();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error(err);
      setError('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteVectorDoc = async (id: number) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchVectorDocs();
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const totalDocs = initialKb.length + vectorDocs.length;

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      <div className={`flex-1 flex flex-col transition-all duration-500 ${showLibrary ? 'mr-[400px]' : ''}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center z-20 sticky top-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-advantech-50 rounded-xl flex items-center justify-center text-advantech-600 shadow-sm border border-advantech-100">
                <i className="fa-solid fa-book-open text-lg"></i>
             </div>
             <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Internal Knowledge Center</h2>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className={`flex h-1.5 w-1.5 rounded-full ${totalDocs > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                   <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                     {totalDocs > 0 ? `${totalDocs} Context Docs Loaded` : 'No Context Loaded'}
                   </span>
                </div>
             </div>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="text-xs font-semibold text-slate-600 hover:text-advantech-600 transition-colors px-4 py-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-layer-group"></i> {showLibrary ? 'Close Library' : 'Manage Context'}
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {history.length === 0 && (
               <div className="text-center py-24 animate-fadeIn">
                  <div className="w-20 h-20 bg-advantech-50 text-advantech-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-advantech-100">
                    <i className="fa-solid fa-file-magnifying text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">Context-First <span className="text-transparent bg-clip-text bg-gradient-to-r from-advantech-500 to-blue-400">Advisor</span></h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                    Ask me anything. I will query our internal vector database first to provide highly accurate, context-aware answers.
                  </p>
               </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-4 animate-fadeIn`}>
                <div className={`flex gap-4 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-6 md:p-8 rounded-3xl shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-none border border-slate-700' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-slate-200/50'
                  } w-fit max-w-[90%] overflow-x-auto transition-all`}>
                    <div className={msg.role === 'user' ? 'prose-invert' : 'prose'}>
                      <MarkdownView content={msg.content} />
                    </div>
                    
                    {msg.grounding && msg.grounding.some(c => c.web) && (
                      <div className={`mt-6 pt-5 border-t ${msg.role === 'user' ? 'border-white/10' : 'border-slate-100'}`}>
                         <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-500'}`}>
                           <i className="fa-solid fa-globe"></i> Fallback Web Sources
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {msg.grounding.map((chunk, idx) => chunk.web && (
                               <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener" className={`text-[11px] border px-3 py-1.5 rounded-lg font-medium transition-colors truncate max-w-[250px] inline-block ${
                                 msg.role === 'user' 
                                 ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white' 
                                 : 'bg-slate-50 border-slate-200 text-advantech-600 hover:bg-advantech-50 hover:border-advantech-200'
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
              <div className="flex gap-4 animate-fadeIn">
                 <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
                   <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-advantech-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-advantech-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 bg-advantech-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Scanning Knowledge Base...</span>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-white border-t border-slate-200">
           <div className="max-w-4xl mx-auto flex gap-3 relative">
              <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Query technical specs, roadmaps, or case studies..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-advantech-500/20 focus:border-advantech-500 transition-all font-medium text-slate-700 shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-advantech-600 text-white w-14 h-14 rounded-xl flex items-center justify-center hover:bg-advantech-700 shadow-md disabled:opacity-50 disabled:hover:bg-advantech-600 transition-all"
              >
                 <i className="fa-solid fa-paper-plane"></i>
              </button>
           </div>
        </div>
      </div>

      {/* Side Library */}
      <div className={`absolute inset-y-0 right-0 w-[400px] bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-500 flex flex-col ${showLibrary ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Active Context</h3>
            <button onClick={() => setShowLibrary(false)} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><i className="fa-solid fa-xmark"></i></button>
         </div>
         <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vector Database</h4>
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-5 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:border-advantech-400 hover:bg-advantech-50 transition-all text-slate-400 group disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-transparent"
               >
                  {isUploading ? (
                    <i className="fa-solid fa-circle-notch animate-spin text-xl text-advantech-500"></i>
                  ) : (
                    <i className="fa-solid fa-file-arrow-up text-xl group-hover:scale-110 group-hover:text-advantech-500 transition-all"></i>
                  )}
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-advantech-600 transition-colors">
                    {isUploading ? 'Uploading & Processing...' : 'Upload PDF/Text to Knowledge Base'}
                  </span>
               </button>
               <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} />
               
               {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium flex items-start gap-2 animate-fadeIn">
                     <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                     <span>{error}</span>
                  </div>
               )}

               <div className="space-y-2 mt-4">
                 {vectorDocs.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                       <i className="fa-solid fa-database text-slate-300 text-2xl mb-2"></i>
                       <p className="text-xs text-slate-500 font-medium">No documents in Vector DB</p>
                    </div>
                 ) : (
                    vectorDocs.map(doc => (
                       <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl relative group hover:border-advantech-300 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-3 mb-1 pr-6">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                               doc.filename.toLowerCase().endsWith('.pdf') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                             }`}>
                                <i className={`fa-solid ${doc.filename.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-lines'}`}></i>
                             </div>
                             <div className="overflow-hidden">
                                <div className="text-sm font-semibold text-slate-800 truncate" title={doc.filename}>{doc.filename}</div>
                                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Uploaded {new Date(doc.upload_date).toLocaleDateString()}</div>
                             </div>
                          </div>
                          <button 
                             onClick={() => handleDeleteVectorDoc(doc.id)} 
                             className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                             title="Delete from Vector DB"
                          >
                             <i className="fa-solid fa-trash-can"></i>
                          </button>
                       </div>
                    ))
                 )}
               </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-100">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pre-loaded Knowledge</h4>
               {initialKb.map(doc => (
                  <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-lock"></i>
                        </div>
                        <div className="overflow-hidden">
                           <div className="text-sm font-semibold text-slate-700 truncate">{doc.source}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">System Default</div>
                        </div>
                     </div>
                     <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{doc.content}</div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
