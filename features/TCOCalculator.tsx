
import React, { useState } from 'react';

export const TCOCalculator: React.FC = () => {
  const [downtimeCostStr, setDowntimeCostStr] = useState('5000');
  const [failureHoursStr, setFailureHoursStr] = useState('20');
  const [revalCostStr, setRevalCostStr] = useState('50000');
  const [priceDiffStr, setPriceDiffStr] = useState('8000');
  const [showResults, setShowResults] = useState(false);

  const downtimeCost = parseFloat(downtimeCostStr) || 0;
  const failureHours = parseFloat(failureHoursStr) || 0;
  const revalCost = parseFloat(revalCostStr) || 0;
  const priceDiff = parseFloat(priceDiffStr) || 0;

  const loss = (downtimeCost * failureHours) + (revalCost / 3);
  const gain = loss - priceDiff;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center shadow-sm"><i className="fa-solid fa-scale-unbalanced text-2xl"></i></div>
          <div>
              <h2 className="text-3xl font-black text-[#004E9A] uppercase tracking-tight">TCO Calculator</h2>
              <p className="text-slate-500 font-medium">Quantify the high cost of "Cheap" hardware</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Downtime Cost ($/hr)</label>
              <input 
                type="number" 
                value={downtimeCostStr} 
                onChange={e => setDowntimeCostStr(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl bg-white font-bold text-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-800" 
              />
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest">Est. Annual Failure Risk (Hrs)</label>
              <input 
                type="number" 
                value={failureHoursStr}
                onChange={e => setFailureHoursStr(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl bg-white font-bold text-lg focus:ring-2 focus:ring-green-500 outline-none text-slate-800" 
              />
            </div>
            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10"><i className="fa-solid fa-triangle-exclamation text-6xl text-red-500"></i></div>
              <label className="block text-xs font-black text-red-600 mb-2 uppercase tracking-widest relative z-10">
                Re-validation Cost (Migration)
              </label>
              <p className="text-[10px] text-red-400 mb-3 font-medium relative z-10">Hidden costs when consumer-grade HW goes EOL.</p>
              <input 
                type="number" 
                value={revalCostStr}
                onChange={e => setRevalCostStr(e.target.value)}
                className="w-full p-4 border border-red-200 rounded-xl bg-white text-red-700 font-black text-lg outline-none relative z-10" 
              />
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <label className="block text-xs font-black text-blue-800 mb-2 uppercase tracking-widest">Advantech Price Premium ($)</label>
              <input 
                type="number" 
                value={priceDiffStr}
                onChange={e => setPriceDiffStr(e.target.value)}
                className="w-full p-4 border border-blue-200 rounded-xl bg-white font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" 
              />
            </div>
            <button 
              onClick={() => setShowResults(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 text-sm tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-calculator"></i> Calculate Value Gain
            </button>
          </div>

          <div className="flex flex-col justify-center h-full space-y-6">
             {showResults ? (
                <div className="animate-fadeIn space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border-l-[16px] border-red-500 shadow-sm border border-slate-100 relative">
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Competitor's Annual Risk Cost</div>
                        <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">${Math.round(loss).toLocaleString()}</div>
                        <div className="absolute top-6 right-6 text-red-100 text-4xl"><i className="fa-solid fa-circle-xmark"></i></div>
                    </div>
                    
                    <div className="bg-white p-8 rounded-[2rem] border-l-[16px] border-green-500 shadow-xl border border-slate-100 relative transform scale-105">
                        <div className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Advantech Value Net Gain</div>
                        <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">${Math.round(gain).toLocaleString()}</div>
                        <div className="absolute top-6 right-6 text-green-100 text-4xl"><i className="fa-solid fa-circle-check"></i></div>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-[2rem] text-slate-300 text-sm leading-relaxed shadow-inner">
                        <i className="fa-solid fa-quote-left text-slate-600 text-2xl mb-2 block"></i>
                        By choosing Advantech, you secure a first-year net value gain of <strong className="text-white">${Math.round(gain).toLocaleString()}</strong> by avoiding ${Math.round(loss).toLocaleString()} in downtime & risks.
                        <div className="mt-4 text-right font-black text-white uppercase text-xs tracking-widest">- Value Consultant</div>
                    </div>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[3rem]">
                    <i className="fa-solid fa-chart-pie text-8xl mb-6 opacity-20"></i>
                    <p className="font-bold uppercase tracking-widest">Enter data to see ROI</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
