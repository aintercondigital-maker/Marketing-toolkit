
import React, { useState, useEffect } from 'react';
import { AppTab, KBEntry, Language } from './types';
import { INITIAL_KB } from './constants';
import { Dashboard } from './features/Dashboard';
import { StrategyConsultant } from './features/StrategyConsultant';
import { SpecTranslator } from './features/SpecTranslator';
import { TCOCalculator } from './features/TCOCalculator';
import { PitchScript } from './features/PitchScript';
import { SolutionBurger } from './features/SolutionBurger';
import { SecureMod } from './features/SecureMod';
import { SmartConverter } from './features/SmartConverter';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  // Default to English as requested
  const [language, setLanguage] = useState<Language>('English');
  const [kb] = useState<KBEntry[]>(INITIAL_KB);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        try { await window.aistudio.openSelectKey(); } catch(e) { console.error(e); }
      }
    };
    checkKey();
  }, []);

  const NavItem = ({ tab, icon, label }: { tab: AppTab, icon: string, label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
        activeTab === tab 
        ? 'bg-[#004E9A] text-white shadow-md transform scale-105' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-[#004E9A]'
      }`}
    >
      <i className={`fa-solid ${icon} ${activeTab === tab ? 'animate-pulse' : ''}`}></i>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800">
      <header className="bg-white shadow-sm border-b border-slate-200 z-50 h-16 flex items-center px-6 justify-between flex-none">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="w-9 h-9 bg-[#004E9A] rounded-lg text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-blue-800 transition-colors">A</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm text-slate-800 uppercase tracking-tight leading-none">Advantech</h1>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Marketing Toolkit</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <NavItem tab="dashboard" icon="fa-gauge" label="Home" />
          <NavItem tab="strategy-consultant" icon="fa-magnifying-glass" label="Marketing" />
          <NavItem tab="spec-translator" icon="fa-wand-magic" label="Spec" />
          <NavItem tab="tco-calculator" icon="fa-scale-unbalanced" label="TCO" />
          <NavItem tab="pitch-script" icon="fa-stopwatch" label="Pitch" />
          <NavItem tab="solution-burger" icon="fa-layer-group" label="Burger" />
          <NavItem tab="smart-converter" icon="fa-file-powerpoint" label="Converter" />
        </nav>

        <div className="flex items-center gap-2">
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value as Language)} 
            className="text-xs font-bold bg-white text-slate-700 py-2 px-3 rounded-lg border border-slate-200 shadow-sm outline-none"
          >
            <option value="English">English</option>
            <option value="Traditional Chinese">繁體中文</option>
            <option value="Simplified Chinese">简体中文</option>
            <option value="Japanese">日本語</option>
            <option value="Korean">한국어</option>
            <option value="Spanish">Español</option>
            <option value="Portuguese">Português</option>
            <option value="Turkish">Türkçe</option>
            <option value="Vietnamese">Tiếng Việt</option>
            <option value="Indonesian">Bahasa Indonesia</option>
            <option value="Thai">ไทย</option>
            <option value="Russian">Русский</option>
          </select>
          <button onClick={() => window.aistudio?.openSelectKey()} className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-key"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} onOpenKB={() => setActiveTab('strategy-consultant')} />}
        {activeTab === 'strategy-consultant' && <StrategyConsultant kb={kb} language={language} />}
        {activeTab === 'spec-translator' && <SpecTranslator language={language} />}
        {activeTab === 'tco-calculator' && <TCOCalculator />}
        {activeTab === 'pitch-script' && <PitchScript language={language} />}
        {activeTab === 'solution-burger' && <SolutionBurger language={language} />}
        {activeTab === 'secure-mod' && <SecureMod language={language} />}
        {activeTab === 'smart-converter' && <SmartConverter />}
      </main>
    </div>
  );
};

export default App;
