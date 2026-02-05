
import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, Target, ShieldAlert } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

/**
 * AdBanner komponenta pro integraci Adsterra (adsterra.com).
 * Zajišťuje správné zobrazení banneru 320x50 dle regulací.
 */
export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);

  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead || isLoading) return;
    
    const damage = 35 + (playerAtk * 12);
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

    // Adsterra Configuration
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

    // Adsterra Invoke Script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//ignateignatepredominanteatable.com/9ffa2bb84a4524c7addb7491067cb475/invoke.js';
    
    invokeScript.onload = () => {
      setIsLoading(false);
      setLoadError(false);
    };
    
    invokeScript.onerror = () => {
      console.warn("Adsterra script block detected or network error.");
      setIsLoading(false);
      setLoadError(true);
    };
    
    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    // Backup timeout pro případ, že skript visí
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        // Pokud se nic nenačetlo, ukážeme aspoň placeholder, aby hra nebyla blokována
      }
    }, 4000);

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
      className={`relative w-[340px] p-2 bg-black/90 border-2 transition-all duration-150 shadow-lg ${
        isHurt ? 'scale-95 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'border-[#00f3ff]/30'
      }`}
    >
      <div className="flex justify-between items-center mb-1 px-1">
        <div className="flex items-center gap-1">
          <Target size={10} className="text-[#00f3ff] animate-pulse" />
          <span className="text-[8px] text-[#00f3ff] font-black uppercase tracking-widest">AD_NODE_0x9F</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-mono text-[#00f3ff] font-bold">{Math.ceil(health)}% HP</span>
           <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-[#00f3ff]" style={{ width: `${health}%` }} />
           </div>
        </div>
      </div>

      <div className="relative w-[320px] h-[50px] bg-[#050505] overflow-hidden mx-auto border border-white/5">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95">
            <Loader2 className="text-[#00f3ff] animate-spin mb-1" size={16} />
            <span className="text-[7px] text-[#00f3ff] font-black uppercase">Syncing Node...</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm">
            <ShieldAlert className="text-red-500 mb-1" size={14} />
            <span className="text-[7px] text-red-500 font-black uppercase">Uplink Blocked - Destroy to bypass</span>
          </div>
        )}

        {/* Div pro Adsterra skript */}
        <div ref={adContainerRef} className="w-[320px] h-[50px] z-10" />

        {/* Interakční vrstva pro ničení banneru */}
        <div 
          onClick={handleHit}
          className="absolute inset-0 z-30 cursor-crosshair active:bg-[#ff00ff]/20 transition-colors"
          title="Click to destroy anomaly"
        />
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(3); }
          100% { transform: scale(2.2); opacity: 0; filter: blur(20px); }
        }
        .animate-explode { animation: explode 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}</style>
    </div>
  );
};
