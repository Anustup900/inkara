
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Wand2, AlertCircle, X, Download, Share2, Image as ImageIcon, User, Trash2, Sparkles, RefreshCcw, ChevronLeft, History } from 'lucide-react';
import Sidebar from './Sidebar';
import ResultView from './ResultView';
import { AppState, UploadedImage, HistoryItem } from '../types';
import { generateTattooTryOn, fileToBase64 } from '../services/gemini';
import { saveItem, getItemsByType, base64ToBlob, blobToURL, urlToBase64 } from '../services/db';

interface TryOnFeatureProps {
  onNavigate?: (view: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const TryOnFeature: React.FC<TryOnFeatureProps> = ({ onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [personImage, setPersonImage] = useState<UploadedImage>({ file: null, preview: null, base64: null });
  const [tattooImage, setTattooImage] = useState<UploadedImage>({ file: null, preview: null, base64: null });
  
  // resultSrc can be a Blob URL or Base64 string
  const [resultSrc, setResultSrc] = useState<string | null>(null);

  const personInputRef = useRef<HTMLInputElement>(null);
  const tattooInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);

  // 1. Load History from DB & Session from LocalStorage on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load History from IndexedDB
        const dbItems = await getItemsByType('tryon');
        const historyItems: HistoryItem[] = dbItems.map(item => ({
          id: item.id,
          personImage: item.inputs?.main ? blobToURL(item.inputs.main) : '',
          tattooImage: item.inputs?.secondary ? blobToURL(item.inputs.secondary) : '',
          resultImage: blobToURL(item.resultBlob),
          timestamp: item.timestamp
        }));
        setHistory(historyItems);

        // Load Active Session (only input states, to avoid heavy base64 in localStorage)
        const savedSession = localStorage.getItem('ink_session_tryon');
        if (savedSession) {
          const data = JSON.parse(savedSession);
          if (data.personImage) setPersonImage(data.personImage);
          if (data.tattooImage) setTattooImage(data.tattooImage);
          // We don't load resultBase64 from localStorage anymore to avoid quota issues
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };

    loadData();

    // Check for imported tattoo
    const importedTattoo = localStorage.getItem('ink_import_tattoo');
    if (importedTattoo) {
      try {
        localStorage.removeItem('ink_import_tattoo'); 
        const preview = `data:image/png;base64,${importedTattoo}`;
        setTattooImage({
          file: null, 
          preview: preview,
          base64: importedTattoo
        });
        setResultSrc(null);
        setAppState(AppState.IDLE);
      } catch (e) {
        console.error("Error loading imported tattoo", e);
      }
    }
    
    isInitialMount.current = false;
  }, []);

