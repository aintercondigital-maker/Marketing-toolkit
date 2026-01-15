
import React, { useState } from 'react';
import { Language } from '../types';
import { generateSolutionCopy } from '../services/geminiService';
import { MarkdownView } from '../components/MarkdownView';

const COMPONENTS = {
  software: [
    { name: "HMINavi", desc: "Object-oriented HMI Software" },
    { name: "MotionNavi", desc: "EtherCAT Configuration Tool" },
    { name: "DAQNavi/MCM", desc: "Data Acquisition & Vibration SDK" },
    { name: "CODESYS", desc: "SoftPLC & Motion Control Runtime" },
    { name: "IoTSuite", desc: "iFactory Solution Package (OEE/PHM)" }
  ],
  hardware: [
    { name: "AMAX-5580", desc: "EtherCAT Slice I/O Controller" },
    { name: "ECU-479", desc: "IEC 61850-3 Substation Server" },
    { name: "WOP-200K", desc: "Industrial Operator Panel (HMI)" },
    { name: "iDAQ-964", desc: "Modular High-Speed DAQ Chassis" },
    { name: "MIC-770 V3", desc: "High Performance Fanless IPC" }
  ],
  connectivity: [
    { name: "AMAX-5000 I/O", desc: "EtherCAT Slice Modules" },
    { name: "USB-5801", desc: "USB 3.0 Industrial Digital I/O" },
    { name: "WISE-750", desc: "Intelligent Vibration Gateway" },
    { name: "ECU-1252", desc: "BESS Communication Gateway" },
    { name: "PCIE-1840", desc: "125MS/s High-Speed Digitizer" }
  ]
};

interface Props { language: Language; }

export const SolutionBurger: React.FC<Props> = ({ language }) => {
  const [selections, setSelections] = useState({
    software: COMPONENTS.software[0].name,
    hardware: COMPONENTS.hardware[0].name,
    connectivity: COMPONENTS.connectivity[0].name
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const copy = await generateSolutionCopy(
      selections.software, 
      selections.hardware, 
      selections.connectivity, 
      language
    );
    setResult(copy || '');
    setLoading(false);
  };

  const SelectionCard = ({ category, list, label, icon }: { category: keyof typeof COMPONENTS, list: any[], label: string, icon: string }) => (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <i className={`fa-solid ${icon} text-blue-500 text-xs`}></i>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      </div>
      <div className="space-y-2">
        {list.map(item => (
          <button
            key={item.name}
            onClick={() => setSelections(prev => ({ ...prev, [category]: item.name }))}
            className={`w-full p-4 text-left rounded-xl border transition-all flex flex-col ${
              selections[category] === item.name 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
            }`}
          >
            <span className="font-bold text-sm">{item.name}</span>
            <span className={`text-[10px] ${selections[category] === item.name ? 'text-blue-100' : 'text-slate-400'}`}>
              {item.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
        <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
             <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
               <i className="fa-solid fa-burger"></i>
             </div>
             <div>
                <h2 className="text-4xl font-black text-[#004E9A] uppercase tracking-tighter">Solution Burger</h2>
                <p className="text-slate-500 font-medium">Build iAutomation, Energy & Factory Solutions</p>
             </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <SelectionCard category="software" list={COMPONENTS.software} label="Intelligence Layer" icon="fa-laptop-code" />
            <SelectionCard category="hardware" list={COMPONENTS.hardware} label="Compute / Control" icon="fa-microchip" />
            <SelectionCard category="connectivity" list={COMPONENTS.connectivity} label="Sensing & I/O" icon="fa-tower-broadcast" />
            
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#004E9A] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              Generate Strategic Copy
            </button>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-slate-50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative overflow-hidden border border-slate-200 shadow-inner min-h-[500px]">
               <div className="flex flex-col gap-2 w-full max-w-md perspective-1000 transform scale-110">
                  <div className="bg-blue-500 text-white p-6 rounded-t-[3.5rem] rounded-b-xl shadow-lg border-b-4 border-blue-700 text-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">Software</span>
                     <span className="text-xl font-black tracking-tight">{selections.software}</span>
                  </div>
                  <div className="bg-slate-700 text-white p-8 rounded-xl shadow-lg border-b-4 border-slate-900 text-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">Hardware</span>
                     <span className="text-2xl font-black tracking-tight">{selections.hardware}</span>
                  </div>
                  <div className="bg-orange-500 text-white p-6 rounded-b-[3.5rem] rounded-t-xl shadow-lg border-b-4 border-orange-700 text-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">Connectivity</span>
                     <span className="text-xl font-black tracking-tight">{selections.connectivity}</span>
                  </div>
               </div>
            </div>

            <div className={`min-h-[400px] rounded-[2.5rem] shadow-2xl transition-all p-10 overflow-hidden flex flex-col ${result ? 'bg-[#004E9A] text-white' : 'bg-white border-2 border-dashed border-slate-200 text-slate-300'}`}>
              {result ? (
                <div className="animate-fadeIn prose-invert overflow-y-auto custom-scrollbar flex-1">
                   <MarkdownView content={result} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                   <i className="fa-solid fa-pen-nib text-6xl opacity-20"></i>
                   <p className="font-black uppercase tracking-[0.3em] text-xs">Ready to build your solution</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-[2.5rem]">
                   <div className="flex flex-col items-center gap-3">
                      <i className="fa-solid fa-fire-burner text-4xl text-orange-400 animate-pulse"></i>
                      <span className="text-white font-black uppercase tracking-widest animate-pulse">Processing Campaign Data...</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
