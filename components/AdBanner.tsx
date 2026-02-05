
import React, { useState } from 'react';
import { Zap, ShieldAlert } from 'lucide-react';

interface AdBannerProps {
  onDestroyed?: () => void;
  playerAtk?: number;
}

const FAKE_ADS = [
  { brand: 'ARASAKA', slogan: 'Securing Your Future', color: '#ff0055' },
  { brand: 'MILITECH', slogan: 'Protection Overload', color: '#00f3ff' },
  { brand: 'KANG TAO', slogan: 'Smart Tech, Better Life', color: '#ffaa00' },
  { brand: 'TRAUMA TEAM', slogan: '7 Minutes or Less', color: '#ffffff' }
];

export const AdBanner: React.FC<AdBannerProps> = ({ onDestroyed, playerAtk = 1 }) => {
  const [health, setHealth] = useState(100);
  const [isHurt, setIsHurt] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [adIndex] = useState(() => Math.floor(Math.random() * FAKE_ADS.length));
  
  const currentAd = FAKE_ADS[adIndex];

  const handleHit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDead) return;
    
    const damage = 25 + (playerAtk * 5);
    setHealth(prev => Math.max(0, prev - damage));
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 100);

    if (health <= damage) {
      setIsDead(true);
      setTimeout(() => onDestroyed?.(), 400);
    }
  };

  if (isDead) {
    return (
      <div className="w-[320px] h-[50px] flex items-center justify-center animate-explode relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 animate-ping rounded-full" />
        <Zap className="text-white neon-glow-cyan" size={32} />
      </div>
    );
  }

  const adScriptUrl = "https://www.highperformanceformat.com/a85ff9ddbe88616be678af1325d6582c/invoke.js";

  // CSS pro skrytí rozbitých obrázků uvnitř iframe
  const hideBrokenImagesCss = `
    img:not([src]), img[src=""], img:invalid { display: none !important; }
    body { background: black; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 50px; overflow: hidden; }
  `;

  return (
    <div 
      onClick={handleHit}
      className={`relative w-[320px] h-[50px] cursor-crosshair overflow-hidden border-2 transition-all select-none shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isHurt ? 'border-red-500 bg-red-900/40 animate-shake scale-95' : 'border-[#00f3ff]/40 bg-black'}`}
    >
      {/* HP BAR - Top Overlay */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-black/80 z-50">
        <div 
          className="h-full bg-gradient-to-r from-red-600 to-[#00f3ff] transition-all duration-200 shadow-[0_0_5px_#00f3ff]" 
          style={{ width: `${health}%` }}
        />
      </div>

      {/* GAME AD CONTENT (Vždy jako základ) */}
      <div className="absolute inset-0 flex items-center justify-between px-5 z-10 pointer-events-none bg-gradient-to-r from-black via-[#050505] to-transparent">
        <div className="flex flex-col">
          <span className="text-[14px] font-black italic tracking-tighter uppercase" style={{ color: currentAd.color }}>
            {currentAd.brand} <span className="text-white/10 ml-1 text-[8px] tracking-normal">LINK_ESTABLISHED</span>
          </span>
          <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">{currentAd.slogan}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-white/5 px-2 py-1 border border-white/10">
            <ShieldAlert size={12} className="text-white/40" />
          </div>
          <span className="text-[7px] text-[#00f3ff] font-black animate-pulse tracking-tighter">SECURE_DATA_STREAM</span>
        </div>
      </div>

      {/* ACTUAL AD (Pokus o vykreslení s pojistkou proti ikonám chyb) */}
      <div className="absolute inset-0 z-20 opacity-60 pointer-events-none mix-blend-screen">
        <iframe
          srcDoc={`
            <html>
              <head>
                <style>${hideBrokenImagesCss}</style>
              </head>
              <body>
                <div id="container">
                  <script type="text/javascript">
                    atOptions={'key':'a85ff9ddbe88616be678af1325d6582c','format':'iframe','height':50,'width':320,'params':{}};
                  </script>
                  <script type="text/javascript" src="${adScriptUrl}"></script>
                </div>
              </body>
            </html>
          `}
          width="320"
          height="50"
          scrolling="no"
          frameBorder="0"
          className="w-full h-full"
        />
      </div>

      {/* INTERACTION LAYER */}
      <div className="absolute inset-0 z-40 bg-transparent active:bg-white/10 transition-colors" />

      {/* Visual scanlines inside the banner area */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-30 opacity-50" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-5px, 2px) rotate(-0.5deg); }
          50% { transform: translate(5px, -2px) rotate(0.5deg); }
          75% { transform: translate(-5px, -2px) rotate(-0.5deg); }
        }
        .animate-shake { animation: shake 0.1s linear infinite; }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; filter: brightness(4); }
          100% { transform: scale(3); opacity: 0; filter: blur(30px); }
        }
        .animate-explode { animation: explode 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