  // 2. Save Session (Lightweight)
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const timeoutId = setTimeout(() => {
      try {
        // Only save input references to maintain state between reloads if possible
        // But usually images are too big. We'll stick to ephemeral state for inputs unless explicitly saved
        // For now, we only save non-blob data if needed.
        const sessionData = {
           personImage: { ...personImage, file: null },
           tattooImage: { ...tattooImage, file: null },
        };
        localStorage.setItem('ink_session_tryon', JSON.stringify(sessionData));
      } catch (e) {
        console.warn("Session save warning", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [personImage, tattooImage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Handle image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'person' | 'tattoo') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        const imgData = { file, preview, base64 };
        
        if (type === 'person') setPersonImage(imgData);
        else setTattooImage(imgData);

        if (resultSrc) {
           setResultSrc(null);
           setAppState(AppState.IDLE);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetAll = () => {
    setPersonImage({ file: null, preview: null, base64: null });
    setTattooImage({ file: null, preview: null, base64: null });
    setResultSrc(null);
    setAppState(AppState.IDLE);
    localStorage.removeItem('ink_session_tryon');
    if (personInputRef.current) personInputRef.current.value = '';
    if (tattooInputRef.current) tattooInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!personImage.base64 || !tattooImage.base64) {
      setErrorMsg("Please upload both images.");
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setResultSrc(null);

    try {
      // Generate
      const generatedBase64 = await generateTattooTryOn(
        personImage.base64,
        tattooImage.base64,
        personImage.file?.type || 'image/jpeg',
        tattooImage.file?.type || 'image/png'
      );

      // Convert to Blobs for Storage
      const resultBlob = await base64ToBlob(generatedBase64);
      const personBlob = await base64ToBlob(personImage.base64);
      const tattooBlob = await base64ToBlob(tattooImage.base64);

      const newItemId = generateId();
      const timestamp = Date.now();

      // Save to DB
      await saveItem({
        id: newItemId,
        type: 'tryon',
        timestamp,
        resultBlob,
        inputs: {
          main: personBlob,
          secondary: tattooBlob
        }
      });

      // Update UI
      const resultUrl = blobToURL(resultBlob);
      setResultSrc(resultUrl);
      setAppState(AppState.SUCCESS);

      // Update History State
      const newHistoryItem: HistoryItem = {
        id: newItemId,
        personImage: blobToURL(personBlob),
        tattooImage: blobToURL(tattooBlob),
        resultImage: resultUrl,
        timestamp
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error("Generation failed:", error);
      setErrorMsg("Generation failed. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const loadHistoryItem = async (item: HistoryItem) => {
    setResultSrc(item.resultImage);
    setAppState(AppState.SUCCESS);
    
    try {
        // We need to recover base64 for the inputs if the user wants to re-generate
        // item.personImage is a Blob URL now
        const pBase64 = await urlToBase64(item.personImage);
        const tBase64 = await urlToBase64(item.tattooImage);

        setPersonImage({ 
            file: null, 
            preview: item.personImage, 
            base64: pBase64 
        });
        setTattooImage({ 
            file: null, 
            preview: item.tattooImage, 
            base64: tBase64 
        });
    } catch(e) {
        console.error("Error recovering session data", e);
    }

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDownload = () => {
    if (!resultSrc) return;
    const link = document.createElement('a');
    link.href = resultSrc; // Works with Blob URL
    link.download = `ink-result-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!resultSrc || !navigator.share) return;
    try {
      const res = await fetch(resultSrc);
      const blob = await res.blob();
      const file = new File([blob], 'ink-result.png', { type: 'image/png' });
      await navigator.share({
        title: 'Tattoo Try-On Result',
        text: 'Check out my AI tattoo try-on!',
        files: [file]
      });
    } catch (err) {
      console.log("Error sharing", err);
    }
  };

  const isReadyToGenerate = personImage.base64 && tattooImage.base64;

  return (
    <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-black text-zinc-100 font-sans selection:bg-[#CCFF00]/30">
      <Sidebar 
        history={history} 
        onSelectHistory={loadHistoryItem}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <input ref={personInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'person')} />
      <input ref={tattooInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'tattoo')} />

      {/* Header */}
      <header className="h-16 flex-shrink-0 z-20 px-4 md:px-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
           {onNavigate && (
              <button onClick={() => onNavigate('home')} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
           )}
           
           <div className="hidden md:flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[#CCFF00] border border-zinc-800">
               <Wand2 size={16} />
             </div>
             <span className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Try On Studio</span>
           </div>
           
           <span className="md:hidden text-sm font-bold text-white uppercase tracking-wide">Try On</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSidebar} 
            className="p-2 text-zinc-400 hover:text-[#CCFF00] transition-colors bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-[#CCFF00]/30"
            title="History"
          >
            <History size={20} />
          </button>

          {appState === AppState.SUCCESS && resultSrc && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
               <button onClick={handleShare} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 text-zinc-300 hover:text-white transition-colors">
                  <Share2 size={18} />
               </button>
               <button onClick={handleDownload} className="p-2 bg-[#CCFF00] hover:bg-[#b3e600] text-black rounded-full transition-colors shadow-lg shadow-[#CCFF00]/20">
                  <Download size={18} />
               </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content (Canvas) */}
      <div className="flex-1 relative w-full overflow-hidden flex flex-col items-center justify-center p-4 pb-32 md:pb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-[#CCFF00]/5 to-transparent opacity-50 pointer-events-none blur-3xl" />

        <div className="relative w-full h-full flex items-center justify-center max-h-[60dvh] md:max-h-[calc(100vh-200px)]">
          <div className="relative w-full max-w-md md:max-w-lg aspect-square bg-[#0A0A0A] rounded-2xl md:rounded-3xl border border-zinc-800/50 shadow-2xl flex items-center justify-center overflow-hidden">
            
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {errorMsg && (
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs backdrop-blur-md">
                <AlertCircle size={14} />
                <span className="truncate">{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="ml-auto hover:text-white flex-shrink-0"><X size={14}/></button>
              </div>
            )}

            {appState === AppState.GENERATING && (
              <div className="absolute z-20 flex flex-col items-center gap-4">
                <div className="relative">
                   <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles size={16} className="text-[#CCFF00] animate-pulse" />
                   </div>
                </div>
                <div className="px-4 py-1.5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full">
                  <span className="text-xs md:text-sm font-medium text-zinc-300 animate-pulse">Processing...</span>
                </div>
              </div>
            )}

            {appState === AppState.SUCCESS && resultSrc && (
              <ResultView resultSrc={resultSrc} />
            )}

            {appState !== AppState.GENERATING && !resultSrc && (
               <div className="text-center space-y-3 z-10 p-4">
                 {personImage.preview || tattooImage.preview ? (
                   <div className="flex items-center justify-center gap-2 md:gap-4 opacity-50 grayscale">
                      {personImage.preview && <img src={personImage.preview} className="w-16 h-16 md:w-24 md:h-24 rounded-lg object-cover border border-zinc-800" alt="body" />}
                      {tattooImage.preview && <img src={tattooImage.preview} className="w-16 h-16 md:w-24 md:h-24 rounded-lg object-contain border border-zinc-800 bg-black/50" alt="tattoo" />}
                   </div>
                 ) : (
                   <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-zinc-900/50 border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700">
                      <ImageIcon size={24} />
                   </div>
                 )}
                 <div>
                   <h3 className="text-zinc-500 font-medium text-sm md:text-base">Canvas Ready</h3>
                   <p className="text-zinc-700 text-xs mt-1">Select images below</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-6 md:pb-6 bg-gradient-to-t from-black via-black/90 to-transparent md:bg-none">
        <div className="glass-panel rounded-2xl p-2 flex items-center gap-2 shadow-2xl shadow-black/50 max-w-xl mx-auto w-full">
          
          <button 
            onClick={() => personInputRef.current?.click()}
            className={`flex-1 h-14 md:h-16 rounded-xl border flex items-center gap-2 md:gap-3 px-2 md:px-4 transition-all relative overflow-hidden
              ${personImage.preview ? 'bg-zinc-900 border-[#CCFF00]/30' : 'bg-zinc-900/40 border-transparent hover:bg-zinc-800'}
            `}
          >
             {personImage.preview ? (
               <>
                 <img src={personImage.preview} className="w-8 h-8 md:w-10 md:h-10 rounded bg-zinc-800 object-cover" alt="Body" />
                 <div className="text-left overflow-hidden">
                    <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-zinc-500 font-bold truncate">Subject</div>
                    <div className="text-[10px] md:text-xs text-[#CCFF00] font-medium truncate">Set</div>
                 </div>
               </>
             ) : (
               <>
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <User size={16} />
                 </div>
                 <div className="text-left">
                    <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Step 1</div>
                    <div className="text-[10px] md:text-xs text-zinc-300 font-medium truncate">Add Body</div>
                 </div>
               </>
             )}
          </button>

          <div className="w-px h-8 bg-zinc-800" />

          <button 
            onClick={() => tattooInputRef.current?.click()}
            className={`flex-1 h-14 md:h-16 rounded-xl border flex items-center gap-2 md:gap-3 px-2 md:px-4 transition-all relative overflow-hidden
              ${tattooImage.preview ? 'bg-zinc-900 border-[#CCFF00]/30' : 'bg-zinc-900/40 border-transparent hover:bg-zinc-800'}
            `}
          >
             {tattooImage.preview ? (
               <>
                 <img src={tattooImage.preview} className="w-8 h-8 md:w-10 md:h-10 rounded bg-black/50 object-contain" alt="Tattoo" />
                 <div className="text-left overflow-hidden">
                    <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-zinc-500 font-bold truncate">Design</div>
                    <div className="text-[10px] md:text-xs text-[#CCFF00] font-medium truncate">Set</div>
                 </div>
               </>
             ) : (
               <>
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <ImageIcon size={16} />
                 </div>
                 <div className="text-left">
                    <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Step 2</div>
                    <div className="text-[10px] md:text-xs text-zinc-300 font-medium truncate">Add Art</div>
                 </div>
               </>
             )}
          </button>

          <div className="pl-1">
             {appState === AppState.SUCCESS ? (
                <button 
                  onClick={handleResetAll}
                  className="h-14 w-14 md:h-16 md:w-16 flex items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700"
                >
                  <Trash2 size={18} />
                </button>
             ) : (
               <button 
                 onClick={handleGenerate}
                 disabled={!isReadyToGenerate || appState === AppState.GENERATING}
                 className={`
                   h-14 md:h-16 px-4 md:px-8 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                   ${appState === AppState.GENERATING 
                     ? 'bg-zinc-800 text-zinc-500 cursor-wait w-14 md:w-auto justify-center' 
                     : isReadyToGenerate ? 'bg-[#CCFF00] text-black hover:bg-[#b3e600] shadow-[#CCFF00]/30' : 'bg-zinc-900 text-zinc-700 border border-zinc-800'}
                 `}
               >
                  {appState === AppState.GENERATING ? (
                    <RefreshCcw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span className="hidden md:inline">Generate</span>
                      <Wand2 size={18} />
                    </>
                  )}
               </button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TryOnFeature;
