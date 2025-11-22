
import React, { useState, useEffect } from 'react';
import { ArrowRight, Wand2, Sparkles, Search, Grid } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [greeting, setGreeting] = useState('Good Morning');
  const [profileName, setProfileName] = useState('Artist');

  useEffect(() => {
    // Time-based greeting
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    // Get name from storage or default
    const storedName = localStorage.getItem('ink_user_name');
    if (storedName) {
      setProfileName(storedName);
    }
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black custom-scrollbar pt-14 md:pt-0">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10">
        
        {/* Header */}
        <div className="space-y-1 mt-2 md:mt-0">
          <h1 className="text-xl md:text-3xl font-light text-zinc-400">{greeting} {profileName},</h1>
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">What would you like to <span className="text-[#CCFF00]">create</span> today?</h2>
        </div>

        {/* Hero Banner - Imagine Studio Promo */}
        <div 
          onClick={() => onNavigate('imagine')}
          className="relative w-full min-h-[500px] md:h-[550px] rounded-3xl overflow-hidden group cursor-pointer border border-zinc-800 shadow-2xl shadow-black/50 bg-[#0A0A0A]"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050505] to-[#050505]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          
          <div className="absolute inset-0 flex flex-col md:flex-row items-center p-6 md:p-12 gap-8">
            
            {/* Left Content */}
            <div className="flex-1 z-10 flex flex-col justify-center items-start text-left w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6 animate-in slide-in-from-left-4 duration-700">
                  <Sparkles size={12} />
                  <span>New AI Engine</span>
                </div>
                
                <h3 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  Turn your words <br/>
                  into <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Ink.</span>
                </h3>
                
                <p className="text-zinc-400 text-lg mb-8 max-w-md leading-relaxed">
                  Describe your customers tattoo requirements , imagine it with our AI add your artistic touch instantly
                </p>
                
                <button 
                  className="px-8 py-4 bg-white text-black rounded-full font-bold text-base flex items-center gap-3 hover:bg-purple-50 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-105"
                >
                  Start Designing <ArrowRight size={18} />
                </button>
            </div>

            {/* Right Content - Static Demo */}
            <div className="flex-1 w-full h-full flex items-center justify-center relative perspective-[1000px] md:translate-x-10 group-hover:translate-x-5 transition-transform duration-700">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="transform rotate-y-[-5deg] rotate-x-[5deg] group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-700 ease-out w-full flex justify-center">
                   
                   {/* Static Preview Card - SQUARE & CLEAN */}
                   <div className="relative w-full max-w-lg aspect-square bg-black/80 backdrop-blur-xl rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
                      
                      {/* Mock UI Body */}
                      <div className="p-5 flex flex-col gap-4 h-full">
                        {/* Input Area */}
                        <div className="flex gap-3 shrink-0">
                           <div className="flex-1 h-12 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center px-4 overflow-hidden shadow-inner">
                              <span className="text-sm text-zinc-300 font-mono whitespace-nowrap">
                                Tribal owl tattoo design...
                              </span>
                           </div>
                           <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                              <Wand2 size={20} />
                           </div>
                        </div>

                        {/* Canvas Area - White Background for Realistic Preview */}
                        <div className="flex-1 bg-white rounded-xl border border-zinc-200 relative overflow-hidden flex items-center justify-center group shadow-inner">
                           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply pointer-events-none" />
                           
                           {/* Image Result - High Quality Vector Icon (Black Ink) */}
                           <div className="absolute inset-0 w-full h-full p-6 flex items-center justify-center">
                             <img 
                                src="https://api.iconify.design/game-icons:owl.svg?color=%23000000" 
                                alt="Tribal Owl" 
                                className="w-full h-full object-contain opacity-90 drop-shadow-sm"
                             />
                           </div>
                        </div>
                      </div>
                    </div>

                </div>
            </div>

          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-10">
          
          {/* Card 1: Try On (Promoted from secondary) */}
          <div 
            onClick={() => onNavigate('tryon')}
            className="group relative p-[1px] rounded-[24px] bg-gradient-to-b from-zinc-700 to-transparent cursor-pointer hover:shadow-lg hover:shadow-[#CCFF00]/5 transition-all active:scale-[0.98]"
          >
            <div className="bg-[#0A0A0A] rounded-[23px] p-5 md:p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-[#CCFF00] group-hover:scale-110 transition-transform border border-zinc-800">
                  <Wand2 size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="px-2 py-1 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold uppercase tracking-wider rounded border border-[#CCFF00]/20">Popular</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">Tattoo Try-On</h3>
              <p className="text-xs md:text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                Already have a design? Visualize how it fits on your body with our realistic placement tool.
              </p>
              
              {/* Action Link */}
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto">
                 <span>Start Try-On</span>
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Inspire (Replaces Imagine which is now Hero) */}
          <div 
            onClick={() => onNavigate('inspire')}
            className="group relative p-[1px] rounded-[24px] bg-gradient-to-b from-zinc-700 to-transparent cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-[0.98]"
          >
            <div className="bg-[#0A0A0A] rounded-[23px] p-5 md:p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform border border-zinc-800">
                  <Search size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/20">Explore</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">Inspiration Feed</h3>
              <p className="text-xs md:text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                Browse trending styles and find the perfect reference for your next ink project.
              </p>
              
              {/* Action Link */}
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto">
                 <span>Browse Feed</span>
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 3: Canvas Studio */}
          <div 
            onClick={() => onNavigate('canvas')}
            className="group relative p-[1px] rounded-[24px] bg-gradient-to-b from-zinc-700 to-transparent cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 transition-all active:scale-[0.98]"
          >
            <div className="bg-[#0A0A0A] rounded-[23px] p-5 md:p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform border border-zinc-800">
                  <Grid size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-500/20">Editor</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">Canvas Studio</h3>
              <p className="text-xs md:text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                 Create designs from scratch with layers, brushes, and advanced editing tools.
              </p>
              
              {/* Action Link */}
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto">
                 <span>Open Studio</span>
                 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeView;
