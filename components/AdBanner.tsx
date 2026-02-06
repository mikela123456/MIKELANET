import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, Target, ShieldAlert, RefreshCw } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isHurt, setIsHurt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDead || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Placeholder logic since TwinRed was removed.
    // In a production app, you would swap this with another display ad provider.
    try {
      setTimeout(() => {
        setIsLoading(false);
        // We show a placeholder or nothing if no other provider is set.
        if (container.innerHTML.length === 0) {
           const placeholder = document.createElement('div');
           placeholder.className = "text-[10px] text-white/20 uppercase tracking-widest text-center";
           placeholder.innerText = "DATOVÁ_ANOMÁLIE_DETEKována";
           container.appendChild(placeholder);
        }
      }, 1000);
    } catch (e) {
      console.error("Ad injection error:", e);
      setLoadError(true);
      setIsLoading(false);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [isDead, retryKey]);

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

  if (isDead) {
    return (
      <div className="w-[320px] h-[50px] flex items-center justify-center animate-explode relative">
        <Zap className="text-white neon-glow-pink animate-ping" size={32} />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-[340px] p-2 bg-black/95 border-2 transition-all duration-150 shadow-2xl ${
        isHurt ? 'scale-95 border-red-500 shadow-[0_0_25px_rgba(255,0,0,0.6)]' : 'border-[#00f3ff]/40'
      }`}
    >
      <div className="flex justify-between items-center mb-1 px-1">
        <div className="flex items-center gap-1">
          <Target size={10} className="text-[#00f3ff]" />
          <span className="text-[8px] text-[#00f3ff] font-black uppercase tracking-widest">ANOMALY_NODE_v3.1</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-mono text-[#00f3ff]">{Math.ceil(health)}%</span>
           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-[#00f3ff] transition-all duration-300" style={{ width: `${health}%` }} />
           </div>
        </div>
      </div>

      <div className="relative w-[320px] h-[50px] bg-[#050505] overflow-hidden mx-auto border border-white/5">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90">
            <Loader2 className="text-[#00f3ff] animate-spin mb-1" size={16} />
            <span className="text-[7px] text-[#00f3ff] font-black uppercase tracking-widest">Skenování...</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-sm p-1 text-center">
            <ShieldAlert className="text-red-500 mb-1" size={14} />
            <button 
              onClick={(e) => { e.stopPropagation(); setRetryKey(k => k + 1); }}
              className="text-[6px] bg-white/10 px-2 py-0.5 rounded hover:bg-white/20 flex items-center gap-1 uppercase font-bold text-white"
            >
              <RefreshCw size={8} /> Opakovat
            </button>
          </div>
        )}

        <div ref={containerRef} className="w-[320px] h-[50px] z-10 flex items-center justify-center" />
        <div onClick={handleHit} className="absolute inset-0 z-30 cursor-crosshair active:bg-[#ff00ff]/20 transition-colors" />
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