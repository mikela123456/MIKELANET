
import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, Target, ShieldAlert, RefreshCw } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

declare global {
  interface Window {
    atOptions: any;
  }
}

/**
 * AdBanner komponenta optimalizovaná pro Adsterra.com
 */
export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const adContainerRef = useRef<HTMLDivElement>(null);

  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead) return;
    
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

  const loadAd = () => {
    if (isDead || !adContainerRef.current) return;
    
    setIsLoading(true);
    setLoadError(false);
    const container = adContainerRef.current;
    container.innerHTML = '';

    // Adsterra vyžaduje globální atOptions
    window.atOptions = {
      'key' : '9ffa2bb84a4524c7addb7491067cb475',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//ignateignatepredominanteatable.com/9ffa2bb84a4524c7addb7491067cb475/invoke.js?r=${Math.random()}`;
    
    script.onload = () => {
      setTimeout(() => setIsLoading(false), 500);
    };
    
    script.onerror = () => {
      setIsLoading(false);
      setLoadError(true);
    };
    
    container.appendChild(script);
  };

  useEffect(() => {
    loadAd();
    return () => {
      if (adContainerRef.current) adContainerRef.current.innerHTML = '';
    };
  }, [isDead, retryCount]);

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
      className={`relative w-[340px] p-2 bg-black/95 border-2 transition-all duration-150 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
        isHurt ? 'scale-95 border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'border-[#00f3ff]/30'
      }`}
    >
      <div className="flex justify-between items-center mb-1 px-1">
        <div className="flex items-center gap-1">
          <Target size={10} className="text-[#00f3ff] animate-pulse" />
          <span className="text-[8px] text-[#00f3ff] font-black uppercase tracking-widest">AD_NODE_v9.2</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-mono text-[#00f3ff] font-bold">{Math.ceil(health)}%</span>
           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-[#00f3ff] transition-all duration-300" style={{ width: `${health}%` }} />
           </div>
        </div>
      </div>

      <div className="relative w-[320px] h-[50px] bg-black overflow-hidden mx-auto border border-white/5">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90">
            <Loader2 className="text-[#00f3ff] animate-spin mb-1" size={16} />
            <span className="text-[7px] text-[#00f3ff] font-black uppercase animate-pulse">Establishing Link...</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/40 backdrop-blur-sm p-2 text-center">
            <ShieldAlert className="text-red-500 mb-1" size={14} />
            <span className="text-[7px] text-red-100 font-black uppercase mb-1">Signal Blocked by Firewall</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setRetryCount(c => c + 1); }}
              className="text-[6px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20 flex items-center gap-1"
            >
              <RefreshCw size={8} /> RETRY_UPLINK
            </button>
          </div>
        )}

        <div ref={adContainerRef} className="w-[320px] h-[50px] z-10" />

        <div 
          onClick={handleHit}
          className="absolute inset-0 z-30 cursor-crosshair active:bg-[#ff00ff]/20 transition-colors"
        />
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(3); }
          100% { transform: scale(2.5); opacity: 0; filter: blur(30px); }
        }
        .animate-explode { animation: explode 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
      `}</style>
    </div>
  );
};
