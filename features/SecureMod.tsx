
import React, { useState } from 'react';
import { Language } from '../types';
import { getGeminiBasicTask } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props { language: Language; }

export const SecureMod: React.FC<Props> = ({ language }) => {
  const [product, setProduct] = useState('');
  const [target, setTarget] = useState('');
  const [pain, setPain] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    const system = "You are an Advantech B2B Strategic Consultant. Use the 'SECURE' framework (Speed, Engineered, Cognitive, Uncertainty, Reliability, Engineering) to analyze the fit.";
    const user = `Product: ${product}\nTarget Customer: ${target}\nCustomer Pain: ${pain}\n\nTask: Analyze using SECURE framework to handle objections.`;
    try {
      const res = await getGeminiBasicTask(system, user, language, true);
      setResult(res || '');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn">
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
            <button onClick={handleAnalyze} disabled={loading} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
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
    </div>
  );
};
