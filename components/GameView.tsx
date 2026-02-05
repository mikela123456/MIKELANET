import React, { useState, useEffect, useRef } from 'react';
// Added missing imports: Truck, RefreshCw, AlertTriangle
import { User, Compass, Package, Zap, Timer, Trophy, Clock, Coins, X, Terminal, Database, PlayCircle, Lock, Eye, Signal, Loader2, Truck, RefreshCw, AlertTriangle } from 'lucide-react';
import { AdBanner } from './AdBanner';

type GameTab = 'profile' | 'expeditions' | 'items';
type ExpeditionPhase = 'STARTING' | 'TRAVELING' | 'EXTRACTING' | 'COMPLETED' | 'FAILED';

interface ExpeditionLog {
  id: string;
  text: string;
  type: 'info' | 'warn' | 'success' | 'error';
}

interface UpgradeItem {
  id: string;
  name: string;
  icon: any;
  level: number;
  baseCost: number;
  desc: string;
}

interface GameCoin {
  id: string;
  x: number;
  y: number;
  value: number;
}

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

const VIDEO_AD_URL = "https://groundedmine.com/dpmzFbz/d.GANRvbZjGiUS/ieemF9tu/ZOUCl_k/PVTpYG3_NWzeYNwEN/DQkwtsNFjccn3wN/jdA/1OMDwf";
const AD_WATCH_DURATION = 60; 

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [mikelaReserves, setMikelaReserves] = useState(150);
  const [reputation, setReputation] = useState(1240);
  const [expeditionLevel, setExpeditionLevel] = useState(1);
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: 'atk', name: 'Útočný Protokol', icon: Zap, level: 1, baseCost: 50, desc: 'Zvyšuje sílu úderu proti bannerům.' },
    { id: 'spd', name: 'Tachyonový Pohon', icon: Compass, level: 1, baseCost: 40, desc: 'Zkracuje čas trvání mise.' },
    { id: 'trns', name: 'Datový Uzel', icon: Truck, level: 1, baseCost: 30, desc: 'Efektivnější přenos vytěžených dat.' },
    { id: 'tm', name: 'Forging Modul', icon: Timer, level: 1, baseCost: 60, desc: 'Zvyšuje výnos MIKELA z jedné mise.' },
  ]);

  const [activeExpedition, setActiveExpedition] = useState<boolean>(false);
  const [phase, setPhase] = useState<ExpeditionPhase>('STARTING');
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [coins, setCoins] = useState<GameCoin[]>([]);
  const [activeAds, setActiveAds] = useState<{id: number}[]>([]);
  const [adsDestroyed, setAdsDestroyed] = useState(0);
  
  // Video Ad States
  const [videoAdVisible, setVideoAdVisible] = useState(false);
  const [videoAdTimer, setVideoAdTimer] = useState(0);
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [isVideoForStart, setIsVideoForStart] = useState(false);
  
  const playerRef = useRef<any>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  const openVideoAd = (forStart: boolean = false) => {
    setIsVideoForStart(forStart);
    setVideoAdVisible(true);
    setVideoAdTimer(AD_WATCH_DURATION);
  };

  // Fluid Player Initialization
  useEffect(() => {
    if (videoAdVisible && videoElementRef.current && window.fluidPlayer) {
      const init = () => {
        if (playerRef.current) return;
        
        playerRef.current = window.fluidPlayer(videoElementRef.current, {
          layoutControls: {
            fillToContainer: true,
            autoPlay: true,
            mute: true,
            allowDownload: false,
            playbackRateControl: false,
            persistentSettings: { volume: false },
            adProgressbarColor: '#00f3ff',
            primaryColor: '#00f3ff',
            controlBar: {
              autoHide: true,
              animated: true
            }
          },
          vastOptions: {
            allowVPAID: true,
            vpaidMode: 'insecure',
            adList: [
              {
                roll: 'preRoll',
                vastTag: VIDEO_AD_URL
              }
            ],
            adStartedCallback: () => {
              addLog("Reklama spuštěna - Autorizace probíhá.", "info");
            },
            adErrorCallback: (err: any) => {
              console.error("VAST Load Error:", err);
              addLog("Chyba načítání reklamy.", "error");
            }
          }
        });
      };

      const timer = setTimeout(init, 300);
      return () => {
        clearTimeout(timer);
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }
  }, [videoAdVisible]);

  useEffect(() => {
    let timerId: number;
    if (videoAdVisible && videoAdTimer > 0) {
      timerId = window.setInterval(() => {
        setVideoAdTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [videoAdVisible, videoAdTimer]);

  const claimVideoReward = () => {
    if (videoAdTimer > 0) return;
    if (isVideoForStart) {
      startExpedition();
    } else if (activeCoinId) {
      const coin = coins.find(c => c.id === activeCoinId);
      if (coin) {
        setMikelaReserves(prev => prev + coin.value);
        setCoins(prev => prev.filter(c => c.id !== activeCoinId));
        addLog(`Získáno ${coin.value} MK z datového fragmentu.`, 'success');
      }
      setVideoAdVisible(false);
      setActiveCoinId(null);
    } else {
      setVideoAdVisible(false);
    }
  };

  const handleCoinClick = (id: string) => {
    setActiveCoinId(id);
    openVideoAd(false);
  };

  const startExpedition = () => {
    setVideoAdVisible(false);
    const baseDuration = Math.max(15, 20 + (expeditionLevel - 1) * 4);
    const spdLevel = upgrades.find(u => u.id === 'spd')?.level || 1;
    const effectiveDuration = Math.ceil(baseDuration * (1 - Math.min(0.6, (spdLevel - 1) * 0.06)));
    
    setExpeditionEndTime(Date.now() + (effectiveDuration * 1000));
    setCurrentExpeditionDuration(effectiveDuration);
    setActiveExpedition(true);
    setPhase('STARTING');
    setLogs([]);
    setProgress(0);
    setAdsDestroyed(0);
    setTimeLeft(effectiveDuration);
    setCoins([]);
    setActiveAds([{ id: Date.now() }]);
    addLog(`Navázáno spojení se Sektorem 0x${expeditionLevel.toString(16).toUpperCase()}`, 'info');
  };

  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);
  const [currentExpeditionDuration, setCurrentExpeditionDuration] = useState<number>(0);

  const handleAdDestroyed = (id: number) => {
    setActiveAds(prev => prev.filter(ad => ad.id !== id));
    setAdsDestroyed(prev => prev + 1);
    addLog(`Anomálie eliminována`, 'success');
    setTimeout(() => {
      if (activeExpedition && timeLeft > 4) setActiveAds(prev => [...prev, { id: Date.now() }]);
    }, 2500);
  };

  useEffect(() => {
    if (!activeExpedition || !expeditionEndTime) return;
    const interval = setInterval(() => {
      const delta = expeditionEndTime - Date.now();
      const remaining = Math.max(0, Math.ceil(delta / 1000));
      setTimeLeft(remaining);
      const elapsed = currentExpeditionDuration - remaining;
      const currentProgress = Math.min(100, Math.floor((elapsed / currentExpeditionDuration) * 100));
      setProgress(currentProgress);
      setPhase(currentProgress < 15 ? 'STARTING' : currentProgress < 85 ? 'TRAVELING' : 'EXTRACTING');

      if (Math.random() < 0.05 && coins.length < 2 && currentProgress > 20 && currentProgress < 80) {
        setCoins(prev => [...prev, {
          id: Math.random().toString(),
          x: 20 + Math.random() * 60,
          y: 25 + Math.random() * 50,
          value: Math.floor(120 * expeditionLevel * (1 + Math.random() * 0.5))
        }]);
      }
      if (delta <= 0) {
        clearInterval(interval);
        setPhase(adsDestroyed >= Math.floor(expeditionLevel * 0.7) ? 'COMPLETED' : 'FAILED');
        if (adsDestroyed >= Math.floor(expeditionLevel * 0.7)) {
          setMikelaReserves(p => p + Math.floor(120 * expeditionLevel + (adsDestroyed * 35)));
          setReputation(p => p + expeditionLevel * 40);
          setExpeditionLevel(p => p + 1);
        }
        setActiveAds([]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeExpedition, expeditionEndTime, adsDestroyed, expeditionLevel, coins.length, currentExpeditionDuration]);

  return (
    <div className="flex h-full w-full bg-[#020202] border-t border-[#00f3ff]/10 relative overflow-hidden font-mono text-[#00f3ff]">
      
      {/* VIDEO AD MODAL - PŘESNĚ PODLE SCREENSHOTU */}
      {videoAdVisible && (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-black animate-in fade-in duration-300">
          
          {/* TOP BAR */}
          <div className="w-full h-16 bg-black flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#ff00ff] shadow-[0_0_8px_#ff00ff]" />
              <span className="text-[10px] text-[#00f3ff] font-bold tracking-[0.2em] uppercase">
                UPLINK_ACTIVE // AUTORIZACE STARTU
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-white/40 uppercase tracking-widest leading-none mb-1">Verifikace spojení</span>
              <span className="text-xl font-black text-[#00f3ff] leading-none tracking-wider neon-glow-cyan tabular-nums">
                {videoAdTimer > 0 ? `${videoAdTimer}s` : 'DONE'}
              </span>
            </div>
          </div>

          {/* VIDEO CONTAINER */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
             <div className="w-full h-full">
                <video 
                  ref={videoElementRef} 
                  id="ad-video-element"
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  playsInline
                >
                  <source src="" type="video/mp4" />
                </video>
             </div>
             
             {/* Cross Button - Only visible when timer hits zero */}
             {videoAdTimer <= 0 && (
               <button 
                onClick={() => setVideoAdVisible(false)}
                className="absolute top-4 right-4 z-[1010] w-10 h-10 flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-[#ff00ff]/20"
               >
                 <X size={24} />
               </button>
             )}
          </div>

          {/* BOTTOM BAR */}
          <div className="w-full h-14 bg-black flex items-center justify-center shrink-0">
             {videoAdTimer > 0 ? (
               <div className="flex items-center gap-2 opacity-60">
                 <RefreshCw size={12} className="text-[#00f3ff] animate-spin" />
                 <span className="text-[10px] text-[#00f3ff] uppercase tracking-[0.2em]">
                   Sledujte reklamu pro získání odměny...
                 </span>
               </div>
             ) : (
               <button 
                onClick={claimVideoReward}
                className="px-12 py-2 bg-[#00f3ff] text-black font-black uppercase tracking-[0.4em] text-xs hover:bg-white transition-all shadow-[0_0_20px_#00f3ff60]"
               >
                 Potvrdit příjem
               </button>
             )}
          </div>
        </div>
      )}

      {/* Side Navigation */}
      <aside className="w-20 md:w-64 border-r border-white/5 bg-black/60 flex flex-col py-8 z-20 backdrop-blur-md">
        <div className="mb-14 flex flex-col items-center gap-3">
          <Database className="text-[#00f3ff] animate-pulse" size={28} />
          <span className="hidden md:block text-[9px] text-[#00f3ff]/40 uppercase font-black tracking-[0.6em]">MATRIX_CONTROL</span>
        </div>
        <nav className="flex-1 space-y-3 px-3">
          {([
            { id: 'profile', icon: User, label: 'Profil' },
            { id: 'expeditions', icon: Compass, label: 'Expedice' },
            { id: 'items', icon: Package, label: 'Arzenál' }
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-5 transition-all duration-300 rounded-xl ${activeTab === item.id ? 'bg-[#00f3ff]/15 text-[#00f3ff] border-r-4 border-[#00f3ff]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={22} />
              <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-1000">
            <div className="px-12 py-8 border-b border-white/10 bg-black/95 flex justify-between items-center z-10">
              <div className="flex items-center gap-12">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#00f3ff]/40 uppercase font-black block tracking-widest">Sector</span>
                  <span className="text-2xl font-black text-white italic uppercase tracking-widest neon-glow-cyan">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-[#ff00ff]/40 uppercase font-black block tracking-widest">Uplink</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
                    <span className="text-sm font-black text-[#00f3ff] uppercase tracking-widest">{phase}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                   <span className="text-[9px] text-white/30 uppercase font-black block">Analyzed</span>
                   <span className="text-lg font-black text-[#ff00ff] tabular-nums">{adsDestroyed} <span className="opacity-40 text-xs">/ {Math.floor(expeditionLevel * 0.7)}</span></span>
                </div>
                <div className="flex items-center gap-4 bg-[#00f3ff]/5 border border-[#00f3ff]/20 px-8 py-4 rounded shadow-[0_0_20px_#00f3ff20]">
                  <Clock className="text-[#00f3ff]" size={20} />
                  <span className="text-2xl font-black text-[#00f3ff] tabular-nums">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative bg-[#010101] overflow-hidden">
                <div className="absolute inset-0 tactical-grid opacity-[0.1]" />
                <div className="absolute inset-0 z-30 pointer-events-none p-20 flex flex-col items-center gap-12">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="pointer-events-auto animate-in fade-in slide-in-from-top-12 duration-700">
                      <AdBanner onDestroyed={() => handleAdDestroyed(ad.id)} playerAtk={upgrades[0].level} />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {coins.map(coin => (
                    <button 
                      key={coin.id}
                      onClick={() => handleCoinClick(coin.id)}
                      className="absolute pointer-events-auto group"
                      style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
                    >
                       <div className="relative hover:scale-125 transition-transform duration-300">
                          <div className="bg-black border border-[#ff00ff] p-4 flex flex-col items-center gap-2 shadow-[0_0_30px_#ff00ff40]">
                            <Coins className="text-[#ff00ff]" size={32} />
                            <span className="text-[9px] font-bold text-white tracking-widest">{coin.value} MK</span>
                          </div>
                       </div>
                    </button>
                  ))}
                </div>

                {(phase === 'COMPLETED' || phase === 'FAILED') && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
                    <div className="text-center p-20 border border-[#00f3ff]/30 bg-black/60 shadow-[0_0_100px_#00f3ff30] max-w-2xl">
                      {phase === 'COMPLETED' ? <Trophy size={100} className="text-[#00f3ff] mx-auto mb-8 animate-bounce" /> : <AlertTriangle size={100} className="text-red-500 mx-auto mb-8" />}
                      <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-8">{phase === 'COMPLETED' ? 'SEKTOR VYČIŠTĚN' : 'LINK LOST'}</h2>
                      <button onClick={() => setActiveExpedition(false)} className="px-20 py-6 bg-[#00f3ff] text-black font-black uppercase tracking-[0.6em] hover:bg-white transition-all">ODPOJIT</button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-24 px-16 w-full h-full overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' && (
              <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col lg:flex-row items-center gap-16 p-16 bg-white/[0.02] border border-white/10 rounded">
                  <div className="w-56 h-56 border-2 border-[#00f3ff] p-2 bg-black shadow-[0_0_40px_#00f3ff20]">
                    <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={80} className="text-white/10" /></div>
                  </div>
                  <div className="space-y-8 flex-1">
                    <h2 className="text-6xl font-black text-white italic uppercase neon-glow-cyan leading-none">ADMIN_77</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="border-l-4 border-[#00f3ff] pl-6 py-2 bg-white/[0.03]"><span className="text-[10px] text-[#00f3ff] uppercase font-bold tracking-widest block mb-1">RESERVY</span><span className="text-4xl font-black text-white tabular-nums">{mikelaReserves.toLocaleString()} MK</span></div>
                      <div className="border-l-4 border-[#ff00ff] pl-6 py-2 bg-white/[0.03]"><span className="text-[10px] text-[#ff00ff] uppercase font-bold tracking-widest block mb-1">REPUTACE</span><span className="text-4xl font-black text-white tabular-nums">{reputation.toLocaleString()} XP</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-16 animate-in zoom-in duration-700">
                <Compass size={200} className="text-[#00f3ff] animate-spin-slow drop-shadow-[0_0_50px_#00f3ff60]" />
                <div className="text-center space-y-6">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-[0.3em] neon-glow-cyan">VSTOUPIT DO MATRIXU</h2>
                  <p className="text-sm text-[#00f3ff]/60 uppercase font-black tracking-widest">Sektor 0x{expeditionLevel.toString(16).toUpperCase()} vyžaduje autorizaci</p>
                </div>
                <button 
                  onClick={() => openVideoAd(true)}
                  className="group relative px-24 py-8 border-2 border-[#00f3ff] text-2xl font-black uppercase tracking-[0.6em] hover:bg-[#00f3ff] hover:text-black transition-all shadow-[0_0_60px_#00f3ff30]"
                >
                  AUTORIZOVAT START
                </button>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-right-12 duration-1000">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.6, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-12 border border-white/10 bg-white/[0.02] flex flex-col group ${!canAfford && 'opacity-40 grayscale'}`}>
                        <div className="flex justify-between items-start mb-12">
                          <u.icon className="text-[#ff00ff]" size={48} />
                          <span className="text-4xl font-black text-[#ff00ff] italic">v{u.level}</span>
                        </div>
                        <h4 className="text-2xl font-black text-white uppercase mb-4">{u.name}</h4>
                        <p className="text-xs text-white/40 uppercase mb-12 leading-loose tracking-widest">{u.desc}</p>
                        <button 
                          onClick={() => { if(canAfford) { setMikelaReserves(p => p - cost); setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item)); } }}
                          disabled={!canAfford}
                          className={`w-full py-6 border font-black uppercase tracking-widest transition-all ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_20px_#ff00ff20]' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? `UPGRADE | ${cost} MK` : 'LOCKED'}
                        </button>
                      </div>
                    )
                  })}
               </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.8); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; }
        .pixelated { image-rendering: pixelated; }
        .tactical-grid {
          background-image: linear-gradient(to right, #00f3ff 1px, transparent 1px), linear-gradient(to bottom, #00f3ff 1px, transparent 1px);
          background-size: 80px 80px;
          animation: grid-scroll 40s linear infinite;
        }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes grid-scroll { from { background-position: 0 0; } to { background-position: 80px 80px; } }
        .neon-glow-cyan { text-shadow: 0 0 10px #00f3ff; }
        
        /* Fluid Player Overrides */
        .fluid_video_wrapper {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 10 !important;
        }
      `}</style>
    </div>
  );
};