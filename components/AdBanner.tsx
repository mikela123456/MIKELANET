
import React, { useEffect, useState, useRef } from 'react';
import { Zap, Loader2, Cpu, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isHurt, setIsHurt] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [status, setStatus] = useState<'loading' | 'active' | 'blocked'>('loading');
  
  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead) return;
    
    const damage = 20 + (playerAtk * 10);
    setHealth(prev => Math.max(0, prev - damage));
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 80);

    if (health <= damage) {
      setIsDead(true);
      setTimeout(() => onDestroyed?.(), 400);
    }
  };

  useEffect(() => {
    // Timeout pro detekci blokování (pokud se reklama nenačte)
    const timer = setTimeout(() => {
      if (status === 'loading') setStatus('blocked');
    }, 5000);

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'ad-ready') {
        setStatus('active');
        clearTimeout(timer);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [status]);

  if (isDead) {
    return (
      <div className="w-[320px] h-[50px] flex items-center justify-center animate-explode">
        <Zap className="text-[#ff00ff] animate-ping" size={32} />
      </div>
    );
  }

  const adHtml = `
    <html>
      <body style="margin:0;padding:0;overflow:hidden;background:black;">
        <div id="container" style="width:320px;height:50px;">
          <script type="text/javascript">
            atOptions = { 'key' : 'a85ff9ddbe88616be678af1325d6582c', 'format' : 'iframe', 'height' : 50, 'width' : 320, 'params' : {} };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/a85ff9ddbe88616be678af1325d6582c/invoke.js" onload="window.parent.postMessage('ad-ready', '*')"></script>
        </div>
      </body>
    </html>
  `;

  return (
    <div 
      onClick={handleHit}
      className={`relative w-[320px] h-[50px] cursor-crosshair overflow-hidden border border-[#00f3ff]/40 bg-black transition-all ${isHurt ? 'animate-shake' : 'hover:scale-[1.01]'}`}
    >
      {/* HP BAR OVERLAY - Tenká linka nahoře */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-black/50 z-50">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-[#00f3ff] transition-all duration-300 shadow-[0_0_5px_#00f3ff]" 
          style={{ width: `${health}%` }}
        />
      </div>

      {/* IFRAME LAYER */}
      <iframe
        srcDoc={adHtml}
        title="Ad"
        width="320"
        height="50"
        scrolling="no"
        frameBorder="0"
        className={`pointer-events-none transition-opacity duration-500 ${status === 'active' ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* FALLBACK LAYER (Pokud je AdBlock aktivní) */}
      {(status === 'loading' || status === 'blocked') && (
        <div className="absolute inset-0 flex items-center justify-between px-4 bg-gradient-to-r from-[#00f3ff]/10 to-black z-10">
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-black text-[#00f3ff] italic uppercase tracking-tighter">
              {status === 'loading' ? 'SYNCHRONIZING...' : 'AD_BLOCK_DETECTED'}
            </span>
            <span className="text-[7px] text-white/40 uppercase font-bold mt-1">
              {status === 'loading' ? 'Establishing link' : 'Neural_Link_Replacement'}
            </span>
          </div>
          {status === 'loading' ? (
            <Loader2 className="text-[#00f3ff] animate-spin" size={14} />
          ) : (
            <div className="flex items-center gap-2">
               <Cpu className="text-[#ff00ff] animate-pulse" size={14} />
               <div className="bg-[#00f3ff] text-black px-1.5 py-0.5 text-[7px] font-black flex items-center gap-1">
                 <ExternalLink size={8} /> CLICK_TO_PURGE
               </div>
            </div>
          )}
        </div>
      )}

      {/* CLICK DETECTOR - Musí být nahoře pro detekci kliknutí */}
      <div className="absolute inset-0 z-40 bg-transparent" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-2px, 1px); }
          40% { transform: translate(2px, -1px); }
          60% { transform: translate(-2px, -1px); }
          80% { transform: translate(2px, 1px); }
        }
        .animate-shake { animation: shake 0.1s linear infinite; }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(2); }
          100% { transform: scale(2); opacity: 0; filter: blur(10px); }
        }
        .animate-explode { animation: explode 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
