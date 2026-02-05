
import React from 'react';

interface NavigationProps {
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  return (
    <nav className="absolute top-0 left-0 w-full h-16 border-b border-[#00f3ff]/20 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 z-50">
      <div className="flex items-center h-full">
        <div className="relative h-full flex items-center px-4">
          <span className="text-[#00f3ff] font-bold tracking-[0.2em] uppercase text-sm neon-glow-cyan">
            Dashboard
          </span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end mr-4">
          <span className="text-[10px] text-[#00f3ff]/60 uppercase tracking-widest">User ID</span>
          <span className="text-xs text-[#00f3ff] font-bold">ADMIN_77</span>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-1 border border-[#ff00ff] text-[#ff00ff] text-[10px] uppercase font-bold hover:bg-[#ff00ff]/10 transition-colors"
        >
          Odhlásit
        </button>
      </div>
    </nav>
  );
};
