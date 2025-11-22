
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Wand2, AlertCircle, X, Download, Share2, Image as ImageIcon, Sparkles, RefreshCcw, Pencil, Plus, ChevronLeft, History, Layers } from 'lucide-react';
import Sidebar from './Sidebar';
import { AppState, HistoryItem } from '../types';
import { generateTattooDesign, fileToBase64 } from '../services/gemini';
import { saveItem, getItemsByType, base64ToBlob, blobToURL, urlToBase64 } from '../services/db';

interface ImagineFeatureProps {
  onNavigate?: (view: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ImagineFeature: React.FC<ImagineFeatureProps> = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]); 
  
  // Output State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // Can be Base64 or Blob URL
  
  // Variation support (simplified for DB integration)
  // Note: DB structure currently designed for single result, we'll save primary result
  const [variationCount, setVariationCount] = useState(1);
  const [variations, setVariations] = useState<string[]>([]); // Array of Srcs
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef(false);
  const isInitialMount = useRef(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // 1. Load History from DB
  useEffect(() => {
    const loadData = async () => {
      try {
        const dbItems = await getItemsByType('imagine');
        const historyItems: HistoryItem[] = dbItems.map(item => ({
          id: item.id,
          personImage: '', 
          tattooImage: blobToURL(item.resultBlob), // Main Result
          resultImage: blobToURL(item.resultBlob), // Duplicated for sidebar compat
          timestamp: item.timestamp
        }));
        setHistory(historyItems);
      } catch(e) {
        console.error("DB Load Error", e);
      }
    };
    loadData();
    isInitialMount.current = false;
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      if (generatedImage) {
        const img = new Image();
        // generatedImage can be blob url or base64
        const src = generatedImage.startsWith('http') || generatedImage.startsWith('blob:') || generatedImage.startsWith('data:') 
          ? generatedImage 
          : `data:image/png;base64,${generatedImage}`;
          
        img.src = src;
        img.onload = () => {
           const scale = Math.min(width / img.width, height / img.height);
           const x = (width / 2) - (img.width / 2) * scale;
           const y = (height / 2) - (img.height / 2) * scale;
           ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
      }
    }
  }, [generatedImage, appState]);

  // Drawing Logic
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !canvasRef.current) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#CCFF00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode || !isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.closePath();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      const remainingSlots = 5 - referenceImages.length;
      const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots);
      for (const file of filesToProcess) {
        try {
          const base64 = await fileToBase64(file as File);
          newImages.push(base64);
        } catch (err) { console.error(err); }
      }
      setReferenceImages([...referenceImages, ...newImages]);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!prompt && referenceImages.length === 0 && !generatedImage) {
      setErrorMsg("Enter a prompt or upload reference.");
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setIsDrawingMode(false);
    setVariations([]); 

    try {
      let inputImages = [...referenceImages];
      if (generatedImage && canvasRef.current && referenceImages.length === 0) {
        const canvasData = canvasRef.current.toDataURL('image/png');
        const base64Clean = canvasData.split(',')[1];
        inputImages = [base64Clean];
      }

      // Call Gemini (returns array of base64)
      const resultsBase64 = await generateTattooDesign(prompt, inputImages, variationCount);

      if (resultsBase64.length > 0) {
        // Process results for DB
        const timestamp = Date.now();
        const mainResultBase64 = resultsBase64[0];
        const mainResultBlob = await base64ToBlob(mainResultBase64);
        const mainResultUrl = blobToURL(mainResultBlob);

        const newItemId = generateId();
        
        // Save primary result to DB
        await saveItem({
           id: newItemId,
           type: 'imagine',
           timestamp,
           resultBlob: mainResultBlob,
           inputs: {
               prompt,
               // We only save first result blob for now to keep it simple in DB schema
               // Ref images are not persisted in DB in this version to save space
           }
        });

        // Convert all base64s to displayable formats (URLs for first, base64 for rest for now unless we save all)
        // For UI state, keep base64 or blobs. Let's use base64 for variations array as it's ephemeral
        setVariations(resultsBase64);
        setGeneratedImage(resultsBase64[0]); 
        setSelectedVariationIndex(0);
        setAppState(AppState.SUCCESS);

        // Update History
        const newHistoryItem: HistoryItem = {
          id: newItemId,
          personImage: '', 
          tattooImage: mainResultUrl, 
          resultImage: mainResultUrl,
          timestamp,
        };
        setHistory(prev => [newHistoryItem, ...prev]);
      } else {
        throw new Error("No images generated");
      }

    } catch (error) {
      console.error(error);
      setErrorMsg("Failed. Try a different prompt.");
      setAppState(AppState.ERROR);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setGeneratedImage(item.resultImage);
    setVariations([item.resultImage]); 
    setSelectedVariationIndex(0);
    setAppState(AppState.SUCCESS);
    setReferenceImages([]);
    setPrompt("");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleVariationSelect = (index: number) => {
    setSelectedVariationIndex(index);
    setGeneratedImage(variations[index]);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    const src = generatedImage.startsWith('http') || generatedImage.startsWith('blob:') 
       ? generatedImage 
       : `data:image/png;base64,${generatedImage}`;
    link.href = src;
    link.download = `ink-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!generatedImage || !navigator.share) return;
    try {
      const src = generatedImage.startsWith('http') || generatedImage.startsWith('blob:') 
       ? generatedImage 
       : `data:image/png;base64,${generatedImage}`;
       
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], 'ink-design.png', { type: 'image/png' });
      await navigator.share({ title: 'My Ink Design', files: [file] });
    } catch (err) { console.log(err); }
  };

  const clearSession = () => {
    setPrompt('');
    setReferenceImages([]);
    setGeneratedImage(null);
    setVariations([]);
    setAppState(AppState.IDLE);
  };

  const getVariationSrc = (v: string) => {
       if (v.startsWith('http') || v.startsWith('blob:') || v.startsWith('data:')) return v;
       return `data:image/png;base64,${v}`;
  };

  return (
    <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-black text-zinc-100 font-sans selection:bg-[#CCFF00]/30">
      <Sidebar 
        history={history} 
        onSelectHistory={loadHistoryItem}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Header */}
      <header className="h-16 flex-shrink-0 z-20 px-4 md:px-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
           {onNavigate && (
              <button onClick={() => onNavigate('home')} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
           )}
           <div className="hidden md:flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-purple-400 border border-zinc-800">
               <ImageIcon size={16} />
             </div>
             <span className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Imagine Studio</span>
           </div>
           <span className="md:hidden text-sm font-bold text-white uppercase tracking-wide">Imagine</span>
        </div>

        <div className="flex items-center gap-2">
           {generatedImage && (
             <div className="flex gap-2">
                <button 
                  onClick={clearSession}
                  className="p-2 bg-zinc-900 hover:bg-red-500/20 rounded-full border border-zinc-800 text-zinc-300 hover:text-red-400"
                  title="Clear Session"
                >
                  <X size={18} />
                </button>
               <button 
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`p-2 rounded-full transition-all border ${isDrawingMode ? 'bg-[#CCFF00] text-black border-[#CCFF00]' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'}`}
                  title="Draw/Edit"
               >
                 <Pencil size={18} />
               </button>
               <button onClick={handleShare} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 text-zinc-300 hover:text-white">
                  <Share2 size={18} />
               </button>
               <button onClick={handleDownload} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full border border-zinc-700">
                  <Download size={18} />
               </button>
             </div>
           )}
           <button 
            onClick={toggleSidebar} 
            className="p-2 text-zinc-400 hover:text-[#CCFF00] transition-colors bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-[#CCFF00]/30 ml-2"
          >
            <History size={20} />
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col items-center justify-center p-4 pb-60 md:pb-48">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative w-full h-full flex items-center justify-center max-h-[50dvh] md:max-h-[calc(100vh-300px)]">
           <div ref={containerRef} className="relative w-full max-w-md md:max-w-lg aspect-square bg-[#0A0A0A] rounded-2xl md:rounded-3xl border border-zinc-800/50 shadow-2xl overflow-hidden touch-none">
             
             {!generatedImage && (
                 <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
             )}

             {errorMsg && (
               <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs backdrop-blur-md">
                 <AlertCircle size={14} />
                 <span className="truncate">{errorMsg}</span>
                 <button onClick={() => setErrorMsg(null)} className="ml-auto hover:text-white"><X size={14}/></button>
               </div>
             )}

             {appState === AppState.GENERATING && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="w-12 h-12 border-4 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin mb-4" />
                 <span className="text-xs md:text-sm font-medium text-zinc-300 animate-pulse">
                   Dreaming {variationCount > 1 ? `(${variationCount} variations)` : ''}...
                 </span>
               </div>
             )}
             
             <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`w-full h-full ${isDrawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
             />

              {!generatedImage && appState !== AppState.GENERATING && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
                    <Sparkles size={32} className="text-zinc-800 mb-3" />
                    <p className="text-zinc-600 text-sm text-center max-w-xs leading-relaxed">
                      Describe your customers tattoo requirements , imagine it with our AI add your artistic touch instantly
                    </p>
                 </div>
              )}

              {isDrawingMode && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#CCFF00] text-black text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg pointer-events-none animate-pulse">
                  Drawing Mode
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-xl border-t border-zinc-900 pb-6 pt-4 px-4">
         <div className="max-w-2xl mx-auto flex flex-col gap-3">
            
            {/* Top Row: Variations & Settings */}
            <div className="flex items-center justify-between">
                {/* Variation Selector */}
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/50">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase px-2 flex items-center gap-1">
                        <Layers size={10} /> Qty
                    </span>
                    {[1, 2, 3].map(n => (
                        <button 
                            key={n}
                            onClick={() => setVariationCount(n)}
                            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold transition-all ${variationCount === n ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                        >
                            {n}
                        </button>
                    ))}
                </div>

                {/* Variation Thumbnails */}
                {variations.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                         {variations.map((varSrc, idx) => (
                             <button 
                                key={idx}
                                onClick={() => handleVariationSelect(idx)}
                                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all relative group ${selectedVariationIndex === idx ? 'border-[#CCFF00] scale-110 z-10 shadow-lg shadow-[#CCFF00]/20' : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'}`}
                             >
                                 <img src={getVariationSrc(varSrc)} className="w-full h-full object-cover" alt={`Var ${idx + 1}`} />
                                 {selectedVariationIndex === idx && (
                                     <div className="absolute inset-0 bg-[#CCFF00]/10" />
                                 )}
                             </button>
                         ))}
                    </div>
                )}
            </div>

            {/* Reference Images Row */}
            {referenceImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-t border-zinc-900 pt-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase py-2 self-center">Refs:</span>
                {referenceImages.map((img, idx) => (
                  <div key={idx} className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 group">
                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover rounded-lg border border-zinc-800" alt="ref" />
                    <button 
                      onClick={() => removeReferenceImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {referenceImages.length < 5 && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 text-zinc-500 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-colors flex-shrink-0"
                    >
                        <Plus size={14} />
                    </button>
                )}
              </div>
            )}

            {/* Input Row */}
            <div className="flex gap-2 md:gap-3 items-end">
               <div className="flex-1 relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isDrawingMode ? "Refine your sketch..." : "Describe your customers tattoo requirements , imagine it with our AI add your artistic touch instantly"}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-[#CCFF00]/50 resize-none h-14 md:h-20 custom-scrollbar"
                  />
                  
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                  
                  {referenceImages.length === 0 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-2 bottom-2 p-2 text-zinc-500 hover:text-[#CCFF00] transition-colors bg-zinc-900/80 rounded-lg"
                        title="Upload Reference Image"
                      >
                        <ImageIcon size={18} />
                      </button>
                  )}
               </div>

               <button
                 onClick={handleGenerate}
                 disabled={appState === AppState.GENERATING || (!prompt && referenceImages.length === 0 && !generatedImage)}
                 className={`
                   h-14 w-14 md:h-20 md:w-20 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0
                   ${appState === AppState.GENERATING 
                     ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                     : 'bg-[#CCFF00] text-black hover:bg-[#b3e600] shadow-lg shadow-[#CCFF00]/10'}
                 `}
               >
                 {appState === AppState.GENERATING ? (
                    <RefreshCcw size={20} className="animate-spin" />
                 ) : (
                    <>
                       <Wand2 size={20} />
                       <span className="hidden md:inline text-[10px] uppercase tracking-wider">
                         {generatedImage ? 'Refine' : 'Create'}
                       </span>
                    </>
                 )}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ImagineFeature;
