
import React, { useState, useEffect, useRef } from 'react';
import { User, Compass, Truck, Timer, Shield, Activity, Clock, Database, PlayCircle, Lock, Signal, Sword, Cpu, Wifi, RefreshCw, LogOut, Database as MiningIcon, Swords, Target, Binary } from 'lucide-react';

// Interfaces
interface UpgradeItem {
  id: string;
  name: string;
  icon: any;
  level: number;
  baseCost: number;
  desc: string;
}

interface ExpeditionLog {
  id: string;
  text: string;
  type: 'info' | 'warn' | 'success' | 'error' | 'pvp';
}

interface Opponent {
  id: string;
  name: string;
  power: number;
  level: number;
  rewardXP: number;
  rewardMK: number;
}

// Fix: Corrected 'interface window' to 'interface Window' to properly extend the global Window type in TypeScript
declare global {
  interface Window {
    fluidPlayer: any;
  }
}

type GameTab = 'profile' | 'expeditions' | 'arena' | 'items';
type ExpeditionPhase = 'COMBAT' | 'HARVESTING' | 'STABILIZING' | 'COMPLETED' | 'FAILED';

// Rotace partnerů: Clickadilla1 na 1., Clickadilla2 na 7., ostatní prokládáno iframe tubecore
const AD_PARTNERS = [
  { id: 'CLICKADILLA_1', url: "https://vast.yomeno.xyz/vast?spot_id=1480488", type: 'vast' }, // 1.
  { id: 'TUBECORPORATE_1', url: "https://hdzog.com/embed/71011?source=1933335898&autoplay=1", type: 'iframe' }, // 2.
  { id: 'ONCLICKA', url: "https://bid.onclckstr.com/vast?spot_id=6109953", type: 'vast' }, // 3.
  { id: 'TUBECORPORATE_2', url: "https://hdzog.com/embed/71011?source=1933335898&autoplay=1", type: 'iframe' }, // 4.
  { id: 'HILLTOP', url: "https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy", type: 'vast' }, // 5.
  { id: 'TUBECORPORATE_3', url: "https://hdzog.com/embed/71011?source=1933335898&autoplay=1", type: 'iframe' }, // 6.
  { id: 'CLICKADILLA_2', url: "https://vast.yomeno.xyz/vast?spot_id=1480563", type: 'vast' }, // 7.
  { id: 'TUBECORPORATE_4', url: "https://hdzog.com/embed/71011?source=1933335898&autoplay=1", type: 'iframe' }  // 8.
];

const LOCAL_VIDEO_SRC = "/MIKELANET.mp4";
const FALLBACK_VIDEO_SRC = "https://vjs.zencdn.net/v/oceans.mp4";

const ARENA_OPPONENTS: Opponent[] = [
  { id: 'opp1', name: 'Ghost_Protocol', level: 10, power: 150, rewardXP: 1200, rewardMK: 45 },
  { id: 'opp2', name: 'Neon_Wraith', level: 45, power: 500, rewardXP: 4500, rewardMK: 180 },
  { id: 'opp3', name: 'Cipher_Hunter', level: 120, power: 1800, rewardXP: 15000, rewardMK: 650 },
  { id: 'opp4', name: 'Kernel_Void', level: 280, power: 5500, rewardXP: 40000, rewardMK: 2200 },
  { id: 'opp5', name: 'ARCHITECT_X', level: 395, power: 12000, rewardXP: 100000, rewardMK: 8500 },
];

