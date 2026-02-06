import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Zap, Compass, Truck, Timer, Trophy, Shield, Activity, Clock, Database, PlayCircle, Lock, Signal, Sword, Cpu, Wifi, RefreshCw, Loader2 } from 'lucide-react';

type GameTab = 'profile' | 'expeditions' | 'items';
type ExpeditionPhase = 'COMBAT' | 'HARVESTING' | 'STABILIZING' | 'COMPLETED' | 'FAILED';
type AdSystem = 'HILLTOP' | 'CLICKADILLA' | 'ONCLICKA';

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

declare global {
  interface Window {
    fluidPlayer: any;
  }
}

const HILLTOP_VAST_URL = "https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy";
const CLICKADILLA_VAST_URL = "https://vast.yomeno.xyz/vast?spot_id=1480488";
const ONCLICKA_VAST_URL = "https://bid.onclckstr.com/vast?spot_id=6109953";

// Lokální video soubor dle požadavku
const LOCAL_VIDEO_SRC = "/MIKELANET.mp4";

/**
 * AFK Modul - VideoStation
 * - Reboot každých 60s (zavření -> otevření)
 * - Ad -> MIKELANET.mp4
 * - Fix 'Unknown in-stream ad type'
 */
const VideoStation: React.FC<{ 
  system: AdSystem, 
  nodeKey: number, 
  onLog: (msg: string, type: any) => void 
}> = ({ system, nodeKey, onLog }) => {
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const vastUrls: Record<AdSystem, string> = {
    HILLTOP: HILLTOP_VAST_URL,
    CLICKADILLA: CLICKADILLA_VAST_URL,
    ONCLICKA: ONCLICKA_VAST_URL
  };

  useEffect(() => {
    let isMounted = true;

    const cleanup = () => {
      document.body.classList.remove('ad-playing');
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };

    const init = async () => {
      // 1. Vizualizace vypnutí (Zavření)
      setIsTransitioning(true);
      setIsAdPlaying(false);
      setCurrentSrc("");
      cleanup();

      // Čekání na vyčištění DOMu a efekt restartu
      await new Promise(r => setTimeout(r, 1000));
      
      if (!isMounted || !videoRef.current || !window.fluidPlayer) return;

      try {
        setIsTransitioning(false);
        // 2. Zapnutí a inicializace nového přehrávače
        playerRef.current = window.fluidPlayer(videoRef.current, {
          layoutControls: {
            fillToContainer: true,
            autoPlay: true,
            mute: false, // Vynucený zvuk
            allowDownload: false,
            playbackRateControl: false,
            controlBar: { autoHide: true },
            playButtonShowing: false,
            // FIX: 'Unknown in-stream ad type' - definujeme striktní chování pro pauzu a overlay
            htmlOnPauseBlock: { html: null, width: 0, height: 0 },
            logo: { imageUrl: null },
          },
          vastOptions: {
            adList: [{ roll: 'preRoll', vastTag: vastUrls[system] }],
            adStartedCallback: () => {
              setIsAdPlaying(true);
              document.body.classList.add('ad-playing');
              onLog(`[Uzel ${system}] Reklama autorizována. ZVUK ON.`, 'info');
            },
            adFinishedCallback: () => {
              setIsAdPlaying(false);
              document.body.classList.remove('ad-playing');
              setCurrentSrc(LOCAL_VIDEO_SRC);
              onLog(`[Uzel ${system}] Ad hotova. Spouštím MIKELANET.mp4`, 'success');
              
              if (videoRef.current) {
                videoRef.current.src = LOCAL_VIDEO_SRC;
                videoRef.current.play().catch(e => console.warn("Local play failed:", e));
              }
            },
            adErrorCallback: (err: any) => {
              console.error("FluidVastError:", err);
              setIsAdPlaying(false);
              document.body.classList.remove('ad-playing');
              setCurrentSrc(LOCAL_VIDEO_SRC);
              onLog(`[Uzel ${system}] In-Stream Error. Bypass -> MIKELANET.mp4`, 'error');
              
              if (videoRef.current) {
                videoRef.current.src = LOCAL_VIDEO_SRC;
                videoRef.current.play().catch(e => console.warn("Local fallback failed:", e));
              }
            }
          }
        });

        // Nastavíme výchozí video na MIKELANET, Fluid ho přehraje po reklamě (pokud ad neselže)
        if (videoRef.current) {
           videoRef.current.src = LOCAL_VIDEO_SRC;
        }

      } catch (err) {
        console.error("Player Init Error:", err);
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [nodeKey, system]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col border-2 border-[#00f3ff]/40 bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)] relative z-50 rounded-sm overflow-hidden">
      {/* Station Meta Header */}
      <div className="bg-[#050505] p-2 flex justify-between items-center border-b border-[#00f3ff]/20">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isAdPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]'}`} />
          <span className="text-[9px] uppercase font-black tracking-[0.2em] text-[#00f3ff]/80">
            {isAdPlaying ? 'SECURITY_AD_OVERRIDE' : 'MIKELANET_DATA_STREAM'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#00f3ff] text-[9px] font-black uppercase tracking-widest opacity-60">
           NODE: {system} | REBOOT_CYCLE: 60s
        </div>
      </div>
      
      <div className="aspect-video bg-black flex items-center justify-center relative">
        {/* Reboot Animation Overlay */}
        {isTransitioning && (
          <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
             <RefreshCw className="text-[#00f3ff] animate-spin" size={60} />
             <span className="text-[12px] font-black tracking-[1em] text-[#00f3ff] animate-pulse uppercase">REBOOTING_STATION...</span>
          </div>
        )}

        {/* Video Element for both Ad and MIKELANET */}
        <div className={`w-full h-full ${isTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'} transition-all duration-700`}>
          <video 
            ref={videoRef} 
            className="video-js vjs-default-skin w-full h-full" 
            playsInline 
            loop={!!currentSrc}
          >
            <source src={currentSrc} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
};

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [mikelaReserves, setMikelaReserves] = useState(150);
  const [reputation, setReputation] = useState(1240);
  const [expeditionLevel, setExpeditionLevel] = useState(1);
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: 'atk', name: 'Útočný Protokol', icon: Sword, level: 1, baseCost: 50, desc: 'Zvyšuje efektivitu v bojové fázi expedice.' },
    { id: 'spd', name: 'Tachyonový Pohon', icon: Compass, level: 1, baseCost: 40, desc: 'Zkracuje časovou náročnost operací.' },
    { id: 'trns', name: 'Datový Uzel', icon: Truck, level: 1, baseCost: 30, desc: 'Zvyšuje rychlost sběru fragmentů.' },
    { id: 'tm', name: 'Forging Modul', icon: Timer, level: 1, baseCost: 60, desc: 'Zvyšuje výnos MIKELA z každé mise.' },
  ]);

  const [activeExpedition, setActiveExpedition] = useState(false);
  const [phase, setPhase] = useState<ExpeditionPhase>('COMBAT');
  const [timeLeft, setTimeLeft] = useState(180); 
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  
  const [currentAdSystem, setCurrentAdSystem] = useState<AdSystem>('HILLTOP');
  const [nodeKey, setNodeKey] = useState(0);
  const [cycleTimer, setCycleTimer] = useState(60); 

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 15));
  };

  const startExpedition = () => {
    setTimeLeft(180);
    setActiveExpedition(true);
    setPhase('COMBAT');
    setLogs([]);
    setNodeKey(k => k + 1);
    setCycleTimer(60);
    addLog(`Operace započata. Sektor 0x${expeditionLevel.toString(16).toUpperCase()}`, 'info');
    addLog(`AFK-Mining: Reboot cyklus 60s nastaven.`, 'warn');
  };

  const finishExpedition = () => {
    const baseReward = 200 * expeditionLevel;
    const bonusMultiplier = 1 + (upgrades.find(u => u.id === 'tm')!.level * 0.15);
    const totalReward = Math.floor(baseReward * bonusMultiplier);
    
    setMikelaReserves(p => p + totalReward);
    setReputation(p => p + expeditionLevel * 60);
    setExpeditionLevel(p => p + 1);
    setPhase('COMPLETED');
    addLog(`Uplink kompletní. Odměna: +${totalReward} MK`, 'success');
  };

  // Nezávislý 60s cyklus rebootu přehrávače
  useEffect(() => {
    if (!activeExpedition || phase === 'COMPLETED') return;

    const interval = setInterval(() => {
      setCycleTimer(prev => {
        if (prev <= 1) {
          setCurrentAdSystem(current => {
            if (current === 'HILLTOP') return 'CLICKADILLA';
            if (current === 'CLICKADILLA') return 'ONCLICKA';
            return 'HILLTOP';
          });
          setNodeKey(k => k + 1); // Spustí reboot VideoStation
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExpedition, phase]);

  // Časovač celé expedice (3 minuty)
  useEffect(() => {
    if (!activeExpedition || timeLeft <= 0 || phase === 'COMPLETED') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        const progress = ((180 - next) / 180) * 100;
        
        if (progress < 30) setPhase('COMBAT');
        else if (progress < 80) setPhase('HARVESTING');
        else setPhase('STABILIZING');

        if (next <= 0) {
          finishExpedition();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExpedition, timeLeft, phase]);

  const progressPercent = useMemo(() => Math.floor(((180 - timeLeft) / 180) * 100), [timeLeft]);

  return (
    <div className="flex h-full w-full bg-[#020202] border-t border-[#00f3ff]/10 relative overflow-hidden font-mono text-[#00f3ff]">
      
      {/* Aside Nav */}
      <aside className="w-20 md:w-64 border-r border-white/5 bg-black/60 flex flex-col py-8 z-20 backdrop-blur-md">
        <div className="mb-14 flex flex-col items-center gap-3">
          <Database className="text-[#00f3ff] animate-pulse" size={28} />
          <span className="hidden md:block text-[9px] text-[#00f3ff]/40 uppercase font-black tracking-[0.6em]">MATRIX_CONTROL</span>
        </div>
        <nav className="flex-1 space-y-3 px-3">
          {[
            { id: 'profile' as GameTab, icon: User, label: 'Profil' },
            { id: 'expeditions' as GameTab, icon: Compass, label: 'Expedice' },
            { id: 'items' as GameTab, icon: Shield, label: 'Arzenál' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(!activeExpedition) setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-5 transition-all duration-300 rounded-xl ${activeTab === item.id ? 'bg-[#00f3ff]/15 text-[#00f3ff] border-r-4 border-[#00f3ff] shadow-[inset_0_0_20px_rgba(0,243,255,0.15)]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={22} />
              <span className="hidden md:block text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-700 bg-[#050505]">
            {/* Expedition HUD */}
            <div className="px-12 py-6 border-b border-[#00f3ff]/20 bg-black flex justify-between items-center z-10 shadow-2xl">
              <div className="flex items-center gap-10">
                <div className="space-y-1">
                  <span className="text-[8px] text-[#00f3ff]/40 uppercase font-black block tracking-widest">PROTOCOL_X_UPLINK</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-[0.2em]">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[8px] text-[#ff00ff]/40 uppercase font-black tracking-widest">REBOOT_TIMER_60S</span>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ff00ff] animate-ping" />
                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{currentAdSystem} (REBOOT: {cycleTimer}s)</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <span className="text-[8px] text-white/30 uppercase font-black block mb-1">CURRENT_PHASE</span>
                    <span className="text-sm font-black text-[#00f3ff] uppercase tracking-widest">{phase}</span>
                 </div>
                 <div className="flex items-center gap-4 bg-[#00f3ff]/10 border border-[#00f3ff]/30 px-8 py-3 rounded shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Clock size={16} className="animate-pulse text-[#00f3ff]" />
                    <span className="text-2xl font-mono font-black tabular-nums text-white">
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden relative">
                  <div className="absolute inset-0 tactical-grid opacity-5 pointer-events-none" />
                  
                  {/* AFK MODUL - 60S REBOOT CYCLE */}
                  <VideoStation system={currentAdSystem} nodeKey={nodeKey} onLog={addLog} />

                  <div className="w-full max-w-4xl mx-auto flex-1 border border-[#00f3ff]/20 bg-black/60 p-8 flex flex-col gap-8 overflow-hidden relative shadow-inner rounded-sm">
                     <div className="flex justify-between items-center border-b border-[#00f3ff]/10 pb-4">
                        <div className="flex items-center gap-4">
                           <Sword size={22} className={phase === 'COMBAT' ? 'text-red-600 animate-bounce' : 'text-[#00f3ff]/10'} />
                           <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#00f3ff]">SYSTEM_MONITOR_v10.1</span>
                        </div>
                        <div className="flex gap-4 text-[#00f3ff]/40 text-[9px] font-black uppercase tracking-widest">
                           UPLINK: 180s | CYC: 60s
                        </div>
                     </div>

                     <div className="flex-1 relative flex items-center justify-center">
                        {phase === 'COMBAT' && (
                           <div className="flex flex-col items-center gap-12 animate-in zoom-in duration-700 text-center">
                              <Sword size={140} className="text-red-600 animate-bounce drop-shadow-[0_0_30px_red]" />
                              <p className="text-[14px] text-red-500 font-black uppercase tracking-[1.8em] animate-pulse">BREAKING_ENCRYPTION</p>
                           </div>
                        )}
                        {phase === 'HARVESTING' && (
                           <div className="flex flex-col items-center gap-12 animate-in slide-in-from-bottom-24 duration-700 text-center">
                              <Cpu size={120} className="text-green-500 animate-spin-slow drop-shadow-[0_0_30px_green]" />
                              <div className="w-[450px] h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                                 <div className="h-full bg-green-500 animate-loading-bar rounded-full" />
                              </div>
                              <p className="text-[14px] text-green-500 font-black uppercase tracking-[1.8em] animate-pulse">EXTRACTING_RESERVES</p>
                           </div>
                        )}
                        {phase === 'STABILIZING' && (
                           <div className="flex flex-col items-center gap-12 animate-in fade-in duration-700 text-center">
                              <Wifi size={140} className="text-[#00f3ff] animate-pulse drop-shadow-[0_0_40px_#00f3ff]" />
                              <p className="text-[14px] text-[#00f3ff] font-black uppercase tracking-[1.8em] animate-pulse">STABILIZING_DATOVÝ_UPLINK</p>
                           </div>
                        )}
                        {phase === 'COMPLETED' && (
                           <div className="absolute inset-0 bg-black/98 z-[200] flex flex-col items-center justify-center p-16 text-center border-4 border-[#00f3ff]/10">
                              <Trophy size={180} className="text-[#00f3ff] neon-glow-cyan animate-bounce mb-12" />
                              <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white mb-10 neon-glow-cyan">SUCCESS</h2>
                              <button onClick={() => setActiveExpedition(false)} className="px-40 py-14 bg-[#00f3ff] text-black font-black uppercase tracking-[1.5em] hover:bg-white transition-all shadow-[0_0_60px_rgba(0,243,255,0.4)]">EXIT_SYSTEM</button>
                           </div>
                        )}
                     </div>

                     <div className="mt-auto space-y-6">
                        <div className="flex justify-between text-[12px] font-black uppercase tracking-[0.8em] text-[#00f3ff]/60">
                           <span>PROGRESS_INDICATOR</span>
                           <span className="text-white shadow-white">{progressPercent}%</span>
                        </div>
                        <div className="h-4 w-full bg-white/5 relative rounded-full overflow-hidden border border-[#00f3ff]/20 p-1">
                           <div className="h-full bg-gradient-to-r from-red-600 via-[#00f3ff] to-green-600 shadow-[0_0_30px_rgba(0,243,255,0.8)] transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Activity Sidebar */}
               <div className="w-80 border-l border-white/5 bg-black/80 flex flex-col p-8 gap-6 z-10 backdrop-blur-3xl shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-[#00f3ff]/30 pb-4">
                     <Activity size={20} className="text-[#00f3ff]" />
                     <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#00f3ff]">SYSTEM_LOGGER_v10.1</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-7 custom-scrollbar pr-3">
                     {logs.map(log => (
                        <div key={log.id} className={`text-[11px] uppercase border-l-3 pl-6 py-2 animate-in slide-in-from-right-10 duration-300 ${log.type === 'success' ? 'border-green-600 text-green-400' : log.type === 'warn' ? 'border-red-600 text-red-400' : 'border-[#00f3ff]/40 text-[#00f3ff]/60'}`}>
                           <p className="font-black leading-tight tracking-tight mb-1">{log.text}</p>
                           <span className="text-[9px] opacity-30 font-bold">{new Date().toLocaleTimeString()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-24 px-16 w-full h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.03)_0%,transparent_100%)]">
            {activeTab === 'profile' && (
              <div className="space-y-24 animate-in slide-in-from-bottom-16 duration-1000">
                <div className="flex flex-col lg:flex-row items-center gap-24 p-24 bg-white/[0.01] border-2 border-[#00f3ff]/20 relative overflow-hidden group rounded-lg shadow-2xl backdrop-blur-md">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-[160px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000" />
                    <div className="relative w-72 h-72 border-4 border-[#00f3ff]/40 p-5 bg-black flex items-center justify-center overflow-hidden rounded-sm">
                       <User size={160} className="text-[#00f3ff]/10" />
                       <div className="absolute top-0 left-0 w-full h-1 bg-[#00f3ff] animate-scanline shadow-[0_0_20px_#00f3ff]" />
                    </div>
                  </div>
                  <div className="space-y-12 relative z-10 flex-1 text-center lg:text-left">
                    <div className="space-y-5">
                       <span className="text-[13px] text-[#00f3ff]/40 font-black uppercase tracking-[1em] block animate-pulse">Root_Access_Administrator</span>
                       <h2 className="text-9xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan leading-none">ADMIN_77</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="flex flex-col border-l-8 border-[#00f3ff] pl-12 py-5 bg-white/[0.02] backdrop-blur-md hover:bg-[#00f3ff]/5 transition-all group/stat cursor-default">
                        <span className="text-[12px] text-[#00f3ff]/60 font-black uppercase tracking-[0.6em] mb-5">MIKELA_VAL_RESERVES</span>
                        <span className="text-7xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-cyan transition-all">{mikelaReserves.toLocaleString()} MK</span>
                      </div>
                      <div className="flex flex-col border-l-8 border-[#ff00ff] pl-12 py-5 bg-white/[0.02] backdrop-blur-md hover:bg-[#ff00ff]/5 transition-all group/stat cursor-default">
                        <span className="text-[12px] text-[#ff00ff]/60 font-black uppercase tracking-[0.6em] mb-5">REPUTATION_RANK</span>
                        <span className="text-7xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-pink transition-all">{reputation.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                   {[
                     { label: 'System Tier', val: `0x${expeditionLevel.toString(16).toUpperCase()}`, color: '#00f3ff', icon: Signal },
                     { label: 'Stream Integrity', val: '99.9%', color: '#ff00ff', icon: Zap },
                     { label: 'Uplink Quality', val: 'MAX_SECURE', color: '#10b981', icon: Shield }
                   ].map((stat, i) => (
                    <div key={i} className="p-16 border-2 border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all hover:-translate-y-5 duration-500 group relative overflow-hidden rounded-md shadow-2xl">
                       <span className="text-[13px] text-white/30 uppercase font-black tracking-[0.6em] block mb-10">{stat.label}</span>
                       <p className="text-7xl font-black italic tracking-tighter" style={{ color: stat.color }}>{stat.val}</p>
                       <stat.icon className="absolute bottom-6 right-6 opacity-5" size={100} />
                    </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-28 animate-in zoom-in duration-1000">
                <div className="w-full max-w-5xl text-center space-y-28 relative">
                  <div className="absolute inset-0 bg-[#00f3ff] blur-[250px] opacity-10 animate-pulse pointer-events-none" />
                  <Compass size={240} className="text-[#00f3ff] mx-auto relative drop-shadow-[0_0_100px_rgba(0,243,255,0.7)] animate-spin-slow group-hover:animate-spin transition-all" />
                  <div className="space-y-14 relative">
                    <h2 className="text-9xl font-black text-white uppercase italic tracking-[0.6em] leading-tight neon-glow-cyan">PRONIKNOUT</h2>
                    <p className="text-xl text-[#00f3ff]/60 max-w-4xl mx-auto leading-relaxed tracking-[0.5em] uppercase font-black">
                      Vstup do sektoru 0x{expeditionLevel.toString(16).toUpperCase()} vyžaduje autorizaci. <br/> 
                      <span className="text-[#ff00ff] neon-glow-pink">REBOOT CYKLUS: 60 SEKUND</span>.
                    </p>
                  </div>
                  <button 
                    onClick={startExpedition}
                    className="group relative px-56 py-16 border-4 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black hover:scale-110 active:scale-95 shadow-[0_0_140px_rgba(0,243,255,0.4)] rounded-sm"
                  >
                    <div className="relative z-10 flex items-center gap-12">
                       <PlayCircle size={56} className="animate-pulse" />
                       <span className="text-6xl font-black uppercase tracking-[1em]">LAUNCH_EXPEDITION</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-20 animate-in slide-in-from-right-16 duration-1000">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.7, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-20 border-2 transition-all duration-700 flex flex-col bg-white/[0.01] group relative rounded-md shadow-xl ${canAfford ? 'border-[#00f3ff]/20 hover:border-[#ff00ff]/60 hover:bg-white/[0.04]' : 'border-white/5 opacity-40 grayscale pointer-events-none'}`}>
                        <div className="flex justify-between items-start mb-20">
                          <div className="w-36 h-36 bg-black border-2 border-white/10 flex items-center justify-center shadow-[inset_0_0_60px_rgba(0,243,255,0.06)] group-hover:border-[#ff00ff]/50 transition-all rounded-sm">
                            <u.icon className={canAfford ? 'text-[#ff00ff] group-hover:scale-125 transition-transform duration-500' : 'text-white/10'} size={72} />
                          </div>
                          <div className="text-right">
                             <span className="text-[14px] text-white/40 font-black uppercase tracking-[0.6em] block mb-5">PROTOCOL_RANK</span>
                             <span className="text-8xl font-black text-[#ff00ff] italic group-hover:neon-glow-pink transition-all duration-500">v{u.level}</span>
                          </div>
                        </div>
                        <h4 className="text-6xl font-black text-white uppercase mb-10 tracking-tighter group-hover:text-[#ff00ff] transition-colors duration-500 italic">{u.name}</h4>
                        <p className="text-base text-white/30 uppercase mb-24 leading-relaxed tracking-[0.35em] font-black">{u.desc}</p>
                        <button 
                          onClick={() => {
                            if(canAfford) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          className={`w-full py-14 border-4 font-black text-xl uppercase tracking-[0.8em] transition-all mt-auto flex items-center justify-center gap-10 shadow-2xl rounded-sm ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_40px_rgba(255,0,255,0.3)]' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? (
                            <>UPGRADE | {cost.toLocaleString()} MK</>
                          ) : (
                            <><Lock size={32} /> REZERVY_LOW</>
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
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff22; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00f3ff55; }
        .tactical-grid {
          background-image: linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(600%); }
        }
        .animate-loading-bar { animation: loading-bar 4.5s infinite linear; }
        .neon-glow-cyan { text-shadow: 0 0 15px #00f3ff, 0 0 30px #00f3ff; }
        .neon-glow-pink { text-shadow: 0 0 15px #ff00ff, 0 0 30px #ff00ff; }
      `}</style>
    </div>
  );
};