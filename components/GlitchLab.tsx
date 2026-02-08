import React, { useState, useMemo } from 'react';
import { glitchLib } from '../lib/GlitchPixelArt';
import { Download, Share2, Terminal, Code, Cpu, Github, Check } from 'lucide-react';

interface GlitchLabProps {
  onSyncAvatar?: (dataUrl: string) => void;
}

export const GlitchLab: React.FC<GlitchLabProps> = ({ onSyncAvatar }) => {
  const [seed, setSeed] = useState('ROOT_USER');
  const [glitch, setGlitch] = useState(7);
  const [size, setSize] = useState(16);
  const [isSynced, setIsSynced] = useState(false);

  const grid = useMemo(() => {
    return glitchLib.generatePixels(seed, { 
      size, 
      glitchLevel: glitch, 
      mirror: true 
    });
  }, [seed, glitch, size]);

  const handleDownload = () => {
    const url = glitchLib.generateDataUrl(grid, 20);
    const link = document.createElement('a');
    link.download = `glitch_${seed}.png`;
    link.href = url;
    link.click();
  };

  const handleSync = () => {
    if (onSyncAvatar) {
      const url = glitchLib.generateDataUrl(grid, 20);
      onSyncAvatar(url);
      setIsSynced(true);
      setTimeout(() => setIsSynced(false), 2000);
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-12 overflow-y-auto custom-scrollbar bg-[#050505] text-[#00f3ff] animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#00f3ff]/20 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code size={16} className="text-[#ff00ff]" />
              <span className="text-[10px] font-black tracking-widest uppercase opacity-50">Open Source Laboratory</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase neon-glow-cyan">GLITCH_GEN_v1.0</h2>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-2 text-[10px] font-bold border border-[#00f3ff]/20 px-4 py-2 hover:bg-[#00f3ff]/10 transition-all">
              <Github size={14} /> REPO
            </a>
            <div className="text-right hidden md:block">
              <span className="text-[8px] block opacity-40 uppercase">License</span>
              <span className="text-[10px] font-bold">MIT_STANDARD</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Controls */}
          <div className="space-y-8 bg-black/40 p-8 border border-[#00f3ff]/10 rounded-sm">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Terminal size={12} /> Input Seed
              </label>
              <input 
                type="text" 
                value={seed}
                onChange={(e) => {
                  setSeed(e.target.value);
                  setIsSynced(false);
                }}
                className="w-full bg-black border border-[#00f3ff]/30 p-4 text-[#00f3ff] focus:border-[#ff00ff] focus:outline-none font-mono text-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Glitch Intensity</label>
                <input 
                  type="range" min="0" max="10" value={glitch}
                  onChange={(e) => {
                    setGlitch(parseInt(e.target.value));
                    setIsSynced(false);
                  }}
                  className="w-full accent-[#ff00ff]"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Grid Resolution</label>
                <select 
                  value={size}
                  onChange={(e) => {
                    setSize(parseInt(e.target.value));
                    setIsSynced(false);
                  }}
                  className="w-full bg-black border border-[#00f3ff]/30 p-2 text-[#00f3ff] focus:outline-none text-xs"
                >
                  <option value="8">8x8 (Classic)</option>
                  <option value="16">16x16 (Standard)</option>
                  <option value="32">32x32 (Hardcore)</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex gap-4">
              <button 
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-[#ff00ff] text-black font-black uppercase tracking-widest hover:bg-[#00f3ff] transition-all"
              >
                <Download size={18} /> Export PNG
              </button>
              <button 
                onClick={handleSync}
                className={`px-6 border transition-all flex items-center justify-center ${isSynced ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-[#00f3ff]/40 hover:bg-[#00f3ff]/10 text-[#00f3ff]'}`}
                title="Synchronizovat s profilem"
              >
                {isSynced ? <Check size={18} /> : <Share2 size={18} />}
              </button>
            </div>
          </div>

          {/* Visualizer */}
          <div className="relative aspect-square bg-black border-2 border-[#00f3ff]/10 flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 tactical-grid opacity-10 pointer-events-none" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Cpu size={14} className="text-[#ff00ff] animate-pulse" />
              <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.3em]">Rendering_Buffer</span>
            </div>
            
            <div 
              className="grid gap-0 border border-white/5 shadow-[0_0_80px_rgba(0,243,255,0.1)]" 
              style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: '70%', height: '70%' }}
            >
              {grid.flat().map((color, i) => (
                <div key={i} style={{ 
                  backgroundColor: color,
                  boxShadow: color !== 'transparent' ? `0 0 10px ${color}66` : 'none'
                }} className="transition-colors duration-200" />
              ))}
            </div>

            {/* Overlay Info */}
            <div className="absolute bottom-4 right-4 text-right">
              <div className="text-[10px] font-black text-[#ff00ff] italic">SEED: {seed.toUpperCase()}</div>
              <div className="text-[8px] opacity-40">GLITCH_LOCKED // AES_256</div>
            </div>
          </div>

        </div>

        {/* Documentation / Code Snippet */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm space-y-4">
           <div className="flex items-center gap-2">
             <Code size={14} className="text-[#00f3ff]" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Library usage: GlitchPixelArt.ts</span>
           </div>
           <pre className="text-[10px] md:text-xs font-mono text-[#00f3ff]/60 overflow-x-auto p-4 bg-black/40">
{`// Install: npx glitch-gen-install
import { glitchLib } from './lib/GlitchPixelArt';

const pixels = glitchLib.generatePixels('${seed}', { 
  size: ${size}, 
  glitchLevel: ${glitch}, 
  mirror: true 
});

const dataUrl = glitchLib.generateDataUrl(pixels);
console.log("Avatar Generated Successfully.");`}
           </pre>
        </div>
      </div>

      <style>{`
        .tactical-grid {
          background-image: linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .neon-glow-cyan { text-shadow: 0 0 15px #00f3ff; }
      `}</style>
    </div>
  );
};