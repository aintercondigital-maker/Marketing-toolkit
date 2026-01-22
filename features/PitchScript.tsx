
import React, { useState } from 'react';
import { Language } from '../types';
import { getGeminiBasicTask } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

interface Props { language: Language; }

export const PitchScript: React.FC<Props> = ({ language }) => {
  const [persona, setPersona] = useState('decision_maker');
  const [dataPoint, setDataPoint] = useState('');
  const [result, setResult] = useState({ call: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);

    let personaContext = "";
    switch (persona) {
      case 'introducer':
        personaContext = "The Introducer. Anxiety: 'Will this reflect poorly on my judgment?' Need: Trust, clear communication, recognition.";
        break;
      case 'evaluator':
        personaContext = "The Evaluator. Anxiety: 'Will I miss a critical flaw? Can I defend this with data?' Need: Technical proof, detailed specs, evidence of reliability.";
        break;
      case 'decision_maker':
        personaContext = "The Decision-Maker. Anxiety: 'Is this the best use of capital? Will it deliver value?' Need: Clear business case, ROI, long-term partnership.";
        break;
      case 'user':
        personaContext = "The User. Anxiety: 'Will this make my job harder? How long to learn?' Need: Simplicity, training, minimal disruption.";
        break;
      case 'advocate':
        personaContext = "The Advocate. Anxiety: 'Was my recommendation the right one?' Need: To see the project succeed and look good.";
        break;
      default:
        personaContext = "The Decision-Maker. Focus on ROI.";
    }

    const system = "You are a World-Class Sales Expert. Your task is to generate an Advantech Value Pitch using the 'Align-Assure-Advance' structure.";
    const user = `Target Persona: ${personaContext}.\nKey Data Point: ${dataPoint}.\n\nOutput Requirement:\n1. A 30-second spoken script (Address their specific anxiety directly).\n2. A follow-up cold email (Focus on their specific need).\n\nSeparator: Use '---SPLIT---' to separate the Script from the Email.`;
    
    try {
      const res = await getGeminiBasicTask(system, user, language);
      const parts = (res || '').split('---SPLIT---');
      setResult({ call: parts[0]?.trim() || '', email: parts[1]?.trim() || '' });
    } catch (e) {
      console.error(e);
      setResult({ call: 'Error generating pitch.', email: '' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm"><i className="fa-solid fa-stopwatch text-2xl"></i></div>
          <div>
            <h2 className="text-3xl font-black text-[#004E9A] uppercase tracking-tight">Golden 30s Pitch Builder</h2>
            <p className="text-slate-500 font-medium">Craft the perfect elevator pitch based on Key Player Psychology</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex-1">
             <label className="block text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Target Persona</label>
             <div className="relative">
                <select value={persona} onChange={e => setPersona(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-white font-bold text-slate-700 focus:ring-2 focus:ring-purple-500 appearance-none text-sm">
                  <option value="introducer">The Introducer (Focus: Trust & Judgment)</option>
                  <option value="evaluator">The Evaluator (Focus: Tech Proof & Specs)</option>
                  <option value="decision_maker">The Decision-Maker (Focus: ROI & Capital)</option>
                  <option value="user">The User (Focus: Simplicity & Ease)</option>
                  <option value="advocate">The Advocate (Focus: Success & Validation)</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
             </div>
          </div>
          <div className="flex-[2]">
             <label className="block text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Key Insight / Data Point</label>
             <input 
                type="text" 
                placeholder="e.g. 'Unplanned downtime costs $20k/hr' or 'New regulation compliance'..." 
                value={dataPoint} 
                onChange={e => setDataPoint(e.target.value)} 
                className="w-full p-4 border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-purple-500 outline-none" 
             />
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="bg-purple-600 text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg hover:bg-purple-700 transition-all self-end h-[58px] flex items-center gap-2"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic"></i>} Generate
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 relative group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-black px-4 py-2 rounded-bl-2xl rounded-tr-[2rem] uppercase tracking-wider">Verbal Script</div>
            <div className="mt-4 min-h-[300px] text-sm text-slate-700 leading-loose">
               {result.call ? <MarkdownView content={result.call} /> : <div className="text-slate-300 flex items-center justify-center h-full italic">Script will appear here...</div>}
            </div>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 relative group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-black px-4 py-2 rounded-bl-2xl rounded-tr-[2rem] uppercase tracking-wider">Email Follow-up</div>
            <div className="mt-4 min-h-[300px] text-sm text-slate-700 leading-loose">
               {result.email ? <MarkdownView content={result.email} /> : <div className="text-slate-300 flex items-center justify-center h-full italic">Email draft will appear here...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
