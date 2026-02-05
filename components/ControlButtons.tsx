
import React from 'react';

export const ControlButtons: React.FC = () => {
  return (
    <div className="absolute top-4 right-4 flex space-x-2 z-30">
      <button className="w-12 h-12 border border-[#ff00ff] bg-black/40 flex items-center justify-center hover:bg-[#ff00ff]/20 transition-colors">
        <div className="w-4 h-[2px] bg-[#ff00ff]" />
      </button>
      <button className="w-12 h-12 border border-[#ff00ff] bg-black/40 flex items-center justify-center hover:bg-red-500 transition-colors group">
        <div className="relative w-4 h-4">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#ff00ff] group-hover:bg-white rotate-45" />
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#ff00ff] group-hover:bg-white -rotate-45" />
        </div>
      </button>
    </div>
  );
};
