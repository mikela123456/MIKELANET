
import React from 'react';

export const GeometricDecorations: React.FC = () => {
  return (
    <>
      {/* Top Left Diamond Grid */}
      <div className="absolute top-[10%] left-[5%] opacity-60">
        <div className="relative w-24 h-24 border-2 border-[#ff00ff] rotate-45 flex items-center justify-center">
            <div className="w-16 h-16 border border-[#ff00ff]" />
            <div className="absolute w-1 h-1 bg-white rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
                <div key={i} className={`w-4 h-4 ${i % 2 === 0 ? 'bg-[#ff00ff]' : 'bg-[#00f3ff]'}`} />
            ))}
        </div>
      </div>

      {/* Top Right Hollow Diamond */}
      <div className="absolute top-[15%] right-[15%] opacity-40">
        <div className="w-20 h-20 border-2 border-[#ff00ff] rotate-45 relative">
            <div className="absolute -top-2 -left-2 w-full h-full border border-[#ff00ff]" />
        </div>
      </div>

      {/* Bottom Right Dot Grid */}
      <div className="absolute bottom-[20%] right-[10%] opacity-60">
        <div className="grid grid-cols-4 gap-1 mb-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className={`w-3 h-3 ${i < 4 ? 'bg-[#00f3ff]' : 'bg-[#ff00ff]'}`} />
            ))}
        </div>
        <div className="w-24 h-24 rounded-full border border-[#ff00ff]/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-[#ff00ff]/50" />
        </div>
      </div>

      {/* Scattered horizontal glitch lines */}
      <div className="absolute top-[30%] left-[10%] w-24 h-[2px] bg-[#00f3ff]/40" />
      <div className="absolute top-[32%] left-[12%] w-12 h-[2px] bg-[#ff00ff]/40" />
      
      <div className="absolute bottom-[40%] right-[5%] w-32 h-[1px] bg-[#ff00ff]/30" />
      <div className="absolute bottom-[38%] right-[8%] w-16 h-[2px] bg-[#00f3ff]/30" />

      {/* Hexagon shape (simplified) */}
      <div className="absolute top-[40%] left-[20%] opacity-20">
        <div className="w-16 h-16 border-2 border-[#ff00ff] [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]" />
      </div>

      {/* Bottom accent bars */}
      <div className="absolute bottom-[10%] left-[10%] flex flex-col items-start">
        <div className="w-24 h-[1px] bg-[#ff00ff]" />
        <div className="w-32 h-[1px] bg-[#ff00ff] mt-1" />
      </div>
    </>
  );
};
