
import React, { useState } from 'react';
import { Language } from '../types';
import { getGeminiBasicTask, generateMotTable } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props { language: Language; }

export const SecureMod: React.FC<Props> = ({ language }) => {
  const [product, setProduct] = useState('');
  const [target, setTarget] = useState('');
  const [pain, setPain] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New State for MOT Table
  const [motResult, setMotResult] = useState('');
  const [motLoading, setMotLoading] = useState(false);

  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    setMotResult(''); // Reset MOT if main analysis is re-run
    const system = "You are an Advantech B2B Strategic Consultant. Use the 'SECURE' framework (Speed, Engineered, Cognitive, Uncertainty, Reliability, Engineering) to analyze the fit.";
    const user = `Product: ${product}\nTarget Customer: ${target}\nCustomer Pain: ${pain}\n\nTask: Analyze using SECURE framework to handle objections.`;
    try {
      const res = await getGeminiBasicTask(system, user, language, true);
      setResult(res || '');
    } finally { setLoading(false); }
  };

  const handleGenerateMot = async () => {
    if (motLoading || !product || !target || !pain) return;
    setMotLoading(true);
    try {
      const table = await generateMotTable(product, target, pain, language);
      setMotResult(table || '');
    } catch (e) {
      console.error(e);
    } finally {
      setMotLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn space-y-10">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm"><i className="fa-solid fa-shield-halved text-3xl"></i></div>
          <div>
             <h2 className="text-4xl font-black text-[#004E9A] uppercase tracking-tighter">SECURE Framework</h2>
             <p className="text-slate-500 font-medium mt-1">Objection Handling & Trust Building Engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Product / Solution</label>
                <input type="text" placeholder="e.g. ECU-4784..." value={product} onChange={e => setProduct(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Audience</label>
                <input type="text" placeholder="e.g. Grid Operator..." value={target} onChange={e => setTarget(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Primary Objection / Pain</label>
                <textarea rows={4} placeholder="e.g. 'Your solution is too expensive compared to commercial PCs'..." value={pain} onChange={e => setPain(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <button onClick={handleAnalyze} disabled={loading || !product || !target} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-gavel"></i>} Analyze SECURE Fit
            </button>
          </div>

          <div className="lg:col-span-8">
            <div className="h-full bg-slate-50 rounded-[2.5rem] border border-slate-200 p-8 shadow-inner overflow-hidden flex flex-col">
               {result ? (
                   <div className="overflow-y-auto custom-scrollbar flex-1">
                        <MarkdownView content={result} />
                   </div>
               ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                       <i className="fa-solid fa-clipboard-check text-6xl mb-6 opacity-50"></i>
                       <p className="font-bold uppercase tracking-widest">Analysis Results Area</p>
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* New Feature: Peak Experience MOT Table */}
      {result && (
        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-800 animate-slideUp">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-700 pb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl">
                 <i className="fa-solid fa-route"></i>
               </div>
               <div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Peak Experience MOT</h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">10 Moments of Truth Strategy</p>
               </div>
            </div>
            <button 
              onClick={handleGenerateMot} 
              disabled={motLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/50 disabled:opacity-50"
            >
              {motLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-table-list"></i>}
              Generate 10 MOTs
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-3xl p-6 min-h-[300px] border border-slate-700">
             {motResult ? (
               <div className="prose prose-invert max-w-none">
                 <MarkdownView content={motResult} />
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 py-12">
                  <i className="fa-solid fa-map-location-dot text-5xl mb-4 opacity-30"></i>
                  <p className="font-bold uppercase tracking-widest text-xs">Ready to map customer journey</p>
               </div>
             )}
          </div>
        </div>
      )}
      <style>{`
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
