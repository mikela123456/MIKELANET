
import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, ShieldAlert, Target } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const adContainerRef = useRef<HTMLDivElement>(null);

  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead) return;
    
    const damage = 40 + (playerAtk * 10);
    setHealth(prev => {
      const newHealth = Math.max(0, prev - damage);
      if (newHealth <= 0 && !isDead) {
        setIsDead(true);
        setTimeout(() => onDestroyed?.(), 600);
      }
      return newHealth;
    });

    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 150);
  };

  useEffect(() => {
    if (isDead || !adContainerRef.current) return;

    const container = adContainerRef.current;
    container.innerHTML = '';

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '9ffa2bb84a4524c7addb7491067cb475',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://ignateignatepredominanteatable.com/9ffa2bb84a4524c7addb7491067cb475/invoke.js';
    
    invokeScript.onload = () => setIsLoading(false);
    
    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    const timeout = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      clearTimeout(timeout);
      container.innerHTML = '';
    };
  }, [isDead]);

  if (isDead) {
    return (
      <div className="w-[320px] h-[50px] flex items-center justify-center animate-explode relative">
        <div className="absolute inset-0 bg-[#ff00ff]/30 blur-xl animate-ping" />
        <Zap className="text-white neon-glow-pink" size={32} />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-[340px] p-2 bg-black/80 border-2 border-[#00f3ff]/20 backdrop-blur-md transition-all duration-150 ${isHurt ? 'scale-95 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'hover:border-[#00f3ff]/50'}`}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <Target size={10} className="text-[#00f3ff] animate-pulse" />
          <span className="text-[9px] text-[#00f3ff] font-black uppercase tracking-widest">GLITCH_NODE_v4.2</span>
        </div>
        <span className="text-[10px] font-mono text-[#00f3ff] font-bold">INTEGRITY: {Math.ceil(health)}%</span>
      </div>
      
      <div className="w-full h-1 bg-white/5 mb-2 relative">
        <div 
          className="h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] transition-all duration-300" 
          style={{ width: `${health}%` }}
        />
      </div>

      <div className="relative w-[320px] h-[50px] bg-black/40 overflow-hidden mx-auto">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90">
            <Loader2 className="text-[#00f3ff] animate-spin mb-1" size={16} />
            <span className="text-[8px] text-[#00f3ff] font-black uppercase">Syncing Uplink...</span>
          </div>
        )}

        <div ref={adContainerRef} className="w-[320px] h-[50px] z-10" />

        <div 
          onClick={handleHit}
          className="absolute inset-0 z-30 cursor-crosshair active:bg-[#ff00ff]/10 transition-colors"
        />
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(3); }
          100% { transform: scale(2); opacity: 0; filter: blur(20px); }
        }
        .animate-explode { animation: explode 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
