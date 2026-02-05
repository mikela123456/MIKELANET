import React from 'react';

interface DashboardProps {
  onEnterGame: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEnterGame }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="relative w-full max-w-lg border border-[#00f3ff]/30 bg-black/60 backdrop-blur-xl p-1 shadow-[0_0_50px_rgba(0,243,255,0.15)] overflow-hidden">
        {/* Window Header Decor */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#00f3ff]/10 border-b border-[#00f3ff]/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#ff00ff] animate-pulse" />
            <span className="text-[10px] text-[#00f3ff] font-bold uppercase tracking-[0.2em]">
              Hra
            </span>
          </div>
          <div className="flex space-x-1">
            <div className="w-4 h-[1px] bg-[#00f3ff]/40" />
            <div className="w-2 h-2 rounded-full border border-[#00f3ff]/40" />
          </div>
        </div>

        {/* Action Area */}
        <div className="relative h-64 w-full flex flex-col items-center justify-center space-y-8 bg-black/40 overflow-hidden group">
          {/* Subtle background glitching */}
          <div className="absolute inset-0 opacity-5 pointer-events-none glitch-lines" />
          
          <div className="text-center z-10">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-[0.3em] mb-2 neon-glow-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              EXPEDICE GLITCH
            </h3>
          </div>

          <button 
            className="group relative px-12 py-4 border-2 border-[#00f3ff] bg-[#00f3ff]/5 hover:bg-[#00f3ff]/20 transition-all duration-300 active:scale-95"
            onClick={onEnterGame}
          >
            {/* Corner accents for button */}
            <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#ff00ff]" />
            <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#ff00ff]" />
            
            <span className="relative text-[#00f3ff] font-black uppercase tracking-[0.5em] text-sm neon-glow-cyan group-hover:text-white transition-colors">
              VSTOUPIT DO HRY
            </span>
            
            {/* Animated scanline on button */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="w-full h-[2px] bg-white/20 absolute -top-full group-hover:top-full transition-all duration-1000 ease-linear" />
            </div>
          </button>

          {/* Bottom status line */}
          <div className="absolute bottom-4 flex items-center space-x-4 opacity-30 text-[8px] text-white uppercase tracking-widest">
            <span>PING: 14MS</span>
            <span>SECURE_LINK: TRUE</span>
            <span>ENCRYPT: AES_256</span>
          </div>
        </div>

        {/* Outer Corner Decorations */}
        <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-2 border-l-2 border-[#00f3ff]" />
        <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-2 border-r-2 border-[#ff00ff]" />
      </div>

      <style>{`
        .glitch-lines {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 243, 255, 0.1) 2px,
            rgba(0, 243, 255, 0.1) 3px
          );
        }
      `}</style>
    </div>
  );
};