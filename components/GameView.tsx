
import React, { useState, useEffect, useRef } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon, PlayCircle, Lock, ExternalLink, RefreshCw, Eye, Signal, Volume2, HardDrive, Cpu, LayoutPanelLeft, Share2 } from 'lucide-react';
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

const VIDEO_AD_URL = "https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy";

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
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
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [isVideoForStart, setIsVideoForStart] = useState(false);
  const [adTimeRemaining, setAdTimeRemaining] = useState(60);
  const [maxAdDuration, setMaxAdDuration] = useState(60);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstance = useRef<any>(null);
  const adFinishedRef = useRef(false);

  // Refs for internal logic to avoid stale closures
  const isVideoForStartRef = useRef(false);
  const activeCoinIdRef = useRef<string | null>(null);

  const calculateTotalDuration = (level: number) => Math.max(15, 20 + (level - 1) * 4);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  const startExpedition = () => {
    const baseDuration = calculateTotalDuration(expeditionLevel);
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

  const handleRewardOnAdFinish = () => {
    if (adFinishedRef.current) return;
    adFinishedRef.current = true;

    if (isVideoForStartRef.current) {
      startExpedition();
    } else if (activeCoinIdRef.current) {
      const coinId = activeCoinIdRef.current;
      setCoins(prev => {
        const coin = prev.find(c => c.id === coinId);
        if (coin) {
          setMikelaReserves(m => m + coin.value);
          addLog(`Overview: Data úspěšně přenesena (+${coin.value} MK)`, 'success');
        }
        return prev.filter(c => c.id !== coinId);
      });
      activeCoinIdRef.current = null;
    }

    setVideoAdVisible(false);
    if (playerInstance.current) {
      try { playerInstance.current.destroy(); } catch(e) {}
      playerInstance.current = null;
    }
  };

  const openVideoAd = (forStart: boolean = false) => {
    adFinishedRef.current = false;
    setIsVideoForStart(forStart);
    isVideoForStartRef.current = forStart;
    setAdTimeRemaining(60); // Default fallback
    setMaxAdDuration(60);
    setVideoAdVisible(true);
  };

  useEffect(() => {
    let countdownInterval: ReturnType<typeof setInterval>;
    let durationCheckInterval: ReturnType<typeof setInterval>;

    if (videoAdVisible && videoRef.current && (window as any).fluidPlayer) {
      // Initialize Fluid Player
      playerInstance.current = (window as any).fluidPlayer(videoRef.current, {
        layoutControls: {
          fillToContainer: true,
          autoPlay: true,
          mute: false,
          allowDownload: false,
          playbackRateControl: false,
          persistentSettings: { volume: false },
          adProgressbarColor: '#00f3ff'
        },
        vastOptions: {
          adList: [
            {
              roll: 'preRoll',
              vastTag: VIDEO_AD_URL
            }
          ],
          adStartedCallback: () => {
            console.log("Fluid Player: Ad Started. Syncing duration with Overview panel...");
            // Detect actual ad duration from the video element Fluid Player uses
            durationCheckInterval = setInterval(() => {
              const videoElement = videoRef.current;
              if (videoElement && videoElement.duration && videoElement.duration > 0 && videoElement.duration !== Infinity) {
                const actualDuration = Math.ceil(videoElement.duration);
                console.log(`Detected duration: ${actualDuration}s`);
                setAdTimeRemaining(actualDuration);
                setMaxAdDuration(actualDuration);
                clearInterval(durationCheckInterval);
              }
            }, 200);
            
            // Timeout safety for duration check
            setTimeout(() => clearInterval(durationCheckInterval), 5000);
          },
          adFinishedCallback: () => {
            console.log("Fluid Player: Ad Finished naturally. Triggering Overview completion.");
            handleRewardOnAdFinish();
          }
        }
      });

      // Overview UI countdown synchronizer
      countdownInterval = setInterval(() => {
        setAdTimeRemaining(prev => {
          if (prev <= 1) {
            // If the timer reaches zero and the ad is still somehow running, we force close for user experience
            if (!adFinishedRef.current) {
               console.log("Overview: Timer expired. Auto-terminating player.");
               handleRewardOnAdFinish();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownInterval) clearInterval(countdownInterval);
        if (durationCheckInterval) clearInterval(durationCheckInterval);
        if (playerInstance.current) {
          try { playerInstance.current.destroy(); } catch(e) {}
          playerInstance.current = null;
        }
      };
    }
  }, [videoAdVisible]);

  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);
  const [currentExpeditionDuration, setCurrentExpeditionDuration] = useState<number>(0);

  const handleAdDestroyed = (id: number) => {
    setActiveAds(prev => prev.filter(ad => ad.id !== id));
    setAdsDestroyed(prev => prev + 1);
    addLog(`Anomálie eliminována: +1 fragment`, 'success');
    
    setTimeout(() => {
      if (activeExpedition && timeLeft > 4) {
        setActiveAds(prev => [...prev, { id: Date.now() }]);
      }
    }, 2500);
  };

  const handleCoinClick = (id: string) => {
    setActiveCoinId(id);
    activeCoinIdRef.current = id;
    openVideoAd(false);
  };

  useEffect(() => {
    if (!activeExpedition || !expeditionEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = expeditionEndTime - now;
      const remaining = Math.max(0, Math.ceil(delta / 1000));
      setTimeLeft(remaining);
      
      const elapsed = currentExpeditionDuration - remaining;
      const currentProgress = Math.min(100, Math.floor((elapsed / currentExpeditionDuration) * 100));
      setProgress(currentProgress);

      setPhase(prev => {
        if (currentProgress < 15) return 'STARTING';
        if (currentProgress < 85) return 'TRAVELING';
        return 'EXTRACTING';
      });

      if (Math.random() < 0.05 && coins.length < 2 && currentProgress > 20 && currentProgress < 80) {
        setCoins(prev => [...prev, {
          id: Math.random().toString(),
          x: 20 + Math.random() * 60,
          y: 25 + Math.random() * 50,
          value: Math.floor(120 * expeditionLevel * (1 + Math.random() * 0.5))
        }]);
      }

      if (now >= expeditionEndTime) {
        clearInterval(interval);
        const success = adsDestroyed >= Math.floor(expeditionLevel * 0.7) || Math.random() > 0.4;
        if (success) {
          setPhase('COMPLETED');
          const reward = Math.floor(120 * expeditionLevel + (adsDestroyed * 35));
          setMikelaReserves(p => p + reward);
          setReputation(p => p + expeditionLevel * 40);
          setExpeditionLevel(p => p + 1);
        } else {
          setPhase('FAILED');
        }
        setActiveAds([]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeExpedition, expeditionEndTime, adsDestroyed, expeditionLevel, phase, coins]);

  return (
    <div className="flex h-full w-full bg-[#020202] border-t border-[#00f3ff]/10 relative overflow-hidden font-mono text-[#00f3ff]">
      
      {/* OVERVIEW VIDEO MODAL - HIGH PRIORITY UI */}
      {videoAdVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-black border-2 border-[#00f3ff]/50 shadow-[0_0_150px_rgba(0,243,255,0.2)] relative overflow-hidden flex flex-col">
            
            {/* Overview Header */}
            <div className="p-5 border-b border-[#00f3ff]/30 flex justify-between items-center bg-[#050505] z-[1001]">
               <div className="flex items-center gap-4">
                 <LayoutPanelLeft className="text-[#00f3ff] animate-pulse" size={24} />
                 <span className="text-[14px] font-black uppercase tracking-[0.5em] neon-glow-cyan">Overview</span>
               </div>
               <div className="flex items-center gap-6">
                  <div className="h-6 w-[2px] bg-white/10" />
                  <button onClick={() => setVideoAdVisible(false)} className="text-[#ff00ff] hover:text-white transition-all transform hover:rotate-90">
                    <X size={28} />
                  </button>
               </div>
            </div>

            {/* OVERVIEW DATA TRANSFER STATUS */}
            <div className="relative w-full z-[1000] bg-black/90 backdrop-blur-xl border-b border-[#00f3ff]/20 p-8 flex items-center justify-between shadow-2xl overflow-hidden">
               <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00f3ff_2px,#00f3ff_3px)]" />
               </div>
               
               <div className="flex items-center gap-8 relative">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00f3ff]/20 blur-3xl animate-ping" />
                    <Share2 size={42} className="text-[#00f3ff] relative animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[18px] font-black uppercase tracking-[0.4em] text-[#00f3ff] mb-1">OVERVIEW: PŘENOS DAT</span>
                    <div className="flex items-center gap-3">
                       <span className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-black">UPLINK_SYNCHRONIZATION_ACTIVE</span>
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-[#ff00ff] animate-bounce" style={{animationDelay: '0s'}} />
                          <div className="w-1.5 h-1.5 bg-[#ff00ff] animate-bounce" style={{animationDelay: '0.2s'}} />
                          <div className="w-1.5 h-1.5 bg-[#ff00ff] animate-bounce" style={{animationDelay: '0.4s'}} />
                       </div>
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-12 relative">
                  <div className="text-right">
                    <span className="text-[12px] text-white/40 uppercase font-black block mb-3 tracking-[0.1em]">ČAS DO DOKONČENÍ PŘENOSU</span>
                    <div className="flex items-center gap-6">
                       <span className="text-5xl font-black text-[#ff00ff] tabular-nums tracking-widest drop-shadow-[0_0_20px_#ff00ff]">
                          {String(adTimeRemaining).padStart(2, '0')}<span className="text-sm ml-1 opacity-50 uppercase">sec</span>
                       </span>
                       <div className="w-80 h-6 bg-white/5 border-2 border-white/20 rounded-full overflow-hidden p-[5px] shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] shadow-[0_0_25px_#00f3ff] transition-all duration-1000 ease-linear rounded-full"
                            style={{ width: `${(adTimeRemaining / maxAdDuration) * 100}%` }}
                          />
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Fluid Player Component Area */}
            <div className="aspect-video bg-[#000] relative flex flex-col items-center justify-center overflow-hidden z-0 shadow-[inset_0_0_100px_rgba(0,0,0,1)]">
               <div className="w-full h-full relative">
                  <video ref={videoRef} id="video-ad-player" className="w-full h-full">
                    <source src="" type="video/mp4" />
                  </video>
                  {/* Digital overlay on video */}
                  <div className="absolute inset-0 pointer-events-none z-10 opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
               </div>
            </div>

            {/* Overview Technical Stats */}
            <div className="p-4 bg-[#050505] flex justify-between items-center border-t border-white/10 px-10">
               <div className="flex items-center gap-8 opacity-40">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest text-white/60">NODE_ID</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#00f3ff]">0x7F_VAST_SYNC</span>
                  </div>
                  <div className="flex flex-col border-l border-white/10 pl-6">
                    <span className="text-[8px] uppercase tracking-widest text-white/60">STATUS</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#00f3ff]">AUTO_CLOSE_ON_FINISH</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-widest text-white/40">INTEGRITY</span>
                    <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest">ENCRYPTED_LINK_v3.4</span>
                  </div>
                  <Activity size={20} className="text-[#00f3ff] animate-pulse" />
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-20 md:w-64 border-r border-white/5 bg-black/60 flex flex-col py-8 z-20 backdrop-blur-md">
        <div className="mb-14 flex flex-col items-center gap-3">
          <Database className="text-[#00f3ff] animate-pulse" size={28} />
          <span className="hidden md:block text-[9px] text-[#00f3ff]/40 uppercase font-black tracking-[0.6em]">MATRIX_CONTROL</span>
        </div>
        <nav className="flex-1 space-y-3 px-3">
          {[
            { id: 'profile' as GameTab, icon: User, label: 'Profil' },
            { id: 'expeditions' as GameTab, icon: Compass, label: 'Expedice' },
            { id: 'items' as GameTab, icon: Package, label: 'Arzenál' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-5 transition-all duration-300 rounded-xl ${activeTab === item.id ? 'bg-[#00f3ff]/15 text-[#00f3ff] border-r-4 border-[#00f3ff] shadow-[inset_0_0_20px_rgba(0,243,255,0.15)]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
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
            {/* HUD Header */}
            <div className="px-12 py-8 border-b border-white/10 bg-black/95 flex justify-between items-center backdrop-blur-3xl z-10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-12">
                <div className="space-y-2">
                  <span className="text-[9px] text-[#00f3ff]/40 uppercase font-black block tracking-[0.2em]">Deep_Sector</span>
                  <span className="text-2xl font-black text-white italic uppercase tracking-[0.25em] neon-glow-cyan">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="h-12 w-[2px] bg-white/10" />
                <div className="space-y-2">
                  <span className="text-[9px] text-[#ff00ff]/40 uppercase font-black block tracking-[0.2em]">Uplink_Signal</span>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-ping" />
                    <span className="text-sm font-black text-[#00f3ff] uppercase tracking-[0.2em]">{phase}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-10">
                <div className="text-right border-r border-white/10 pr-10">
                   <span className="text-[9px] text-white/30 uppercase font-black block mb-1.5 tracking-widest">Fragments_Analyzed</span>
                   <span className="text-lg font-black text-[#ff00ff] tabular-nums tracking-widest">{adsDestroyed} <span className="text-[10px] opacity-40">/ {Math.floor(expeditionLevel * 0.7)}</span></span>
                </div>
                <div className="flex items-center gap-6 bg-[#00f3ff]/5 border-2 border-[#00f3ff]/20 px-12 py-5 rounded-lg shadow-[inset_0_0_15px_rgba(0,243,255,0.6)]">
                  <Clock className="text-[#00f3ff] animate-pulse" size={24} />
                  <span className="text-3xl font-mono font-black text-[#00f3ff] tabular-nums drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical View */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative bg-[#010101] overflow-hidden">
                <div className="absolute inset-0 tactical-grid opacity-[0.15]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.95)_100%)] pointer-events-none" />
                
                {/* Ads Layer */}
                <div className="absolute inset-0 z-30 pointer-events-none p-20 flex flex-col items-center gap-12">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="pointer-events-auto shadow-[0_0_60px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-12 duration-700 hover:scale-105 transition-transform">
                      <AdBanner onDestroyed={() => handleAdDestroyed(ad.id)} playerAtk={upgrades[0].level} />
                    </div>
                  ))}
                </div>

                {/* Coins/Data Layer */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {coins.map(coin => (
                    <button 
                      key={coin.id}
                      onClick={() => handleCoinClick(coin.id)}
                      className="absolute pointer-events-auto group animate-in zoom-in duration-1000"
                      style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
                    >
                       <div className="relative hover:scale-150 transition-transform duration-500">
                          <div className="absolute inset-0 bg-[#ff00ff] blur-3xl opacity-50 animate-pulse" />
                          <div className="bg-black border-2 border-[#ff00ff] p-6 flex flex-col items-center gap-3 shadow-[0_0_50px_rgba(255,0,255,0.5)] group-hover:border-white group-hover:shadow-[0_0_80px_rgba(255,255,255,0.3)] transition-all">
                            <Coins className="text-[#ff00ff] group-hover:text-white group-hover:animate-bounce" size={40} />
                            <div className="text-center space-y-1">
                               <span className="text-[10px] font-black text-white bg-[#ff00ff] px-3 py-1 tracking-tighter block">DECRYPT_UPLINK</span>
                               <span className="text-[9px] font-bold text-[#ff00ff] tracking-[0.1em] group-hover:text-white">{coin.value} MK</span>
                            </div>
                          </div>
                       </div>
                    </button>
                  ))}
                </div>

                {/* Status HUD Overlays */}
                {phase === 'COMPLETED' && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in zoom-in duration-700">
                    <div className="text-center p-24 border-2 border-[#00f3ff] bg-black/60 shadow-[0_0_150px_rgba(0,243,255,0.4)] max-w-3xl border-dashed">
                      <Trophy size={140} className="text-[#00f3ff] mx-auto mb-12 animate-bounce neon-glow-cyan" />
                      <h2 className="text-8xl font-black text-white italic uppercase tracking-tighter mb-8 neon-glow-cyan">SEKTOR_VYČIŠTĚN</h2>
                      <p className="text-sm text-[#00f3ff] uppercase font-black mb-16 tracking-[0.5em] opacity-80 animate-pulse">Data Secured | Connection Stable | Rewarding Uplink</p>
                      <button onClick={() => setActiveExpedition(false)} className="group relative px-32 py-10 bg-[#00f3ff] text-black font-black uppercase tracking-[0.8em] hover:bg-white transition-all text-lg overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.5)]">
                        <span className="relative z-10">ODPOJIT_LINK</span>
                        <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal sidebar */}
              <div className="w-80 border-l border-white/5 bg-[#020202] flex flex-col shadow-[-30px_0_60px_rgba(0,0,0,0.8)] z-10">
                <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/60">
                  <div className="flex items-center gap-4">
                    <Terminal size={20} className="text-[#00f3ff] animate-pulse" />
                    <span className="text-[11px] text-[#00f3ff] font-black uppercase tracking-[0.4em]">SYSTEM_LOG</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className={`text-[11px] uppercase leading-relaxed border-l-3 pl-5 transition-all animate-in slide-in-from-right-6 duration-500 ${log.type === 'success' ? 'border-green-500 text-green-400' : log.type === 'error' ? 'border-red-600 text-red-500' : 'border-[#00f3ff]/40 text-[#00f3ff]/60'}`}>
                      <div className="flex justify-between items-center opacity-40 text-[8px] mb-2 tracking-[0.1em]">
                         <span>EVENT_NODE_{log.id.slice(-6)}</span>
                         <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <span className="font-black tracking-tight block leading-snug drop-shadow-lg">{log.text}</span>
                    </div>
                  ))}
                </div>
                <div className="p-10 bg-black/95 border-t border-white/10 space-y-8">
                   <div className="space-y-4">
                      <div className="flex justify-between text-[11px] text-[#00f3ff] font-black tracking-[0.4em] uppercase">
                        <span>EXTRAKCE_DAT</span>
                        <span className="neon-glow-cyan font-mono">{progress}%</span>
                      </div>
                      <div className="h-3 bg-white/5 relative rounded-full overflow-hidden p-1 border border-white/10">
                        <div className="h-full bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] shadow-[0_0_25px_rgba(0,243,255,0.8)] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-24 px-16 w-full h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_100%)]">
            {activeTab === 'profile' && (
              <div className="space-y-20 animate-in slide-in-from-bottom-12 duration-1000">
                <div className="flex flex-col lg:flex-row items-center gap-20 p-20 bg-white/[0.02] border-2 border-white/10 relative overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-lg">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-[120px] opacity-10 group-hover:opacity-40 transition-opacity duration-1000" />
                    <div className="relative w-64 h-64 border-4 border-[#00f3ff] p-4 bg-black shadow-[0_0_80px_rgba(0,243,255,0.3)] overflow-hidden group-hover:border-[#ff00ff] transition-colors duration-700">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover pixelated" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={120} className="text-white/10" /></div>}
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#00f3ff] animate-scanline shadow-[0_0_15px_#00f3ff]" />
                    </div>
                  </div>
                  <div className="space-y-10 relative z-10 flex-1 text-center lg:text-left">
                    <div className="space-y-3">
                       <span className="text-[12px] text-[#00f3ff] font-black uppercase tracking-[0.6em] opacity-40 block animate-pulse">Network_Master_Admin</span>
                       <h2 className="text-8xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan leading-none">ADMIN_77</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="flex flex-col border-l-6 border-[#00f3ff] pl-10 py-3 bg-white/[0.03] backdrop-blur-md hover:bg-[#00f3ff]/5 transition-colors group/stat"><span className="text-[11px] text-[#00f3ff] font-black uppercase tracking-[0.4em] mb-3 opacity-60">MIKELA_VAL_RESERVES</span><span className="text-5xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-cyan transition-all">{mikelaReserves.toLocaleString()} MK</span></div>
                      <div className="flex flex-col border-l-6 border-[#ff00ff] pl-10 py-3 bg-white/[0.03] backdrop-blur-md hover:bg-[#ff00ff]/5 transition-colors group/stat"><span className="text-[11px] text-[#ff00ff] font-black uppercase tracking-[0.4em] mb-3 opacity-60">GLOBAL_REPUTATION</span><span className="text-5xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-pink transition-all">{reputation.toLocaleString()} XP</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   {[
                     { label: 'System Tier', val: `0x${expeditionLevel.toString(16).toUpperCase()}`, color: '#00f3ff', icon: Eye },
                     { label: 'Purged Anomalies', val: adsDestroyed, color: '#ff00ff', icon: Zap },
                     { label: 'VAST Integrity', val: 'STABLE', color: '#10b981', icon: Shield }
                   ].map((stat, i) => (
                    <div key={i} className="p-12 border-2 border-white/5 bg-white/[0.01] hover:bg-white/[0.05] transition-all hover:-translate-y-3 duration-500 group relative overflow-hidden">
                       <span className="text-[12px] text-white/40 uppercase font-black tracking-[0.4em] block mb-6">{stat.label}</span>
                       <p className="text-6xl font-black italic tracking-tighter group-hover:scale-110 transition-transform origin-left drop-shadow-2xl" style={{ color: stat.color }}>{stat.val}</p>
                    </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-24 animate-in zoom-in duration-1000">
                <div className="w-full max-w-4xl text-center space-y-24 relative">
                  <div className="absolute inset-0 bg-[#00f3ff] blur-[200px] opacity-10 animate-pulse pointer-events-none" />
                  <div className="relative inline-block scale-125">
                    <Compass size={240} className="text-[#00f3ff] mx-auto relative drop-shadow-[0_0_60px_rgba(0,243,255,0.7)] animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Shield size={80} className="text-[#ff00ff] animate-pulse drop-shadow-[0_0_30px_#ff00ff]" />
                    </div>
                  </div>
                  <div className="space-y-10 relative">
                    <h2 className="text-7xl font-black text-white uppercase italic tracking-[0.4em] leading-tight neon-glow-cyan">VSTOUPIT_DO_MATRIXU</h2>
                    <p className="text-base text-[#00f3ff]/60 max-w-2xl mx-auto leading-loose tracking-[0.3em] uppercase font-black">
                      Detekována hluboká vrstva Sektoru 0x{expeditionLevel.toString(16).toUpperCase()}. <br/> 
                      Nutná autorizace přes uzel <span className="text-[#ff00ff] neon-glow-pink">HilltopAds</span>.
                    </p>
                  </div>
                  <button 
                    onClick={() => openVideoAd(true)}
                    className="group relative px-40 py-12 border-4 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black hover:scale-110 active:scale-95 shadow-[0_0_100px_rgba(0,243,255,0.4)]"
                  >
                    <div className="relative z-10 flex items-center gap-8">
                       <PlayCircle size={40} className="animate-pulse" />
                       <span className="text-4xl font-black uppercase tracking-[0.6em]">AUTORIZOVAT_START</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16 animate-in slide-in-from-right-12 duration-1000">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.6, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-16 border-2 transition-all duration-700 flex flex-col bg-white/[0.01] group relative rounded-sm ${canAfford ? 'border-white/10 hover:border-[#ff00ff]/60 hover:bg-white/[0.04]' : 'border-white/5 opacity-40 grayscale'}`}>
                        <div className="flex justify-between items-start mb-16">
                          <div className="w-28 h-28 bg-black border-2 border-white/10 flex items-center justify-center shadow-[inset_0_0_50px_rgba(255,0,255,0.08)] group-hover:border-[#ff00ff]/50 transition-all">
                            <u.icon className={canAfford ? 'text-[#ff00ff] group-hover:scale-125 transition-transform duration-500' : 'text-white/10'} size={56} />
                          </div>
                          <div className="text-right">
                             <span className="text-[12px] text-white/40 font-black uppercase tracking-[0.4em] block mb-3">Upgrade_Tier</span>
                             <span className="text-6xl font-black text-[#ff00ff] italic group-hover:neon-glow-pink transition-all duration-500">v{u.level}</span>
                          </div>
                        </div>
                        <h4 className="text-4xl font-black text-white uppercase mb-6 tracking-tight group-hover:text-[#ff00ff] transition-colors duration-500">{u.name}</h4>
                        <p className="text-sm text-white/30 uppercase mb-16 leading-loose tracking-[0.25em] font-black">{u.desc}</p>
                        <button 
                          onClick={() => {
                            if(canAfford) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-10 border-3 font-black text-base uppercase tracking-[0.5em] transition-all mt-auto flex items-center justify-center gap-6 shadow-2xl ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_30px_rgba(255,0,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? (
                            <>AKTUALIZOVAT_KÓD | {cost.toLocaleString()} MK</>
                          ) : (
                            <><Lock size={24} /> REZERVY_VYČERPÁNY</>
                          )}
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
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.8); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; border-radius: 20px; border: 2px solid rgba(0,0,0,0.8); }
        .pixelated { image-rendering: pixelated; }
        .tactical-grid {
          background-image: 
            linear-gradient(to right, #00f3ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f3ff 1px, transparent 1px);
          background-size: 100px 100px;
          animation: grid-scroll 60s linear infinite;
        }
        .animate-spin-slow { animation: spin 25s linear infinite; }
        .animate-scanline { animation: scanline 5s linear infinite; }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 100px 100px; }
        }
        .neon-glow-cyan { text-shadow: 0 0 10px #00f3ff, 0 0 20px #00f3ff; }
        .neon-glow-pink { text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff; }
      `}</style>
    </div>
  );
};
