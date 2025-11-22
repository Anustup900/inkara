
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Play, ChevronDown, Globe, Box,
  Layout, Wand2, Layers, Palette, Share2, Download, 
  ScanFace, Shield, Camera, Check, Cpu, Smartphone, 
  Menu, X, Monitor, Grid, Search, Zap, Maximize2,
  Sliders, Image as ImageIcon, User, Sparkles, Pencil, MousePointer2, Loader2, Brush,
  Mail, Lock, Github, Store
} from 'lucide-react';
import { LOGO_URL } from '../services/assets';

interface LandingPageProps {
  onGetStarted: () => void;
}

const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'signin' | 'signup';
  onComplete: (name: string) => void;
}> = ({ isOpen, onClose, initialMode, onComplete }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Role State
  const [role, setRole] = useState<'artist' | 'studio'>('artist');
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate Backend API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Determine Display Name
      const finalName = mode === 'signup' && name ? name : (email.split('@')[0] || 'Artist');
      
      // Save session data to local storage (Simulating DB persist)
      localStorage.setItem('ink_user_name', finalName);
      localStorage.setItem('ink_user_role', role);
      localStorage.setItem('ink_user_email', email);
      
      onComplete(finalName);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Simulate Google OAuth Provider flow
    // In a real app, this would allow redirect to Google's OAuth endpoint
    setTimeout(() => {
      setIsLoading(false);
      
      const mockGoogleUser = {
          name: "Alex Doe",
          email: "alex.doe@gmail.com",
          picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
      };
      
      localStorage.setItem('ink_user_name', mockGoogleUser.name);
      localStorage.setItem('ink_user_email', mockGoogleUser.email);
      // Default role for social login
      localStorage.setItem('ink_user_role', 'artist'); 
      
      onComplete(mockGoogleUser.name);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-[400px] bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent opacity-50" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-4">
               <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-white/5 flex items-center justify-center text-white shadow-lg shadow-black/50">
                  <User size={24} />
               </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-zinc-500 text-sm">
              {mode === 'signin' 
                ? 'Enter your details to access your studio.' 
                : 'Join the revolution of digital tattoo artistry.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection (Only for Sign Up) */}
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="text-xs font-medium text-zinc-500 ml-1 mb-2 block uppercase tracking-wider">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('artist')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      role === 'artist' 
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-white shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                        : 'bg-[#18181b] border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <Brush size={20} className={role === 'artist' ? 'text-[#CCFF00]' : 'currentColor'} />
                    <span className="text-xs font-medium">Artist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('studio')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      role === 'studio' 
                        ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-white shadow-[0_0_15px_rgba(204,255,0,0.1)]' 
                        : 'bg-[#18181b] border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <Store size={20} className={role === 'studio' ? 'text-[#CCFF00]' : 'currentColor'} />
                    <span className="text-xs font-medium">Studio Owner</span>
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all"
                    placeholder="Ink Master"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all"
                  placeholder="artist@inkara.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#CCFF00]/20"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#09090b] px-2 text-zinc-500">Or continue with</span></div>
          </div>

          {/* Socials */}
          <div className="grid grid-cols-1 gap-3">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 bg-[#18181b] hover:bg-[#27272a] border border-zinc-800 rounded-xl text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-zinc-700"
            >
              {isLoading ? (
                 <Loader2 size={16} className="animate-spin" />
              ) : (
                 <>
                   <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                   Google
                 </>
              )}
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-white hover:text-[#CCFF00] font-medium transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [scrolled, setScrolled] = useState(false);
  
  // Auth State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Animation State
  // 0: Reset/Blank
  // 1: Drawing (Sketch)
  // 2: Prompting (Input appears)
  // 3: Processing (Scan effect)
  // 4: Result (Final Image)
  const [animState, setAnimState] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Animation Loop
    let timeout: ReturnType<typeof setTimeout>;
    
    const runAnimationSequence = () => {
        setAnimState(0); // Reset
        
        // Start Drawing
        timeout = setTimeout(() => setAnimState(1), 500);

        // Show Imagine Prompt
        timeout = setTimeout(() => setAnimState(2), 5500); 

        // Start Scanning/Processing
        timeout = setTimeout(() => setAnimState(3), 7500);

        // Reveal Result
        timeout = setTimeout(() => setAnimState(4), 8500);

        // Reset Loop
        timeout = setTimeout(() => runAnimationSequence(), 14000);
    };

    runAnimationSequence();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false); // Close mobile menu if open
  };

  const handleAuthComplete = (name: string) => {
    localStorage.setItem('ink_user_name', name);
    setShowAuthModal(false);
    onGetStarted();
  };

  // Continuous Line Owl Path (Refined for recognizability)
  // Starts at beak, goes to eyes, ears, head contour, wings, then back to beak.
  const owlPath = "M 50 60 L 45 55 L 40 45 C 35 40 30 45 30 50 C 30 55 35 60 40 60 L 30 70 L 20 50 C 15 40 15 30 25 25 C 30 20 35 25 35 30 L 35 20 L 45 25 L 50 20 L 55 25 L 65 20 L 65 30 C 65 25 70 20 75 25 C 85 30 85 40 80 50 L 70 70 L 60 60 C 65 60 70 55 70 50 C 70 45 65 40 60 45 L 55 55 L 50 60 Z";

  // Refined Image URL (Tattoo Style Art - Illustration)
  const refinedImageUrl = "https://i.ibb.co/JJFDTzL/owl.jpg";

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans selection:bg-[#CCFF00] selection:text-black overflow-x-hidden relative">
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
        onComplete={handleAuthComplete}
      />

      {/* --- Ambient Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 rounded-full blur-[120px] animate-pulse duration-[10s]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#CCFF00]/5 rounded-full blur-[120px] animate-pulse duration-[8s] delay-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
      </div>

      {/* --- Navigation --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex justify-center ${scrolled ? 'pt-4' : 'pt-6'}`}>
        <div className={`
           relative flex items-center justify-between px-6 md:px-2
           ${scrolled 
             ? 'w-[90%] md:w-auto md:min-w-[600px] bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-full py-3 shadow-2xl' 
             : 'w-full max-w-7xl py-4 bg-transparent border-transparent'
           }
        `}>
          {/* Logo */}
          <div className="flex items-center gap-2 pl-2 md:pl-6 cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
             <img src={LOGO_URL} alt="Inkara" className="h-6 object-contain group-hover:opacity-80 transition-opacity" />
          </div>
          
          {/* Desktop Links */}
          <div className={`hidden md:flex items-center gap-1 px-2 ${scrolled ? '' : 'bg-white/5 backdrop-blur-md rounded-full border border-white/5 p-1'}`}>
            {['Features', 'How it works', 'Pricing', 'FAQ'].map((item) => (
                <a 
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s/g, '-')}`} 
                    className="px-5 py-2 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                >
                    {item}
                </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4 pr-2 md:pr-2">
            {!scrolled && <button onClick={() => openAuth('signin')} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors px-4">Log in</button>}
            <button 
              onClick={() => openAuth('signup')}
              className="px-6 py-2.5 bg-[#CCFF00] text-black text-sm font-bold rounded-full hover:bg-[#dfff3d] transition-all hover:shadow-[0_0_20px_rgba(204,255,0,0.3)] active:scale-95 flex items-center gap-2"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white p-2 pr-0"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-[#111] border border-white/10 rounded-2xl p-6 md:hidden flex flex-col gap-4 animate-in slide-in-from-top-5 shadow-2xl z-50">
            <div className="flex flex-col gap-2 text-lg font-medium text-zinc-300">
                {['Features', 'How it works', 'Pricing'].map(item => (
                   <a key={item} href={`#${item.toLowerCase().replace(/\s/g, '-')}`} onClick={() => setIsMenuOpen(false)} className="p-4 hover:bg-white/5 rounded-xl">{item}</a>
                ))}
                <button onClick={() => openAuth('signin')} className="p-4 hover:bg-white/5 rounded-xl text-left">Log In</button>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <button onClick={() => openAuth('signup')} className="w-full py-4 bg-[#CCFF00] text-black font-bold rounded-xl text-lg">Get Started</button>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 md:pt-52 pb-20 px-6 flex flex-col items-center text-center perspective-[1000px]">
        
        <div className="relative z-10 max-w-5xl mx-auto mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#CCFF00]/20 bg-[#CCFF00]/5 text-[11px] font-bold uppercase tracking-widest text-[#CCFF00] animate-in fade-in slide-in-from-bottom-4 duration-1000 shadow-[0_0_30px_rgba(204,255,0,0.15)] backdrop-blur-md cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CCFF00]"></span>
            </span>
            <span>Inkara Studio</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold text-white tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Take control of <br className="hidden md:block"/>
            <span className="text-zinc-500">Tattoo designs with Inkara.</span>
          </h1>
          
          {/* Subhead */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 font-light">
            All your artistic need for designing in one place — canvas, Brushes, tryons, AI-powered design tool, and assistant and personal portfolio management. 
          </p>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <button 
              onClick={() => openAuth('signup')}
              className="group w-full sm:w-auto px-8 py-4 bg-[#CCFF00] text-black rounded-full font-bold text-base transition-all hover:shadow-[0_0_50px_rgba(204,255,0,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Start Designing 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
               <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Play size={10} fill="currentColor" />
               </div>
               Watch Demo
            </button>
          </div>
        </div>

        {/* --- Canvas Drawing Demo --- */}
        <div className="relative w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 group perspective-[3000px]">
           
           {/* Dashboard Frame */}
           <div className="relative rounded-2xl border border-zinc-800 bg-[#09090b] shadow-[0_0_120px_rgba(204,255,0,0.15)] overflow-hidden aspect-[16/10] md:aspect-[21/10] transform transition-transform duration-[1.5s] ease-out rotate-x-6 group-hover:rotate-x-0 origin-bottom">
              
              {/* App Header */}
              <div className="h-12 bg-[#050505] border-b border-white/5 flex items-center px-4 justify-between shrink-0 relative z-20">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#282828] border border-white/5" />
                    <div className="w-3 h-3 rounded-full bg-[#282828] border border-white/5" />
                    <div className="w-3 h-3 rounded-full bg-[#282828] border border-white/5" />
                 </div>
                 
                 <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                    <div className="px-3 py-1 rounded bg-zinc-900 border border-white/5 flex items-center gap-2 text-zinc-300">
                       <Shield size={10} className="text-[#CCFF00]" /> inkara.studio
                    </div>
                 </div>

                 <div className="w-20" />
              </div>

              <div className="flex flex-1 h-full relative">
                 
                 {/* LEFT: Toolbar */}
                 <div className="w-16 md:w-20 bg-[#050505] border-r border-white/5 flex flex-col items-center py-6 gap-6 shrink-0 z-20 transition-all">
                    
                    {/* Tool: Move */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 bg-zinc-900/30 border border-white/5"><MousePointer2 size={20} /></div>
                    
                    {/* Tool: Brush (Active in Draw Mode) */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative
                       ${animState >= 1 && animState < 2 ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-zinc-600 bg-zinc-900/30 border border-white/5'}
                    `}>
                        <Brush size={20} />
                        {animState >= 1 && animState < 2 && <div className="absolute -right-1 -top-1 w-3 h-3 bg-[#CCFF00] rounded-full border-2 border-[#050505]" />}
                    </div>

                    {/* Tool: Imagine (Active in Result Mode) */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative
                       ${animState >= 2 ? 'bg-purple-600 text-white scale-110 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'text-zinc-600 bg-zinc-900/30 border border-white/5'}
                    `}>
                        <Sparkles size={20} />
                        {animState >= 2 && <div className="absolute -right-1 -top-1 w-3 h-3 bg-[#CCFF00] rounded-full border-2 border-[#050505]" />}
                    </div>

                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 bg-zinc-900/30 border border-white/5"><Layers size={20} /></div>
                    
                    <div className="mt-auto w-10 h-10 flex items-center justify-center text-zinc-500 hover:bg-zinc-900 rounded-xl"><User size={20} /></div>
                 </div>

                 {/* CENTER: Canvas */}
                 <div className="flex-1 relative bg-[#0c0c0e] overflow-hidden flex items-center justify-center p-8">
                    
                    {/* Canvas Board */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-white flex items-center justify-center group/canvas">
                        {/* Subtle Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] [background-size:40px_40px]" />
                        
                        {/* Content Container */}
                        <div className="relative w-[70%] h-[70%] flex items-center justify-center">
                           
                           {/* 1. SVG Sketch Layer (Fades out at Result) */}
                           <svg 
                              viewBox="0 0 100 100" 
                              className={`w-full h-full overflow-visible absolute transition-opacity duration-1000 ${animState >= 4 ? 'opacity-0' : 'opacity-100'}`}
                           >
                              {animState >= 1 && (
                                 <path 
                                    d={owlPath}
                                    fill="none" 
                                    stroke="#18181b" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="sketch-stroke"
                                 />
                              )}
                           </svg>

                           {/* 2. Animated Pencil Cursor (During Draw) */}
                           {animState === 1 && (
                              <div className="sketch-cursor absolute top-0 left-0 pointer-events-none z-50">
                                 <div className="relative -top-6 -left-1">
                                    <div className="w-2 h-2 bg-black rounded-full absolute bottom-0 left-0" />
                                    <Pencil size={32} fill="#000000" className="text-zinc-800 transform -rotate-[15deg] origin-bottom-left drop-shadow-xl" />
                                 </div>
                              </div>
                           )}

                           {/* 3. Scan Effect (During Processing) */}
                           {animState === 3 && (
                              <div className="absolute inset-0 z-20 pointer-events-none">
                                 <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-scan" />
                              </div>
                           )}

                           {/* 4. Refined Image Layer (Reveals at End) */}
                           <div 
                              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${animState >= 4 ? 'opacity-100' : 'opacity-0'}`}
                           >
                              <img 
                                 src={refinedImageUrl} 
                                 alt="Refined Owl Tattoo" 
                                 className="w-full h-full object-contain drop-shadow-xl scale-110 mix-blend-multiply filter contrast-125"
                              />
                           </div>

                           {/* 5. Prompt Input Overlay */}
                           <div 
                              className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl transition-all duration-500 z-30 whitespace-nowrap
                                ${animState >= 2 && animState < 4 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
                              `}
                           >
                              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                              <span className="text-sm font-medium text-white">
                                 Imagine the drawn owl head to a bohemian owl tattoo                              </span>
                              {animState === 3 && <Loader2 size={14} className="animate-spin text-zinc-500 ml-2" />}
                           </div>

                        </div>
                    </div>
                 </div>

                 {/* RIGHT: Panels */}
                 <div className="w-72 bg-[#050505] border-l border-white/5 hidden md:flex flex-col">
                    <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between">
                       <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Layers</span>
                       <Layers size={14} className="text-zinc-600" />
                    </div>
                    
                    <div className="p-4 space-y-3">
                       {/* Active Layer - Updates based on state */}
                       <div className={`p-3 bg-zinc-900/50 border rounded-xl flex items-center gap-3 shadow-lg shadow-black/50 transition-all duration-500 ${animState >= 2 ? 'border-purple-500/30' : 'border-[#CCFF00]/30'}`}>
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-zinc-700/50 relative">
                             {/* Layer Thumbnail Transition */}
                             <div className={`absolute inset-0 p-2 transition-opacity duration-1000 ${animState >= 4 ? 'opacity-0' : 'opacity-80'}`}>
                                <svg viewBox="0 0 100 100" className="w-full h-full"><path d={owlPath} fill="none" stroke="black" strokeWidth="3" /></svg>
                             </div>
                             <img 
                                src={refinedImageUrl} 
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${animState >= 4 ? 'opacity-100' : 'opacity-0'}`} 
                             />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold text-zinc-200 truncate">
                                {animState >= 4 ? 'Imagine Result' : 'Owl Tattoo'}
                             </div>
                             <div className={`text-[10px] flex items-center gap-1 mt-0.5 ${animState >= 4 ? 'text-purple-400' : 'text-[#CCFF00]'}`}>
                                <Check size={8} /> {animState >= 4 ? 'Generated' : 'Active'}
                             </div>
                          </div>
                       </div>

                       {/* Prompt Layer Indicator */}
                       <div className={`p-3 bg-purple-900/10 border border-purple-500/20 rounded-xl flex items-center gap-3 transition-all duration-500 ${animState >= 2 && animState < 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}`}>
                          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                             <Wand2 size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold text-zinc-200">Imagine</div>
                             <div className="text-[10px] text-zinc-500">Processing...</div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto border-t border-white/5 p-5">
                       <div className="flex justify-between text-xs text-zinc-500 mb-4 font-bold uppercase tracking-wider"><span>Settings</span></div>
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] text-zinc-400"><span>Detail Level</span><span>High</span></div>
                             <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full w-[80%] bg-zinc-600" /></div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex justify-between text-[10px] text-zinc-400"><span>Stability</span><span>100%</span></div>
                             <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full w-[100%] bg-[#CCFF00]" /></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Reflection Glow */}
           <div className="absolute -inset-[100px] bg-[#CCFF00]/5 blur-[150px] rounded-full pointer-events-none z-[-1]" />
        </div>
      </section>

      {/* --- How It Works --- */}
      <section id="how-it-works" className="py-32 px-6 relative border-t border-zinc-900">
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24">
               <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Three steps to perfection.</h2>
               <p className="text-zinc-400 text-lg max-w-xl mx-auto">Our workflow is designed for speed and precision.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
               {[
                  { step: "01", title: "Canvas/Inspire", desc: "AI powered search engine to get best design recommendations based on your artistic needs. Solely finetuned for tattoo artists. Canvas with unique design brushes and tools to draw your art from scratch.", icon: Wand2, color: "text-[#CCFF00]" },
                  { step: "02", title: "Imagine", desc: "AI powered tattoo design assistant which will listen to your idea and references and help you to draw faster", icon: Pencil, color: "text-blue-400" },
                  { step: "03", title: "Try-On", desc: "Map the design onto your customers body for a realistic preview. No additional efforts, realistic looks and blending.", icon: ScanFace, color: "text-purple-400" }
               ].map((item, i) => (
                  <div key={i} className={`flex flex-col items-center text-center group hover:scale-105 transition-transform duration-300`}>
                     <div className={`w-20 h-20 rounded-2xl bg-[#0A0A0A] border border-zinc-800 flex items-center justify-center mb-8 shadow-2xl group-hover:border-white/10`}>
                        <item.icon size={32} className={`${item.color}`} />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                     <p className="text-zinc-500 leading-relaxed max-w-xs">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- Features --- */}
      <section id="features" className="py-32 px-6 bg-[#030303] border-t border-zinc-900">
         <div className="max-w-7xl mx-auto">
            <div className="mb-20">
               <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">A complete studio suite.</h2>
               <p className="text-zinc-400 text-lg max-w-2xl">From client consultation to final stencil export, Inkara manages your entire creative workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
               <div className="col-span-1 md:col-span-2 bg-[#080808] rounded-[40px] border border-zinc-800 p-10 relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="w-12 h-12 bg-[#CCFF00] rounded-xl flex items-center justify-center mb-6 text-black"><Cpu size={24}/></div>
                     <h3 className="text-3xl font-bold text-white mb-4">Generative Ink Engine</h3>
                     <p className="text-zinc-400 max-w-md text-lg">Create unique tattoo designs in seconds. Make your customer experience it faster. Train our AI on your personal style for consistent results.</p>
                  </div>
                  <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-zinc-900/50 rounded-tl-[40px] border-t border-l border-zinc-800/50 overflow-hidden">
                      {/* Mini Interface Demo */}
                      <div className="p-6 space-y-4">
                          <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-zinc-700" /><div className="h-8 bg-zinc-800 rounded-lg flex-1" /></div>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="aspect-square bg-black rounded-lg border border-zinc-700/50 p-4 flex items-center justify-center">
                                 <img src="https://api.iconify.design/game-icons:wolf-head.svg?color=%23333333" className="w-16 h-16 opacity-50" />
                              </div>
                              <div className="aspect-square bg-black rounded-lg border border-zinc-700/50 p-4 flex items-center justify-center">
                                 <img src="https://api.iconify.design/game-icons:tiger-head.svg?color=%23333333" className="w-16 h-16 opacity-50" />
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
               <div className="col-span-1 bg-[#080808] rounded-[40px] border border-zinc-800 p-10 relative overflow-hidden group">
                  <div className="relative z-10">
                     <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6"><Smartphone size={24}/></div>
                     <h3 className="text-2xl font-bold text-white mb-2">Inkara Showroom</h3>
                     <p className="text-zinc-500">Build and manage your portfolio with us, create a sharable profile page with all your designs. Handle your client booking and consultations seamlessly. Join our community waitlist where we are building a marketplace for tattoo artists.</p>
                  </div>
                  {/* Phone Mockup CSS */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-64 bg-black border-4 border-zinc-800 rounded-[30px] shadow-2xl flex flex-col items-center justify-start pt-4 overflow-hidden">
                      <div className="w-12 h-1 bg-zinc-800 rounded-full mb-4" />
                      <div className="w-full h-full bg-zinc-900 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-purple-500/20 rounded-full blur-xl" />
                         <img src="https://api.iconify.design/lucide:scan-face.svg?color=%23A855F7" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 opacity-80 animate-pulse" />
                      </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="pricing" className="py-32 px-6 bg-black border-t border-zinc-900">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Pricing Plans</h2>
               <div className="inline-flex items-center p-1 bg-zinc-900 rounded-full border border-zinc-800">
                  {['Monthly', 'Yearly'].map(cycle => (
                     <button 
                        key={cycle}
                        onClick={() => setBillingCycle(cycle.toLowerCase() as any)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === cycle.toLowerCase() ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                     >
                        {cycle}
                        {cycle === 'Yearly' && <span className="ml-2 text-[#CCFF00] text-[10px]">SAVE 20%</span>}
                     </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
               
               {/* Free Trial */}
               <div className="p-8 rounded-[32px] border border-zinc-800 bg-[#050505] flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-zinc-600 font-medium">/mo</span></div>
                  <button onClick={() => openAuth('signup')} className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold mb-8 hover:bg-zinc-800 transition-all">Start Free</button>
                  <ul className="space-y-4 text-sm text-zinc-400 flex-1">
                     {['15 days of free access', 'Standard Export', 'Community Waitlist Access'].map(feature => (
                        <li key={feature} className="flex gap-3 items-center"><Check size={16} className="text-zinc-600" /> {feature}</li>
                     ))}
                  </ul>
               </div>

               {/* Pro (Highlighted) */}
               <div className="p-10 rounded-[32px] border border-[#CCFF00]/50 bg-[#0A0A0A] relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(204,255,0,0.05)] flex flex-col">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CCFF00] text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">Best Value</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pro Artist</h3>
                  <div className="text-5xl font-bold text-white mb-8">{billingCycle === 'monthly' ? '$10' : '$8'}<span className="text-lg text-zinc-600 font-medium">/artist/mo</span></div>
                  <button onClick={() => openAuth('signup')} className="w-full py-4 rounded-xl bg-[#CCFF00] text-black font-bold mb-8 hover:bg-[#e2ff5e] transition-all shadow-lg shadow-[#CCFF00]/20">Get Pro Access</button>
                  <ul className="space-y-4 text-sm text-zinc-300 flex-1">
                     {['Unlimited Generations', 'Access to all tools and brushes', 'Portfolio and Client Management', 'Priority Access To Community waitlist', 'Priority Support'].map(feature => (
                        <li key={feature} className="flex gap-3 items-center"><div className="bg-[#CCFF00] rounded-full p-0.5 text-black"><Check size={10} /></div> {feature}</li>
                     ))}
                  </ul>
               </div>

               {/* Studio */}
               <div className="p-8 rounded-[32px] border border-zinc-800 bg-[#050505] flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">Studio</h3>
                  <div className="text-4xl font-bold text-white mb-6">{billingCycle === 'monthly' ? '$49' : '$39'}<span className="text-lg text-zinc-600 font-medium">/mo</span></div>
                  <button onClick={() => openAuth('signup')} className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold mb-8 hover:bg-zinc-800 transition-all">Contact Sales</button>
                  <ul className="space-y-4 text-sm text-zinc-400 flex-1">
                     {['Everything in Pro', 'Team Collaboration', '1:1 Support for building anything custom'].map(feature => (
                        <li key={feature} className="flex gap-3 items-center"><Check size={16} className="text-zinc-600" /> {feature}</li>
                     ))}
                  </ul>
               </div>

            </div>
         </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-20 px-6 bg-black border-t border-zinc-900 text-sm">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 md:col-span-1 space-y-4">
               <img src={LOGO_URL} alt="Inkara" className="h-6 opacity-100" />
               <p className="text-zinc-500 leading-relaxed max-w-xs">
                  The future of body arts. 
                  Designed in India.
               </p>
            </div>
            
            {[
               { title: "Product", links: ["Features", "Pricing", "Download", "Changelog"] },
               { title: "Resources", links: ["Community", "Help Center", "Blog", "Tutorials"] },
               { title: "Legal", links: ["Privacy", "Terms", "Security"] },
            ].map((col, i) => (
               <div key={i}>
                  <h4 className="text-white font-bold mb-6">{col.title}</h4>
                  <ul className="space-y-4 text-zinc-500">
                     {col.links.map(link => (
                        <li key={link}><a href="#" className="hover:text-[#CCFF00] transition-colors">{link}</a></li>
                     ))}
                  </ul>
               </div>
            ))}
         </div>
         
         <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-600">
            <span>© 2025 Inkara Inc. All rights reserved.</span>
            <div className="flex gap-6">
               <Globe size={16} className="hover:text-white cursor-pointer transition-colors" />
               <Box size={16} className="hover:text-white cursor-pointer transition-colors" />
            </div>
         </div>
      </footer>
      
      <style>{`
        .sketch-stroke {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 5s cubic-bezier(0.45, 0, 0.55, 1) forwards;
        }

        .sketch-cursor {
          offset-path: path("${owlPath}");
          animation: move 5s cubic-bezier(0.45, 0, 0.55, 1) forwards;
        }

        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes move {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }

        @keyframes scan {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 120%; opacity: 0; }
        }

        .animate-scan {
          animation: scan 1.5s linear forwards;
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          box-shadow: 0 0 15px 2px rgba(168, 85, 247, 0.6);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
