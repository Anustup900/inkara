import React, { useState } from 'react';
import { Users, ShoppingBag, Brush, Heart, ArrowRight, Mail, Sparkles, Search, TrendingUp, Palette, DollarSign } from 'lucide-react';

const CommunityView = () => {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setJoined(true);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#050505] custom-scrollbar relative font-sans text-zinc-200">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#CCFF00]/5 rounded-full blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md text-[#CCFF00] text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#CCFF00]/5">
                <Sparkles size={14} />
                <span>Join the Revolution</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-emerald-400">Pinterest</span> for <br/> Tattoo Artists.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                A dedicated marketplace to showcase your portfolio, sell custom flash & brushes, and connect with the global ink community.
            </p>
        </div>

        {/* Waitlist Input */}
        <div className="w-full max-w-md mx-auto mt-12 mb-24 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
             {joined ? (
                 <div className="bg-gradient-to-br from-[#CCFF00]/20 to-emerald-500/20 border border-[#CCFF00]/30 rounded-3xl p-8 text-center backdrop-blur-xl relative overflow-hidden">
                     <div className="w-16 h-16 bg-[#CCFF00] rounded-full flex items-center justify-center text-black mx-auto mb-4 shadow-[0_0_30px_rgba(204,255,0,0.3)] animate-in zoom-in duration-300">
                         <Heart size={32} fill="currentColor" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
                     <p className="text-zinc-300">We've reserved your spot. Keep an eye on <span className="text-[#CCFF00] font-medium">{email}</span> for your invite.</p>
                 </div>
             ) : (
                 <form onSubmit={handleJoin} className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-[#CCFF00] to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                     <div className="relative flex items-center bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-2 pl-5 shadow-2xl">
                         <Mail size={20} className="text-zinc-500 shrink-0 mr-3" />
                         <input 
                            type="email" 
                            placeholder="enter.your@email.com" 
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-600 h-12 min-w-0"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                         />
                         <button type="submit" className="bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 shrink-0">
                             Join <ArrowRight size={18} className="hidden sm:block" />
                         </button>
                     </div>
                     <div className="flex items-center justify-center gap-3 mt-6 text-zinc-500 text-xs font-medium">
                        <div className="flex -space-x-2">
                           {[1,2,3,4].map(i => (
                               <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-[#0A0A0A] flex items-center justify-center overflow-hidden">
                                   <Users size={12} className="text-zinc-500" />
                               </div>
                           ))}
                        </div>
                        <span>Join 2,400+ artists waiting for access</span>
                     </div>
                 </form>
             )}
        </div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
            
            {/* Card 1 */}
            <div className="group p-8 rounded-[32px] bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:-translate-y-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShoppingBag size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <DollarSign size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">Marketplace</h3>
                <p className="text-zinc-500 leading-relaxed">
                    Monetize your creativity. Sell your unique flash sheets, stencils, and digital assets directly to clients and other artists worldwide.
                </p>
            </div>

             {/* Card 2 */}
             <div className="group p-8 rounded-[32px] bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:-translate-y-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <Users size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">Artist Network</h3>
                <p className="text-zinc-500 leading-relaxed">
                   Connect with ink masters. Share techniques, collaborate on guest spots, and build your professional reputation in a verified community.
                </p>
            </div>

             {/* Card 3 */}
             <div className="group p-8 rounded-[32px] bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:-translate-y-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Palette size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <Brush size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-400 transition-colors">Custom Tools</h3>
                <p className="text-zinc-500 leading-relaxed">
                    Buy and sell custom Procreate brushes, 3D models, and texture packs designed specifically for tattoo artistry.
                </p>
            </div>

             {/* Card 4 */}
             <div className="group p-8 rounded-[32px] bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all hover:-translate-y-1 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Search size={120} />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#CCFF00]/10 text-[#CCFF00] flex items-center justify-center mb-6 border border-[#CCFF00]/20 shadow-[0_0_20px_rgba(204,255,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#CCFF00] transition-colors">Infinite Feed</h3>
                <p className="text-zinc-500 leading-relaxed">
                    Discover trending styles, curate mood boards for clients, and find the perfect reference image from a vast, artist-curated library.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityView;