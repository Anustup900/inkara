
import React, { useState } from 'react';
import GlobalSidebar from './components/GlobalSidebar';
import HomeView from './components/HomeView';
import LandingPage from './components/LandingPage';
import TryOnFeature from './components/TryOnFeature';
import ImagineFeature from './components/ImagineFeature';
import CanvasFeature from './components/CanvasFeature';
import CommunityView from './components/CommunityView';
import InspireFeature from './components/InspireFeature';
import { Menu } from 'lucide-react';
import { LOGO_URL } from './services/assets';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  // Landing Page Render
  if (activeView === 'landing') {
    return <LandingPage onGetStarted={() => setActiveView('home')} />;
  }

  // Main App Layout
  return (
    <div className="flex h-[100dvh] w-full bg-black text-zinc-100 font-sans overflow-hidden">
      {/* Global Sidebar - Desktop & Mobile Drawer */}
      <GlobalSidebar 
        activeView={activeView} 
        onNavigate={handleNavigate} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 h-full relative flex flex-col min-w-0">
        
        {/* Mobile Header Trigger (Only visible on Home when menu is closed) */}
        {activeView === 'home' && (
           <div className="md:hidden absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white pointer-events-auto"
             >
               <Menu size={20} />
             </button>
             <img 
               src={LOGO_URL} 
               alt="Inkara" 
               className="h-8 object-contain drop-shadow-lg opacity-90"
             />
           </div>
        )}

        {activeView === 'home' && <HomeView onNavigate={handleNavigate} />}
        {activeView === 'tryon' && <TryOnFeature onNavigate={handleNavigate} />}
        {activeView === 'imagine' && <ImagineFeature onNavigate={handleNavigate} />}
        {activeView === 'canvas' && <CanvasFeature onNavigate={handleNavigate} />}
        {activeView === 'community' && <CommunityView />}
        {activeView === 'inspire' && <InspireFeature onNavigate={handleNavigate} />}
        
        {/* Placeholders for other views */}
        {activeView !== 'home' && activeView !== 'tryon' && activeView !== 'imagine' && activeView !== 'canvas' && activeView !== 'community' && activeView !== 'inspire' && (
           <div className="flex-1 flex items-center justify-center flex-col text-zinc-500 p-4 text-center">
             <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
             <p className="max-w-xs mx-auto">The {activeView} feature is under development.</p>
             <button 
               onClick={() => setActiveView('home')} 
               className="mt-6 px-6 py-2 rounded-full bg-[#CCFF00] text-black font-bold text-sm hover:bg-[#b3e600] transition-colors"
             >
               Back to Home
             </button>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
