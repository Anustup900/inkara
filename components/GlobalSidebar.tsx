
import React, { useState } from 'react';
import { Home, Wand2, Image as ImageIcon, Grid, Users, Lightbulb, MessageCircle, User, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { LOGO_URL } from '../services/assets';

interface GlobalSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ activeView, onNavigate, isOpen = false, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: { id: string; label: string; icon: React.ElementType; badge?: string; sub?: string }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tryon', label: 'Tryon', icon: Wand2 },
    { id: 'imagine', label: 'Imagine', icon: ImageIcon, badge: 'New' },
    { id: 'canvas', label: 'Canvas', icon: Grid },
    { id: 'community', label: 'Community', icon: Users, badge: 'Waitlist' },
    { id: 'inspire', label: 'Inspire', icon: Lightbulb },
  ];

  // Base classes for the sidebar container
  const sidebarClasses = `
    fixed md:static inset-y-0 left-0 z-50
    bg-[#050505] border-r border-zinc-900 
    flex flex-col shrink-0 
    transform transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    ${isCollapsed ? 'md:w-20' : 'md:w-64'}
    w-[280px]
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <div className={sidebarClasses}>
        {/* Logo Area */}
        <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          {!isCollapsed && (
             <img src={LOGO_URL} alt="Inkara" className="h-8 object-contain animate-in fade-in slide-in-from-left-2 duration-300" />
          )}
          
          {/* Toggle Button (Desktop) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              disabled={item.sub === 'coming soon'}
              className={`
                w-full flex items-center rounded-xl transition-all duration-200 group relative
                ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'}
                ${activeView === item.id 
                  ? 'bg-zinc-900 text-white shadow-inner shadow-black/50' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                }
                ${item.sub === 'coming soon' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              {activeView === item.id && (
                <div className={`absolute bg-[#CCFF00] rounded-full transition-all ${isCollapsed ? 'left-1 top-1/2 -translate-y-1/2 w-1 h-1' : 'left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full'}`} />
              )}
              
              <item.icon size={20} className={`flex-shrink-0 ${activeView === item.id ? 'text-[#CCFF00]' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
              
              {!isCollapsed && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  {item.sub && <span className="text-[10px] text-zinc-700 font-normal truncate">{item.sub}</span>}
                </div>
              )}

              {!isCollapsed && item.badge && (
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${
                    item.badge === 'Waitlist' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                    : 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/20 shadow-[0_0_10px_rgba(204,255,0,0.1)]'
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Collapsed Badge indicator */}
              {isCollapsed && item.badge && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-black ${item.badge === 'Waitlist' ? 'bg-purple-500' : 'bg-[#CCFF00]'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className={`border-t border-zinc-900 bg-[#050505] ${isCollapsed ? 'p-2' : 'p-4 space-y-1'}`}>
          <button 
            className={`w-full flex items-center rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'}`}
            title={isCollapsed ? "Chat with us" : undefined}
          >
            <MessageCircle size={20} />
            {!isCollapsed && <span>Chat with us</span>}
          </button>
          
          <div className={`mt-2 ${!isCollapsed ? 'pt-2 border-t border-zinc-900/50' : ''}`}>
             <button 
               className={`w-full flex items-center rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-900/50 transition-colors ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'}`}
               title={isCollapsed ? "My Profile" : undefined}
             >
               <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 flex-shrink-0">
                 <User size={16} />
               </div>
               {!isCollapsed && (
                 <div className="flex flex-col items-start text-left overflow-hidden">
                    <span className="text-zinc-200 text-xs truncate">My Profile</span>
                    <span className="text-[10px] text-zinc-600 truncate">Free Plan</span>
                 </div>
               )}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSidebar;
