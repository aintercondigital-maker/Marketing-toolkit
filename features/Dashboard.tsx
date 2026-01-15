
import React from 'react';
import { AppTab } from '../types';

interface Props {
  onNavigate: (tab: AppTab) => void;
  onOpenKB: () => void;
}

export const Dashboard: React.FC<Props> = ({ onNavigate, onOpenKB }) => {
  const cards = [
    { id: 'spec-translator' as AppTab, icon: 'fa-wand-magic-sparkles', title: 'Spec-to-Value', desc: 'Transform Datasheets into Business Value.', color: 'blue' },
    { id: 'tco-calculator' as AppTab, icon: 'fa-scale-unbalanced', title: 'TCO Calculator', desc: 'Quantify the cost of "Cheap" vs. Reliability.', color: 'green' },
    { id: 'pitch-script' as AppTab, icon: 'fa-stopwatch', title: 'Golden 30s', desc: 'Generate high-impact elevator pitches.', color: 'purple' },
    { id: 'solution-burger' as AppTab, icon: 'fa-layer-group', title: 'Solution Burger', desc: 'Stack Products into a Vertical Solution.', color: 'orange' },
    { id: 'icon-factory' as AppTab, icon: 'fa-shapes', title: 'Icon Factory', desc: 'Generate Industrial SVG Assets.', color: 'indigo' },
    { id: 'smart-converter' as AppTab, icon: 'fa-file-powerpoint', title: 'Smart Converter', desc: 'Turn PDFs into Editable PPTX slides.', color: 'emerald' },
    { id: 'secure-mod' as AppTab, icon: 'fa-shield-halved', title: 'SECURE Framework', desc: 'Address objections with Reliability & Trust.', color: 'red' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="bg-gradient-to-br from-[#004E9A] to-blue-900 rounded-3xl p-8 md:p-16 text-white shadow-2xl mb-10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-block bg-cyan-500 text-blue-900 text-[10px] font-black px-3 py-1 rounded-full mb-6 uppercase tracking-widest">2026 Partner Portal</div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-white uppercase">Marketing <span className="text-yellow-400 italic">Toolkit</span></h2>
          <p className="text-blue-100 text-lg max-w-2xl mb-10 font-light leading-relaxed">
            Quickly find <strong>Marketing Assets</strong>, translate specs into value, and build high-impact presentations for your clients.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('strategy-consultant')}
              className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl flex items-center gap-3 uppercase tracking-tighter"
            >
              <i className="fa-solid fa-magnifying-glass"></i> Marketing Assistant
            </button>
            <button 
              onClick={onOpenKB}
              className="bg-blue-600/30 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg flex items-center gap-3 border border-white/20 uppercase tracking-tighter backdrop-blur-sm"
            >
              <i className="fa-solid fa-folder-open"></i> Browse Library
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map(card => (
          <div 
            key={card.id}
            onClick={() => onNavigate(card.id)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <i className={`fa-solid ${card.icon}`}></i>
            </div>
            <h3 className="font-bold text-slate-800">{card.title}</h3>
            <p className="text-xs text-slate-500 mt-2">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
