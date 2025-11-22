import React, { useRef } from 'react';
import { Camera, Upload, Plus, Image as ImageIcon, X } from 'lucide-react';
import { UploadedImage } from '../types';

interface UploadZoneProps {
  label: string;
  subLabel?: string;
  imageState: UploadedImage;
  onImageSelect: (file: File) => void;
  onClear: () => void;
  accept?: string;
  capture?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ 
  label, 
  subLabel,
  imageState, 
  onImageSelect, 
  onClear,
  accept = "image/*",
  capture = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="w-full h-full relative group cursor-pointer"
      onClick={!imageState.preview ? handleClick : undefined}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept={accept}
        capture={capture ? "environment" : undefined}
        className="hidden" 
        onChange={handleFileChange}
      />

      {imageState.preview ? (
        <div className="w-full h-full relative bg-black/40">
          <img 
            src={imageState.preview} 
            alt={label} 
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
          />
          
          {/* Floating Label */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-xs font-medium text-white">
            {label}
          </div>

          {/* Clear Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white border border-white/10 transition-colors z-10"
          >
            <X size={14} />
          </button>

          {/* Replace Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                <Upload size={20} />
              </div>
              <span className="text-sm font-medium">Click to Replace</span>
            </div>
          </div>
           <div 
             className="absolute inset-0" 
             onClick={handleClick}
           />
        </div>
      ) : (
        /* Empty State */
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 transition-colors duration-300 group-hover:bg-zinc-800/50">
          <div className="mb-4 p-4 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-xl group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-300 relative">
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
             {capture ? <Camera size={24} className="text-zinc-300" /> : <ImageIcon size={24} className="text-zinc-300" />}
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-1">{label}</h3>
          {subLabel && <p className="text-sm text-zinc-500">{subLabel}</p>}
          
          <div className="mt-6 px-4 py-2 bg-zinc-800/50 rounded-full text-xs font-medium text-zinc-400 border border-zinc-700 group-hover:border-zinc-600 group-hover:text-zinc-300 transition-colors flex items-center gap-2">
            <Plus size={12} />
            <span>Select Image</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
