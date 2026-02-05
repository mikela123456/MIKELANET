
import React from 'react';

export const TerminalHeader: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-7xl md:text-9xl font-black text-[#ff00ff] neon-glow-pink italic uppercase tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        Vítejte
      </h1>
      <p className="text-[#00f3ff] text-sm md:text-base tracking-[0.5em] mt-4 font-bold uppercase neon-glow-cyan">
        VSTUPTE DO DIGITÁLNÍ BUDOUCNOSTI
      </p>
    </div>
  );
};
