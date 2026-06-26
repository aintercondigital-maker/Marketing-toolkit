
import React from 'react';
import { AppTab } from '../types';

interface Props {
  onNavigate: (tab: AppTab) => void;
  onOpenKB: () => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigate, onOpenKB }) => {
  const cards = [
    { id: 'spec-translator' as AppTab, icon: 'fa-wand-magic-sparkles', title: 'Spec-to-Value', desc: 'Transform Datasheets into Business Value.', colorClass: 'bg-blue-50 text-blue-600' },
    { id: 'tco-calculator' as AppTab, icon: 'fa-scale-unbalanced', title: 'TCO Calculator', desc: 'Quantify the cost of "Cheap" vs. Reliability.', colorClass: 'bg-emerald-50 text-emerald-600' },
    { id: 'pitch-script' as AppTab, icon: 'fa-stopwatch', title: 'Golden 30s', desc: 'Generate high-impact elevator pitches.', colorClass: 'bg-purple-50 text-purple-600' },
    { id: 'solution-burger' as AppTab, icon: 'fa-layer-group', title: 'Solution Burger', desc: 'Stack Products into a Vertical Solution.', colorClass: 'bg-orange-50 text-orange-600' },
    { id: 'roi-calculator' as AppTab, icon: 'fa-chart-line', title: 'JMF ROI Calc', desc: 'Track CPL and Pipeline conversion.', colorClass: 'bg-indigo-50 text-indigo-600' },
    { id: 'smart-converter' as AppTab, icon: 'fa-file-powerpoint', title: 'Smart Converter', desc: 'Turn PDFs into Editable PPTX slides.', colorClass: 'bg-teal-50 text-teal-600' },
    { id: 'secure-mod' as AppTab, icon: 'fa-shield-halved', title: 'SECURE Framework', desc: 'Address objections with Reliability & Trust.', colorClass: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fadeIn">
      {/* Hero Section */}
      <div className="bg-slate-900 rounded-[2rem] p-10 md:p-16 text-white shadow-xl mb-12 relative overflow-hidden border border-slate-800">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-advantech-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            2026 Partner Portal
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white">
            Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-advantech-400 to-blue-300">Toolkit</span>
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 font-normal leading-relaxed max-w-2xl">
            Quickly find marketing assets, translate technical specs into business value, and build high-impact presentations for your clients.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('strategy-consultant')}
              className="bg-advantech-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-advantech-500 transition-all shadow-lg shadow-advantech-900/20 flex items-center gap-2.5"
            >
              <i className="fa-solid fa-magnifying-glass text-sm"></i> Marketing Assistant
            </button>
            <button 
              onClick={onOpenKB}
              className="bg-slate-800/80 text-slate-200 px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2.5 backdrop-blur-sm"
            >
              <i className="fa-solid fa-folder-open text-sm"></i> Browse Library
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-toolbox text-advantech-600"></i> Core Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map(card => (
            <div 
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-advantech-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className={`w-12 h-12 rounded-xl ${card.colorClass} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <i className={`fa-solid ${card.icon} text-lg`}></i>
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-advantech-700 transition-colors">{card.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed flex-grow">{card.desc}</p>
              <div className="mt-4 flex items-center text-xs font-semibold text-advantech-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                Launch Tool <i className="fa-solid fa-arrow-right ml-1.5"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
