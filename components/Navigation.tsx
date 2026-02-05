
import React from 'react';

interface NavigationProps {
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onLogout }) => {
  return (
    <nav className="fixed top-0 left-0 w-full h-20 border-b border-[#00f3ff]/20 bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-50">
      <div className="flex flex-col items-start">
        <span className="text-[#00f3ff] font-black tracking-[0.2em] uppercase text-base neon-glow-cyan">
          DASHBOARD
        </span>
        <div className="w-full h-[3px] bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] mt-1" />
      </div>
      
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-[#00f3ff]/60 uppercase tracking-[0.2em]">User ID</span>
        <span className="text-sm text-[#00f3ff] font-black uppercase tracking-widest">ADMIN_77</span>
      </div>

      <button 
        onClick={onLogout}
        className="px-6 py-2 border-2 border-[#ff00ff] text-[#ff00ff] text-[10px] uppercase font-black hover:bg-[#ff00ff]/10 transition-all active:scale-95"
      >
        Odhlásit
      </button>
    </nav>
  );
};
