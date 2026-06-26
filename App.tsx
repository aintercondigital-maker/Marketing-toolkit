
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
import { ROICalculator } from './features/ROICalculator';
import { VectorDBManager } from './features/VectorDBManager';

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
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
        activeTab === tab 
        ? 'bg-slate-800 text-white shadow-sm' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <i className={`fa-solid ${icon} ${activeTab === tab ? 'text-blue-400' : 'text-slate-400'}`}></i>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-14 flex items-center px-6 justify-between flex-none sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 bg-advantech-700 rounded-md text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-advantech-800 transition-colors">A</div>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm text-slate-900 tracking-tight leading-none">Advantech</h1>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">Marketing Toolkit</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          <NavItem tab="dashboard" icon="fa-gauge" label="Home" />
          <NavItem tab="strategy-consultant" icon="fa-magnifying-glass" label="Marketing" />
          <NavItem tab="spec-translator" icon="fa-wand-magic" label="Spec" />
          <NavItem tab="tco-calculator" icon="fa-scale-unbalanced" label="TCO" />
          <NavItem tab="pitch-script" icon="fa-stopwatch" label="Pitch" />
          <NavItem tab="solution-burger" icon="fa-layer-group" label="Burger" />
          <NavItem tab="roi-calculator" icon="fa-chart-line" label="ROI" />
          <NavItem tab="smart-converter" icon="fa-file-powerpoint" label="Converter" />
          <NavItem tab="vector-db" icon="fa-database" label="Vector DB" />
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value as Language)} 
              className="appearance-none text-xs font-medium bg-slate-50 text-slate-700 py-1.5 pl-3 pr-8 rounded-md border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-advantech-500/20 transition-all cursor-pointer"
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
            <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
          <button onClick={() => window.aistudio?.openSelectKey()} className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all flex items-center justify-center" title="API Key Settings">
            <i className="fa-solid fa-key text-xs"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} onOpenKB={() => setActiveTab('strategy-consultant')} />}
        {activeTab === 'strategy-consultant' && <StrategyConsultant kb={kb} language={language} />}
        {activeTab === 'spec-translator' && <SpecTranslator language={language} />}
        {activeTab === 'tco-calculator' && <TCOCalculator language={language} />}
        {activeTab === 'pitch-script' && <PitchScript language={language} />}
        {activeTab === 'solution-burger' && <SolutionBurger language={language} />}
        {activeTab === 'secure-mod' && <SecureMod language={language} />}
        {activeTab === 'roi-calculator' && <ROICalculator language={language} />}
        {activeTab === 'smart-converter' && <SmartConverter language={language} />}
        {activeTab === 'vector-db' && <VectorDBManager />}
      </main>
    </div>
  );
};

export default App;
