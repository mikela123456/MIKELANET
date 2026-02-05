
import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, ShieldAlert } from 'lucide-react';

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

  // Funkce pro zásah (kliknutí na banner)
  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead) return;
    
    const damage = 35 + (playerAtk * 5);
    setHealth(prev => {
      const newHealth = Math.max(0, prev - damage);
      if (newHealth <= 0 && !isDead) {
        setIsDead(true);
        setTimeout(() => onDestroyed?.(), 600);
      }
      return newHealth;
    });

    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 100);
  };

  // Injekce nového skriptu přímo do DOM
  useEffect(() => {
    if (isDead || !adContainerRef.current) return;

    // Vyčištění kontejneru před novou injekcí
    const container = adContainerRef.current;
    container.innerHTML = '';

    // Definice atOptions s NOVÝM KLÍČEM
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

    // Nový invoke skript s NOVOU URL
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://ignateignatepredominanteatable.com/9ffa2bb84a4524c7addb7491067cb475/invoke.js';
    
    // Sledování načtení
    invokeScript.onload = () => setIsLoading(false);
    
    container.appendChild(optionsScript);
    container.appendChild(invokeScript);

    // Timeout pro zrušení loading stavu
    const timeout = setTimeout(() => setIsLoading(false), 3000);

    return () => {
      clearTimeout(timeout);
      container.innerHTML = '';
    };
  }, [isDead]);

  if (isDead) {
    return (
      <div className="w-[320px] h-[50px] flex items-center justify-center animate-explode relative bg-[#ff00ff]/10">
        <Zap className="text-[#ff00ff] neon-glow-pink animate-ping" size={32} />
        <div className="absolute inset-0 border border-[#ff00ff] opacity-20" />
      </div>
    );
  }

  return (
    <div 
      className={`relative w-[320px] h-[70px] flex flex-col items-center group select-none transition-transform ${isHurt ? 'scale-95' : ''}`}
    >
      {/* HP Bar a Info */}
      <div className="w-full flex justify-between items-end mb-1 px-1">
        <span className="text-[8px] text-[#00f3ff] font-black uppercase tracking-[0.2em] opacity-70">
          Target: Static_Banner_v3
        </span>
        <span className="text-[10px] text-[#00f3ff] font-black italic">
          INTEGRITA: {Math.ceil(health)}%
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-black border border-white/10 mb-2 overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
        <div 
          className="h-full bg-gradient-to-r from-red-600 via-[#00f3ff] to-red-600 transition-all duration-300 shadow-[0_0_8px_#00f3ff]" 
          style={{ width: `${health}%`, backgroundSize: '200% 100%' }}
        />
      </div>

      {/* Kontejner pro reklamu */}
      <div className="relative w-[320px] h-[50px] bg-black/40 border border-[#00f3ff]/20 overflow-hidden group-hover:border-[#00f3ff]/50 transition-colors">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 gap-3">
            <Loader2 className="text-[#00f3ff] animate-spin" size={16} />
            <span className="text-[9px] text-[#00f3ff] font-black uppercase tracking-widest">Synchronizace...</span>
          </div>
        )}

        {/* Ad Injection Point */}
        <div 
          ref={adContainerRef}
          className="w-[320px] h-[50px] z-10"
        />

        {/* Click Layer */}
        <div 
          onClick={handleHit}
          className="absolute inset-0 z-30 cursor-crosshair bg-transparent active:bg-white/5"
          title="Klikněte pro likvidaci banneru"
        />
        
        {/* AdBlock Fallback */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30">
           <ShieldAlert className="text-red-500" size={24} />
           <span className="text-[8px] ml-2 font-black uppercase">Chráněno firewallem</span>
        </div>
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(2); }
          100% { transform: scale(1.8); opacity: 0; filter: blur(15px); }
        }
        .animate-explode { animation: explode 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};
