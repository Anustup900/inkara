
import React from 'react';
import { HistoryItem } from '../types';
import { Clock, ChevronLeft, Sparkles } from 'lucide-react';

interface SidebarProps {
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ history, onSelectHistory, isOpen, toggleSidebar }) => {
  
  const getImageSrc = (src: string) => {
      if (!src) return '';
      if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:')) {
          return src;
      }
      return `data:image/png;base64,${src}`;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar Panel */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#09090b] border-r border-zinc-900 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          
          {/* Header */}
          <div className="p-6 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800">
                <Clock size={16} className="text-[#CCFF00]"/>
              </div>
              <span className="font-semibold text-zinc-200 tracking-wide">History</span>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-zinc-900/50 flex items-center justify-center mb-4">
                   <Sparkles size={20} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-zinc-500">No creations yet</p>
                <p className="text-xs text-zinc-700 mt-2 leading-relaxed">
                  Your generated designs will be saved here automatically.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  className="w-full group flex gap-4 p-3 rounded-2xl hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all text-left relative overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-zinc-800 relative flex-shrink-0">
                    <img 
                      src={getImageSrc(item.resultImage)} 
                      alt="Result" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all group-hover:scale-110"
                    />
                  </div>
                  
                  {/* Text Info */}
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-[#CCFF00] truncate transition-colors">
                      Generated Art
                    </span>
                    <span className="text-xs text-zinc-600 group-hover:text-zinc-500 mt-1 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {/* Footer */}
           <div className="p-6 border-t border-zinc-900 bg-[#050505]">
              <div className="flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                 <span>Saved in DB</span>
                 <span>{history.length} Items</span>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
