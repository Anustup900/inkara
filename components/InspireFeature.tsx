
import React, { useState, useRef, useEffect } from 'react';
import { Search, Image as ImageIcon, X, Loader2, ArrowRight, ChevronLeft, Sparkles, ExternalLink, Download, Wand2, Zap } from 'lucide-react';
import { searchInspiration, fileToBase64 } from '../services/gemini';

interface InspireFeatureProps {
  onNavigate?: (view: string) => void;
}

interface SearchResult {
  text: string;
  images: string[];
  sources: { title: string; uri: string }[];
}

const SUGGESTIONS = [
  "Cyberpunk Geisha", 
  "Minimalist Constellation", 
  "Traditional Snake",
  "Geometric Wolf", 
  "Watercolor Phoenix", 
  "Dotwork Mandala",
  "Japanese Dragon"
];

const InspireFeature: React.FC<InspireFeatureProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // 1. Load Session on Mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('ink_session_inspire');
      if (savedSession) {
        const data = JSON.parse(savedSession);
        if (data.query) setQuery(data.query);
        if (data.result) setResult(data.result);
        // Note: We skip re-hydrating image blobs for search because it's complex and less critical for quick navigation
      }
    } catch (e) {
      console.error("Failed to load Inspire session", e);
    }
    isInitialMount.current = false;
  }, []);

  // 2. Save Session on Change
  useEffect(() => {
    if (isInitialMount.current) return;
    // Only save if there is a result or a query
    if (query || result) {
        const timeoutId = setTimeout(() => {
        try {
            const sessionData = {
            query,
            result
            };
            localStorage.setItem('ink_session_inspire', JSON.stringify(sessionData));
        } catch (e) {
            console.warn("Failed to save Inspire session", e);
        }
        }, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [query, result]);


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = [];
      const fileList = Array.from(e.target.files) as File[];
      for (const file of fileList) {
        try {
          const base64 = await fileToBase64(file);
          const preview = URL.createObjectURL(file);
          newImages.push({ file, preview, base64 });
        } catch (err) { console.error(err); }
      }
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const searchQuery = overrideQuery || query;
    
    if (!searchQuery.trim() && images.length === 0) return;
    if (overrideQuery) setQuery(overrideQuery);

    setIsSearching(true);
    setResult(null);

    try {
      const imageBase64s = images.map(img => img.base64);
      const response = await searchInspiration(searchQuery, imageBase64s);
      setResult(response);
      // Smooth scroll to results if needed, though layout shift handles it mostly
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTryOn = async (imgSrc: string) => {
    if (!onNavigate) return;
    
    try {
      // If it's a data URL, use it directly. If it's a remote URL, fetch and convert.
      let base64 = imgSrc;
      if (imgSrc.startsWith('http')) {
        const response = await fetch(imgSrc);
        const blob = await response.blob();
        const reader = new FileReader();
        base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      
      // Strip prefix for storage if needed
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      
      localStorage.setItem('ink_import_tattoo', cleanBase64);
      onNavigate('tryon');
    } catch (e) {
      console.error("Failed to import image for try-on", e);
    }
  };

  const downloadImage = (src: string, idx: number) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `ink-inspiration-${idx}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSession = () => {
      setQuery('');
      setResult(null);
      setImages([]);
      localStorage.removeItem('ink_session_inspire');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black custom-scrollbar relative flex flex-col font-sans text-white selection:bg-[#CCFF00] selection:text-black">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-[#CCFF00]/5 blur-[150px] rounded-full mix-blend-screen animate-pulse duration-[4000ms]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className={`
        fixed top-0 left-0 right-0 z-50 px-4 md:px-6 h-16 flex items-center justify-between 
        transition-all duration-500
        ${result ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}
      `}>
        <div className="flex items-center gap-3">
           {onNavigate && (
              <button onClick={() => onNavigate('home')} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
           )}
           <div className="hidden md:flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#CCFF00] border border-white/10 backdrop-blur-md">
               <Zap size={16} fill="currentColor" />
             </div>
             <span className="text-sm font-bold text-white tracking-wide">INSPIRE</span>
           </div>
        </div>
        
        {/* Clear Button */}
        {(query || result) && (
            <button 
                onClick={clearSession}
                className="p-2 text-zinc-400 hover:text-red-400 bg-black/20 hover:bg-red-500/10 backdrop-blur rounded-lg transition-colors border border-white/5"
                title="Clear Search"
            >
                <X size={18} />
            </button>
        )}
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col w-full max-w-7xl mx-auto">
        
        {/* Search Section */}
        <div className={`
          flex flex-col items-center w-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] px-4
          ${result ? 'pt-24 pb-8' : 'min-h-[80vh] justify-center'}
        `}>
           {/* Hero Text (Only in initial state) */}
           <div className={`text-center space-y-4 mb-10 transition-all duration-500 ${result ? 'hidden' : 'block opacity-100'}`}>
             <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight">
               Dream it. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-emerald-300">Ink it.</span>
             </h1>
             <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
               Search millions of styles or let our AI generate the perfect tattoo design for you instantly.
             </p>
           </div>

           {/* Search Bar */}
           <div className={`
             w-full max-w-2xl relative group transition-all duration-500
             ${result ? 'scale-100' : 'scale-110'}
           `}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#CCFF00]/30 to-purple-500/30 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500" />
              
              <form 
                onSubmit={(e) => handleSearch(e)}
                className="relative flex items-center bg-[#0A0A0A]/90 border border-white/10 rounded-full p-2 pl-6 shadow-2xl backdrop-blur-xl"
              >
                  {/* Image Uploads Preview */}
                  {images.length > 0 && (
                    <div className="flex gap-2 mr-3">
                       {images.map((img, idx) => (
                         <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 group/img">
                           <img src={img.preview} className="w-full h-full object-cover" alt="ref" />
                           <button 
                             type="button"
                             onClick={() => removeImage(idx)}
                             className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                           >
                             <X size={12} />
                           </button>
                         </div>
                       ))}
                    </div>
                  )}

                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe your tattoo idea..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-600 h-12 text-lg"
                  />
                  
                  <div className="flex items-center gap-2">
                      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                        title="Upload Reference"
                      >
                        <ImageIcon size={20} />
                      </button>
                      
                      <button 
                        type="submit"
                        disabled={isSearching || (!query && images.length === 0)}
                        className="bg-[#CCFF00] hover:bg-[#b3e600] disabled:opacity-50 disabled:cursor-not-allowed text-black p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                      >
                         {isSearching ? <Loader2 size={24} className="animate-spin" /> : <ArrowRight size={24} />}
                      </button>
                  </div>
              </form>
           </div>

           {/* Suggestions Chips (Only initial state) */}
           {!result && !isSearching && (
              <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                 {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSearch(undefined, suggestion)}
                      className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#CCFF00]/30 text-zinc-400 hover:text-[#CCFF00] text-sm transition-all"
                    >
                      {suggestion}
                    </button>
                 ))}
              </div>
           )}
        </div>

        {/* Results Grid */}
        {result && (
          <div ref={resultsRef} className="px-4 pb-20 w-full animate-in fade-in slide-in-from-bottom-10 duration-700">
             
             {result.text && (
               <p className="text-zinc-500 text-center mb-8 max-w-2xl mx-auto text-sm">
                 {result.text}
               </p>
             )}

             {result.images.length > 0 ? (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 w-full">
                   {result.images.map((imgSrc, idx) => (
                      <div key={idx} className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-zinc-900/50 border border-white/5 hover:border-[#CCFF00]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#CCFF00]/5">
                         {/* Image */}
                         <img 
                           src={imgSrc} 
                           alt={`Inspiration ${idx}`} 
                           className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                           loading="lazy"
                         />
                         
                         {/* Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                             <div className="flex items-center justify-between gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                               <div className="flex gap-2">
                                  <button 
                                     onClick={() => downloadImage(imgSrc, idx)}
                                     className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors"
                                     title="Download"
                                   >
                                     <Download size={18} />
                                   </button>
                                   {imgSrc.startsWith('http') && (
                                     <a 
                                        href={imgSrc} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors"
                                        title="Source"
                                     >
                                        <ExternalLink size={18} />
                                     </a>
                                   )}
                               </div>
                               
                               <button 
                                 onClick={() => handleTryOn(imgSrc)}
                                 className="px-4 py-2 bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold rounded-full flex items-center gap-2 text-xs uppercase tracking-wider shadow-lg shadow-[#CCFF00]/20 transition-all"
                               >
                                 <Wand2 size={14} />
                                 Try On
                               </button>
                             </div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                      <ImageIcon size={24} className="opacity-30" />
                   </div>
                   <p>No results found. Try a different keyword.</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspireFeature;
