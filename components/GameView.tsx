
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Added Loader2 to the lucide-react import list
import { User, Zap, Compass, Truck, Timer, Trophy, Shield, Activity, Clock, Database, PlayCircle, Lock, Signal, Sword, Cpu, Download, Wifi, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

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

  // Expedition States
  const [activeExpedition, setActiveExpedition] = useState(false);
  const [phase, setPhase] = useState<ExpeditionPhase>('COMBAT');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  const [currentAdSystem, setCurrentAdSystem] = useState<AdSystem>('HILLTOP');
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isAdLoading, setIsAdLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstance = useRef<any>(null);
  const watchdogTimer = useRef<number | null>(null);

  // Scaling logic
  const calculateDuration = (lvl: number) => {
    if (lvl <= 10) return 60 + (lvl - 1) * 30;
    const baseAtLevel10 = 60 + 9 * 30; 
    return baseAtLevel10 + (lvl - 10) * 60;
  };

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 15));
  };

  const cycleSystem = () => {
    setCurrentAdSystem(prev => {
      if (prev === 'HILLTOP') return 'CLICKADILLA';
      if (prev === 'CLICKADILLA') return 'ONCLICKA';
      return 'HILLTOP';
    });
  };

  const startExpedition = () => {
    const duration = calculateDuration(expeditionLevel);
    setTotalTime(duration);
    setTimeLeft(duration);
    setActiveExpedition(true);
    setPhase('COMBAT');
    setLogs([]);
    addLog(`Navazování spojení se Sektorem 0x${expeditionLevel.toString(16).toUpperCase()}`, 'info');
    addLog(`AFK-Mining zahájen. Očekávaný čas: ${Math.floor(duration/60)}m ${duration%60}s`, 'warn');
  };

  const finishExpedition = () => {
    const baseReward = 200 * expeditionLevel;
    const bonusMultiplier = 1 + (upgrades.find(u => u.id === 'tm')!.level * 0.15);
    const totalReward = Math.floor(baseReward * bonusMultiplier);
    
    setMikelaReserves(p => p + totalReward);
    setReputation(p => p + expeditionLevel * 60);
    setExpeditionLevel(p => p + 1);
    setPhase('COMPLETED');
    addLog(`Data zajištěna! Reward: +${totalReward} MK`, 'success');
    
    if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
    }
  };

  // Video Ad Rotation & Robust Error Handling
  useEffect(() => {
    if (!activeExpedition || phase === 'COMPLETED' || phase === 'FAILED') return;

    const vastUrls: Record<AdSystem, string> = {
      HILLTOP: HILLTOP_VAST_URL,
      CLICKADILLA: CLICKADILLA_VAST_URL,
      ONCLICKA: ONCLICKA_VAST_URL
    };

    const handlePlayerError = (err: any) => {
      const msg = String(err?.message || err || "UNKNOWN_VAST_ERROR");
      console.warn(`[WATCHDOG] VAST Error caught: ${msg}`);
      
      // Specifically handle the "link" and "Unknown in-stream ad type" strings
      if (msg.toLowerCase().includes("link") || msg.toLowerCase().includes("unknown in-stream")) {
        addLog(`Uzel ${currentAdSystem} vykazuje anomálii linku. Přesměrovávám...`, 'warn');
      } else {
        addLog(`Chyba signálu na uzlu ${currentAdSystem}.`, 'error');
      }

      setPlayerError("RE-ROUTING");
      setIsAdLoading(false);
      
      // Cleanup watchdog
      if (watchdogTimer.current) window.clearTimeout(watchdogTimer.current);

      setTimeout(() => {
        setPlayerError(null);
        cycleSystem();
      }, 1000);
    };

    const initPlayer = () => {
      if (!videoRef.current || !window.fluidPlayer) return;

      setIsAdLoading(true);

      // Watchdog: If ad doesn't start in 8 seconds, force cycle
      if (watchdogTimer.current) window.clearTimeout(watchdogTimer.current);
      watchdogTimer.current = window.setTimeout(() => {
        if (isAdLoading) {
           addLog(`Časový limit pro uzel ${currentAdSystem} vypršel.`, 'warn');
           handlePlayerError("TIMEOUT");
        }
      }, 8000);

      try {
        if (playerInstance.current) {
          playerInstance.current.destroy();
        }

        playerInstance.current = window.fluidPlayer(videoRef.current, {
          layoutControls: {
            fillToContainer: true,
            autoPlay: true,
            mute: true,
            allowDownload: false,
            playbackRateControl: false,
            persistentSettings: { volume: false },
            controlBar: { autoHide: true },
            playButtonShowing: false,
            keyboardControl: false,
            htmlOnPauseBlock: {
                enabled: true,
                html: '<div style="color:white; font-family:mono; text-align:center; padding: 10px;">PROBÍHÁ SYNCHRONIZACE...</div>'
            }
          },
          vastOptions: {
            adList: [{ roll: 'preRoll', vastTag: vastUrls[currentAdSystem] }],
            adStartedCallback: () => {
              setIsAdLoading(false);
              if (watchdogTimer.current) window.clearTimeout(watchdogTimer.current);
            },
            adFinishedCallback: () => {
              addLog(`Uzel ${currentAdSystem} synchronizován. Pokračuji...`, 'success');
              cycleSystem();
            },
            adErrorCallback: (err: any) => handlePlayerError(err)
          }
        });
      } catch (e) {
        console.error("Critical Player Initialization Error:", e);
        handlePlayerError(e);
      }
    };

    initPlayer();

    return () => {
      if (watchdogTimer.current) window.clearTimeout(watchdogTimer.current);
      if (playerInstance.current) {
        try { playerInstance.current.destroy(); } catch(e) {}
        playerInstance.current = null;
      }
    };
  }, [activeExpedition, currentAdSystem, phase]);

  // Main Mission Timer
  useEffect(() => {
    if (!activeExpedition || timeLeft <= 0 || phase === 'COMPLETED') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        
        // Phase Thresholds
        const progress = ((totalTime - next) / totalTime) * 100;
        if (progress < 35) setPhase('COMBAT');
        else if (progress < 85) setPhase('HARVESTING');
        else setPhase('STABILIZING');

        if (next <= 0) {
          finishExpedition();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExpedition, timeLeft, totalTime, phase]);

  // Dynamic Ambient Logs
  useEffect(() => {
    if (!activeExpedition || phase === 'COMPLETED') return;
    
    const logInterval = setInterval(() => {
      const msgs: Record<string, string[]> = {
        COMBAT: ["Lámání SSL na uzlu " + currentAdSystem, "Boj s firewallem partnera", "Injekce kódu přes " + currentAdSystem, "Zahlcování packetama"],
        HARVESTING: ["Extrakce meta-dat...", "Analýza streamu " + currentAdSystem, "Stahování datových bloků", "Bypass validace"],
        STABILIZING: ["Finalizace Matrix spojení...", "Šifrování výstupu", "Zahlazování digitálních stop", "Signál stabilní"]
      };
      
      const currentMsgs = msgs[phase] || [];
      if (currentMsgs.length > 0) {
        addLog(currentMsgs[Math.floor(Math.random() * currentMsgs.length)], phase === 'COMBAT' ? 'warn' : 'info');
      }
    }, 9000);

    return () => clearInterval(logInterval);
  }, [activeExpedition, phase, currentAdSystem]);

  const progressPercent = useMemo(() => {
    if (totalTime === 0) return 0;
    return Math.floor(((totalTime - timeLeft) / totalTime) * 100);
  }, [timeLeft, totalTime]);

  return (
    <div className="flex h-full w-full bg-[#020202] border-t border-[#00f3ff]/10 relative overflow-hidden font-mono text-[#00f3ff]">
      
      {/* Sidebar Navigation */}
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

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-700 bg-[#050505]">
            {/* Mission HUD */}
            <div className="px-12 py-6 border-b border-[#00f3ff]/20 bg-black flex justify-between items-center z-10 shadow-2xl">
              <div className="flex items-center gap-10">
                <div className="space-y-1">
                  <span className="text-[8px] text-[#00f3ff]/40 uppercase font-black block tracking-widest">UPLINK_PROTOCOL</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-[0.2em]">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                   <span className="text-[8px] text-[#ff00ff]/40 uppercase font-black tracking-widest">STREAM_NODE</span>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isAdLoading ? 'bg-yellow-500 animate-pulse' : 'bg-[#ff00ff] animate-ping'}`} />
                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{currentAdSystem}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                 <div className="text-right">
                    <span className="text-[8px] text-white/30 uppercase font-black block mb-1">OPERATION_PHASE</span>
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

            {/* EXPEDITION MAIN VIEW */}
            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 flex flex-col p-8 gap-8 overflow-hidden relative">
                  <div className="absolute inset-0 tactical-grid opacity-5 pointer-events-none" />
                  
                  {/* VIDEO PLAYER ZONE (100% OPAQUE) */}
                  <div className="w-full max-w-4xl mx-auto flex flex-col border-2 border-[#00f3ff]/30 bg-black shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 rounded-sm overflow-hidden">
                     <div className="bg-[#0a0a0a] p-2 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-2">
                           <Activity size={12} className="text-red-500 animate-pulse" />
                           <span className="text-[8px] uppercase font-bold tracking-widest text-[#00f3ff]/60">ENCRYPTION: AES_256_ACTIVE</span>
                        </div>
                        {isAdLoading && (
                          <div className="flex items-center gap-2 text-yellow-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            <Loader2 size={10} className="animate-spin" /> SYNCHRONIZING_UPLINK...
                          </div>
                        )}
                        {playerError && (
                          <div className="flex items-center gap-2 text-red-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            <ShieldAlert size={10} /> {playerError}...
                          </div>
                        )}
                     </div>
                     <div className="aspect-video bg-[#000] flex items-center justify-center relative">
                        <video ref={videoRef} className="video-js vjs-default-skin w-full h-full" playsInline muted />
                     </div>
                  </div>

                  {/* TACTICAL COMBAT MONITOR (VISUALIZATION) */}
                  <div className="w-full max-w-4xl mx-auto flex-1 border border-[#00f3ff]/20 bg-black/60 p-8 flex flex-col gap-8 overflow-hidden relative shadow-inner rounded-sm">
                     <div className="flex justify-between items-center border-b border-[#00f3ff]/10 pb-4">
                        <div className="flex items-center gap-4">
                           <Sword size={22} className={phase === 'COMBAT' ? 'text-red-600 animate-bounce' : 'text-[#00f3ff]/10'} />
                           <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#00f3ff]">TACTICAL_UPLINK_MONITOR_v5.2</span>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${phase === 'COMBAT' ? 'bg-red-600 shadow-[0_0_15px_red]' : 'bg-gray-800'}`} />
                             <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">COMBAT</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${phase === 'HARVESTING' ? 'bg-green-600 shadow-[0_0_15px_green]' : 'bg-gray-800'}`} />
                             <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">HARVEST</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${phase === 'STABILIZING' ? 'bg-[#00f3ff] shadow-[0_0_15px_#00f3ff]' : 'bg-gray-800'}`} />
                             <span className="text-[8px] uppercase font-bold opacity-30 tracking-widest">STABLE</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 relative flex items-center justify-center">
                        {/* COMBAT ANIMATION */}
                        {phase === 'COMBAT' && (
                           <div className="flex flex-col items-center gap-12 animate-in zoom-in duration-700">
                              <div className="relative">
                                 <div className="absolute inset-0 bg-red-600/30 blur-3xl animate-pulse" />
                                 <Sword size={140} className="text-red-600 animate-bounce drop-shadow-[0_0_30px_red] relative z-10" />
                                 <Zap size={50} className="absolute -top-6 -right-6 text-white animate-ping" />
                              </div>
                              <div className="flex gap-4 h-20 items-end">
                                 {[...Array(24)].map((_, i) => (
                                    <div key={i} className="w-2.5 bg-red-600/60 animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i*0.04}s` }} />
                                 ))}
                              </div>
                              <p className="text-[14px] text-red-500 font-black uppercase tracking-[1.8em] animate-pulse">BREAKING_NODE_SECURITY</p>
                           </div>
                        )}

                        {/* HARVESTING ANIMATION */}
                        {phase === 'HARVESTING' && (
                           <div className="flex flex-col items-center gap-12 animate-in slide-in-from-bottom-24 duration-700">
                              <div className="flex gap-20 relative">
                                 <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse" />
                                 <Cpu size={120} className="text-green-500 animate-spin-slow drop-shadow-[0_0_30px_green]" />
                                 <div className="flex flex-col justify-center">
                                    <Download size={80} className="text-green-400 animate-bounce drop-shadow-[0_0_15px_green]" />
                                 </div>
                              </div>
                              <div className="w-[450px] h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
                                 <div className="h-full bg-green-500 shadow-[0_0_25px_green] animate-loading-bar rounded-full" />
                              </div>
                              <p className="text-[14px] text-green-500 font-black uppercase tracking-[1.8em] animate-pulse">EXTRACTING_DATA_LOOPS</p>
                           </div>
                        )}

                        {/* STABILIZING ANIMATION */}
                        {phase === 'STABILIZING' && (
                           <div className="flex flex-col items-center gap-12 animate-in fade-in duration-700">
                              <div className="relative">
                                 <Wifi size={140} className="text-[#00f3ff] animate-pulse drop-shadow-[0_0_40px_#00f3ff]" />
                                 <div className="absolute inset-0 bg-[#00f3ff]/20 blur-3xl" />
                              </div>
                              <div className="flex gap-8">
                                 {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="w-6 h-6 bg-[#00f3ff]/20 rounded-full flex items-center justify-center">
                                       <div className="w-3 h-3 bg-[#00f3ff] rounded-full animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                                    </div>
                                 ))}
                              </div>
                              <p className="text-[14px] text-[#00f3ff] font-black uppercase tracking-[1.8em] animate-pulse">FINALIZING_UPLINK</p>
                           </div>
                        )}

                        {/* COMPLETED SUCCESS SCREEN */}
                        {phase === 'COMPLETED' && (
                           <div className="absolute inset-0 bg-black/98 z-50 flex flex-col items-center justify-center p-16 text-center animate-in zoom-in duration-700 border-4 border-[#00f3ff]/10">
                              <div className="relative mb-16">
                                 <Trophy size={180} className="text-[#00f3ff] neon-glow-cyan animate-bounce" />
                                 <div className="absolute inset-0 bg-[#00f3ff] blur-3xl opacity-40" />
                              </div>
                              <h2 className="text-9xl font-black italic uppercase tracking-tighter text-white mb-10 neon-glow-cyan">UPLINK_SECURED</h2>
                              <p className="text-base text-[#00f3ff]/60 uppercase tracking-[1em] mb-24 font-bold">Operation Completed | Reward Processed</p>
                              <button 
                                onClick={() => setActiveExpedition(false)}
                                className="group relative px-40 py-14 bg-[#00f3ff] text-black font-black uppercase tracking-[1.5em] hover:bg-white transition-all shadow-[0_0_120px_rgba(0,243,255,0.7)] overflow-hidden"
                              >
                                <span className="relative z-10 text-2xl">DISCONNECT</span>
                                <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                              </button>
                           </div>
                        )}
                     </div>

                     {/* Overall Integrity Bar */}
                     <div className="mt-auto space-y-6">
                        <div className="flex justify-between text-[12px] font-black uppercase tracking-[0.8em] text-[#00f3ff]/60">
                           <span>MISSION_INTEGRITY_CHECK</span>
                           <span className="text-white drop-shadow-[0_0_15px_white]">{progressPercent}%</span>
                        </div>
                        <div className="h-4 w-full bg-white/5 relative rounded-full overflow-hidden border border-[#00f3ff]/20 p-1 shadow-inner">
                           <div className="h-full bg-gradient-to-r from-red-600 via-[#00f3ff] to-green-600 shadow-[0_0_30px_rgba(0,243,255,0.8)] transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Log Sidebar (Vertical) */}
               <div className="w-80 border-l border-white/5 bg-black/80 flex flex-col p-8 gap-6 z-10 backdrop-blur-3xl shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-[#00f3ff]/30 pb-4">
                     <Activity size={20} className="text-[#00f3ff]" />
                     <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#00f3ff]">DECRYPT_LOG_v5.2</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-7 custom-scrollbar pr-3">
                     {logs.map(log => (
                        <div key={log.id} className={`text-[11px] uppercase border-l-3 pl-6 py-2 animate-in slide-in-from-right-10 duration-300 ${log.type === 'success' ? 'border-green-600 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : log.type === 'warn' ? 'border-red-600 text-red-400 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'border-[#00f3ff]/40 text-[#00f3ff]/60'}`}>
                           <p className="font-black leading-tight tracking-tight mb-1">{log.text}</p>
                           <span className="text-[9px] opacity-30 font-bold">{new Date().toLocaleTimeString()}</span>
                        </div>
                     ))}
                  </div>
                  <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-6">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                      <span>SECURE_UPLINK</span>
                      <span>ACTIVE</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-1.5 bg-[#00f3ff]/20 animate-pulse rounded-full" style={{ animationDelay: `${i*0.12}s` }} />
                      ))}
                    </div>
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
                    <div className="relative w-72 h-72 border-4 border-[#00f3ff]/40 p-5 bg-black flex items-center justify-center overflow-hidden rounded-sm shadow-[0_0_60px_rgba(0,243,255,0.15)]">
                       <User size={160} className="text-[#00f3ff]/10" />
                       <div className="absolute top-0 left-0 w-full h-1 bg-[#00f3ff] animate-scanline shadow-[0_0_20px_#00f3ff]" />
                    </div>
                  </div>
                  <div className="space-y-12 relative z-10 flex-1 text-center lg:text-left">
                    <div className="space-y-5">
                       <span className="text-[13px] text-[#00f3ff]/40 font-black uppercase tracking-[1em] block animate-pulse">Network_Master_Access</span>
                       <h2 className="text-9xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan leading-none">ADMIN_77</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="flex flex-col border-l-8 border-[#00f3ff] pl-12 py-5 bg-white/[0.02] backdrop-blur-md hover:bg-[#00f3ff]/5 transition-all group/stat cursor-default rounded-r-md">
                        <span className="text-[12px] text-[#00f3ff]/60 font-black uppercase tracking-[0.6em] mb-5">MIKELA_VAL_RESERVES</span>
                        <span className="text-7xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-cyan transition-all">{mikelaReserves.toLocaleString()} MK</span>
                      </div>
                      <div className="flex flex-col border-l-8 border-[#ff00ff] pl-12 py-5 bg-white/[0.02] backdrop-blur-md hover:bg-[#ff00ff]/5 transition-all group/stat cursor-default rounded-r-md">
                        <span className="text-[12px] text-[#ff00ff]/60 font-black uppercase tracking-[0.6em] mb-5">REPUTATION_RANK</span>
                        <span className="text-7xl font-black text-white tracking-tighter tabular-nums group-hover/stat:neon-glow-pink transition-all">{reputation.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                   {[
                     { label: 'System Tier', val: `0x${expeditionLevel.toString(16).toUpperCase()}`, color: '#00f3ff', icon: Signal },
                     { label: 'Stream Integrity', val: '99.8%', color: '#ff00ff', icon: Zap },
                     { label: 'Node Quality', val: 'MAX_STABLE', color: '#10b981', icon: Shield }
                   ].map((stat, i) => (
                    <div key={i} className="p-16 border-2 border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all hover:-translate-y-5 duration-500 group relative overflow-hidden rounded-md shadow-2xl">
                       <span className="text-[13px] text-white/30 uppercase font-black tracking-[0.6em] block mb-10">{stat.label}</span>
                       <p className="text-7xl font-black italic tracking-tighter group-hover:scale-110 transition-transform origin-left drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]" style={{ color: stat.color }}>{stat.val}</p>
                       <stat.icon className="absolute bottom-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity" size={100} />
                    </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-28 animate-in zoom-in duration-1000">
                <div className="w-full max-w-5xl text-center space-y-28 relative">
                  <div className="absolute inset-0 bg-[#00f3ff] blur-[250px] opacity-10 animate-pulse pointer-events-none" />
                  <div className="relative inline-block scale-150 group">
                    <Compass size={240} className="text-[#00f3ff] mx-auto relative drop-shadow-[0_0_100px_rgba(0,243,255,0.7)] animate-spin-slow group-hover:animate-spin transition-all" />
                  </div>
                  <div className="space-y-14 relative">
                    <h2 className="text-9xl font-black text-white uppercase italic tracking-[0.6em] leading-tight neon-glow-cyan drop-shadow-2xl">PRONIKNOUT</h2>
                    <p className="text-xl text-[#00f3ff]/60 max-w-4xl mx-auto leading-relaxed tracking-[0.5em] uppercase font-black">
                      Vstup do Sektoru 0x{expeditionLevel.toString(16).toUpperCase()} vyžaduje video-autorizaci. <br/> 
                      <span className="text-[#ff00ff] neon-glow-pink">SYSTÉM AFK-MINING AKTIVNÍ (UPLINK LOOP)</span>.
                    </p>
                  </div>
                  <button 
                    onClick={startExpedition}
                    className="group relative px-56 py-16 border-4 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black hover:scale-110 active:scale-95 shadow-[0_0_140px_rgba(0,243,255,0.4)] rounded-sm"
                  >
                    <div className="relative z-10 flex items-center gap-12">
                       <PlayCircle size={56} className="animate-pulse" />
                       <span className="text-6xl font-black uppercase tracking-[1em]">ENTRY_LINK</span>
                    </div>
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 opacity-20" />
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
                          className={`w-full py-14 border-4 font-black text-xl uppercase tracking-[0.8em] transition-all mt-auto flex items-center justify-center gap-10 shadow-2xl rounded-sm ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_40px_rgba(255,0,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)]' : 'border-white/10 text-white/10'}`}
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
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff22; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
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
