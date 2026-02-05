
import React, { useState, useEffect, useRef } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon, PlayCircle, Lock, ExternalLink, RefreshCw } from 'lucide-react';
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
const AD_WATCH_DURATION = 15; 

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
  const [iframeKey, setIframeKey] = useState(0);

  const calculateTotalDuration = (level: number) => Math.max(15, 20 + (level - 1) * 4);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  const openVideoAd = (forStart: boolean = false) => {
    setIsVideoForStart(forStart);
    setVideoAdVisible(true);
    setVideoAdTimer(AD_WATCH_DURATION);
    setIframeKey(prev => prev + 1);
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-black border border-[#00f3ff]/20 shadow-[0_0_150px_rgba(0,243,255,0.2)] relative overflow-hidden">
            <div className="p-4 border-b border-[#00f3ff]/20 flex justify-between items-center bg-black/50 backdrop-blur-md">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-red-600 animate-pulse rounded-full" />
                 <span className="text-xs font-black uppercase tracking-[0.2em]">{isVideoForStart ? 'PŘED-START_VERIFIKACE' : 'DATAVÝ_UPLINK_AUTORIZACE'}</span>
               </div>
               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setIframeKey(k => k + 1)}
                  className="p-2 hover:bg-white/10 text-white/40 transition-colors"
                  title="Refresh Uplink"
                 >
                   <RefreshCw size={16} />
                 </button>
                 {videoAdTimer <= 0 && (
                   <button onClick={() => setVideoAdVisible(false)} className="text-white/40 hover:text-white transition-colors">
                     <X size={20} />
                   </button>
                 )}
               </div>
            </div>

            <div className="aspect-video bg-[#050505] relative group flex items-center justify-center">
               <iframe 
                key={iframeKey}
                src={VIDEO_AD_URL}
                className="w-full h-full border-0 absolute inset-0 z-10"
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                title="Secure Ad Bridge"
               />
               
               {/* Iframe Loading/Fallback Screen */}
               <div className="flex flex-col items-center gap-4 text-center p-8 z-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-2xl opacity-20 animate-pulse" />
                    <Activity size={48} className="text-[#00f3ff] mb-4" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-[#00f3ff]/40">Navazování spojení s HilltopAds...</h4>
                  <p className="text-[10px] text-white/20 max-w-xs leading-relaxed uppercase">
                    Pokud se okno nenačte, použijte tlačítko pro manuální otevření níže.
                  </p>
                  <button 
                    onClick={() => window.open(VIDEO_AD_URL, '_blank')}
                    className="mt-4 px-6 py-2 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2"
                  >
                    <ExternalLink size={12} /> MANUÁLNÍ_OTEVŘENÍ_V_NOVÉ_KARTĚ
                  </button>
               </div>
               
               {/* Controls Overlay */}
               <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center gap-4 z-20">
                  {videoAdTimer > 0 ? (
                    <div className="flex flex-col items-center gap-3 bg-black/80 px-10 py-5 border border-white/10 backdrop-blur-sm">
                       <div className="flex items-center gap-4">
                         <Loader2 className="animate-spin text-[#00f3ff]" size={20} />
                         <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#00f3ff]">Autorizace probíhá: {videoAdTimer}s</p>
                       </div>
                       <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-[#00f3ff] transition-all duration-1000 linear" style={{ width: `${(1 - videoAdTimer/AD_WATCH_DURATION) * 100}%` }} />
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-green-500/10 border border-green-500/40 px-6 py-2 rounded-full">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Verifikace uzlu dokončena</p>
                       </div>
                       <button 
                        onClick={claimVideoReward} 
                        className="group relative px-20 py-5 bg-[#ff00ff] text-black font-black uppercase text-sm tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_40px_rgba(255,0,255,0.4)]"
                       >
                         <span className="relative z-10">DOKONČIT_AUTORIZACI</span>
                         <div className="absolute inset-0 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                       </button>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-3 bg-black text-center border-t border-white/5">
               <span className="text-[7px] opacity-10 uppercase tracking-widest">Protocol: HilltopAds Secure Tunnel v9.1 | Status: Latency Stable</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-20 md:w-64 border-r border-white/5 bg-black/60 flex flex-col py-8 z-20 backdrop-blur-md">
        <div className="mb-14 flex flex-col items-center gap-2">
          <Database className="text-[#00f3ff] animate-pulse" size={24} />
          <span className="hidden md:block text-[9px] text-[#00f3ff]/40 uppercase font-black tracking-[0.5em]">SYSTEM_HUB_0xEF</span>
        </div>
        <nav className="flex-1 space-y-2 px-2">
          {[
            { id: 'profile' as GameTab, icon: User, label: 'Profil' },
            { id: 'expeditions' as GameTab, icon: Compass, label: 'Expedice' },
            { id: 'items' as GameTab, icon: Package, label: 'Arzenál' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 transition-all duration-300 rounded-lg ${activeTab === item.id ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-r-4 border-[#00f3ff] shadow-[inset_0_0_15px_rgba(0,243,255,0.1)]' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={20} />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-1000">
            {/* HUD Header */}
            <div className="px-10 py-6 border-b border-white/5 bg-black/90 flex justify-between items-center backdrop-blur-xl z-10 shadow-2xl">
              <div className="flex items-center gap-10">
                <div className="space-y-1">
                  <span className="text-[8px] text-[#00f3ff]/40 uppercase font-black block tracking-tighter">Sector Coordinates</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-[0.2em] neon-glow-cyan">0x{expeditionLevel.toString(16).toUpperCase()}</span>
                </div>
                <div className="h-10 w-[1px] bg-white/10" />
                <div className="space-y-1">
                  <span className="text-[8px] text-[#00f3ff]/40 uppercase font-black block tracking-tighter">Operational Phase</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
                    <span className="text-xs font-black text-[#00f3ff] uppercase tracking-widest">{phase}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right border-r border-white/5 pr-8">
                   <span className="text-[8px] text-white/20 uppercase font-black block mb-1">Anomalies Cleared</span>
                   <span className="text-sm font-bold text-[#ff00ff] tabular-nums">{adsDestroyed} / {Math.floor(expeditionLevel * 0.7)}</span>
                </div>
                <div className="flex items-center gap-5 bg-[#00f3ff]/5 border border-[#00f3ff]/30 px-10 py-4 rounded shadow-[inset_0_0_20px_rgba(0,243,255,0.1)]">
                  <Clock className="text-[#00f3ff] animate-pulse" size={20} />
                  <span className="text-2xl font-mono font-black text-[#00f3ff] tabular-nums drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical View */}
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 relative bg-black overflow-hidden">
                <div className="absolute inset-0 tactical-grid opacity-[0.12]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />
                
                {/* Ads Layer */}
                <div className="absolute inset-0 z-30 pointer-events-none p-16 flex flex-col items-center gap-10">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-10 duration-700">
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
                       <div className="relative hover:scale-125 transition-transform duration-300">
                          <div className="absolute inset-0 bg-[#ff00ff] blur-2xl opacity-40 animate-pulse" />
                          <div className="bg-black border-2 border-[#ff00ff] p-5 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(255,0,255,0.4)] group-hover:border-white transition-colors">
                            <Coins className="text-[#ff00ff] group-hover:text-white group-hover:animate-bounce" size={32} />
                            <span className="text-[10px] font-black text-white bg-[#ff00ff] px-2 py-0.5 tracking-tighter">DATA_FRAGMENT</span>
                            <span className="text-[8px] font-bold text-white/60">VAL: {coin.value} MK</span>
                          </div>
                       </div>
                    </button>
                  ))}
                </div>

                {/* Overlays */}
                {phase === 'COMPLETED' && (
                  <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                    <div className="text-center p-20 border-2 border-[#00f3ff] bg-black/80 shadow-[0_0_120px_rgba(0,243,255,0.3)] max-w-2xl">
                      <Trophy size={120} className="text-[#00f3ff] mx-auto mb-10 animate-bounce" />
                      <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter mb-6 neon-glow-cyan">DATOVÁ_ŽEŇ</h2>
                      <p className="text-xs text-[#00f3ff] uppercase font-black mb-14 tracking-[0.4em] opacity-80">Extraction Complete | Uplink Secured | Reward Pending</p>
                      <button onClick={() => setActiveExpedition(false)} className="group relative px-28 py-8 bg-[#00f3ff] text-black font-black uppercase tracking-[0.6em] hover:bg-white transition-all text-base overflow-hidden">
                        <span className="relative z-10">NÁVRAT_DOMŮ</span>
                        <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal sidebar */}
              <div className="w-80 border-l border-white/5 bg-[#030303] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                  <div className="flex items-center gap-3">
                    <Terminal size={16} className="text-[#00f3ff]" />
                    <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-[0.3em]">Command_Line</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {logs.length === 0 && <div className="text-[9px] text-white/5 uppercase italic">Awaiting telemetry...</div>}
                  {logs.map(log => (
                    <div key={log.id} className={`text-[10px] uppercase leading-relaxed border-l-2 pl-4 transition-all animate-in slide-in-from-right-4 duration-400 ${log.type === 'success' ? 'border-green-500 text-green-400' : log.type === 'error' ? 'border-red-600 text-red-500' : 'border-[#00f3ff]/40 text-[#00f3ff]/60'}`}>
                      <div className="flex justify-between items-center opacity-30 text-[7px] mb-1.5">
                         <span className="tracking-widest">LOG_ID: {log.id.slice(-6)}</span>
                         <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <span className="font-bold tracking-tight block leading-tight">{log.text}</span>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-black/80 border-t border-white/5 space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] text-[#00f3ff] font-black tracking-widest uppercase">
                        <span>Extrakce dat</span>
                        <span className="neon-glow-cyan">{progress}%</span>
                      </div>
                      <div className="h-2.5 bg-white/5 relative rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-gradient-to-r from-[#00f3ff] to-[#ff00ff] shadow-[0_0_20px_rgba(0,243,255,0.8)] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-20 px-12 w-full h-full overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.02)_0%,transparent_100%)]">
            {activeTab === 'profile' && (
              <div className="space-y-16 animate-in slide-in-from-bottom-10 duration-700">
                <div className="flex flex-col md:flex-row items-center gap-16 p-16 bg-white/[0.01] border border-white/5 relative overflow-hidden group shadow-2xl rounded-sm">
                  <div className="absolute -top-20 -right-20 p-8 opacity-5 -rotate-12 transform group-hover:rotate-0 group-hover:scale-125 transition-all duration-1000"><Database size={320} /></div>
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-3xl opacity-10 group-hover:opacity-30 transition-opacity" />
                    <div className="relative w-56 h-56 border-2 border-[#00f3ff] p-3 bg-black shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover pixelated" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={100} className="text-white/10" /></div>}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00f3ff] animate-scanline" />
                    </div>
                  </div>
                  <div className="space-y-8 relative z-10 flex-1">
                    <div className="space-y-2">
                       <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-[0.5em] opacity-40">System_Administrator</span>
                       <h2 className="text-7xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan">ADMIN_77</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                      <div className="flex flex-col border-l-4 border-[#00f3ff] pl-8 py-2 bg-white/[0.02]"><span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest mb-2">MIKELA_VAL_RESERVES</span><span className="text-4xl font-black text-white tracking-tighter tabular-nums">{mikelaReserves.toLocaleString()} MK</span></div>
                      <div className="flex flex-col border-l-4 border-[#ff00ff] pl-8 py-2 bg-white/[0.02]"><span className="text-[10px] text-[#ff00ff] font-black uppercase tracking-widest mb-2">NETWORK_REPUTATION</span><span className="text-4xl font-black text-white tracking-tighter tabular-nums">{reputation.toLocaleString()} XP</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {[
                     { label: 'System Tier', val: `0x${expeditionLevel.toString(16).toUpperCase()}`, color: '#00f3ff' },
                     { label: 'Purged Anomalies', val: adsDestroyed, color: '#ff00ff' },
                     { label: 'Network Integrity', val: '99.8%', color: '#10b981' }
                   ].map((stat, i) => (
                    <div key={i} className="p-10 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all hover:-translate-y-2 duration-300 group">
                       <span className="text-[11px] text-white/30 uppercase font-black tracking-[0.3em] block mb-4">{stat.label}</span>
                       <p className="text-5xl font-black italic tracking-tighter group-hover:scale-105 transition-transform" style={{ color: stat.color }}>{stat.val}</p>
                    </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-16 animate-in zoom-in duration-700">
                <div className="w-full max-w-2xl text-center space-y-20">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-[150px] opacity-20 animate-pulse" />
                    <Compass size={200} className="text-[#00f3ff] mx-auto relative drop-shadow-[0_0_40px_rgba(0,243,255,0.6)] animate-spin-slow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Shield size={64} className="text-[#ff00ff] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h2 className="text-6xl font-black text-white uppercase italic tracking-[0.3em] leading-tight neon-glow-cyan">VSTOUPIT_DO_MATRIXU</h2>
                    <p className="text-sm text-[#00f3ff]/50 max-w-xl mx-auto leading-loose tracking-[0.2em] uppercase font-bold">
                      Detekována hluboká vrstva Sektoru 0x{expeditionLevel.toString(16).toUpperCase()}. <br/> 
                      Nutná autorizace přes uzel <span className="text-[#ff00ff]">HilltopAds</span> k dešifrování přenosu.
                    </p>
                  </div>
                  <button 
                    onClick={() => openVideoAd(true)}
                    className="group relative px-32 py-10 border-2 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black hover:scale-110 active:scale-90 shadow-[0_0_80px_rgba(0,243,255,0.3)]"
                  >
                    <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 bg-[#00f3ff] transition-transform duration-500 ease-expo" />
                    <div className="relative z-10 flex items-center gap-6">
                       <PlayCircle size={32} />
                       <span className="text-3xl font-black uppercase tracking-[0.5em]">AUTORIZOVAT</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-right-10 duration-700">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.6, u.level - 1));
                    const canAfford = mikelaReserves >= cost;
                    return (
                      <div key={u.id} className={`p-14 border transition-all duration-500 flex flex-col bg-white/[0.01] group relative ${canAfford ? 'border-white/10 hover:border-[#ff00ff]/60 hover:bg-white/[0.03]' : 'border-white/5 opacity-40 grayscale'}`}>
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-24 h-24 bg-black border border-white/10 flex items-center justify-center shadow-[inset_0_0_30px_rgba(255,0,255,0.05)] group-hover:border-[#ff00ff]/40 transition-colors">
                            <u.icon className={canAfford ? 'text-[#ff00ff] group-hover:scale-110 transition-transform' : 'text-white/10'} size={48} />
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] block mb-2">Upgrade_Tier</span>
                             <span className="text-5xl font-black text-[#ff00ff] italic group-hover:neon-glow-pink transition-all">v{u.level}</span>
                          </div>
                        </div>
                        <h4 className="text-3xl font-black text-white uppercase mb-4 tracking-tight group-hover:text-[#ff00ff] transition-colors">{u.name}</h4>
                        <p className="text-xs text-white/30 uppercase mb-14 leading-relaxed tracking-[0.2em] font-medium">{u.desc}</p>
                        
                        <button 
                          onClick={() => {
                            if(canAfford) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-8 border-2 font-black text-sm uppercase tracking-[0.4em] transition-all mt-auto flex items-center justify-center gap-4 ${canAfford ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_20px_rgba(255,0,255,0.1)] hover:shadow-[0_0_40px_rgba(255,0,255,0.4)]' : 'border-white/10 text-white/10'}`}
                        >
                          {canAfford ? (
                            <>VYLEPŠIT_KÓD | {cost.toLocaleString()} MK</>
                          ) : (
                            <><Lock size={20} /> NEDOSTATEK_MIKELA</>
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; border-radius: 10px; }
        .pixelated { image-rendering: pixelated; }
        .tactical-grid {
          background-image: 
            linear-gradient(to right, #00f3ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f3ff 1px, transparent 1px);
          background-size: 80px 80px;
          animation: grid-scroll 40s linear infinite;
        }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(224px); }
        }
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 80px 80px; }
        }
        .ease-expo { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
      `}</style>
    </div>
  );
};