const VideoStation: React.FC<{ 
  partnerIndex: number, 
  rebootKey: number, 
  onLog: (msg: string, type: any) => void 
}> = ({ partnerIndex, rebootKey, onLog }) => {
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const partner = AD_PARTNERS[partnerIndex % AD_PARTNERS.length];

  useEffect(() => {
    let isMounted = true;

    const cleanup = () => {
      document.body.classList.remove('ad-playing');
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn("Fluid Player destruction failed:", e);
        }
        playerRef.current = null;
      }
    };

    const init = async () => {
      setIsTransitioning(true);
      setShowContent(false);
      setIsAdPlaying(false);
      
      await new Promise(r => setTimeout(r, 800));
      
      if (!isMounted) return;

      if (partner.type === 'vast') {
        if (!videoRef.current || !window.fluidPlayer) return;
        try {
          setIsTransitioning(false);
          playerRef.current = window.fluidPlayer(videoRef.current, {
            layoutControls: {
              fillToContainer: true,
              autoPlay: true,
              mute: false, 
              allowDownload: false,
              playbackRateControl: false,
              controlBar: { autoHide: true },
              playButtonShowing: false,
              htmlOnPauseBlock: { html: null, width: 0, height: 0 },
              logo: { imageUrl: null },
              keyboardControl: false
            },
            vastOptions: {
              adList: [{ roll: 'preRoll', vastTag: partner.url }],
              adStartedCallback: () => {
                setIsAdPlaying(true);
                document.body.classList.add('ad-playing');
                onLog(`[Uzel ${partner.id}] VAST Uplink aktivní.`, 'info');
              },
              adFinishedCallback: () => {
                setIsAdPlaying(false);
                document.body.classList.remove('ad-playing');
                setShowContent(true);
                onLog(`[Uzel ${partner.id}] Verifikace OK.`, 'success');
                playContent();
              },
              adErrorCallback: (err: any) => {
                console.warn(`[Uzel ${partner.id}] Ad Error:`, err);
                setIsAdPlaying(false);
                document.body.classList.remove('ad-playing');
                setShowContent(true);
                onLog(`[Uzel ${partner.id}] Signál přerušen. Simulace obsahu.`, 'error');
                playContent();
              }
            }
          });
        } catch (err) {
          console.error("Fluid Player init error:", err);
          setIsTransitioning(false);
          setShowContent(true);
          playContent();
        }
      } else {
        setIsTransitioning(false);
        setIsAdPlaying(true); 
        onLog(`[Uzel ${partner.id}] Inicializace Iframe (Direct Link).`, 'info');
      }
    };

    const playContent = () => {
      if (videoRef.current) {
        videoRef.current.src = LOCAL_VIDEO_SRC;
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.src = FALLBACK_VIDEO_SRC;
            videoRef.current.play().catch(e => console.error("Final playback error:", e));
          }
        });
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [rebootKey]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col border border-[#00f3ff]/40 md:border-2 bg-black shadow-[0_0_150px_rgba(0,0,0,1)] relative z-50 rounded-sm overflow-hidden min-h-[200px] md:min-h-[300px]">
      <div className="bg-[#050505] p-2 md:p-3 flex justify-between items-center border-b border-[#00f3ff]/20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isAdPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_12px_red]' : 'bg-[#00f3ff] shadow-[0_0_12px_#00f3ff]'}`} />
          <span className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.15em] md:tracking-[0.25em] text-[#00f3ff]/90">
            {isAdPlaying ? `AD_SYNC: ${partner.id}` : showContent ? 'STREAM_CONNECTED' : 'SYSTEM_REBOOTING'}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-[#00f3ff] text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
           UPLINK_{(partnerIndex % AD_PARTNERS.length) + 1}
        </div>
      </div>
      
      <div className="aspect-video bg-black flex items-center justify-center relative w-full h-full">
        {isTransitioning && (
          <div className="absolute inset-0 z-[110] bg-[#020202] flex flex-col items-center justify-center gap-3 md:gap-6">
             <RefreshCw className="text-[#00f3ff] animate-spin" size={32} />
             <div className="text-center space-y-1">
                <span className="text-[10px] md:text-[14px] font-black tracking-[0.5em] md:tracking-[1.5em] text-[#00f3ff] animate-pulse uppercase block">REBOOT</span>
                <span className="text-[7px] text-[#ff00ff] uppercase tracking-[0.2em] animate-pulse">SYNCING_{partner.id}</span>
             </div>
          </div>
        )}

        <div 
          key={rebootKey} 
          className={`w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {partner.type === 'vast' ? (
            <video 
              ref={videoRef} 
              className="video-js vjs-default-skin w-full h-full block" 
              playsInline
            >
               <source src={FALLBACK_VIDEO_SRC} type="video/mp4" />
            </video>
          ) : (
            <iframe 
              src={partner.url} 
              className="w-full h-full border-0" 
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
              allowFullScreen
            />
          )}
        </div>

        {showContent && !isAdPlaying && !isTransitioning && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[100] bg-black/80 border border-[#00f3ff]/40 p-1 md:p-2 flex items-center gap-1 md:gap-2 pointer-events-none">
             <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-600 rounded-full animate-pulse" />
             <span className="text-[7px] md:text-[9px] font-black text-white uppercase tracking-widest">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const GameView: React.FC<{ userAvatar?: string | null }> = ({ userAvatar }) => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [mikelaReserves, setMikelaReserves] = useState(150);
  const [reputation, setReputation] = useState(1240);
  const [rank, setRank] = useState(1);
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: 'atk', name: 'Útočný Protokol', icon: Sword, level: 1, baseCost: 50, desc: 'Zvyšuje efektivitu v bojové fázi expedice.' },
    { id: 'spd', name: 'Tachyonový Pohon', icon: Compass, level: 1, baseCost: 40, desc: 'Zkracuje časovou náročnost operací.' },
    { id: 'trns', name: 'Datový Uzel', icon: Truck, level: 1, baseCost: 30, desc: 'Zvyšuje rychlost sběru fragmentů.' },
    { id: 'tm', name: 'Forging Modul', icon: Timer, level: 1, baseCost: 60, desc: 'Zvyšuje výnos MIKELA z každé mise.' },
  ]);

  const [activeExpedition, setActiveExpedition] = useState(false);
  const [activeArenaBattle, setActiveArenaBattle] = useState<Opponent | null>(null);
  const [arenaPhase, setArenaPhase] = useState<'IDLE' | 'FIGHTING' | 'VICTORY' | 'DEFEAT'>('IDLE');
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);

  const [phase, setPhase] = useState<ExpeditionPhase>('COMBAT');
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [rebootKey, setRebootKey] = useState(0);
  const [cycleTimer, setCycleTimer] = useState(60); 

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' | 'pvp' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 15));
  };

  // Rank Progress Logic
  useEffect(() => {
    const xpPerRank = rank * 2000;
    if (reputation >= xpPerRank && rank < 400) {
      setReputation(prev => prev - xpPerRank);
      setRank(prev => prev + 1);
      addLog(`RANK_UP: Úroveň ${rank + 1} dosažena.`, 'success');
    }
  }, [reputation, rank]);

  // PvP Battle Logic
  useEffect(() => {
    if (arenaPhase === 'FIGHTING' && activeArenaBattle) {
      const battleTimer = setInterval(() => {
        const playerAtk = (upgrades.find(u => u.id === 'atk')!.level * 10) + (rank * 2);
        const enemyAtk = Math.max(5, activeArenaBattle.power / 20);
        
        setEnemyHp(prev => Math.max(0, prev - playerAtk));
        setPlayerHp(prev => Math.max(0, prev - enemyAtk));

        if (enemyHp <= 0) {
          setArenaPhase('VICTORY');
          setReputation(prev => prev + activeArenaBattle.rewardXP);
          setMikelaReserves(prev => prev + activeArenaBattle.rewardMK);
          addLog(`ARENA_VICTORY: ${activeArenaBattle.name} poražen! +${activeArenaBattle.rewardXP} XP.`, 'pvp');
          clearInterval(battleTimer);
        } else if (playerHp <= 0) {
          setArenaPhase('DEFEAT');
          addLog(`ARENA_DEFEAT: Simulace přerušena.`, 'error');
          clearInterval(battleTimer);
        }
      }, 1000);
      return () => clearInterval(battleTimer);
    }
  }, [arenaPhase, enemyHp, playerHp, activeArenaBattle, rank, upgrades]);

  const startExpedition = () => {
    setElapsedTime(0);
    setActiveExpedition(true);
    setPhase('COMBAT');
    setLogs([]);
    setPartnerIndex(0);
    setRebootKey(k => k + 1);
    setCycleTimer(60);
    addLog(`Uplink inicializován. Sektor 0x7FF`, 'info');
  };

  const terminateExpedition = () => {
    setActiveExpedition(false);
    setReputation(p => p + Math.floor(elapsedTime / 10) * 5); 
    addLog(`Expedice ukončena.`, 'success');
  };

  const startPvP = (opponent: Opponent) => {
    setActiveArenaBattle(opponent);
    setEnemyHp(opponent.power);
    setPlayerHp(100 + (rank * 10));
    setArenaPhase('FIGHTING');
    addLog(`ARENA: Vstup do souboje s ${opponent.name}.`, 'pvp');
  };

  useEffect(() => {
    if (!activeExpedition || phase === 'COMPLETED') return;
    const interval = setInterval(() => {
      setCycleTimer(prev => {
        if (prev <= 1) {
          setPartnerIndex(current => (current + 1) % AD_PARTNERS.length);
          setRebootKey(k => k + 1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExpedition, phase]);

  useEffect(() => {
    if (!activeExpedition || phase === 'COMPLETED') return;
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const next = prev + 1;
        const cycleSeconds = next % 180;
        if (cycleSeconds < 60) setPhase('COMBAT');
        else if (cycleSeconds < 120) setPhase('HARVESTING');
        else setPhase('STABILIZING');

        if (next > 0 && next % 30 === 0) {
          const bonusMultiplier = 1 + (upgrades.find(u => u.id === 'tm')!.level * 0.15);
          const totalReward = Math.floor(4 * bonusMultiplier);
          setMikelaReserves(p => p + totalReward);
          addLog(`Generováno +${totalReward} MK.`, 'success');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExpedition, phase, upgrades]);

  const navItems = [
    { id: 'profile' as GameTab, icon: User, label: 'Profil' },
    { id: 'expeditions' as GameTab, icon: Compass, label: 'Expedice' },
    { id: 'arena' as GameTab, icon: Swords, label: 'Aréna' },
    { id: 'items' as GameTab, icon: Shield, label: 'Arzenál' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#020202] border-t border-[#00f3ff]/10 relative overflow-hidden font-mono text-[#00f3ff]">
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/5 bg-black/60 flex-col py-8 z-20 backdrop-blur-md">
        <div className="mb-14 flex flex-col items-center gap-3">
          <Database className="text-[#00f3ff] animate-pulse" size={28} />
          <span className="text-[9px] text-[#00f3ff]/40 uppercase font-black tracking-[0.6em]">MATRIX_CONTROL</span>
        </div>
        <nav className="flex-1 space-y-3 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(!activeExpedition) setActiveExpedition(false); }}
              className={`w-full flex items-center justify-start gap-4 p-5 transition-all duration-300 rounded-xl ${activeTab === item.id ? 'bg-[#00f3ff]/15 text-[#00f3ff] border-r-4 border-[#00f3ff] shadow-[inset_0_0_20px_rgba(0,243,255,0.15)]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={22} />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden pb-16 md:pb-0">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-700 bg-[#050505] overflow-y-auto md:overflow-hidden">
            <div className="px-4 md:px-12 py-4 md:py-6 border-b border-[#00f3ff]/20 bg-black flex flex-col md:flex-row justify-between items-center z-10 gap-4 md:gap-0">
              <div className="flex items-center gap-4 md:gap-10 w-full md:w-auto justify-between md:justify-start">
                <div className="relative group/mining bg-[#00f3ff]/5 border border-[#00f3ff]/10 px-2 md:px-4 py-1.5 rounded-sm flex-1 md:flex-none">
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1 md:gap-2">
                         <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
                         <span className="text-[7px] md:text-[9px] text-[#00f3ff] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">MK_MINING</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                         <span className="text-sm md:text-xl font-black text-white italic tracking-tighter tabular-nums">
                            {30 - (elapsedTime % 30)}S
                         </span>
                      </div>
                   </div>
                </div>

                <div className="hidden md:block h-10 w-px bg-white/10" />
                
                <div className="flex flex-col text-right md:text-left">
                   <span className="text-[7px] md:text-[8px] text-[#ff00ff]/40 uppercase font-black tracking-widest">REBOOT_SYNC</span>
                   <div className="flex items-center gap-1 md:gap-2 justify-end md:justify-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff] animate-ping" />
                      <span className="text-[9px] md:text-xs font-bold text-white uppercase tracking-tighter">
                         {AD_PARTNERS[partnerIndex % AD_PARTNERS.length].id} ({cycleTimer}s)
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                 <div className="flex-1 text-left md:text-right">
                    <span className="text-[7px] md:text-[8px] text-white/30 uppercase font-black block">STATUS</span>
                    <span className="text-[10px] md:text-sm font-black text-[#00f3ff] uppercase tracking-widest">{phase}</span>
                 </div>
                 <button 
                    onClick={terminateExpedition}
                    className={`flex items-center gap-2 md:gap-4 border px-4 md:px-8 py-2 md:py-3 rounded shadow-lg transition-all duration-300 min-w-[100px] md:min-w-[140px] justify-center bg-[#ff00ff]/10 border-[#ff00ff]/30`}
                 >
                    <LogOut size={14} className="text-[#ff00ff]" />
                    <span className="text-xs md:text-xl font-black text-[#ff00ff] uppercase tracking-[0.1em] md:tracking-[0.2em]">UKONČIT</span>
                 </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
               <div className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-8 overflow-y-auto md:overflow-hidden relative">
                  <div className="absolute inset-0 tactical-grid opacity-5 pointer-events-none" />
                  
                  <VideoStation partnerIndex={partnerIndex} rebootKey={rebootKey} onLog={addLog} />
                  
                  <div className="w-full max-w-4xl mx-auto flex-1 border border-[#00f3ff]/20 bg-black/60 p-4 md:p-8 flex flex-col gap-4 md:gap-8 overflow-hidden relative shadow-inner rounded-sm min-h-[300px]">
                     <div className="flex justify-between items-center border-b border-[#00f3ff]/10 pb-2 md:pb-4">
                        <div className="flex items-center gap-2 md:gap-4">
                           <Sword size={16} className={phase === 'COMBAT' ? 'text-red-600 animate-bounce' : 'text-[#00f3ff]/10'} />
                           <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[#00f3ff]">UPLINK_SYSTEM</span>
                        </div>
                        <div className="text-[#00f3ff]/40 text-[7px] md:text-[9px] font-black uppercase tracking-widest">
                           {(partnerIndex % AD_PARTNERS.length) + 1}/{AD_PARTNERS.length}
                        </div>
                     </div>
                     
                     <div className="flex-1 relative flex items-center justify-center">
                        {phase === 'COMBAT' && (
                           <div className="flex flex-col items-center gap-6 md:gap-12 text-center text-red-600">
                              <Sword size={60} className="animate-bounce" />
                              <p className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] md:tracking-[1.8em] animate-pulse">BYPASSING</p>
                           </div>
                        )}
                        {phase === 'HARVESTING' && (
                           <div className="flex flex-col items-center gap-6 md:gap-12 text-center text-green-500">
                              <Cpu size={50} className="animate-spin-slow" />
                              <p className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] md:tracking-[1.8em] animate-pulse">HARVESTING</p>
                           </div>
                        )}
                        {phase === 'STABILIZING' && (
                           <div className="flex flex-col items-center gap-6 md:gap-12 text-center text-[#00f3ff]">
                              <Wifi size={60} className="animate-pulse" />
                              <p className="text-[10px] md:text-[14px] font-black uppercase tracking-[1em] md:tracking-[1.8em] animate-pulse">STABILIZING</p>
                           </div>
                        )}
                     </div>
                     
                     <div className="mt-auto pt-4 border-t border-[#00f3ff]/10">
                        <div className="flex justify-between text-[9px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.8em] text-[#00f3ff]/60">
                           <span>DURATION</span>
                           <span className="text-white tabular-nums">{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Logger */}
               <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-white/5 bg-black/80 flex flex-col p-4 md:p-8 gap-4 z-10 backdrop-blur-3xl shadow-2xl h-64 md:h-auto">
                  <div className="flex items-center gap-3 border-b border-[#00f3ff]/30 pb-2 md:pb-4">
                     <Activity size={16} className="text-[#00f3ff]" />
                     <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[#00f3ff]">LOGGER</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 md:space-y-7 custom-scrollbar pr-2">
                     {logs.map(log => (
                        <div key={log.id} className={`text-[9px] md:text-[11px] uppercase border-l-2 md:border-l-3 pl-3 md:pl-6 py-1 md:py-2 ${log.type === 'success' ? 'border-green-600 text-green-400' : log.type === 'warn' ? 'border-red-600 text-red-400' : log.type === 'pvp' ? 'border-[#ff00ff] text-[#ff00ff]' : 'border-[#00f3ff]/40 text-[#00f3ff]/60'}`}>
                           <p className="font-black leading-tight tracking-tight">{log.text}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto py-8 md:py-16 px-4 md:px-16 w-full h-full overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' && (
              <div className="space-y-12 md:space-y-16 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-16 p-6 md:p-16 bg-white/[0.01] border-2 border-[#00f3ff]/20 relative overflow-hidden group rounded-lg shadow-2xl backdrop-blur-md">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-[80px] md:blur-[120px] opacity-10" />
                    <div className="relative w-32 h-32 md:w-64 md:h-64 border-2 md:border-4 border-[#00f3ff]/40 p-2 md:p-5 bg-black flex items-center justify-center overflow-hidden rounded-sm">
                       {userAvatar ? (
                         <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover shadow-[0_0_30px_rgba(0,243,255,0.3)]" />
                       ) : (
                         <User size={64} md:size={120} className="text-[#00f3ff]/10" />
                       )}
                    </div>
                  </div>
                  <div className="space-y-6 md:space-y-8 relative z-10 flex-1 text-center lg:text-left">
                    <div className="space-y-2 md:space-y-3">
                       <span className="text-[10px] md:text-[12px] text-[#00f3ff]/40 font-black uppercase tracking-[0.5em] md:tracking-[0.8em] block">RANK_{rank}</span>
                       <h2 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan leading-none">ADMIN_77</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12">
                      <div className="flex flex-col border-l-4 md:border-l-6 border-[#00f3ff] pl-4 md:pl-10 py-2 md:py-4 bg-white/[0.02] backdrop-blur-md">
                        <span className="text-[9px] md:text-[11px] text-[#00f3ff]/60 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-1 md:mb-3">RESERVES</span>
                        <span className="text-xl md:text-5xl font-black text-white tracking-tighter tabular-nums">{mikelaReserves.toLocaleString()} MK</span>
                      </div>
                      <div className="flex flex-col border-l-4 md:border-l-6 border-[#ff00ff] pl-4 md:pl-10 py-2 md:py-4 bg-white/[0.02] backdrop-blur-md">
                        <span className="text-[9px] md:text-[11px] text-[#ff00ff]/60 font-black uppercase tracking-[0.3em] md:tracking-[0.6em] mb-1 md:mb-3">RANK_PROGRESS</span>
                        <span className="text-xl md:text-5xl font-black text-white tracking-tighter tabular-nums">{reputation.toLocaleString()} XP</span>
                        <div className="w-full h-1 bg-white/5 mt-2 overflow-hidden">
                           <div className="h-full bg-[#ff00ff]" style={{ width: `${(reputation / (rank * 2000)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'arena' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-700">
                 {arenaPhase === 'IDLE' ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {ARENA_OPPONENTS.map(o => (
                       <div key={o.id} className="p-8 border-2 border-[#ff00ff]/20 bg-black/60 hover:border-[#ff00ff]/60 transition-all group flex flex-col gap-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 bg-[#ff00ff]/10 text-[#ff00ff] text-[8px] font-black uppercase tracking-widest">RANK_{o.level}</div>
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 border border-[#ff00ff]/40 flex items-center justify-center bg-black group-hover:bg-[#ff00ff]/5 transition-colors">
                                <Target size={32} className="text-[#ff00ff]" />
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{o.name}</h4>
                                <span className="text-[10px] text-[#ff00ff] font-bold">POWER: {o.power}</span>
                             </div>
                          </div>
                          <div className="flex justify-between border-y border-white/5 py-4">
                             <div className="flex flex-col">
                                <span className="text-[8px] opacity-30 uppercase">Reward_XP</span>
                                <span className="text-sm font-black text-white">{o.rewardXP}</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-[8px] opacity-30 uppercase">Loot_MK</span>
                                <span className="text-sm font-black text-[#00f3ff]">{o.rewardMK}</span>
                             </div>
                          </div>
                          <button 
                            onClick={() => startPvP(o)}
                            className="w-full py-4 bg-transparent border-2 border-[#ff00ff] text-[#ff00ff] font-black uppercase tracking-[0.5em] hover:bg-[#ff00ff] hover:text-black transition-all"
                          >
                            CHALLENGE
                          </button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="max-w-4xl mx-auto border-2 border-[#ff00ff]/30 bg-black p-8 md:p-16 space-y-12 relative rounded-sm">
                      <div className="flex justify-between items-center px-4 md:px-8">
                         <div className="flex flex-col items-center gap-4">
                            <User size={64} className="text-[#00f3ff]" />
                            <span className="text-xs font-black text-[#00f3ff] uppercase tracking-widest">YOU</span>
                            <div className="w-32 h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-[#00f3ff]" style={{ width: `${(playerHp / (100 + rank * 10)) * 100}%` }} />
                            </div>
                         </div>
                         <div className="flex flex-col items-center">
                            <Swords size={48} className="text-[#ff00ff] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] mt-2 italic">SIM_VS</span>
                         </div>
                         <div className="flex flex-col items-center gap-4">
                            <Binary size={64} className="text-[#ff00ff]" />
                            <span className="text-xs font-black text-[#ff00ff] uppercase tracking-widest">{activeArenaBattle?.name}</span>
                            <div className="w-32 h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-[#ff00ff]" style={{ width: `${(enemyHp / activeArenaBattle!.power) * 100}%` }} />
                            </div>
                         </div>
                      </div>

                      {arenaPhase === 'FIGHTING' && (
                        <div className="text-center">
                           <p className="text-xl md:text-3xl font-black text-white uppercase italic tracking-widest animate-pulse">PRŮBĚH SOUBOJE...</p>
                        </div>
                      )}

                      {arenaPhase === 'VICTORY' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <h3 className="text-4xl md:text-7xl font-black text-green-500 italic uppercase">VÍTĚZSTVÍ</h3>
                           <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                              <div className="bg-white/5 p-4 border border-green-500/20">
                                 <span className="text-[9px] block opacity-40">+XP</span>
                                 <span className="text-xl font-black text-white">{activeArenaBattle?.rewardXP}</span>
                              </div>
                              <div className="bg-white/5 p-4 border border-green-500/20">
                                 <span className="text-[9px] block opacity-40">+MK</span>
                                 <span className="text-xl font-black text-[#00f3ff]">{activeArenaBattle?.rewardMK}</span>
                              </div>
                           </div>
                           <button onClick={() => setArenaPhase('IDLE')} className="px-12 py-4 border-2 border-green-500 text-green-500 font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all">POKRAČOVAT</button>
                        </div>
                      )}

                      {arenaPhase === 'DEFEAT' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <h3 className="text-4xl md:text-7xl font-black text-red-500 italic uppercase">PORÁŽKA</h3>
                           <p className="text-[#ff00ff]/60 uppercase tracking-widest font-black">SYSTÉMOVÁ CHYBA. VAŠE DATA BYLA KOMPROMITOVÁNA.</p>
                           <button onClick={() => setArenaPhase('IDLE')} className="px-12 py-4 border-2 border-red-500 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all">NÁVRAT</button>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-12 md:space-y-28 animate-in zoom-in duration-700 text-center">
                <div className="w-full max-w-5xl space-y-8 md:space-y-28 relative px-4">
                  <Compass size={120} md:size={240} className="text-[#00f3ff] mx-auto drop-shadow-[0_0_50px_rgba(0,243,255,0.7)] animate-spin-slow" />
                  <div className="space-y-4 md:space-y-14">
                    <h2 className="text-4xl md:text-9xl font-black text-white uppercase italic tracking-[0.2em] md:tracking-[0.6em] neon-glow-cyan">LAUNCH</h2>
                    <p className="text-xs md:text-xl text-[#00f3ff]/60 leading-relaxed tracking-[0.2em] md:tracking-[0.5em] uppercase font-black">
                      Vstup vyžaduje autorizaci. <br/> 
                      <span className="text-[#ff00ff]">CYKLUS: 60s</span>
                    </p>
                  </div>
                  <button 
                    onClick={startExpedition}
                    className="group relative px-12 md:px-56 py-6 md:py-16 border-2 md:border-4 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black active:scale-95 shadow-[0_0_40px_rgba(0,243,255,0.4)] rounded-sm w-full md:w-auto"
                  >
                    <span className="relative z-10 text-xl md:text-6xl font-black uppercase tracking-[0.2em] md:tracking-[1em]">EXPEDICE</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-in slide-in-from-right-8 duration-700">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.7, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-6 md:p-12 border-2 transition-all duration-300 flex flex-col bg-white/[0.01] rounded-md shadow-xl ${canAfford ? 'border-[#00f3ff]/20 hover:border-[#ff00ff]/60' : 'border-white/5 opacity-40 grayscale pointer-events-none'}`}>
                        <div className="flex justify-between items-start mb-6 md:mb-10">
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-black border-2 border-white/10 flex items-center justify-center">
                            <u.icon className={canAfford ? 'text-[#ff00ff]' : 'text-white/10'} size={32} md:size={48} />
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] text-white/40 font-black uppercase tracking-widest block mb-1">RANK</span>
                             <span className="text-3xl md:text-5xl font-black text-[#ff00ff] italic">v{u.level}</span>
                          </div>
                        </div>
                        <h4 className="text-xl md:text-3xl font-black text-white uppercase mb-2 md:mb-4 tracking-tighter italic">{u.name}</h4>
                        <p className="text-[10px] text-white/30 uppercase mb-8 leading-relaxed tracking-widest font-black">{u.desc}</p>
                        <button 
                          onClick={() => {
                            if(canAfford) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          className={`w-full py-4 border-2 md:border-3 font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all mt-auto flex items-center justify-center gap-4 ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? <>{cost.toLocaleString()} MK</> : <><Lock size={16} /></>}
                        </button>
                      </div>
                    )
                  })}
               </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 border-t border-[#00f3ff]/20 bg-black/90 backdrop-blur-xl flex items-center justify-around px-2 z-[60]">
         {navItems.map((item) => (
            <button
               key={item.id}
               onClick={() => { setActiveTab(item.id); if(!activeExpedition) setActiveExpedition(false); }}
               className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === item.id ? 'text-[#00f3ff] scale-110' : 'text-white/30'}`}
            >
               <item.icon size={20} />
               <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
         ))}
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff22; border-radius: 20px; }
        .tactical-grid {
          background-image: linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .neon-glow-cyan { text-shadow: 0 0 10px #00f3ff; }
      `}</style>
    </div>
  );
};
