
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Check, X, ZoomIn, ZoomOut, Wrench, 
  Image as ImageIcon, Move, MousePointer2, Layers, Eye, 
  EyeOff, Trash2, Copy, Lock, Unlock, Folder, ChevronDown, 
  ChevronRight, MoreHorizontal, ArrowUp, ArrowDown, Merge,
  Wand2, Sliders, Activity, RotateCcw, Eraser, Brush, Paintbrush,
  Lasso, Scissors, Copy as CopyIcon, Ban, Clipboard, ClipboardCopy,
  Palette, Cloud, Pencil, PenTool, Maximize2, Upload, Download, Share2,
  Save, AlertTriangle, Clock, Sparkles, CheckCircle2, Circle
} from 'lucide-react';
import { generateTattooDesign } from '../services/gemini';

// --- Types ---
interface CanvasConfig {
  name: string;
  width: number;
  height: number;
}

interface Layer {
  id: string;
  type: 'image' | 'group';
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-100
  blendMode: GlobalCompositeOperation;
  
  // Image specific
  image?: HTMLImageElement | HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Group specific
  children?: Layer[]; 
  collapsed?: boolean;
}

interface SerializedLayer extends Omit<Layer, 'image' | 'children'> {
  imageBase64?: string;
  children?: SerializedLayer[];
}

interface SavedProject {
  id: string;
  name: string;
  lastModified: number;
  thumbnail: string;
  config: CanvasConfig;
  layers: SerializedLayer[];
}

interface Point {
  x: number;
  y: number;
}

// --- Geometry Helpers ---
const distance = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
const angleBetween = (p1: Point, p2: Point) => Math.atan2(p2.y - p1.y, p2.x - p1.x);
const rotatePoint = (x: number, y: number, cx: number, cy: number, angle: number) => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: cx + (x - cx) * cos - (y - cy) * sin,
    y: cy + (x - cx) * sin + (y - cy) * cos
  };
};

// --- Color Helpers ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const hsbToHex = (h: number, s: number, b: number) => {
  s /= 100;
  b /= 100;
  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
};

// --- Serialization Helpers ---
const serializeLayers = (layers: Layer[]): SerializedLayer[] => {
  return layers.map(layer => {
    const { image, children, ...rest } = layer; // Destructure image to exclude it
    const serialized: SerializedLayer = {
      ...rest,
      children: children ? serializeLayers(children) : undefined
    };

    if (image) {
      if (image instanceof HTMLCanvasElement) {
        serialized.imageBase64 = image.toDataURL();
      } else if (image instanceof HTMLImageElement) {
        const c = document.createElement('canvas');
        c.width = image.width;
        c.height = image.height;
        c.getContext('2d')?.drawImage(image, 0, 0);
        serialized.imageBase64 = c.toDataURL();
      }
    }
    return serialized;
  });
};

const deserializeLayers = async (serializedLayers: SerializedLayer[]): Promise<Layer[]> => {
  const layers: Layer[] = [];
  for (const sLayer of serializedLayers) {
    const layer: Layer = {
      ...sLayer,
      image: undefined, // Will be set below
      children: sLayer.children ? await deserializeLayers(sLayer.children) : undefined
    } as any;

    if (sLayer.imageBase64) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          layer.image = img;
          resolve();
        };
        img.src = sLayer.imageBase64!;
      });
    }
    layers.push(layer);
  }
  return layers;
};


const PRESETS: CanvasConfig[] = [
  { name: 'A4 Paper', width: 2480, height: 3508 },
  { name: 'A3 Paper', width: 3508, height: 4960 }, 
  { name: 'Screen (HD)', width: 1920, height: 1080 },
  { name: 'Square (2k)', width: 2048, height: 2048 },
];

const BLEND_MODES: { label: string; value: GlobalCompositeOperation; short: string }[] = [
  { label: 'Normal', value: 'source-over', short: 'N' },
  { label: 'Darken', value: 'darken', short: 'D' },
  { label: 'Multiply', value: 'multiply', short: 'M' },
  { label: 'Color Burn', value: 'color-burn', short: 'B' },
  { label: 'Lighten', value: 'lighten', short: 'L' },
  { label: 'Screen', value: 'screen', short: 'S' },
  { label: 'Color Dodge', value: 'color-dodge', short: 'CD' },
  { label: 'Overlay', value: 'overlay', short: 'O' },
  { label: 'Soft Light', value: 'soft-light', short: 'SL' },
  { label: 'Hard Light', value: 'hard-light', short: 'HL' },
  { label: 'Difference', value: 'difference', short: 'Dif' },
  { label: 'Exclusion', value: 'exclusion', short: 'X' },
  { label: 'Hue', value: 'hue', short: 'H' },
  { label: 'Saturation', value: 'saturation', short: 'Sat' },
  { label: 'Color', value: 'color', short: 'C' },
  { label: 'Luminosity', value: 'luminosity', short: 'Lum' },
];

