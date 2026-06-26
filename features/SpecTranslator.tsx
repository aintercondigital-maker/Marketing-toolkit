
import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { getGeminiBasicTask, generateGoogleAds, AdFormat, generateKeywordSuggestions } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';
import { INITIAL_KB } from '../constants';

interface Props { language: Language; }

interface AdsData {
  ad_group_idea: string;
  headlines: { text: string; length_check: string }[];
  long_headlines?: { text: string; length_check: string }[];
  descriptions: { text: string; length_check: string }[];
  marketing_rationale: string;
}

export const SpecTranslator: React.FC<Props> = ({ language }) => {
  const [model, setModel] = useState('');
  const [specs, setSpecs] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [keywordReport, setKeywordReport] = useState('');
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);

  const [adsData, setAdsData] = useState<AdsData | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [adFormat, setAdFormat] = useState<AdFormat>('RSA');
  const [adsError, setAdsError] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  const adsRef = useRef<HTMLDivElement>(null);
  const kwRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!specs.trim() || loading) return;
    setLoading(true);
    setAdsData(null);
    setAdsError(null);
    setKeywordReport('');
    setSuggestedKeywords([]);
    
    const context = INITIAL_KB
      .filter(item => model && (item.content.toLowerCase().includes(model.toLowerCase()) || item.source.toLowerCase().includes(model.toLowerCase())))
      .map(i => `[Ref: ${i.source}] ${i.content}`).join('\n\n');

    const system = "You are an Advantech Strategist. Translate technical specs into value props. Use clear Markdown sections: ### 🚩 Pain Point Analysis, ### 💎 Value Propositions, and ### 🎯 Target Persona. Highlight ROI and Industrial Reliability.";
    const user = `Product: ${model}\nSpecs:\n${specs}\n\nContext:\n${context}\n\nTask: Diagnose pain points and create value propositions.`;
    
    try {
      const res = await getGeminiBasicTask(system, user, language);
      setResult(res || '');
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetKeywords = async () => {
    if (keywordLoading) return;
    setKeywordLoading(true);
    kwRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    try {
      const report = await generateKeywordSuggestions(model, specs, language);
      setKeywordReport(report || '');
      
      const lines = report.split('\n');
      const kwList: string[] = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && !trimmed.includes('---') && !trimmed.toLowerCase().includes('keyword') && !trimmed.toLowerCase().includes('關鍵字')) {
          const parts = trimmed.split('|');
          if (parts.length > 2) {
            const kw = parts[1].trim()
              .replace(/\*\*/g, '')
              .replace(/\[/g, '')
              .replace(/\]/g, '')
              .replace(/"/g, '')
              .replace(/'/g, '');
              
            if (kw && kw.length > 1 && kw.length < 50) {
              kwList.push(kw);
            }
          }
        }
      });
      setSuggestedKeywords([...new Set(kwList)].slice(0, 12)); 
    } catch (err) {
      console.error(err);
    } finally {
      setKeywordLoading(false);
    }
  };

  const handleGenerateAds = async () => {
    if (!result || adsLoading) return;
    setAdsLoading(true);
    setAdsError(null);
    try {
      const jsonStr = await generateGoogleAds(model, specs, result, keywords, adFormat, language);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr.trim());
        setAdsData(parsed);
        setTimeout(() => adsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error: any) {
      console.error("Ads generation failed", error);
      setAdsError(error.message || "Failed to generate valid ad copy. Please try again.");
    } finally {
      setAdsLoading(false);
    }
  };

  const toggleKeyword = (kw: string) => {
    const current = keywords.split(',').map(s => s.trim()).filter(Boolean);
    if (current.includes(kw)) {
      setKeywords(current.filter(k => k !== kw).join(', '));
    } else {
      setKeywords([...current, kw].join(', '));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn" style={{ fontFamily: 'Arial' }}>
      {/* 1. INPUT SECTION */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-[#004E9A] rounded-xl text-white flex items-center justify-center text-xl shadow-lg">
               <i className="fa-solid fa-wand-magic-sparkles"></i>
             </div>
             <div>
               <h2 className="text-xl font-black text-[#004E9A] uppercase tracking-tight">Strategy Input</h2>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Feed the AI with Technical Data</p>
             </div>
           </div>
           <button onClick={() => {setModel(''); setSpecs(''); setResult(''); setAdsData(null); setKeywordReport(''); setAdsError(null);}} className="text-slate-400 hover:text-red-500 transition-colors">
              <i className="fa-solid fa-rotate-left"></i>
           </button>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Product</label>
             <input 
                type="text" 
                placeholder="e.g. MIC-770 V3..." 
                value={model} 
                onChange={e => setModel(e.target.value)} 
                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-[14px]" 
             />
             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                  Internal KB will automatically map certifications and campaign themes based on this product name.
                </p>
             </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Datasheet Content / Specs</label>
             <textarea 
                rows={5} 
                placeholder="Paste technical specifications here..." 
                value={specs} 
                onChange={e => setSpecs(e.target.value)} 
                className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-[14px]" 
             />
             <button 
                onClick={handleGenerate} 
                disabled={loading || !specs} 
                className="w-full bg-[#004E9A] text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm"
              >
                {loading ? <i className="fa-solid fa-gear animate-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
                Extract Business Value
              </button>
          </div>
        </div>
      </div>

      {/* 2. RESULTS SECTION */}
      {(result || loading) && (
        <div ref={resultRef} className="space-y-8 animate-slideUp">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-8 md:p-12">
               <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 text-[#004E9A] rounded-2xl flex items-center justify-center text-xl">
                    <i className="fa-solid fa-brain"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-[14px]">Value Intelligence Report</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grounded in Peak Experience Methodology</p>
                  </div>
               </div>

               <div className="relative min-h-[200px]" style={{ fontSize: '14px' }}>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <i className="fa-solid fa-atom animate-spin text-4xl text-blue-600"></i>
                       <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Analyzing Market Context...</p>
                    </div>
                  ) : (
                    <div className="prose prose-blue max-w-none">
                       <MarkdownView content={result} />
                    </div>
                  )}
               </div>
            </div>

            {/* Keyword Intelligence Section */}
            {!loading && result && (
              <div ref={kwRef} className="bg-blue-50 p-8 md:p-12 border-t border-blue-100">
                <div className="max-w-6xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                           <i className="fa-solid fa-magnifying-glass-chart"></i>
                        </div>
                        <div>
                           <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">SEM Keyword Intelligence</h4>
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Strategy: Core • Specs • Scenarios</p>
                        </div>
                     </div>

                     {!keywordReport && !keywordLoading && (
                       <button 
                         onClick={handleGetKeywords}
                         className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95"
                       >
                         <i className="fa-solid fa-wand-sparkles"></i>
                         Generate Keyword Report
                       </button>
                     )}
                  </div>

                  {keywordLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                       <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 animate-pulse">Mapping Search Intent...</span>
                    </div>
                  ) : keywordReport ? (
                    <div className="space-y-6">
                       <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 prose prose-sm max-w-none overflow-x-auto animate-fadeIn">
                          <MarkdownView content={keywordReport} />
                       </div>
                       
                       {suggestedKeywords.length > 0 && (
                         <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 animate-fadeIn">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4 text-center italic">
                             — Auto-Detected Keywords (Select to Build Ads) —
                           </span>
                           <div className="flex flex-wrap gap-2 justify-center">
                              {suggestedKeywords.map((kw, i) => {
                                const active = keywords.split(',').map(s => s.trim()).includes(kw);
                                return (
                                  <button 
                                    key={i} 
                                    onClick={() => toggleKeyword(kw)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                                      active 
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                    }`}
                                  >
                                    {active ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus text-[10px] opacity-40"></i>}
                                    {kw}
                                  </button>
                                );
                              })}
                           </div>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="py-20 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex flex-col items-center justify-center text-blue-300/60">
                       <i className="fa-solid fa-lightbulb text-6xl mb-4 opacity-20"></i>
                       <p className="font-black uppercase tracking-[0.2em] text-[10px]">Click the button above to start Keyword Discovery</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ad Extension Tool */}
            {!loading && result && (
              <div ref={adsRef} className="bg-slate-900 p-8 md:p-12 border-t border-slate-800">
                <div className="max-w-4xl mx-auto">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                            <i className="fa-brands fa-google text-blue-500 text-xl"></i>
                         </div>
                         <div>
                            <h4 className="text-white font-black text-lg uppercase tracking-tight text-[14px]">SEM Digital Asset Factory</h4>
                            <p className="text-blue-300/50 text-[10px] font-black uppercase tracking-widest">Convert Strategy to High-CTR Ad Copy</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-2">
                         {(['RSA', 'PMax', 'Display', 'DemandGen'] as AdFormat[]).map(f => (
                           <button 
                             key={f}
                             onClick={() => setAdFormat(f)}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                               adFormat === f ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                             }`}
                           >
                             {f}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="md:col-span-3">
                         <input 
                            type="text" 
                            placeholder="Select keywords above or enter manually..." 
                            value={keywords} 
                            onChange={e => setKeywords(e.target.value)} 
                            className="w-full p-4 border border-slate-700 rounded-2xl bg-slate-800 text-white font-bold text-[14px] outline-none transition-all placeholder:text-slate-600"
                         />
                      </div>
                      <button onClick={handleGenerateAds} disabled={adsLoading} className="w-full bg-blue-600 text-white p-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        {adsLoading ? <i className="fa-solid fa-sync animate-spin"></i> : <i className="fa-solid fa-bullhorn"></i>} Build Ads
                      </button>
                   </div>

                   {adsError && (
                     <div className="mb-8 p-6 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-200 text-sm font-bold flex items-center gap-3">
                       <i className="fa-solid fa-circle-exclamation text-xl"></i>
                       {adsError}
                     </div>
                   )}

                   {adsData && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn" style={{ fontSize: '14px' }}>
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-3">Headlines (Units Check)</label>
                              <div className="space-y-2">
                                 {adsData.headlines.map((h, i) => (
                                   <div key={i} className="flex group items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all cursor-copy" onClick={() => copyToClipboard(h.text)}>
                                      <span className="text-[14px] font-bold text-slate-300 truncate mr-3">{h.text}</span>
                                      <span className="text-[9px] font-mono text-slate-500 group-hover:text-blue-400">{h.length_check}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           {adsData.long_headlines && adsData.long_headlines.length > 0 && (
                              <div>
                                 <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-3">Long Headlines (Max 90)</label>
                                 <div className="space-y-2">
                                    {adsData.long_headlines.map((h, i) => (
                                      <div key={i} className="flex group items-center justify-between p-3 rounded-xl bg-purple-900/10 border border-purple-500/20 hover:border-purple-500 transition-all cursor-copy" onClick={() => copyToClipboard(h.text)}>
                                         <span className="text-[14px] font-black text-purple-200 leading-snug">{h.text}</span>
                                         <span className="text-[9px] font-mono text-purple-500">{h.length_check}</span>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Descriptions</label>
                              <div className="space-y-3">
                                 {adsData.descriptions.map((d, i) => (
                                   <div key={i} className="flex group flex-col p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all cursor-copy" onClick={() => copyToClipboard(d.text)}>
                                      <p className="text-[14px] text-slate-400 leading-relaxed mb-2">{d.text}</p>
                                      <div className="text-right"><span className="text-[9px] font-mono text-slate-600 group-hover:text-blue-400">{d.length_check}</span></div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                           <div className="p-5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">AI Campaign Logic</span>
                              <p className="text-[12px] text-blue-100/70 italic leading-relaxed">"{adsData.marketing_rationale}"</p>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .cursor-copy { cursor: copy; }
      `}</style>
    </div>
  );
};
