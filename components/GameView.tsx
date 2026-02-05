
import React, { useState, useEffect } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon } from 'lucide-react';
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
  imgUrl?: string;
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

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);
  
  const [mikelaReserves, setMikelaReserves] = useState(100);
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
  const [videoAdVisible, setVideoAdVisible] = useState(false);
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  
  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);
  const [currentExpeditionDuration, setCurrentExpeditionDuration] = useState<number>(0);

  const calculateTotalDuration = (level: number) => Math.max(15, 25 + (level - 1) * 5);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 15));
  };

  const startExpedition = () => {
    setPreLaunchAdVisible(false);
    const baseDuration = calculateTotalDuration(expeditionLevel);
    const spdLevel = upgrades.find(u => u.id === 'spd')?.level || 1;
    const effectiveDuration = Math.ceil(baseDuration * (1 - Math.min(0.6, (spdLevel - 1) * 0.05)));
    
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
    addLog(`Navazování spojení se Sektorem 0x${expeditionLevel.toString(16).toUpperCase()}`, 'info');
  };

  const handleAdDestroyed = (id: number) => {
    setActiveAds(prev => prev.filter(ad => ad.id !== id));
    setAdsDestroyed(prev => prev + 1);
    addLog(`Anomálie eliminována. Integrita +10%`, 'success');
    
    setTimeout(() => {
      if (activeExpedition && timeLeft > 5) {
        setActiveAds(prev => [...prev, { id: Date.now() }]);
      }
    }, 2000);
  };

  const handleCoinClick = (id: string) => {
    setActiveCoinId(id);
    setVideoAdVisible(true);
  };

  const claimCoinReward = () => {
    if (activeCoinId) {
      const coin = coins.find(c => c.id === activeCoinId);
      if (coin) {
        setMikelaReserves(prev => prev + coin.value);
        setCoins(prev => prev.filter(c => c.id !== activeCoinId));
        addLog(`Dekódováno ${coin.value} MK z datového fragmentu`, 'success');
      }
    }
    setVideoAdVisible(false);
    setActiveCoinId(null);
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
        if (currentProgress < 20) return 'STARTING';
        if (currentProgress < 80) return 'TRAVELING';
        return 'EXTRACTING';
      });

      if (Math.random() < 0.04 && coins.length < 2 && currentProgress > 10 && currentProgress < 85) {
        setCoins(prev => [...prev, {
          id: Math.random().toString(),
          x: 15 + Math.random() * 70,
          y: 20 + Math.random() * 50,
          value: Math.floor(80 * expeditionLevel * (1 + Math.random()))
        }]);
      }

      if (now >= expeditionEndTime) {
        clearInterval(interval);
        const success = adsDestroyed >= Math.floor(expeditionLevel * 0.8) || Math.random() > 0.3;
        if (success) {
          setPhase('COMPLETED');
          const reward = Math.floor(100 * expeditionLevel + (adsDestroyed * 30));
          setMikelaReserves(p => p + reward);
          setReputation(p => p + expeditionLevel * 50);
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
    <div className="flex h-full w-full bg-[#050505] border-t border-[#00f3ff]/20 relative overflow-hidden font-mono">
      
      {/* Video Ad Modal */}
      {videoAdVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-4xl p-1 bg-[#ff00ff]/30 border border-[#ff00ff]/60 shadow-[0_0_100px_rgba(255,0,255,0.2)]">
            <div className="bg-black p-4 flex justify-between items-center border-b border-[#ff00ff]/30">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#ff00ff] animate-pulse" />
                <span className="text-xs font-black text-[#ff00ff] uppercase tracking-widest">HLOUBKOVÁ_DEKRYPTACE</span>
              </div>
              <button onClick={() => setVideoAdVisible(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="aspect-video bg-black relative">
              <iframe 
                src="https://groundedmine.com/d.mTFSzgdpGDNYvcZcGXUK/FeJm/9IuZZNUElDktPwTaYW3CNUz/YTwMNFD/ket-N/j_c/3qN/jPA/1cMuwy"
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                title="Reward Auth"
              />
              <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent flex justify-end">
                <button onClick={claimCoinReward} className="px-8 py-3 bg-[#ff00ff] text-black font-black uppercase text-[11px] tracking-widest hover:bg-white transition-all">
                  POTVRDIT_DEKÓDOVÁNÍ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-launch Overlay */}
      {preLaunchAdVisible && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md bg-[#050505] border-2 border-[#00f3ff]/40 p-10 shadow-[0_0_50px_rgba(0,243,255,0.2)] text-center">
            <AlertIcon className="text-[#00f3ff] mx-auto mb-6 animate-pulse" size={48} />
            <h2 className="text-2xl font-black text-white uppercase italic mb-2">AUTORIZACE_PŘENOSU</h2>
            <p className="text-[10px] text-[#00f3ff]/60 uppercase tracking-widest mb-8">Stabilizujte reklamní uzel pro start expedice</p>
            
            <div className="flex justify-center mb-10">
              <AdBanner playerAtk={1} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPreLaunchAdVisible(false)} className="py-4 border border-white/10 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white">STORNO</button>
              <button onClick={startExpedition} className="py-4 bg-[#00f3ff] text-black text-[10px] font-black uppercase tracking-widest hover:bg-white">POTVRDIT_START</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 border-r border-[#00f3ff]/10 bg-black/80 flex flex-col py-8 z-20">
        <div className="mb-12 flex flex-col items-center">
          <Database className="text-[#00f3ff] mb-2" size={24} />
          <span className="hidden md:block text-[8px] text-[#00f3ff]/40 uppercase font-black tracking-[0.5em]">SYSTEM_CORE</span>
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
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 transition-all ${activeTab === item.id ? 'bg-[#00f3ff]/5 text-[#00f3ff] border-r-2 border-[#00f3ff]' : 'text-white/20 hover:text-white'}`}
            >
              <item.icon size={20} />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeExpedition ? (
          <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* HUD Header */}
            <div className="p-6 border-b border-[#00f3ff]/20 bg-black/60 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#00f3ff]/60 uppercase font-black">Lokalita</span>
                  <span className="text-xl font-black text-white italic uppercase tracking-widest">Sector_0x{expeditionLevel}</span>
                </div>
                <div className="h-8 w-[1px] bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#00f3ff]/60 uppercase font-black">Status</span>
                  <span className="text-sm font-black text-[#00f3ff] uppercase tracking-widest animate-pulse">{phase}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-[#00f3ff]/5 border border-[#00f3ff]/20 px-6 py-3">
                <Clock className="text-[#00f3ff]" size={18} />
                <span className="text-2xl font-black text-[#00f3ff] tabular-nums">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Tactical View Container */}
            <div className="flex-1 flex overflow-hidden">
              {/* Map/Radar Area */}
              <div className="flex-1 relative bg-black overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,1)]">
                {/* Tactical Grid Background */}
                <div className="absolute inset-0 tactical-grid opacity-20" />
                
                {/* Ads Layer */}
                <div className="absolute inset-0 z-30 pointer-events-none p-10 flex flex-wrap content-start justify-center gap-6">
                  {activeAds.map(ad => (
                    <div key={ad.id} className="pointer-events-auto">
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
                      className="absolute pointer-events-auto group animate-in zoom-in duration-500 hover:scale-110 transition-transform"
                      style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
                    >
                       <div className="relative">
                          <div className="absolute inset-0 bg-[#ff00ff] blur-md opacity-40 animate-pulse" />
                          <div className="bg-black border border-[#ff00ff] p-3 flex flex-col items-center shadow-[0_0_20px_rgba(255,0,255,0.4)]">
                            <Coins className="text-[#ff00ff] mb-1" size={24} />
                            <span className="text-[8px] font-black text-[#ff00ff]">EXTRACT_DATA</span>
                          </div>
                       </div>
                    </button>
                  ))}
                </div>

                {/* Status Overlays */}
                {phase === 'COMPLETED' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in duration-500">
                    <div className="text-center">
                      <Trophy size={80} className="text-[#00f3ff] mx-auto mb-6 animate-bounce" />
                      <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-8">MISE_SPLNĚNA</h2>
                      <button onClick={() => setActiveExpedition(false)} className="px-20 py-5 bg-[#00f3ff] text-black font-black uppercase tracking-[0.5em] hover:bg-white">NÁVRAT</button>
                    </div>
                  </div>
                )}

                {phase === 'FAILED' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="text-center">
                      <AlertTriangle size={80} className="text-red-500 mx-auto mb-6" />
                      <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mb-8">PŘIPOJENÍ_ZTRACENO</h2>
                      <button onClick={() => setActiveExpedition(false)} className="px-20 py-5 bg-red-600 text-white font-black uppercase tracking-[0.5em]">REBOOT</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal Log Sidebar */}
              <div className="w-80 border-l border-[#00f3ff]/20 bg-black/40 flex flex-col">
                <div className="p-4 border-b border-[#00f3ff]/10 flex items-center gap-2">
                  <Terminal size={14} className="text-[#00f3ff]" />
                  <span className="text-[10px] text-[#00f3ff] font-black uppercase tracking-widest">Live_Terminal</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {logs.map(log => (
                    <div key={log.id} className={`text-[9px] uppercase leading-relaxed flex gap-2 animate-in slide-in-from-right duration-300 ${log.type === 'success' ? 'text-green-500' : log.type === 'error' ? 'text-red-500' : 'text-[#00f3ff]/60'}`}>
                      <span className="opacity-40">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                      <span className="font-bold">{log.text}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-black/60 border-t border-[#00f3ff]/10">
                   <div className="flex justify-between text-[10px] text-[#00f3ff] font-black mb-2">
                      <span>SYNC_PROGRESS</span>
                      <span>{progress}%</span>
                   </div>
                   <div className="h-1 bg-white/5 relative">
                      <div className="h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]" style={{ width: `${progress}%` }} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto py-12 px-8 w-full h-full overflow-y-auto custom-scrollbar">
            {activeTab === 'profile' && (
              <div className="space-y-10">
                <div className="flex items-center gap-10 p-12 bg-white/5 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Database size={120} /></div>
                  <div className="relative w-40 h-40 border-2 border-[#00f3ff] p-2 bg-black">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover pixelated" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={64} className="text-white/10" /></div>}
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">ADMIN_77</h2>
                    <div className="flex gap-6">
                      <div className="flex flex-col"><span className="text-[10px] text-[#00f3ff] font-black uppercase">Reserves</span><span className="text-2xl font-black text-white">{mikelaReserves} MK</span></div>
                      <div className="flex flex-col"><span className="text-[10px] text-[#ff00ff] font-black uppercase">Reputation</span><span className="text-2xl font-black text-white">{reputation}</span></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-8 border border-white/5 bg-white/[0.02] space-y-2">
                      <span className="text-[10px] text-white/40 uppercase font-black">Level Expedice</span>
                      <p className="text-3xl font-black text-[#00f3ff]">0x{expeditionLevel.toString(16).toUpperCase()}</p>
                   </div>
                   <div className="p-8 border border-white/5 bg-white/[0.02] space-y-2">
                      <span className="text-[10px] text-white/40 uppercase font-black">Zničené Anomálie</span>
                      <p className="text-3xl font-black text-[#ff00ff]">{adsDestroyed}</p>
                   </div>
                   <div className="p-8 border border-white/5 bg-white/[0.02] space-y-2">
                      <span className="text-[10px] text-white/40 uppercase font-black">Uptime</span>
                      <p className="text-3xl font-black text-white">99.9%</p>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-full max-w-2xl text-center space-y-12">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#00f3ff] blur-3xl opacity-20 animate-pulse" />
                    <Compass size={120} className="text-[#00f3ff] mx-auto relative" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-widest mb-4">HLUBOKÝ_PRŮNIK</h2>
                    <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">Vyberte si sektor pro extrakci dat. Buďte připraveni na systémové anomálie a fragmenty ztracených dat.</p>
                  </div>
                  <button 
                    onClick={() => setPreLaunchAdVisible(true)}
                    className="group relative px-20 py-6 border-2 border-[#00f3ff] overflow-hidden transition-all hover:bg-[#00f3ff] hover:text-black"
                  >
                    <span className="relative z-10 text-xl font-black uppercase tracking-[0.4em]">START_EXPEDICE</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.6, u.level - 1));
                    return (
                      <div key={u.id} className="p-10 border border-white/10 bg-white/[0.02] hover:border-[#ff00ff]/50 transition-colors flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 bg-black border border-[#ff00ff]/40 flex items-center justify-center">
                            <u.icon className="text-[#ff00ff]" size={32} />
                          </div>
                          <span className="text-2xl font-black text-[#ff00ff] italic">LV_{u.level}</span>
                        </div>
                        <h4 className="text-xl font-black text-white uppercase mb-2">{u.name}</h4>
                        <p className="text-[11px] text-white/40 uppercase mb-10 leading-relaxed">{u.desc}</p>
                        <button 
                          onClick={() => {
                            if(mikelaReserves >= cost) {
                              setMikelaReserves(p => p - cost);
                              setUpgrades(prev => prev.map(item => item.id === u.id ? {...item, level: item.level+1} : item));
                            }
                          }}
                          disabled={mikelaReserves < cost}
                          className={`w-full py-5 border-2 font-black text-[12px] uppercase tracking-widest transition-all mt-auto ${mikelaReserves >= cost ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black' : 'border-gray-800 text-gray-800 opacity-50'}`}
                        >
                          VYLEPŠIT_{cost}_MK
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; }
        .pixelated { image-rendering: pixelated; }
        .tactical-grid {
          background-image: 
            linear-gradient(to right, #00f3ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f3ff 1px, transparent 1px);
          background-size: 40px 40px;
          animation: grid-scroll 20s linear infinite;
        }
        @keyframes grid-scroll {
          from { background-position: 0 0; }
          to { background-position: 0 40px; }
        }
      `}</style>
    </div>
  );
};