const CanvasFeature: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const [activeConfig, setActiveConfig] = useState<CanvasConfig | null>(null);
  const [initialLayers, setInitialLayers] = useState<Layer[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customWidth, setCustomWidth] = useState(2048);
  const [customHeight, setCustomHeight] = useState(2048);

  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Load Projects + Auto-Load Session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ink_dream_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }

      // Auto-load session if no active config yet
      const savedSession = localStorage.getItem('ink_session_canvas');
      if (savedSession && !activeConfig) {
         const session = JSON.parse(savedSession);
         if (session.config && session.layers) {
            // Restore session logic
            deserializeLayers(session.layers).then(layers => {
                setInitialLayers(layers);
                setActiveConfig(session.config);
                setCurrentProjectId(session.projectId || null);
            });
         }
      }

    } catch (e) {
      console.error("Failed to load projects/session", e);
    }
  }, []); // Run once

  const handleCreateCustom = () => {
    setActiveConfig({
      name: 'Custom Canvas',
      width: Number(customWidth),
      height: Number(customHeight)
    });
    setInitialLayers([]);
    setCurrentProjectId(null);
    setShowCustomModal(false);
    localStorage.removeItem('ink_session_canvas'); // Clear previous auto-save when starting fresh
  };

  const handleLoadProject = async (project: SavedProject) => {
    setIsLoadingProject(true);
    try {
      const layers = await deserializeLayers(project.layers);
      setInitialLayers(layers);
      setActiveConfig(project.config);
      setCurrentProjectId(project.id);
      localStorage.removeItem('ink_session_canvas'); // Switch context to project
    } catch (e) {
      console.error("Failed to load project layers", e);
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      const updated = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem('ink_dream_projects', JSON.stringify(updated));
    }
  };

  if (!activeConfig) {
    return (
      <div className="flex-1 h-full bg-[#09090b] flex flex-col p-6 md:p-12 relative overflow-hidden font-sans text-zinc-200 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
         <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none" />
         
         <div className="flex items-center gap-4 mb-8 z-10">
            <button 
              onClick={() => onNavigate?.('home')} 
              className="group p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors border border-zinc-800 flex items-center justify-center"
              title="Back to Home"
            >
               <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
               <h1 className="text-3xl font-bold text-white">Canvas Studio</h1>
               <p className="text-zinc-500 text-sm mt-1">Create new artwork or resume editing</p>
            </div>
         </div>

         {/* Recent Projects Section */}
         {savedProjects.length > 0 && (
           <div className="mb-12 z-10">
              <h2 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Clock size={18} /> Recent Projects
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {savedProjects.map(project => (
                  <div 
                    key={project.id}
                    onClick={() => handleLoadProject(project)}
                    className="group relative aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-[#CCFF00]/50 transition-all cursor-pointer"
                  >
                     {isLoadingProject && currentProjectId === project.id ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur z-20">
                         <div className="w-6 h-6 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin"/>
                       </div>
                     ) : null}
                     <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                     <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        <p className="text-[10px] text-zinc-400">{new Date(project.lastModified).toLocaleDateString()}</p>
                     </div>
                     <button 
                       onClick={(e) => handleDeleteProject(e, project.id)}
                       className="absolute top-2 right-2 p-1.5 bg-black/50 text-zinc-400 hover:text-red-400 hover:bg-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
                ))}
              </div>
           </div>
         )}

         <div className="max-w-6xl mx-auto w-full z-10">
            <h2 className="text-lg font-semibold text-zinc-300 mb-4">Start New</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <button 
                 onClick={() => setShowCustomModal(true)}
                 className="aspect-[3/4] rounded-3xl border-2 border-dashed border-zinc-800 hover:border-[#CCFF00] hover:bg-zinc-900/50 transition-all flex flex-col items-center justify-center gap-4 group"
               >
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-[#CCFF00] group-hover:scale-110 transition-transform border border-zinc-800">
                     <Plus size={32} />
                  </div>
                  <span className="font-medium text-zinc-500 group-hover:text-zinc-300">Custom Size</span>
               </button>

               {PRESETS.map(preset => (
                  <button 
                    key={preset.name}
                    onClick={() => {
                      setActiveConfig(preset);
                      setInitialLayers([]);
                      setCurrentProjectId(null);
                      localStorage.removeItem('ink_session_canvas'); // Clear previous session
                    }}
                    className="aspect-[3/4] bg-[#121212] border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-end relative overflow-hidden group hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/50 transition-all active:scale-[0.98]"
                  >
                     <div 
                        className="absolute top-12 bottom-24 left-10 right-10 bg-white shadow-2xl shadow-black/50 transition-transform duration-500 group-hover:-translate-y-4 group-hover:rotate-1"
                        style={{ aspectRatio: `${preset.width}/${preset.height}` }}
                     />
                     <div className="relative z-10 text-center w-full">
                        <h3 className="font-bold text-white text-lg mb-1">{preset.name}</h3>
                        <div className="flex items-center justify-center gap-2">
                           <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-mono">
                              {preset.width} &times; {preset.height}
                           </span>
                        </div>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         {showCustomModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
               <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-white">Custom Canvas</h3>
                 <button onClick={() => setShowCustomModal(false)} className="text-zinc-500 hover:text-white">
                   <X size={20} />
                 </button>
               </div>
               <div className="p-6 space-y-4">
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-zinc-400 uppercase">Width (px)</label>
                   <input 
                      type="number" 
                      value={customWidth} 
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#CCFF00] focus:outline-none"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-zinc-400 uppercase">Height (px)</label>
                   <input 
                      type="number" 
                      value={customHeight} 
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#CCFF00] focus:outline-none"
                   />
                 </div>
               </div>
               <div className="p-6 pt-2">
                 <button 
                   onClick={handleCreateCustom}
                   className="w-full py-3 bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                 >
                   Create Canvas <Check size={18} />
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <CanvasWorkspace 
      config={activeConfig} 
      initialLayers={initialLayers}
      projectId={currentProjectId}
      onBack={() => {
        setActiveConfig(null);
        setInitialLayers([]);
        setCurrentProjectId(null);
      }} 
    />
  );
};

interface CanvasWorkspaceProps {
  config: CanvasConfig;
  initialLayers: Layer[];
  projectId: string | null;
  onBack: () => void;
}

const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ config, initialLayers, projectId, onBack }) => {
   const containerRef = useRef<HTMLDivElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // --- Core State ---
   const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 0.15 });
   const [layers, setLayers] = useState<Layer[]>(initialLayers);
   const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
   const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
   
   // Saving & Dirty State
   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
   const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);
   const [showExitDialog, setShowExitDialog] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   // Clipboard State
   const [clipboard, setClipboard] = useState<{
      image: HTMLCanvasElement;
      width: number;
      height: number;
      opacity: number;
      blendMode: GlobalCompositeOperation;
   } | null>(null);

   // --- Tool State ---
   const [activeTool, setActiveTool] = useState<'move' | 'brush' | 'eraser' | 'selection'>('move');
   
   // --- Brush / Eraser State ---
   const [brushSize, setBrushSize] = useState(20);
   const [brushOpacity, setBrushOpacity] = useState(100);
   const [brushColor, setBrushColor] = useState('#000000');
   const [activeBrush, setActiveBrush] = useState<'soft' | 'hard' | 'pencil' | 'clouds'>('soft');
   const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
   
   const [eraserSize, setEraserSize] = useState(50);
   const [eraserOpacity, setEraserOpacity] = useState(100);
   
   const [showBrushLibrary, setShowBrushLibrary] = useState(false);
   const [brushCategory, setBrushCategory] = useState<'sketching' | 'airbrushing' | 'elements'>('airbrushing');
   
   // --- Selection State ---
   const [selectionPath, setSelectionPath] = useState<Point[]>([]);
   const [isSelectionActive, setIsSelectionActive] = useState(false);
   const [selectionInverted, setSelectionInverted] = useState(false);

   // --- Imagine Tool State ---
   const [isImagineModalOpen, setIsImagineModalOpen] = useState(false);
   const [imaginePrompt, setImaginePrompt] = useState('');
   const [isGeneratingImagine, setIsGeneratingImagine] = useState(false);

   // --- UI State ---
   const [isActionsOpen, setIsActionsOpen] = useState(false);
   const [isAdjustOpen, setIsAdjustOpen] = useState(false);
   const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
   const [openLayerSettingsId, setOpenLayerSettingsId] = useState<string | null>(null);
   
   // --- Adjustment State ---
   const [adjustMode, setAdjustMode] = useState<'none' | 'hsb' | 'curves'>('none');
   const [hsb, setHsb] = useState({ h: 0, s: 100, b: 0 }); 
   const [curvePoints, setCurvePoints] = useState<Point[]>([{x:0,y:255}, {x:255,y:0}]); 
   const [curvesPreview, setCurvesPreview] = useState<HTMLImageElement | null>(null);

   // --- Interaction State ---
   const [interactionMode, setInteractionMode] = useState<'none' | 'panning' | 'moving' | 'resizing' | 'rotating' | 'drawing' | 'selecting' | 'gesture'>('none');
   const activePointers = useRef<Map<number, Point>>(new Map());
   const gestureStartRef = useRef<{ dist: number, angle: number, center: Point, layerState: any } | null>(null);
   const dragStartRef = useRef<{ x: number, y: number } | null>(null);
   const activeHandleRef = useRef<string | null>(null);
   const initialLayerState = useRef<Record<string, {x: number, y: number, w: number, h: number, r: number}>>({});
   const lastPaintPointRef = useRef<{x: number, y: number} | null>(null);
   
   // --- Auto-Save Logic (on unmount or change) ---
   useEffect(() => {
     // Only run auto-save if layers exist
     if (layers.length > 0) {
         const autoSave = () => {
             try {
                 const serialized = serializeLayers(layers);
                 const sessionData = {
                     config,
                     layers: serialized,
                     projectId: currentProjectId,
                     timestamp: Date.now()
                 };
                 localStorage.setItem('ink_session_canvas', JSON.stringify(sessionData));
             } catch (e) {
                 console.warn("Auto-save failed (canvas too large)", e);
             }
         };
         
         // Debounce autosave
         const timeout = setTimeout(autoSave, 2000);
         
         // Save on unmount
         return () => {
             clearTimeout(timeout);
             autoSave();
         };
     }
   }, [layers, config, currentProjectId]);

   // --- Mark as Dirty on Change ---
   useEffect(() => {
     if (layers !== initialLayers) {
       setHasUnsavedChanges(true);
     }
   }, [layers, initialLayers]);

   // Initialize Viewport
   useEffect(() => {
      const vW = window.innerWidth;
      const vH = window.innerHeight;
      const padding = 80;
      const scale = Math.min((vW - padding)/config.width, (vH - padding)/config.height);
      setViewport({
         x: (vW - config.width * scale) / 2 / scale,
         y: (vH - config.height * scale) / 2 / scale,
         zoom: scale || 0.15
      });
   }, [config]);

   // --- Rendering Loop ---
   const renderTrigger = useRef(0);
   const forceRender = () => { renderTrigger.current++; setLayers(l => [...l]); };

   useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // 1. Clear
      ctx.clearRect(0, 0, config.width, config.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, config.width, config.height);

      // 2. Render Layers
      const renderLayer = (layer: Layer) => {
         if (!layer.visible) return;

         if (layer.type === 'group' && layer.children) {
            layer.children.forEach(child => renderLayer(child));
         } else if (layer.type === 'image' && layer.image) {
            ctx.save();
            
            // Apply Layer Opacity & Blend Mode
            ctx.globalAlpha = layer.opacity / 100;
            ctx.globalCompositeOperation = layer.blendMode;

            const cx = layer.x + layer.width / 2;
            const cy = layer.y + layer.height / 2;
            ctx.translate(cx, cy);
            ctx.rotate(layer.rotation);

            if (layer.id === activeLayerId) {
               if (adjustMode === 'hsb') {
                  ctx.filter = `hue-rotate(${hsb.h}deg) saturate(${hsb.s}%) brightness(${100 + hsb.b}%)`;
               }
               if (adjustMode === 'curves' && curvesPreview) {
                   ctx.drawImage(curvesPreview, -layer.width/2, -layer.height/2, layer.width, layer.height);
                   ctx.restore();
                   return; 
               }
            }

            try {
               ctx.drawImage(layer.image, -layer.width/2, -layer.height/2, layer.width, layer.height);
            } catch (e) { }
            
            ctx.restore();
         }
      };

      layers.forEach(layer => renderLayer(layer));

      // 3. Selection Overlay
      if (isSelectionActive && selectionPath.length > 2) {
         ctx.save();
         const pCanvas = document.createElement('canvas');
         pCanvas.width = 20; pCanvas.height = 20;
         const pCtx = pCanvas.getContext('2d');
         if (pCtx) {
            pCtx.fillStyle = '#00000055'; 
            pCtx.fillRect(0,0,20,20);
            pCtx.strokeStyle = '#ffffff33';
            pCtx.lineWidth = 2;
            pCtx.beginPath();
            pCtx.moveTo(0, 20); pCtx.lineTo(20, 0);
            pCtx.stroke();
         }
         
         const pattern = ctx.createPattern(pCanvas, 'repeat');
         if (pattern) {
            ctx.beginPath();
            if (!selectionInverted) {
               ctx.rect(0,0,config.width, config.height); 
               ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
               for(let i=1; i<selectionPath.length; i++) ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
               ctx.closePath();
               ctx.globalCompositeOperation = 'source-over';
               ctx.fillStyle = pattern;
               ctx.fill('evenodd');
            } else {
               ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
               for(let i=1; i<selectionPath.length; i++) ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
               ctx.closePath();
               ctx.fillStyle = pattern;
               ctx.fill();
            }
         }
         
         ctx.beginPath();
         ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
         for(let i=1; i<selectionPath.length; i++) ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
         ctx.closePath();
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 2 / viewport.zoom;
         ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom]);
         ctx.lineDashOffset = Date.now() / 20; 
         ctx.stroke();
         ctx.strokeStyle = '#000';
         ctx.lineDashOffset = (Date.now() / 20) + 5;
         ctx.stroke();
         ctx.restore();
      }

      // 4. Tools Overlay (Transform Box)
      const renderToolOverlay = (layer: Layer) => {
         if ((activeLayerId === layer.id || multiSelectedIds.has(layer.id)) && adjustMode === 'none') {
            ctx.save();
            if (activeTool === 'move') {
                const cx = layer.x + layer.width/2;
                const cy = layer.y + layer.height/2;
                const tl = rotatePoint(layer.x, layer.y, cx, cy, layer.rotation);
                const tr = rotatePoint(layer.x + layer.width, layer.y, cx, cy, layer.rotation);
                const bl = rotatePoint(layer.x, layer.y + layer.height, cx, cy, layer.rotation);
                const br = rotatePoint(layer.x + layer.width, layer.y + layer.height, cx, cy, layer.rotation);
                const rotHandle = rotatePoint(cx, layer.y - 30 / viewport.zoom, cx, cy, layer.rotation);
                const topMid = rotatePoint(cx, layer.y, cx, cy, layer.rotation);

                ctx.beginPath();
                ctx.moveTo(tl.x, tl.y); ctx.lineTo(tr.x, tr.y); ctx.lineTo(br.x, br.y); ctx.lineTo(bl.x, bl.y); ctx.closePath();
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2 / viewport.zoom; ctx.stroke();

                if (activeLayerId === layer.id && !layer.locked) {
                    ctx.beginPath(); ctx.moveTo(topMid.x, topMid.y); ctx.lineTo(rotHandle.x, rotHandle.y); ctx.strokeStyle = '#3b82f6'; ctx.stroke();
                    const handleSize = 10 / viewport.zoom; 
                    const drawHandle = (p: Point, color = '#fff') => {
                        ctx.beginPath(); ctx.arc(p.x, p.y, handleSize/2, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#3b82f6'; ctx.stroke();
                    };
                    drawHandle(tl); drawHandle(tr); drawHandle(bl); drawHandle(br); drawHandle(rotHandle, '#CCFF00');
                }
            } else if (interactionMode !== 'drawing' && activeTool !== 'selection' && !isSelectionActive) {
               const cx = layer.x + layer.width/2;
               const cy = layer.y + layer.height/2;
               ctx.translate(cx, cy);
               ctx.rotate(layer.rotation);
               ctx.strokeStyle = '#3b82f655';
               ctx.lineWidth = 1 / viewport.zoom;
               ctx.strokeRect(-layer.width/2, -layer.height/2, layer.width, layer.height);
            }
            ctx.restore();
         }
         if (layer.type === 'group' && layer.children) layer.children.forEach(renderToolOverlay);
      };
      layers.forEach(renderToolOverlay);

   }, [layers, activeLayerId, multiSelectedIds, viewport, config, adjustMode, hsb, curvesPreview, activeTool, interactionMode, renderTrigger.current, selectionPath, isSelectionActive, selectionInverted]);

   // Animation Loop
   useEffect(() => {
      if (isSelectionActive) {
         let animId: number;
         const animate = () => { renderTrigger.current++; setLayers(l => [...l]); animId = requestAnimationFrame(animate); };
         animId = requestAnimationFrame(animate);
         return () => cancelAnimationFrame(animId);
      }
   }, [isSelectionActive]);

   // --- Layer Management ---
   const addLayer = (img?: HTMLImageElement | HTMLCanvasElement) => {
      // If no img provided, create blank canvas
      let newImg = img;
      if (!newImg) {
          const c = document.createElement('canvas');
          c.width = config.width; c.height = config.height;
          newImg = c;
      }

      const aspectRatio = newImg.width / newImg.height;
      const newWidth = img ? Math.min(config.width * 0.8, newImg.width) : config.width;
      const newHeight = img ? newWidth / aspectRatio : config.height;
      
      const newLayer: Layer = {
         id: Math.random().toString(36).substr(2, 9),
         type: 'image',
         name: img ? 'Image Layer' : `Layer ${layers.length + 1}`,
         visible: true,
         locked: false,
         opacity: 100,
         blendMode: 'source-over',
         image: newImg,
         x: (config.width - newWidth) / 2,
         y: (config.height - newHeight) / 2,
         width: newWidth,
         height: newHeight,
         rotation: 0
      };

      setLayers([...layers, newLayer]); 
      setActiveLayerId(newLayer.id);
      setIsActionsOpen(false);
      if (!img) setActiveTool('brush'); 
   };

   const updateLayer = (id: string, updates: Partial<Layer>) => {
      setLayers(prev => prev.map(l => {
         if (l.id === id) return { ...l, ...updates };
         if (l.children) {
            const updateChildren = (children: Layer[]): Layer[] => children.map(child => {
               if (child.id === id) return { ...child, ...updates };
               if (child.children) return { ...child, children: updateChildren(child.children) };
               return child;
            });
            return { ...l, children: updateChildren(l.children) };
         }
         return l;
      }));
   };

   const deleteLayer = (id: string) => {
      const recursiveDelete = (list: Layer[]): Layer[] => list.filter(l => l.id !== id).map(l => ({ ...l, children: l.children ? recursiveDelete(l.children) : undefined }));
      setLayers(prev => recursiveDelete(prev));
      if (activeLayerId === id) setActiveLayerId(null);
   };

   const toggleLayerSelection = (id: string) => {
     setMultiSelectedIds(prev => {
       const newSet = new Set(prev);
       if (newSet.has(id)) {
         newSet.delete(id);
       } else {
         newSet.add(id);
         // Also ensure current active layer is included if we are starting a multi-select
         if (activeLayerId && activeLayerId !== id && !newSet.has(activeLayerId)) {
            newSet.add(activeLayerId);
         }
       }
       return newSet;
     });
   };

   // --- Imagine Tool Handlers ---
   const handleImagineGenerate = async () => {
     if (!imaginePrompt.trim()) return;
     setIsGeneratingImagine(true);

     try {
       // Gather all selected layers (active + multi-selected)
       const selectedRefs: string[] = [];
       const idsToProcess = new Set(multiSelectedIds);
       if (activeLayerId) idsToProcess.add(activeLayerId);

       layers.forEach(l => {
         if (idsToProcess.has(l.id) && l.image && l.visible) {
           let base64 = '';
           if (l.image instanceof HTMLCanvasElement) {
              base64 = l.image.toDataURL().split(',')[1];
           } else {
              const c = document.createElement('canvas');
              c.width = l.image.width;
              c.height = l.image.height;
              c.getContext('2d')?.drawImage(l.image, 0, 0);
              base64 = c.toDataURL().split(',')[1];
           }
           selectedRefs.push(base64);
         }
       });

       // Call service with count 1 for canvas insertion
       const results = await generateTattooDesign(imaginePrompt, selectedRefs, 1);
       const result = results[0]; // Take first result

       const img = new Image();
       img.onload = () => {
          addLayer(img);
       };
       img.src = `data:image/png;base64,${result}`;
       
       setIsImagineModalOpen(false);
       setImaginePrompt('');
       // Clear selection after generate to show new layer
       setMultiSelectedIds(new Set());

     } catch (e) {
       console.error("Imagine generation failed", e);
       alert("Failed to generate image. Please try again.");
     } finally {
       setIsGeneratingImagine(false);
     }
   };


   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Convert to canvas immediately for editable capability
            const c = document.createElement('canvas');
            c.width = img.width;
            c.height = img.height;
            const ctx = c.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            addLayer(c);
        }
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
   };

   // --- Cut / Copy / Paste ---
   const getActiveLayerCanvas = (): HTMLCanvasElement | null => {
      if (!activeLayerId) return null;
      const layer = layers.find(l => l.id === activeLayerId);
      if (!layer || !layer.image || layer.type !== 'image') return null;
      
      if (layer.image instanceof HTMLCanvasElement) return layer.image;
      
      const c = document.createElement('canvas');
      c.width = layer.image.width;
      c.height = layer.image.height;
      c.getContext('2d')?.drawImage(layer.image, 0, 0);
      return c;
   };

   const handleCopy = () => {
      const sourceCanvas = getActiveLayerCanvas();
      if (!sourceCanvas) return;
      const layer = layers.find(l => l.id === activeLayerId);

      const copyCanvas = document.createElement('canvas');
      copyCanvas.width = sourceCanvas.width;
      copyCanvas.height = sourceCanvas.height;
      const ctx = copyCanvas.getContext('2d');
      
      if (ctx) {
          if (isSelectionActive && selectionPath.length > 2) {
             ctx.drawImage(sourceCanvas, 0, 0);
          } else {
             ctx.drawImage(sourceCanvas, 0, 0);
          }
      }
      
      setClipboard({
         image: copyCanvas,
         width: sourceCanvas.width,
         height: sourceCanvas.height,
         opacity: layer?.opacity ?? 100,
         blendMode: layer?.blendMode ?? 'source-over'
      });
      setIsActionsOpen(false);
   };

   const handleCut = () => {
      handleCopy();
      if (!activeLayerId) return;
      // Clear the source
      const layer = layers.find(l => l.id === activeLayerId);
      if (layer && layer.image) {
          let canvas: HTMLCanvasElement;
          if (layer.image instanceof HTMLCanvasElement) canvas = layer.image;
          else {
             canvas = document.createElement('canvas');
             canvas.width = layer.image.width; canvas.height = layer.image.height;
             canvas.getContext('2d')?.drawImage(layer.image, 0, 0);
             updateLayer(layer.id, { image: canvas });
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.globalCompositeOperation = 'destination-out';
             ctx.fillRect(0,0, canvas.width, canvas.height); 
             ctx.globalCompositeOperation = 'source-over';
          }
          forceRender();
      }
   };

   const handlePaste = () => {
      if (!clipboard) return;
      
      const newCanvas = document.createElement('canvas');
      newCanvas.width = clipboard.width;
      newCanvas.height = clipboard.height;
      newCanvas.getContext('2d')?.drawImage(clipboard.image, 0, 0);

      const newLayer: Layer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          name: 'Pasted Layer',
          visible: true,
          locked: false,
          opacity: clipboard.opacity,
          blendMode: clipboard.blendMode,
          image: newCanvas,
          x: config.width / 2 - clipboard.width / 2 + 20, // Offset slightly
          y: config.height / 2 - clipboard.height / 2 + 20,
          width: clipboard.width,
          height: clipboard.height,
          rotation: 0
      };
      
      setLayers([...layers, newLayer]);
      setActiveLayerId(newLayer.id);
      setIsActionsOpen(false);
   };
   
   const handleDownload = () => {
       const canvas = canvasRef.current;
       if(canvas) {
           const link = document.createElement('a');
           link.download = `ink-canvas-${Date.now()}.png`;
           link.href = canvas.toDataURL();
           link.click();
       }
   };

   const handleShare = async () => {
     const canvas = canvasRef.current;
     if(canvas && navigator.share) {
        canvas.toBlob(async (blob) => {
           if(blob) {
             const file = new File([blob], 'artwork.png', { type: 'image/png' });
             try {
               await navigator.share({
                 title: 'My InkDream Artwork',
                 files: [file]
               });
             } catch (e) { console.log("Share failed", e) }
           }
        });
     }
   };

   const handleSave = () => {
     if (!canvasRef.current) return;
     setIsSaving(true);

     // 1. Serialize Layers
     const serializedLayers = serializeLayers(layers);
     
     // 2. Create Thumbnail
     const thumbnail = canvasRef.current.toDataURL('image/jpeg', 0.5);

     // 3. Create Project Object
     const id = currentProjectId || Math.random().toString(36).substr(2, 9);
     const newProject: SavedProject = {
       id,
       name: config.name === 'Custom Canvas' ? `Untitled ${new Date().toLocaleTimeString()}` : `${config.name} Project`,
       lastModified: Date.now(),
       config,
       thumbnail,
       layers: serializedLayers
     };

     // 4. Save to Local Storage
     try {
       const existing = localStorage.getItem('ink_dream_projects');
       let projects: SavedProject[] = existing ? JSON.parse(existing) : [];
       
       // Remove old version if exists
       projects = projects.filter(p => p.id !== id);
       // Add new version to top
       projects.unshift(newProject);
       
       localStorage.setItem('ink_dream_projects', JSON.stringify(projects));
       
       setCurrentProjectId(id);
       setHasUnsavedChanges(false);
       localStorage.removeItem('ink_session_canvas'); // Project saved, no need for session backup
       
       // Optional: Show simple toast feedback
     } catch (e) {
       console.error("Save failed", e);
       alert("Failed to save project. Storage might be full.");
     } finally {
       setIsSaving(false);
     }
   };

   const handleExitAttempt = () => {
     if (hasUnsavedChanges) {
       setShowExitDialog(true);
     } else {
       onBack();
     }
   };


   // --- Coordinate Utils ---
   const getLayerLocalCoordinates = (layer: Layer, globalX: number, globalY: number) => {
      if (!layer.image) return { x: 0, y: 0 };
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      const dx = globalX - cx;
      const dy = globalY - cy;
      const r = -layer.rotation;
      const rx = dx * Math.cos(r) - dy * Math.sin(r);
      const ry = dx * Math.sin(r) + dy * Math.cos(r);
      const lx = rx + layer.width / 2;
      const ly = ry + layer.height / 2;
      const scaleX = layer.image.width / layer.width;
      const scaleY = layer.image.height / layer.height;
      return { x: lx * scaleX, y: ly * scaleY };
   };

   // --- Drawing / Painting Logic ---
   const performPaint = (layerId: string, currentPos: {x: number, y: number}) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !layer.image || layer.locked || !layer.visible) return;

      let canvas: HTMLCanvasElement;
      // Ensure we have a canvas
      if (layer.image instanceof HTMLCanvasElement) {
         canvas = layer.image;
      } else {
         // Convert Image to Canvas on first paint
         canvas = document.createElement('canvas');
         canvas.width = layer.image.width;
         canvas.height = layer.image.height;
         canvas.getContext('2d')?.drawImage(layer.image, 0, 0);
         layer.image = canvas; // Mutate reference for speed
         // Important: Schedule a state update so React knows this layer has changed type, 
         // though for painting performance we mostly rely on ref mutation + forceRender
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x: lx, y: ly } = getLayerLocalCoordinates(layer, currentPos.x, currentPos.y);
      
      ctx.save();
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      
      const scale = layer.image.width / layer.width;
      const size = (activeTool === 'eraser' ? eraserSize : brushSize) * scale;
      const opacity = (activeTool === 'eraser' ? eraserOpacity : brushOpacity) / 100;
      const color = hexToRgb(brushColor);
      
      // Interpolate points for smooth stroke
      const points = [];
      if (lastPaintPointRef.current) {
         const { x: lastX, y: lastY } = getLayerLocalCoordinates(layer, lastPaintPointRef.current.x, lastPaintPointRef.current.y);
         const dist = Math.hypot(lx - lastX, ly - lastY);
         const stepSize = Math.max(1, size * 0.1); 
         const steps = Math.ceil(dist / stepSize);
         
         for (let i = 1; i <= steps; i++) {
            points.push({
               x: lastX + (lx - lastX) * (i / steps),
               y: lastY + (ly - lastY) * (i / steps)
            });
         }
      } else {
         points.push({ x: lx, y: ly });
      }

      points.forEach(p => {
         ctx.beginPath();
         
         if (activeBrush === 'soft') {
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
            if (activeTool === 'eraser') {
               grad.addColorStop(0, `rgba(0,0,0,${opacity})`);
               grad.addColorStop(1, 'rgba(0,0,0,0)');
            } else {
               grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${opacity})`);
               grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
            }
            ctx.fillStyle = grad;
            ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
         } else if (activeBrush === 'clouds') {
             for(let k=0; k<5; k++) {
                const r = Math.random() * size;
                const a = Math.random() * 2 * Math.PI;
                const ox = Math.cos(a) * r;
                const oy = Math.sin(a) * r;
                const subSize = size * (0.2 + Math.random() * 0.5);
                ctx.beginPath();
                ctx.arc(p.x + ox, p.y + oy, subSize, 0, Math.PI*2);
                ctx.fillStyle = activeTool === 'eraser' 
                   ? `rgba(0,0,0,${opacity * 0.2})` 
                   : `rgba(${color.r},${color.g},${color.b},${opacity * 0.1})`;
                ctx.fill();
             }
         } else if (activeBrush === 'pencil') {
             ctx.arc(p.x, p.y, size * 0.1, 0, Math.PI * 2);
             ctx.fillStyle = activeTool === 'eraser' 
                ? `rgba(0,0,0,${opacity})` 
                : `rgba(${color.r},${color.g},${color.b},${opacity})`;
             ctx.fill();
         } else {
            ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = activeTool === 'eraser' 
               ? `rgba(0,0,0,${opacity})` 
               : `rgba(${color.r},${color.g},${color.b},${opacity})`;
            ctx.fill();
         }
      });

      ctx.restore();
      forceRender();
   };

   // --- Input Handlers ---
   const getCanvasCoordinates = (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
         x: (e.clientX - rect.left) / viewport.zoom - viewport.x,
         y: (e.clientY - rect.top) / viewport.zoom - viewport.y
      };
   };

   const handlePointerDown = (e: React.PointerEvent) => {
      if (adjustMode !== 'none') return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const { x, y } = getCanvasCoordinates(e);

      // Multi-touch
      if (activePointers.current.size === 2 && activeLayerId && activeTool === 'move') {
          setInteractionMode('gesture');
          const pts: Point[] = Array.from(activePointers.current.values());
          const layer = layers.find(l => l.id === activeLayerId);
          if (layer) {
             gestureStartRef.current = {
                 dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
                 angle: Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x),
                 center: { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y)/2 },
                 layerState: { ...layer }
             };
          }
          return;
      }

      if (activeTool === 'selection') {
         if (isSelectionActive) setIsSelectionActive(false);
         setSelectionPath([{x, y}]);
         setInteractionMode('selecting');
         return;
      }

      if ((activeTool === 'brush' || activeTool === 'eraser') && activeLayerId) {
         setInteractionMode('drawing');
         lastPaintPointRef.current = { x, y };
         performPaint(activeLayerId, { x, y });
         return;
      }

      if (activeTool === 'move') {
         // Handle Logic for handles/moving
         const layer = layers.find(l => l.id === activeLayerId);
         if (activeLayerId && layer && !layer.locked && layer.type === 'image') {
             const cx = layer.x + layer.width/2;
             const cy = layer.y + layer.height/2;
             const handleRadius = 30 / viewport.zoom;
             const handles = [
                { id: 'tl', p: rotatePoint(layer.x, layer.y, cx, cy, layer.rotation) },
                { id: 'tr', p: rotatePoint(layer.x + layer.width, layer.y, cx, cy, layer.rotation) },
                { id: 'bl', p: rotatePoint(layer.x, layer.y + layer.height, cx, cy, layer.rotation) },
                { id: 'br', p: rotatePoint(layer.x + layer.width, layer.y + layer.height, cx, cy, layer.rotation) },
                { id: 'rot', p: rotatePoint(cx, layer.y - 30/viewport.zoom, cx, cy, layer.rotation) }
             ];
             const hit = handles.find(h => Math.hypot(h.p.x - x, h.p.y - y) < handleRadius);
             if (hit) {
                setInteractionMode(hit.id === 'rot' ? 'rotating' : 'resizing');
                activeHandleRef.current = hit.id;
                dragStartRef.current = { x, y };
                initialLayerState.current = {}; // CRITICAL FIX: Clear previous state
                initialLayerState.current[layer.id] = { x: layer.x, y: layer.y, w: layer.width, h: layer.height, r: layer.rotation };
                return;
             }
         }

         // Hit Test Layer
         for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            if (!l.visible || l.locked) continue;
            const lx = rotatePoint(x, y, l.x + l.width/2, l.y + l.height/2, -l.rotation);
            if (lx.x >= l.x && lx.x <= l.x + l.width && lx.y >= l.y && lx.y <= l.y + l.height) {
               if (l.id !== activeLayerId && !multiSelectedIds.has(l.id)) {
                  setActiveLayerId(l.id);
                  // Don't clear multi-selection on single click if used to just drag, 
                  // but standard behavior is usually clear unless shift held.
                  // For simplicity, we clear here to allow easy switching.
                  setMultiSelectedIds(new Set()); 
               }
               setInteractionMode('moving');
               dragStartRef.current = { x, y };
               initialLayerState.current = {}; // CRITICAL FIX: Clear previous state
               const ids = multiSelectedIds.has(l.id) ? Array.from(multiSelectedIds) : [l.id];
               ids.forEach(id => {
                  const item = layers.find(ll => ll.id === id);
                  if (item) initialLayerState.current[id] = { x: item.x, y: item.y, w: item.width, h: item.height, r: item.rotation };
               });
               return;
            }
         }
         setActiveLayerId(null);
      }
   };

   const handlePointerMove = (e: React.PointerEvent) => {
      if (activePointers.current.has(e.pointerId)) activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (interactionMode === 'gesture' && activePointers.current.size === 2) {
          const pts: Point[] = Array.from(activePointers.current.values());
          const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          const currentAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
          const center = { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y)/2 };
          const start = gestureStartRef.current;
          if (start && activeLayerId) {
              const scale = currentDist / start.dist;
              const dAngle = currentAngle - start.angle;
              const dx = (center.x - start.center.x) / viewport.zoom;
              const dy = (center.y - start.center.y) / viewport.zoom;
              updateLayer(activeLayerId, {
                 width: start.layerState.width * scale, height: start.layerState.height * scale, rotation: start.layerState.rotation + dAngle,
                 x: start.layerState.x + dx + (start.layerState.width * (1-scale))/2, y: start.layerState.y + dy + (start.layerState.height * (1-scale))/2
              });
          }
          return;
      }
      if (interactionMode === 'none') return;
      
      const { x, y } = getCanvasCoordinates(e);
      
      if (interactionMode === 'drawing' && activeLayerId) {
         performPaint(activeLayerId, { x, y });
         lastPaintPointRef.current = { x, y };
         return;
      }
      if (interactionMode === 'selecting') { setSelectionPath(prev => [...prev, {x, y}]); return; }
      
      if (!dragStartRef.current) return;
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      
      if (interactionMode === 'moving') {
          const keys = Object.keys(initialLayerState.current);
          setLayers(prev => prev.map(l => keys.includes(l.id) ? { ...l, x: initialLayerState.current[l.id].x + dx, y: initialLayerState.current[l.id].y + dy } : l));
      } else if (interactionMode === 'rotating' && activeLayerId) {
          const l = layers.find(i => i.id === activeLayerId);
          if (l) {
             const cx = l.x + l.width/2; const cy = l.y + l.height/2;
             updateLayer(activeLayerId, { rotation: Math.atan2(y - cy, x - cx) + Math.PI / 2 });
          }
      } else if (interactionMode === 'resizing' && activeLayerId) {
          setLayers(prev => prev.map(l => {
            if (l.id === activeLayerId) {
                const init = initialLayerState.current[l.id];
                if (!init) return l;
                const scale = Math.max(0.1, (init.w + dx) / init.w);
                return { ...l, width: init.w * scale, height: init.h * scale };
            }
            return l;
          }));
      }
   };

   const handlePointerUp = (e: React.PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (activePointers.current.size === 0) {
         if (interactionMode === 'selecting' && selectionPath.length > 2) setIsSelectionActive(true);
         setInteractionMode('none');
         lastPaintPointRef.current = null;
         gestureStartRef.current = null;
      }
   };

   return (
      <div className="fixed inset-0 z-[100] bg-[#121212] flex flex-col overflow-hidden touch-none">
         <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
         
         {/* Exit Confirmation Modal */}
         {showExitDialog && (
           <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
             <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
               <div className="flex items-center gap-3 mb-4 text-yellow-500">
                 <AlertTriangle size={24} />
                 <h3 className="text-lg font-bold text-white">Unsaved Changes</h3>
               </div>
               <p className="text-zinc-400 mb-6">
                 You have unsaved changes in your artwork. Do you want to save before leaving?
               </p>
               <div className="flex flex-col gap-2">
                 <button 
                   onClick={() => { handleSave(); setShowExitDialog(false); onBack(); }}
                   className="w-full py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b3e600] text-black font-bold"
                 >
                   Save & Exit
                 </button>
                 <button 
                   onClick={() => { setShowExitDialog(false); onBack(); }}
                   className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium"
                 >
                   Discard Changes
                 </button>
                 <button 
                   onClick={() => setShowExitDialog(false)}
                   className="w-full py-2 rounded-xl text-zinc-500 hover:text-zinc-300 text-sm"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Imagine Prompt Modal */}
         {isImagineModalOpen && (
            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-[#CCFF00]"/> 
                      Imagine
                    </h3>
                    <button onClick={() => setIsImagineModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Selection ({1 + multiSelectedIds.size})</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                       {/* Show thumbnails of selected layers */}
                       {layers.filter(l => (l.id === activeLayerId || multiSelectedIds.has(l.id)) && l.image).map(l => (
                          <div key={l.id} className="w-12 h-12 rounded bg-white flex-shrink-0 border border-zinc-700 overflow-hidden">
                             <img src={l.image instanceof HTMLCanvasElement ? l.image.toDataURL() : l.image?.src} className="w-full h-full object-cover" alt="ref" />
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Prompt</label>
                    <textarea 
                       value={imaginePrompt}
                       onChange={(e) => setImaginePrompt(e.target.value)}
                       placeholder="Describe what you want to generate based on these layers..."
                       className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-[#CCFF00] resize-none"
                    />
                 </div>

                 <button 
                   onClick={handleImagineGenerate}
                   disabled={isGeneratingImagine || !imaginePrompt}
                   className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                     ${isGeneratingImagine ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-[#CCFF00] hover:bg-[#b3e600] text-black'}
                   `}
                 >
                    {isGeneratingImagine ? (
                       <>Generating...</>
                    ) : (
                       <>Generate Layer <Sparkles size={16}/></>
                    )}
                 </button>
              </div>
            </div>
         )}

         {/* Top Toolbar */}
         <div className="h-14 bg-[#1c1c1e] border-b border-zinc-800 flex items-center justify-between px-4 z-50 shrink-0 shadow-md">
            <div className="flex items-center gap-4">
               <button onClick={handleExitAttempt} className="flex items-center gap-2 text-zinc-400 hover:text-white">
                  <ArrowLeft size={18} /> <span className="hidden md:inline">Gallery</span>
               </button>
               <div className="h-5 w-px bg-zinc-800" />
               
               <button onClick={() => {setIsActionsOpen(!isActionsOpen); setIsAdjustOpen(false);}} className={`p-2 rounded-lg ${isActionsOpen ? 'bg-[#CCFF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
                  <Wrench size={20} />
               </button>
               {isActionsOpen && (
                  <div className="absolute top-12 left-12 w-64 bg-[#1c1c1e] border border-zinc-800 rounded-xl shadow-xl z-50 py-2">
                     <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">General</div>
                     <button onClick={() => { addLayer(); setIsActionsOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><Plus size={14}/> Add Blank Layer</button>
                     <button onClick={() => { fileInputRef.current?.click(); setIsActionsOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><ImageIcon size={14}/> Import Image</button>
                     
                     <div className="my-2 border-t border-zinc-800" />
                     <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">Clipboard</div>
                     <button onClick={handleCut} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><Scissors size={14}/> Cut</button>
                     <button onClick={handleCopy} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"><CopyIcon size={14}/> Copy</button>
                     <button onClick={handlePaste} disabled={!clipboard} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 disabled:opacity-50"><Clipboard size={14}/> Paste</button>
                  </div>
               )}

               <button disabled={!activeLayerId} onClick={() => {setIsAdjustOpen(!isAdjustOpen); setIsActionsOpen(false);}} className={`p-2 rounded-lg ${isAdjustOpen ? 'bg-[#CCFF00] text-black' : 'text-zinc-400 hover:text-white disabled:opacity-30'}`}>
                  <Wand2 size={20} />
               </button>
               {isAdjustOpen && (
                  <div className="absolute top-12 left-24 w-56 bg-[#1c1c1e] border border-zinc-800 rounded-xl shadow-xl z-50 py-2">
                     <button onClick={() => {setAdjustMode('hsb'); setIsAdjustOpen(false);}} className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800">HSB Adjust</button>
                     <button onClick={() => {setAdjustMode('curves'); setIsAdjustOpen(false);}} className="w-full px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800">Curves</button>
                  </div>
               )}
               
               {/* Imagine Button - New! */}
               <button 
                 onClick={() => setIsImagineModalOpen(true)} 
                 className={`p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/30 hover:text-white hover:border-purple-400`}
                 title="Imagine / Generate"
               >
                   <Sparkles size={20} />
               </button>

               <div className="h-5 w-px bg-zinc-800" />

               <button onClick={() => { setActiveTool(activeTool === 'selection' ? 'move' : 'selection'); setSelectionPath([]); setIsSelectionActive(false); }} className={`p-2 rounded-lg ${activeTool === 'selection' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'}`}>
                   <Lasso size={20} />
               </button>

               <div className="h-5 w-px bg-zinc-800" />

               <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                  <button onClick={() => { setActiveTool('move'); setIsSelectionActive(false); }} className={`p-1.5 rounded ${activeTool === 'move' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                     <Move size={18} />
                  </button>
                  <button 
                     onClick={() => { 
                        if (activeTool === 'brush') setShowBrushLibrary(true); 
                        setActiveTool('brush'); setIsSelectionActive(false); 
                     }} 
                     className={`p-1.5 rounded ${activeTool === 'brush' ? 'bg-[#CCFF00] text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                     <Paintbrush size={18} />
                  </button>
                  <button onClick={() => { setActiveTool('eraser'); setIsSelectionActive(false); }} className={`p-1.5 rounded ${activeTool === 'eraser' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                     <Eraser size={18} />
                  </button>
               </div>
               
               <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg" title="Import Image">
                  <Upload size={20} />
               </button>
            </div>

            <div className="flex items-center gap-3">
               <button onClick={handleSave} className={`p-2 rounded-lg transition-colors ${isSaving ? 'text-[#CCFF00] animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`} title="Save Project">
                  <Save size={20} />
               </button>
               
               <button onClick={handleShare} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg" title="Share">
                  <Share2 size={20} />
               </button>

               <button onClick={handleDownload} className="p-2 text-zinc-400 hover:text-[#CCFF00] hover:bg-zinc-800 rounded-lg" title="Download PNG">
                  <Download size={20} />
               </button>
               
               {/* Color Picker */}
               <div className="relative">
                  <button 
                     onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                     className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                     style={{ backgroundColor: brushColor }}
                  />
                  {isColorPickerOpen && (
                     <div className="absolute top-10 right-0 w-64 bg-[#1c1c1e] border border-zinc-800 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 origin-top-right">
                        <div className="space-y-4">
                           <div 
                              className="w-full aspect-square rounded-lg relative cursor-crosshair overflow-hidden"
                              style={{ backgroundColor: brushColor }}
                           >
                              <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                           </div>
                           <input 
                              type="range" min="0" max="360" 
                              className="w-full h-3 rounded-full appearance-none cursor-pointer"
                              style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }}
                              onChange={(e) => setBrushColor(hsbToHex(Number(e.target.value), 100, 100))}
                           />
                           <div className="grid grid-cols-5 gap-2">
                              {['#000000', '#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316', '#ec4899', '#6366f1'].map(c => (
                                 <button key={c} onClick={() => setBrushColor(c)} className="w-full aspect-square rounded-full border border-zinc-700" style={{backgroundColor: c}} />
                              ))}
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               <button onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)} className={`p-2 rounded-lg transition-colors relative ${isLayersPanelOpen ? 'bg-[#CCFF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
                  <Layers size={20} />
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{layers.length}</span>
               </button>
            </div>
         </div>

         {/* Canvas Area */}
         <div className="flex-1 relative overflow-hidden flex">
            
            {/* Left Sidebar (Sliders) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-8 pointer-events-auto">
               {/* Size Slider */}
               <div className="group relative h-48 w-10 bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full flex flex-col justify-end items-center overflow-hidden">
                  <div 
                     className={`w-full transition-all ${activeTool === 'eraser' ? 'bg-blue-500' : 'bg-[#CCFF00]'}`}
                     style={{ height: `${activeTool === 'eraser' ? eraserSize : brushSize}%` }}
                  />
                  <input 
                     type="range" min="1" max="100" 
                     value={activeTool === 'eraser' ? eraserSize : brushSize} 
                     onChange={(e) => activeTool === 'eraser' ? setEraserSize(Number(e.target.value)) : setBrushSize(Number(e.target.value))}
                     className="absolute inset-0 opacity-0 cursor-ns-resize"
                  />
                  <div className="absolute top-2 text-[9px] font-bold text-white pointer-events-none shadow-black drop-shadow-md">SIZE</div>
               </div>
               
               {/* Opacity Slider */}
               <div className="group relative h-48 w-10 bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full flex flex-col justify-end items-center overflow-hidden">
                   <div 
                     className={`w-full transition-all ${activeTool === 'eraser' ? 'bg-blue-500' : 'bg-[#CCFF00]'}`}
                     style={{ height: `${activeTool === 'eraser' ? eraserOpacity : brushOpacity}%` }}
                  />
                  <input 
                     type="range" min="1" max="100" 
                     value={activeTool === 'eraser' ? eraserOpacity : brushOpacity} 
                     onChange={(e) => activeTool === 'eraser' ? setEraserOpacity(Number(e.target.value)) : setBrushOpacity(Number(e.target.value))}
                     className="absolute inset-0 opacity-0 cursor-ns-resize"
                  />
                  <div className="absolute top-2 text-[9px] font-bold text-white pointer-events-none shadow-black drop-shadow-md">OPAC</div>
               </div>
            </div>

            {/* Main Workspace */}
            <div 
               ref={containerRef}
               className={`flex-1 bg-[#0c0c0e] relative overflow-hidden ${activeTool === 'move' ? 'cursor-default' : 'cursor-crosshair'}`}
               onWheel={(e) => {
                  if (interactionMode !== 'none' || adjustMode !== 'none') return;
                  e.preventDefault();
                  if (e.ctrlKey) {
                     const newZoom = Math.max(0.05, Math.min(5, viewport.zoom - e.deltaY * 0.001));
                     setViewport(v => ({ ...v, zoom: newZoom }));
                  } else {
                     setViewport(v => ({ ...v, x: v.x - e.deltaX/v.zoom, y: v.y - e.deltaY/v.zoom }));
                  }
               }}
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerLeave={handlePointerUp}
            >
               {/* Loading Overlay for Imagine */}
               {isGeneratingImagine && (
                 <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-[#CCFF00] border-t-transparent rounded-full animate-spin mb-4"/>
                    <p className="text-white font-medium animate-pulse">Dreaming...</p>
                 </div>
               )}

               <div 
                  style={{
                     transform: `scale(${viewport.zoom}) translate(${viewport.x}px, ${viewport.y}px)`,
                     transformOrigin: 'top left',
                     width: config.width,
                     height: config.height,
                     boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                  }}
                  className="absolute top-0 left-0 bg-white"
               >
                  <canvas ref={canvasRef} width={config.width} height={config.height} className="w-full h-full block" />
               </div>
            </div>

            {/* Brush Library Modal */}
            {showBrushLibrary && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBrushLibrary(false)}>
                  <div className="bg-[#1c1c1e] border border-zinc-800 rounded-2xl w-[600px] h-[400px] overflow-hidden shadow-2xl flex" onClick={e => e.stopPropagation()}>
                     {/* Categories */}
                     <div className="w-40 border-r border-zinc-800 p-2 bg-[#151516]">
                        {['sketching', 'airbrushing', 'elements'].map(cat => (
                           <button 
                              key={cat}
                              onClick={() => setBrushCategory(cat as any)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-1 ${brushCategory === cat ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                     {/* Brushes */}
                     <div className="flex-1 p-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                           {brushCategory === 'airbrushing' && (
                              <>
                                 <button onClick={() => {setActiveBrush('soft'); setShowBrushLibrary(false);}} className={`p-3 rounded-xl border text-left ${activeBrush === 'soft' ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                                    <div className="w-10 h-10 rounded-full bg-gradient-radial from-white to-transparent mb-2 opacity-80" />
                                    <div className="text-sm font-bold text-white">Soft Airbrush</div>
                                 </button>
                                 <button onClick={() => {setActiveBrush('hard'); setShowBrushLibrary(false);}} className={`p-3 rounded-xl border text-left ${activeBrush === 'hard' ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                                    <div className="w-10 h-10 rounded-full bg-white mb-2" />
                                    <div className="text-sm font-bold text-white">Hard Airbrush</div>
                                 </button>
                              </>
                           )}
                           {brushCategory === 'elements' && (
                              <button onClick={() => {setActiveBrush('clouds'); setShowBrushLibrary(false);}} className={`p-3 rounded-xl border text-left ${activeBrush === 'clouds' ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                                 <div className="w-10 h-10 flex items-center justify-center mb-2 text-zinc-400"><Cloud size={24} /></div>
                                 <div className="text-sm font-bold text-white">Clouds</div>
                              </button>
                           )}
                           {brushCategory === 'sketching' && (
                              <button onClick={() => {setActiveBrush('pencil'); setShowBrushLibrary(false);}} className={`p-3 rounded-xl border text-left ${activeBrush === 'pencil' ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}>
                                 <div className="w-10 h-10 flex items-center justify-center mb-2 text-zinc-400"><Pencil size={24} /></div>
                                 <div className="text-sm font-bold text-white">6B Pencil</div>
                              </button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Selection Toolbar */}
            {activeTool === 'selection' && (
               <div className="absolute bottom-0 left-0 right-0 bg-[#1c1c1e] border-t border-zinc-800 p-3 z-50 animate-in slide-in-from-bottom-full">
                  <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
                     <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2">Freehand</div>
                     <div className="flex items-center gap-2">
                         <button onClick={() => setSelectionInverted(!selectionInverted)} disabled={!isSelectionActive} className="p-2 rounded-lg bg-zinc-800 text-zinc-200"><RotateCcw size={14} className="rotate-180" /></button>
                         <button onClick={() => { setSelectionPath([]); setIsSelectionActive(false); }} disabled={!isSelectionActive} className="p-2 rounded-lg bg-red-500/20 text-red-400"><Ban size={14} /></button>
                     </div>
                  </div>
               </div>
            )}

            {/* Layers Panel */}
            <div className={`absolute top-2 right-2 bottom-2 w-72 bg-[#1c1c1e]/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl transform transition-transform duration-300 flex flex-col z-50 ${isLayersPanelOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}>
               <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Layers</span>
                  <button onClick={() => addLayer()} className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400"><Plus size={16} /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {[...layers].reverse().map((layer) => (
                     <div 
                        key={layer.id}
                        className={`flex flex-col rounded-xl border overflow-hidden transition-all ${activeLayerId === layer.id ? 'border-blue-500/50 bg-[#2a2a2d]' : 'border-transparent bg-[#27272a]'}`}
                        onClick={() => { setActiveLayerId(layer.id); }}
                     >
                        <div className="flex items-center gap-2 p-2">
                           {/* Multi-Select Checkbox */}
                           <button 
                              onClick={(e) => { e.stopPropagation(); toggleLayerSelection(layer.id); }}
                              className="text-zinc-500 hover:text-[#CCFF00] transition-colors"
                           >
                              {multiSelectedIds.has(layer.id) || activeLayerId === layer.id ? (
                                <CheckCircle2 size={16} className="text-[#CCFF00]" />
                              ) : (
                                <Circle size={16} />
                              )}
                           </button>

                           {/* Visibility */}
                           <button 
                               onClick={(e) => {e.stopPropagation(); updateLayer(layer.id, {visible: !layer.visible})}} 
                               className="text-zinc-500 p-1 hover:text-white"
                           >
                               {layer.visible ? <Eye size={14}/> : <EyeOff size={14}/>}
                           </button>

                           {/* Blend Mode Toggle */}
                           <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenLayerSettingsId(openLayerSettingsId === layer.id ? null : layer.id);
                              }}
                              className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center border transition-colors ${openLayerSettingsId === layer.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'}`}
                           >
                              {BLEND_MODES.find(m => m.value === layer.blendMode)?.short || 'N'}
                           </button>

                           {/* Thumbnail */}
                           <div className="w-10 h-10 bg-white rounded overflow-hidden relative border border-zinc-700/50">
                              {layer.type === 'image' && layer.image && <img src={layer.image instanceof HTMLCanvasElement ? layer.image.toDataURL() : layer.image.src} className="w-full h-full object-cover"/>}
                           </div>
                           
                           {/* Name */}
                           <span className="text-xs font-medium text-zinc-300 truncate flex-1 select-none">{layer.name}</span>
                           
                           {/* Delete */}
                           {activeLayerId === layer.id && (
                               <button onClick={(e)=>{e.stopPropagation(); deleteLayer(layer.id)}} className="text-zinc-600 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                           )}
                        </div>

                        {/* Expanded Settings (Accordion) */}
                        {openLayerSettingsId === layer.id && (
                           <div 
                              className="p-3 bg-[#18181b] border-t border-zinc-800 space-y-3 animate-in slide-in-from-top-2"
                              onClick={(e) => e.stopPropagation()}
                           >
                              {/* Opacity */}
                              <div className="space-y-1">
                                 <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold">
                                    <span>Opacity</span>
                                    <span>{Math.round(layer.opacity)}%</span>
                                 </div>
                                 <input 
                                    type="range" min="0" max="100" 
                                    value={layer.opacity}
                                    onChange={(e) => updateLayer(layer.id, { opacity: Number(e.target.value) })}
                                    className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                 />
                              </div>
                              
                              {/* Blend Modes Grid */}
                              <div className="space-y-1">
                                 <div className="text-[10px] text-zinc-400 uppercase font-bold">Blending Mode</div>
                                 <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                    {BLEND_MODES.map(mode => (
                                       <button
                                          key={mode.value}
                                          onClick={() => updateLayer(layer.id, { blendMode: mode.value })}
                                          className={`px-1 py-1.5 text-[10px] text-center rounded truncate ${layer.blendMode === mode.value ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400'}`}
                                          title={mode.label}
                                       >
                                          {mode.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

         </div>
      </div>
   )
}

export default CanvasFeature;
