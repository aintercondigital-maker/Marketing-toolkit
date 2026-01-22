
import React, { useState, useRef, useEffect } from 'react';
import { analyzeDocumentLayout, removeTextFromImage } from '../services/geminiService';
import { OCRBlock, Slot, LayoutRatio } from '../types';

declare const pdfjsLib: any;
declare const PptxGenJS: any;
declare const JSZip: any;

const Toast: React.FC<{ message: string; type: 'info' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-50 text-sm font-black border transition-all animate-fadeIn ${
      type === 'error' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'
    }`}>
      {message}
    </div>
  );
};

export const SmartConverter: React.FC = () => {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]); 
  const [ratio, setRatio] = useState<LayoutRatio>('16:9');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const [mergeTextFile, setMergeTextFile] = useState<File | null>(null);
  const [mergeBgFile, setMergeBgFile] = useState<File | null>(null);
  const [mergeLogs, setMergeLogs] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textMergeInputRef = useRef<HTMLInputElement>(null);
  const bgMergeInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
  };

  const addMergeLog = (msg: string) => setMergeLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleFileUpload = async (file: File) => {
    if (file.type === 'application/pdf') {
      showToast('Executing High-Res PDF Layout Scan...');
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.5 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            pages.push(canvas.toDataURL('image/png'));
          }
        }
        setPdfPages(pages);
        showToast(`Successfully parsed ${pages.length} pages from PDF`);
      } catch (err) {
        showToast('PDF Parse Failed', 'error');
      }
    } else if (file.type.startsWith('image/')) {
      showToast('Processing Image Source...');
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPdfPages(prev => [...prev, dataUrl]);
        showToast('Image added successfully');
      };
      reader.readAsDataURL(file);
    } else {
      showToast('Unsupported format (PDF/JPG/PNG only)', 'error');
    }
  };

  const downloadAllImages = async () => {
    if (pdfPages.length === 0) return;
    try {
      showToast('Packing images...');
      const zip = new JSZip();
      pdfPages.forEach((url, i) => {
        const base64Data = url.split(',')[1];
        zip.file(`page_${i + 1}.png`, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `Digitized_Assets_${Date.now()}.zip`;
      a.click();
      showToast('Image archive downloaded');
    } catch (err) {
      showToast('Download Failed', 'error');
    }
  };

  const exportToPptx = async () => {
    if (pdfPages.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const pptx = new PptxGenJS();
      if (ratio === '9:16') {
        pptx.defineLayout({ name: 'MOBILE', width: 5.625, height: 10 });
        pptx.layout = 'MOBILE';
      } else if (ratio === '4:3') pptx.layout = 'LAYOUT_4x3';
      else pptx.layout = 'LAYOUT_WIDE';

      for (let i = 0; i < pdfPages.length; i++) {
        setExportProgress(Math.round(((i + 1) / pdfPages.length) * 100));
        const base64 = pdfPages[i].split(',')[1];
        const blocks = await analyzeDocumentLayout(base64);
        const slide = pptx.addSlide();
        slide.background = { fill: "FFFFFF" };

        if (blocks && Array.isArray(blocks)) {
            blocks.forEach((block: any) => {
              if (!block.text || !block.box_2d) return;
              let [ymin, xmin, ymax, xmax] = block.box_2d;
              if (ymax <= 1 && xmax <= 1) {
                  ymin *= 1000; xmin *= 1000; ymax *= 1000; xmax *= 1000;
              }
              
              slide.addText(block.text, {
                x: `${(xmin / 10).toFixed(2)}%`,
                y: `${(ymin / 10).toFixed(2)}%`,
                w: `${((xmax - xmin) / 10).toFixed(2)}%`,
                h: `${((ymax - ymin) / 10).toFixed(2)}%`,
                fontSize: block.font_size || 12,
                color: (block.color || '000000').replace('#', ''),
                bold: block.is_bold || false,
                align: block.align || 'left',
                valign: 'middle'
              });
            });
        }
        if (i < pdfPages.length - 1) await new Promise(r => setTimeout(r, 1000));
      }
      pptx.writeFile({ fileName: `Digitized_Text_Layer.pptx` });
      showToast('Text Layer Downloaded');
    } catch (err) {
      console.error(err);
      showToast('Generation Failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const addAllToSlots = () => {
    if (pdfPages.length === 0) return;
    const newSlots: Slot[] = pdfPages.map((url, i) => ({
      id: `slot-${Date.now()}-${i}`,
      originalBase64: url.split(',')[1],
      resultBase64: null,
      status: 'ready'
    }));
    setSlots(prev => [...prev, ...newSlots]);
    showToast(`Batch added ${pdfPages.length} tasks`);
  };

  const addToSlot = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    const newSlot: Slot = {
      id: `slot-${Date.now()}-${Math.random()}`,
      originalBase64: base64,
      resultBase64: null,
      status: 'ready'
    };
    setSlots(prev => [...prev, newSlot]);
    showToast('Added to Workbench');
  };

  const removeSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const processSlot = async (id: string) => {
    const slot = slots.find(s => s.id === id);
    if (!slot?.originalBase64) return;
    setSlots(prev => prev.map(s => s.id === id ? { ...s, status: 'processing' } : s));
    try {
      const res = await removeTextFromImage(slot.originalBase64);
      setSlots(prev => prev.map(s => s.id === id ? { ...s, resultBase64: res, status: 'done' } : s));
    } catch (err: any) {
      console.error(err);
      setSlots(prev => prev.map(s => s.id === id ? { ...s, status: 'error' } : s));
      const errMsg = err.message?.includes('403') ? 'Permission Error: Check API Key' : 'AI Inpainting Error';
      showToast(errMsg, 'error');
    }
  };

  const runBatchProcess = async () => {
    const readySlots = slots.filter(s => s.status === 'ready');
    if (readySlots.length === 0) return showToast('No pending tasks', 'info');
    
    setIsBatchProcessing(true);
    showToast(`Starting batch process for ${readySlots.length} tasks...`);

    for (const slot of readySlots) {
      await processSlot(slot.id);
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsBatchProcessing(false);
    showToast('Batch Inpainting Complete');
  };

  const generateBgOnlyPptx = async () => {
    const readyResults = slots.filter(s => s.resultBase64);
    if (readyResults.length === 0) return showToast('Please finish at least one image', 'error');
    const pptx = new PptxGenJS();
    if (ratio === '9:16') {
         pptx.defineLayout({ name: 'MOBILE', width: 5.625, height: 10 });
         pptx.layout = 'MOBILE';
    } else if (ratio === '4:3') {
         pptx.layout = 'LAYOUT_4x3';
    } else {
         pptx.layout = 'LAYOUT_WIDE';
    }

    readyResults.forEach(s => {
      const slide = pptx.addSlide();
      slide.addImage({ data: `data:image/png;base64,${s.resultBase64}`, x: 0, y: 0, w: '100%', h: '100%' });
    });
    pptx.writeFile({ fileName: `Background_Base.pptx` });
  };

  const handleMerge = async () => {
    if (!mergeTextFile || !mergeBgFile) return;
    setIsMerging(true);
    setMergeLogs([]);
    addMergeLog('🚀 Starting XML Fusion Engine...');

    try {
      const textZip = new JSZip();
      const bgZip = new JSZip();
      await textZip.loadAsync(mergeTextFile);
      await bgZip.loadAsync(mergeBgFile);

      const getSlideFiles = (zip: any) => Object.keys(zip.files).filter(p => p.match(/ppt\/slides\/slide\d+\.xml/)).sort((a,b) => {
          const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || "0");
          const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || "0");
          return numA - numB;
      });

      const textSlides = getSlideFiles(textZip);
      const bgSlides = getSlideFiles(bgZip);

      const parser = new DOMParser();
      const serializer = new XMLSerializer();

      for (let i = 0; i < Math.min(textSlides.length, bgSlides.length); i++) {
        try {
          const textXml = await textZip.file(textSlides[i]).async("string");
          const bgXml = await bgZip.file(bgSlides[i]).async("string");
          const tDoc = parser.parseFromString(textXml, "application/xml");
          const bDoc = parser.parseFromString(bgXml, "application/xml");

          const getSpTree = (doc: Document) => {
            const all = doc.getElementsByTagName("*");
            for (let j = 0; j < all.length; j++) if (all[j].localName === "spTree") return all[j];
            return null;
          };

          const tTree = getSpTree(tDoc);
          const bTree = getSpTree(bDoc);

          if (tTree && bTree) {
            let successCount = 0;
            
            Array.from(tTree.childNodes).forEach((node) => {
              try {
                const ln = (node as any).localName || node.nodeName.split(':').pop();
                if (['sp', 'grpSp', 'graphicFrame', 'pic'].includes(ln)) {
                  const clone = bDoc.importNode(node, true);
                  const cNvPrs = (clone as any).getElementsByTagName ? (clone as any).getElementsByTagName("p:cNvPr") : [];
                  const cNvPrsAlt = (clone as any).getElementsByTagName ? (clone as any).getElementsByTagName("cNvPr") : [];
                  const pr = cNvPrs.length > 0 ? cNvPrs[0] : (cNvPrsAlt.length > 0 ? cNvPrsAlt[0] : null);

                  if (pr) {
                    const existingId = parseInt(pr.getAttribute("id") || "0");
                    pr.setAttribute("id", (existingId + 5000 + i * 100).toString());
                  }
                  bTree.appendChild(clone);
                  successCount++;
                }
              } catch (nodeErr: any) {}
            });

            bgZip.file(bgSlides[i], serializer.serializeToString(bDoc));
            addMergeLog(`✅ Page ${i+1}: Merged ${successCount} objects.`);
          }
        } catch (slideErr: any) {
          addMergeLog(`❌ Error: Page ${i+1} failed parse.`);
        }
      }

      const blob = await bgZip.generateAsync({ type: "blob" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Merged_Result_${Date.now()}.pptx`;
      a.click();
      showToast('Fusion Complete');
    } catch (e: any) {
      addMergeLog(`❌ Fatal Merge Error: ${e.message}`);
      showToast('Merge Failed', 'error');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-16 md:space-y-24 pb-48 font-sans">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100 mb-4">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Stable AI Workflow</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">AI Magic PPTX Station</h1>
        <p className="text-slate-500 font-bold max-w-2xl mx-auto text-sm md:text-lg">
          Professional Document Digitalization. Supports PDF, JPG, and PNG.
        </p>
      </header>

      {/* Step 1 */}
      <section className="space-y-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-end gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <span className="bg-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-xl shadow-slate-200">01</span>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Layout Extraction</h2>
              <p className="text-sm text-slate-400 font-bold mt-1">
                Convert PDF/Images to editable text coordinates using Gemini 3.
              </p>
            </div>
          </div>
          {pdfPages.length > 0 && (
            <div className="md:ml-auto flex flex-wrap items-center gap-3 bg-indigo-50 p-2 rounded-2xl">
              <button 
                onClick={addAllToSlots} 
                className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-all"
              >
                Send All to Eraser ➜
              </button>
              <button 
                onClick={downloadAllImages} 
                className="bg-white text-slate-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-download"></i> Zip Export
              </button>
              <select value={ratio} onChange={e => setRatio(e.target.value as any)} className="text-xs font-black text-indigo-600 bg-white px-4 py-2 rounded-xl border-none outline-none shadow-sm cursor-pointer">
                <option value="16:9">16:9 Wide</option>
                <option value="9:16">9:16 Mobile</option>
                <option value="4:3">4:3 Standard</option>
              </select>
              <button 
                onClick={exportToPptx} 
                disabled={isExporting} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
              >
                {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : null}
                {isExporting ? `Parsing ${exportProgress}%` : 'Get Text Layer (PPTX)'}
              </button>
            </div>
          )}
        </div>

        {pdfPages.length === 0 ? (
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="group relative bg-white border-2 border-dashed border-slate-200 rounded-[48px] p-12 md:p-24 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all duration-500 overflow-hidden"
          >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf,image/jpeg,image/png" 
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
            />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <i className="fa-solid fa-file-pdf text-3xl"></i>
              </div>
              <p className="text-2xl font-black text-slate-800">Upload PDF or Image</p>
              <p className="text-slate-400 font-bold mt-2">Supports PDF, JPG, PNG for batch processing</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {pdfPages.map((url, i) => (
              <div key={i} className="group relative bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-slate-50">
                  <img src={url} className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all rounded-3xl flex items-center justify-center p-4">
                  <button onClick={() => addToSlot(url)} className="bg-white text-slate-900 w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition">
                    Add to Eraser
                  </button>
                </div>
                <div className="mt-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {i+1}</div>
              </div>
            ))}
            {/* Quick Add Button */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 cursor-pointer transition-all"
            >
              <i className="fa-solid fa-plus text-2xl"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Add More</span>
            </div>
          </div>
        )}
      </section>

      {/* Step 2 */}
      <section className="space-y-8 animate-fadeIn delay-75">
        <div className="flex flex-col md:flex-row md:items-end gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <span className="bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-xl shadow-blue-100">02</span>
            <div>
              <h2 className="text-2xl font-black text-slate-800">AI Magic Eraser</h2>
              <p className="text-sm text-slate-400 font-bold mt-1">
                Restore background templates by removing original text.
              </p>
            </div>
          </div>
          {slots.length > 0 && (
            <div className="md:ml-auto flex items-center gap-3">
              <button 
                onClick={runBatchProcess} 
                disabled={isBatchProcessing || !slots.some(s => s.status === 'ready')}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg hover:bg-black transition-all disabled:opacity-30"
              >
                {isBatchProcessing ? "Processing..." : "Run Batch"}
              </button>
              <button onClick={() => setSlots([])} className="text-xs font-black text-slate-400 hover:text-red-500 px-4 py-2 transition">Clear</button>
              <button 
                onClick={generateBgOnlyPptx} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-100 transition"
              >
                Get Background Layer (PPTX)
              </button>
            </div>
          )}
        </div>

        {slots.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dotted border-slate-200 rounded-[48px] p-12 md:p-24 text-center">
            <div className="text-slate-200 mb-4 flex justify-center">
              <i className="fa-solid fa-eraser text-6xl"></i>
            </div>
            <p className="text-slate-300 font-black text-xl italic uppercase tracking-widest">Workbench Empty</p>
            <p className="text-slate-300 font-bold text-sm mt-2 uppercase tracking-tighter">Use Step 01 to add documents</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {slots.map((slot, i) => (
              <div key={slot.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-blue-500 italic tracking-widest uppercase">TASK #{i+1}</span>
                  <div className="flex gap-2">
                    {slot.status === 'ready' && <span className="w-2 h-2 bg-slate-200 rounded-full"></span>}
                    {slot.status === 'processing' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                    {slot.status === 'done' && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
                    <button onClick={() => removeSlot(slot.id)} className="text-slate-300 hover:text-red-500 transition ml-2">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-50 mb-6">
                  <img src={slot.resultBase64 ? `data:image/png;base64,${slot.resultBase64}` : `data:image/png;base64,${slot.originalBase64}`} className="w-full h-full object-cover" />
                  {slot.status === 'processing' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <span className="text-xs font-black text-blue-600 animate-pulse uppercase text-center px-4">AI Inpainting...</span>
                    </div>
                  )}
                  {slot.status === 'done' && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black shadow-lg animate-bounce">Done</div>
                  )}
                </div>

                <button 
                  onClick={() => processSlot(slot.id)}
                  disabled={slot.status === 'processing' || !!slot.resultBase64}
                  className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 bg-slate-900 text-white hover:bg-black"
                >
                  {slot.resultBase64 ? 'View Result' : 'Start Repair'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Step 3 */}
      <section className="space-y-8 animate-fadeIn delay-150 pb-20">
        <div className="flex flex-col md:flex-row md:items-end gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-5">
            <span className="bg-indigo-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-xl shadow-indigo-100">03</span>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Final Restoration (Merge)</h2>
              <p className="text-sm text-slate-400 font-bold mt-1">
                Merge Text and Background layers into one editable PPTX.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div 
                onClick={() => textMergeInputRef.current?.click()}
                className={`group relative p-8 border-2 border-dashed rounded-[36px] text-center cursor-pointer transition-all ${mergeTextFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-indigo-400 bg-white'}`}
              >
                <input type="file" ref={textMergeInputRef} className="hidden" accept=".pptx" onChange={e => e.target.files?.[0] && setMergeTextFile(e.target.files[0])} />
                <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${mergeTextFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                  <i className="fa-solid fa-font"></i>
                </div>
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">A. Text Layer (Source)</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">
                  {mergeTextFile ? mergeTextFile.name : 'Select PPTX from Step 1'}
                </p>
              </div>

              <div 
                onClick={() => bgMergeInputRef.current?.click()}
                className={`group relative p-8 border-2 border-dashed rounded-[36px] text-center cursor-pointer transition-all ${mergeBgFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-indigo-400 bg-white'}`}
              >
                <input type="file" ref={bgMergeInputRef} className="hidden" accept=".pptx" onChange={e => e.target.files?.[0] && setMergeBgFile(e.target.files[0])} />
                <div className={`w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${mergeBgFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                  <i className="fa-solid fa-image"></i>
                </div>
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">B. BG Layer (Base)</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">
                  {mergeBgFile ? mergeBgFile.name : 'Select PPTX from Step 2'}
                </p>
              </div>
            </div>

            <button 
              onClick={handleMerge}
              disabled={!mergeTextFile || !mergeBgFile || isMerging}
              className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[32px] font-black text-lg shadow-2xl transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-4 group"
            >
              {isMerging ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Fusing XML Layers...</span>
                </>
              ) : (
                <>
                  <span>Execute Fusion</span>
                  <i className="fa-solid fa-bolt group-hover:translate-x-2 transition-transform"></i>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 bg-slate-900 rounded-[36px] p-8 shadow-inner ring-1 ring-slate-800 h-80 lg:h-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merge Master Terminal</span>
            </div>
            <div className="flex-grow overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar pr-2">
              {mergeLogs.length === 0 && <p className="text-slate-700 italic">Ready to merge...</p>}
              {mergeLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 text-emerald-400/90 leading-relaxed">
                  <span className="text-slate-700">|</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
