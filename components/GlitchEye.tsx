
import React from 'react';

export const GlitchEye: React.FC = () => {
  return (
    <div className="relative w-48 h-32 md:w-64 md:h-40 flex items-center justify-center">
      {/* Outer glitch elements */}
      <div className="absolute inset-0 bg-white/10 blur-xl animate-pulse" />
      
      {/* The Eye Container */}
      <div className="relative bg-white p-2 border-4 border-white overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.5)]">
        {/* Eye Shape */}
        <div className="w-32 h-20 md:w-48 md:h-28 bg-[#000000] flex items-center justify-center relative">
          {/* Iris */}
          <div className="w-16 h-16 md:w-24 md:h-24 bg-[#0066cc] rounded-full flex items-center justify-center border-4 border-white/20">
            {/* Pupil */}
            <div className="w-8 h-8 md:w-12 md:h-12 bg-black rounded-full" />
          </div>
          
          {/* Scanline overlay over the eye */}
          <div className="absolute inset-0 bg-black opacity-10 pointer-events-none" style={{ backgroundSize: '100% 4px', backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 50%, transparent 50%)' }} />
        </div>
        
        {/* Horizontal Glitch Strips */}
        <div className="absolute top-1/4 -left-10 w-full h-1 bg-cyan-400 opacity-70 animate-bounce" style={{ animationDuration: '0.2s' }} />
        <div className="absolute bottom-1/4 -right-10 w-full h-1 bg-pink-500 opacity-70 animate-bounce" style={{ animationDuration: '0.3s' }} />
      </div>

      {/* Decorative floating boxes */}
      <div className="absolute -top-4 -left-8 w-6 h-2 bg-[#ff00ff] animate-pulse" />
      <div className="absolute -bottom-4 -right-8 w-8 h-3 bg-[#00f3ff] animate-pulse" />
    </div>
  );
};
