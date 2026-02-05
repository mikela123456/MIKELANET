
import React, { useState, useEffect, useRef } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon, PlayCircle, Lock } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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

const VIDEO_AD_URL = "https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy";
const AD_WATCH_DURATION = 15; // Sekundy, po kterých se zobrazí tlačítko potvrzení

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
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
  const [preLaunchAdVisible, setPreLaunchAdVisible] = useState(false);
  
  // Video Ad States
  const [videoAdVisible, setVideoAdVisible] = useState(false);
  const [videoAdTimer, setVideoAdTimer] = useState(0);
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [isVideoForStart, setIsVideoForStart] = useState(false);

  const calculateTotalDuration = (level: number) => Math.max(15, 20 + (level - 1) * 4);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  // Video Ad Trigger Logic
  const openVideoAd = (forStart: boolean = false) => {
    setIsVideoForStart(forStart);
    setVideoAdVisible(true);
    setVideoAdTimer(AD_WATCH_DURATION);
  };

  useEffect(() => {
    let timer: number;
    if (videoAdVisible && videoAdTimer > 0) {
      timer = window.setInterval(() => {
        setVideoAdTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [videoAdVisible, videoAdTimer]);

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
    openVideoAd(false);
  };

  const claimVideoReward = () => {
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
    }
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
      
      {/* GLOBAL VIDEO AD OVERLAY */}
      {videoAdVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-black border border-[#00f3ff]/20 shadow-[0_0_100px_rgba(0,243,255,0.15)] relative">
            <div className="p-4 border-b border-[#00f3ff]/20 flex justify-between items-center bg-black">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-red-600 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-[0.2em]">{isVideoForStart ? 'PŘED-START_VERIFIKACE' : 'DATAVÝ_UPLINK_AUTORIZACE'}</span>
               </div>
               {videoAdTimer <= 0 && (
                 <button onClick={() => setVideoAdVisible(false)} className="text-white/40 hover:text-white transition-colors">
                   <X size={20} />
                 </button>
               )}
            </div>

            <div className="aspect-video bg-black relative group">
               <iframe 
                src={VIDEO_AD_URL}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                title="Secure Ad Bridge"
               />
               
               {/* Overlay with timer or confirm button */}
               <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4">
                  {videoAdTimer > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="animate-spin text-[#00f3ff]/60" size={24} />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00f3ff]/60">Autorizace probíhá: {videoAdTimer}s</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                       <p className="text-[11px] font-black uppercase tracking-[0.2em] text-green-400">Verifikace dokončena</p>
                       <button 
                        onClick={claimVideoReward} 
                        className="px-12 py-4 bg-[#ff00ff] text-black font-black uppercase text-xs tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_30px_rgba(255,0,255,0.4)]"
                       >
                         POTVRDIT_PŘENOS
                       </button>
                    </div>
                  )}
               </div>
            </div>

            {/* HilltopAds / Adsterra Compliance footer */}
            <div className="p-2 bg-[#050505] text-center border-t border-white/5">
               <span className="text-[7px] opacity-20 uppercase tracking-widest">Powered by Secure Link Protocol v8.4.1 - 2024 Digital Future Systems</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-20 md:w-64 border-r border-white/5 bg-black/40 flex flex-col py-8 z-20">
        <div className="mb-12 flex flex-col items-center gap-2">
          <Database className="text-[#00f3ff] animate-pulse" size={20} />
          <span className="hidden md:block text-[8px] text-[#00f3ff]/40 uppercase font-black tracking-[0.4em]">SYSTEM_HUB</span>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {[
            { id: 'profile' as GameTab, icon: User, label: 'Profil' },
            { id: 'expeditions' as GameTab, icon: Compass, label: 'Expedice' },
            { id: 'items' as GameTab, icon: Package, label: 'Arzenál' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 transition-all duration-300 ${activeTab === item.id ? 'bg-[#00f3ff]/5 text-[#00f3ff] border-r-2 border-[#00f3ff]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-700">
            {/* HUD Header - More compact and clearer */}
            <div className="px-8 py-5 border-b border-white/5 bg-black/80 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-8">
                <div className="space-y-1">
                  <span className="text-[7px] text-[#00f3ff]/40 uppercase font-black block">Mission Sector</span>
                  <span className="text-lg font-black text-white italic uppercase tracking-[0.1em]">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="space-y-1">
                  <span className="text-[7px] text-[#00f3ff]/40 uppercase font-black block">Signal Integrity</span>
                  <span className="text-xs font-black text-[#00f3ff] uppercase tracking-widest animate-pulse">{phase}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                   <span className="text-[7px] text-white/20 uppercase font-black block">Chunks Extracted</span>
                   <span className="text-sm font-bold text-[#ff00ff]">{adsDestroyed} / {Math.floor(expeditionLevel * 0.7)}</span>
                </div>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-3 rounded-sm shadow-inner">
                  <Clock className="text-[#00f3ff]" size={16} />
                  <span className="text-xl font-mono font-black text-[#00f3ff] tabular-nums">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical View - Improved grid and visibility */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative bg-[#010101] overflow-hidden">
                <div className="absolute inset-0 tactical-grid opacity-[0.07]" />
                <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
                
                {/* Ads Layer - Banners centered or strategically placed */}
                <div className="absolute inset-0 z-30 pointer-events-none p-12 flex flex-col items-center gap-8">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="pointer-events-auto shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
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
                      className="absolute pointer-events-auto group animate-in zoom-in duration-700"
                      style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
                    >
                       <div className="relative hover:scale-110 transition-transform">
                          <div className="absolute inset-0 bg-[#ff00ff] blur-xl opacity-30 animate-pulse" />
                          <div className="bg-black border-2 border-[#ff00ff] p-4 flex flex-col items-center gap-1 shadow-[0_0_30px_rgba(255,0,255,0.3)] group-hover:border-white transition-colors">
                            <Coins className="text-[#ff00ff] group-hover:text-white" size={32} />
                            <span className="text-[8px] font-black text-[#ff00ff] group-hover:text-white">EXTRACT_{coin.value}_MK</span>
                          </div>
                       </div>
                    </button>
                  ))}
                </div>

                {/* Phase specific messages */}
                {phase === 'STARTING' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-40">
                     <div className="flex flex-col items-center gap-4">
                        <Activity size={48} className="animate-pulse" />
                        <h4 className="text-xl font-black uppercase tracking-[0.5em]">Synchronizace...</h4>
                     </div>
                  </div>
                )}

                {/* Completion Overlays */}
                {phase === 'COMPLETED' && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-500">
                    <div className="text-center p-16 border-2 border-[#00f3ff]/40 bg-black/60 shadow-[0_0_100px_rgba(0,243,255,0.2)]">
                      <Trophy size={100} className="text-[#00f3ff] mx-auto mb-8 animate-bounce" />
                      <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">DATOVÁ_ŽEŇ_ÚSPĚŠNÁ</h2>
                      <p className="text-[10px] text-[#00f3ff] uppercase font-black mb-12 tracking-widest opacity-60">Všechny linky stabilizovány | Sektor vyčištěn</p>
                      <button onClick={() => setActiveExpedition(false)} className="px-24 py-6 bg-[#00f3ff] text-black font-black uppercase tracking-[0.6em] hover:bg-white transition-all text-sm">NÁVRAT_NA_ZÁKLADNU</button>
                    </div>
                  </div>
                )}

                {phase === 'FAILED' && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
                    <div className="text-center p-16 border-2 border-red-600 bg-black/60">
                      <AlertTriangle size={100} className="text-red-600 mx-auto mb-8 animate-pulse" />
                      <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">LINK_ZTRACEN</h2>
                      <p className="text-[10px] text-red-600 uppercase font-black mb-12 tracking-widest opacity-60">Detekován systémový firewall | Spojení ukončeno</p>
                      <button onClick={() => setActiveExpedition(false)} className="px-24 py-6 bg-red-600 text-white font-black uppercase tracking-[0.6em] transition-all text-sm">REBOOT_SYSTÉM</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal sidebar - clearer spacing */}
              <div className="w-80 border-l border-white/5 bg-[#050505] flex flex-col shadow-2xl">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-[#00f3ff]" />
                    <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest">Live_Logs</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className={`text-[10px] uppercase leading-relaxed border-l-2 pl-3 transition-all animate-in slide-in-from-right duration-300 ${log.type === 'success' ? 'border-green-500 text-green-400' : log.type === 'error' ? 'border-red-600 text-red-400' : 'border-[#00f3ff]/20 text-[#00f3ff]/50'}`}>
                      <div className="flex justify-between items-center opacity-40 text-[7px] mb-1">
                         <span>EVENT_{log.id.slice(-4)}</span>
                         <span>{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                      </div>
                      <span className="font-bold tracking-tight">{log.text}</span>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-black border-t border-white/5 space-y-4">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[9px] text-[#00f3ff] font-black tracking-widest">
                        <span>MISSION_PROGRESS</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-white/5 relative rounded-full overflow-hidden">
                        <div className="h-full bg-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.6)] transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-16 px-10 w-full h-full overflow-y-auto custom-scrollbar bg-radial-vignette">
            {activeTab === 'profile' && (
              <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center gap-12 p-14 bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 transform group-hover:scale-110 transition-transform"><Database size={240} /></div>
                  <div className="relative w-48 h-48 border-2 border-[#00f3ff] p-2 bg-black shadow-[0_0_30px_rgba(0,243,255,0.15)]">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover pixelated" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={80} className="text-white/10" /></div>}
                  </div>
                  <div className="space-y-6 relative z-10">
                    <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter">ADMIN_77</h2>
                    <div className="flex gap-10">
                      <div className="flex flex-col border-l-2 border-[#00f3ff] pl-6"><span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest mb-1">MIKELA_RESERVES</span><span className="text-3xl font-black text-white">{mikelaReserves} MK</span></div>
                      <div className="flex flex-col border-l-2 border-[#ff00ff] pl-6"><span className="text-[10px] text-[#ff00ff] font-black uppercase tracking-widest mb-1">REPUTATION_XP</span><span className="text-3xl font-black text-white">{reputation}</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="p-10 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block">System Tier</span>
                      <p className="text-4xl font-black text-[#00f3ff]">0x{expeditionLevel.toString(16).toUpperCase()}</p>
                   </div>
                   <div className="p-10 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block">Anomalies Purged</span>
                      <p className="text-4xl font-black text-[#ff00ff]">{adsDestroyed}</p>
                   </div>
                   <div className="p-10 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors space-y-3">
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block">Uplink Health</span>
                      <p className="text-4xl font-black text-green-500">STABLE</p>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500">
                <div className="w-full max-w-2xl text-center space-y-16">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-[100px] opacity-20 animate-pulse" />
                    <Compass size={160} className="text-[#00f3ff] mx-auto relative drop-shadow-[0_0_20px_rgba(0,243,255,0.5)]" />
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-5xl font-black text-white uppercase italic tracking-[0.2em]">VSTOUPIT_DO_DATOVÉHO_TOKŮ</h2>
                    <p className="text-xs text-[#00f3ff]/60 max-w-lg mx-auto leading-loose tracking-widest">
                      Detekován Sektor 0x{expeditionLevel.toString(16).toUpperCase()}. Před vstupem je nutná autorizace zabezpečeného přenosu prostřednictvím reklamního uzlu HilltopAds.
                    </p>
                  </div>
                  <button 
                    onClick={() => openVideoAd(true)}
                    className="group relative px-28 py-8 border-2 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(0,243,255,0.2)]"
                  >
                    <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-[#00f3ff] transition-transform duration-300" />
                    <div className="relative z-10 flex items-center gap-4">
                       <PlayCircle size={24} />
                       <span className="text-2xl font-black uppercase tracking-[0.3em]">START_AUTORIZACE</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-right-8 duration-500">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.6, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-12 border transition-all duration-300 flex flex-col bg-white/[0.01] hover:bg-white/[0.03] ${canAfford ? 'border-white/10 hover:border-[#ff00ff]/60' : 'border-white/5 opacity-50 grayscale'}`}>
                        <div className="flex justify-between items-start mb-10">
                          <div className="w-20 h-20 bg-black border border-white/10 flex items-center justify-center shadow-inner">
                            <u.icon className={canAfford ? 'text-[#ff00ff]' : 'text-white/20'} size={40} />
                          </div>
                          <div className="text-right">
                             <span className="text-3xl font-black text-[#ff00ff] italic block">LV_{u.level}</span>
                             <span className="text-[8px] text-white/40 font-bold uppercase tracking-widest">Upgrade Available</span>
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-white uppercase mb-4 tracking-tight">{u.name}</h4>
                        <p className="text-[11px] text-white/30 uppercase mb-12 leading-relaxed tracking-wider">{u.desc}</p>
                        
                        <button 
                          onClick={() => {
                            if(canAfford) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-6 border-2 font-black text-sm uppercase tracking-[0.3em] transition-all mt-auto flex items-center justify-center gap-3 ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? (
                            <>VYLEPŠIT | {cost} MK</>
                          ) : (
                            <><Lock size={16} /> NEDOSTATEK_DAT</>
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; }
        .pixelated { image-rendering: pixelated; }
        .tactical-grid {
          background-image: 
            linear-gradient(to right, #00f3ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f3ff 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-scroll 30s linear infinite;
        }
        .bg-radial-vignette {
          background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
        }
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 0 60px; }
        }
      `}</style>
    </div>
  );
};
