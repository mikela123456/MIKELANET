import React, { useState, useEffect, useRef } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon, PlayCircle, Lock, ExternalLink, RefreshCw, Eye, Signal, Volume2 } from 'lucide-react';
import { AdBanner } from './AdBanner';

type GameTab = 'profile' | 'expeditions' | 'items';
type ExpeditionPhase = 'STARTING' | 'TRAVELING' | 'EXTRACTING' | 'COMPLETED' | 'FAILED';
type AdSystem = 'HILLTOP' | 'IMA';

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
    videojs: any;
    google: any;
  }
}

// Ad Configs
const HILLTOP_VAST_URL = "https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy";
const IMA_AD_TAG_URL = "https://youradexchange.com/video/select.php?r=10948866";
const AD_WATCH_DURATION = 60; 

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
  const [videoAdTimer, setVideoAdTimer] = useState(0);
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [isVideoForStart, setIsVideoForStart] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [currentAdSystem, setCurrentAdSystem] = useState<AdSystem>('HILLTOP');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstance = useRef<any>(null);

  const calculateTotalDuration = (level: number) => Math.max(15, 20 + (level - 1) * 4);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  const openVideoAd = (forStart: boolean = false) => {
    setIsVideoForStart(forStart);
    setVideoAdVisible(true);
    setVideoAdTimer(AD_WATCH_DURATION);
    setIsAdPlaying(false);
    // Alternate between Hilltop and IMA system
    setCurrentAdSystem(prev => prev === 'HILLTOP' ? 'IMA' : 'HILLTOP');
  };

  const claimVideoReward = () => {
    if (videoAdTimer > 0) return;
    if (isVideoForStart) {
      startExpedition();
    } else if (activeCoinId) {
      const coin = coins.find(c => c.id === activeCoinId);
      if (coin) {
        setMikelaReserves(prev => prev + coin.value);
        setCoins(prev => prev.filter(c => c.id !== activeCoinId));
        addLog(`Dekódováno: +${coin.value} MK`, 'success');
      }
      setVideoAdVisible(false);
      setActiveCoinId(null);
    } else {
      setVideoAdVisible(false);
    }
  };

  // Improved Ad initialization for both Hilltop and IMA
  useEffect(() => {
    if (!videoAdVisible || !videoRef.current) return;

    if (currentAdSystem === 'HILLTOP' && window.fluidPlayer) {
      try {
        playerInstance.current = window.fluidPlayer(videoRef.current, {
          layoutControls: {
            fillToContainer: true,
            autoPlay: true,
            mute: true,
            allowDownload: false,
            playbackRateControl: false,
            persistentSettings: { volume: false }
          },
          vastOptions: {
            adList: [{ roll: 'preRoll', vastTag: HILLTOP_VAST_URL }],
            adFinishedCallback: () => {
              addLog("Hilltop ad finished.", "success");
            }
          }
        });
        setIsAdPlaying(true);
        addLog("Inicializace HilltopAds VAST...", "info");
      } catch (e) {
        console.error("FluidPlayer error:", e);
        setIsAdPlaying(true);
      }
    } 
    else if (currentAdSystem === 'IMA' && window.videojs) {
      try {
        const player = window.videojs(videoRef.current, {
          autoplay: true,
          muted: true,
          controls: false,
          fluid: true,
          sources: [{
            // Dummy source often needed for some IMA implementations to behave correctly
            src: 'https://vjs.zencdn.net/v/oceans.mp4',
            type: 'video/mp4'
          }]
        });

        player.ima({
          adTagUrl: IMA_AD_TAG_URL,
          showControlsForAds: false,
          debug: false
        });

        // Some browsers require explicit initialization
        player.on('ready', () => {
          if (player.ima && player.ima.initializeAdDisplayContainer) {
            player.ima.initializeAdDisplayContainer();
            player.ima.requestAds();
          }
        });

        player.on('adserror', (e: any) => {
          console.warn("IMA Ads Error:", e);
          addLog("IMA Uplink unstable, waiting for timeout...", "warn");
        });

        playerInstance.current = player;
        setIsAdPlaying(true);
        addLog("Inicializace YourAdExchange IMA...", "info");
      } catch (e) {
        console.error("IMA setup error:", e);
        setIsAdPlaying(true);
      }
    }

    return () => {
      if (playerInstance.current) {
        try {
          if (currentAdSystem === 'HILLTOP') {
            playerInstance.current.destroy();
          } else {
            playerInstance.current.dispose();
          }
        } catch(e) {}
        playerInstance.current = null;
      }
    };
  }, [videoAdVisible, currentAdSystem]);

  // Unified timer for 60s watch requirement
  useEffect(() => {
    let timer: number;
    if (videoAdVisible && isAdPlaying && videoAdTimer > 0) {
      timer = window.setInterval(() => {
        setVideoAdTimer(prev => prev - 1);
      }, 1000);
    } else if (videoAdVisible && isAdPlaying && videoAdTimer === 0) {
      const autoCloseTimeout = setTimeout(() => {
        claimVideoReward();
      }, 1500);
      return () => clearTimeout(autoCloseTimeout);
    }
    return () => clearInterval(timer);
  }, [videoAdVisible, isAdPlaying, videoAdTimer]);

  const startExpedition = () => {
    setVideoAdVisible(false);
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

  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);
  const [currentExpeditionDuration, setCurrentExpeditionDuration] = useState<number>(0);

  const handleCoinClick = (id: string) => {
    setActiveCoinId(id);
    openVideoAd(false);
    addLog("Iniciuji dekódování datového fragmentu...", "info");
  };

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
      
      {/* IMPROVED VIDEO AD MODAL */}
      {videoAdVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-4xl bg-black border-2 border-[#00f3ff]/40 shadow-[0_0_150px_rgba(0,243,255,0.2)] relative overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-[#00f3ff]/20 flex justify-between items-center bg-[#050505]">
               <div className="flex items-center gap-4">
                 <Signal className="text-red-600 animate-pulse" size={20} />
                 <span className="text-sm font-black uppercase tracking-[0.25em]">
                   {currentAdSystem === 'HILLTOP' ? 'SECURE_CHANNEL_HILLTOP' : 'SECURE_CHANNEL_IMA'}
                 </span>
               </div>
            </div>

            <div className="aspect-video bg-[#010101] relative flex flex-col items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_70%)] pointer-events-none" />

               <div className="w-full h-full z-10 flex items-center justify-center">
                  <video ref={videoRef} id="my-video" className="video-js vjs-default-skin w-full h-full" playsInline>
                    <source src="" type="video/mp4" />
                  </video>
               </div>
               
               <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-6 z-30 pointer-events-none">
                  {videoAdTimer > 0 ? (
                    <div className="flex flex-col items-center gap-4 bg-black/80 px-12 py-6 border border-[#00f3ff]/20 backdrop-blur-md shadow-2xl pointer-events-auto">
                       <div className="flex items-center gap-6">
                         {!isAdPlaying ? (
                            <Loader2 className="animate-spin text-[#00f3ff]" size={20} />
                         ) : (
                            <Activity className="text-[#00f3ff] animate-pulse" size={20} />
                         )}
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#00f3ff]">DATOVÝ_TOK_AKTIVNÍ</span>
                            <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold">ZABEZPEČENO: {videoAdTimer}S</span>
                         </div>
                       </div>
                       <div className="w-64 h-2 bg-white/5 relative rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] transition-all duration-1000 linear shadow-[0_0_10px_#00f3ff]" style={{ width: `${(1 - videoAdTimer/AD_WATCH_DURATION) * 100}%` }} />
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 animate-in zoom-in slide-in-from-bottom-8 duration-700 pointer-events-auto">
                       <div className="flex items-center gap-3 bg-green-500/20 border-2 border-green-500/50 px-8 py-3 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                          <Shield size={18} className="text-green-400" />
                          <p className="text-xs font-black uppercase tracking-[0.25em] text-green-400">PŘENOS_DOKONČEN</p>
                       </div>
                       <div className="bg-black/40 px-6 py-2 border border-white/10 text-[9px] uppercase tracking-widest text-white/40">
                          Probíhá dekódování a odměna...
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-4 bg-[#050505] flex justify-between items-center border-t border-white/5 px-8">
               <span className="text-[8px] opacity-20 uppercase tracking-[0.4em]">Protocol: {currentAdSystem === 'HILLTOP' ? 'HilltopAds_VAST' : 'VideoJS_IMA_v3'} | 0xDEADBEEF</span>
               <div className="flex gap-4">
                  {/* Fixed Manual link - point to developer page instead of raw VAST XML to avoid the 'no style information' error */}
                  <button 
                    onClick={() => window.open(currentAdSystem === 'HILLTOP' ? 'https://hilltopads.com' : 'https://www.google.com/ads/publisher/', '_blank')} 
                    className="text-[8px] uppercase tracking-widest text-[#00f3ff]/40 hover:text-white flex items-center gap-1"
                  >
                    <ExternalLink size={10} /> Manuální_Odkaz
                  </button>
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
                      Nutná autorizace přes uzel <span className="text-[#ff00ff] neon-glow-pink">MULTI_AD_SWITCH</span>.
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
                          className={`w-full py-10 border-3 font-black text-base uppercase tracking-[0.5em] transition-all mt-auto flex items-center justify-center gap-6 shadow-2xl ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_30px_rgba(255,0,255,0.2)] hover:shadow-[0_0_60px_rgba(255,0,255,0.5)]' : 'border-white/10 text-white/10'}`}
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
        .video-js.vjs-fluid { height: 100% !important; padding-top: 0 !important; }
      `}</style>
    </div>
  );
};