
import React from 'react';

interface SystemStatusProps {
  time: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ time }) => {
  const currentDate = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center space-x-2 text-[#00f3ff] font-bold tracking-[0.3em] uppercase">
        <span className="neon-glow-cyan">SYSTÉM ONLINE // PŘIPOJENÍ AKTIVNÍ</span>
      </div>
      
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
        <span className="text-gray-300 font-medium tracking-wide">{currentDate}</span>
      </div>
    </div>
  );
};
