
import React, { useState, useEffect } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock } from 'lucide-react';
import { AdBanner } from './AdBanner';

type GameTab = 'profile' | 'expeditions' | 'items';
type ExpeditionPhase = 'STARTING' | 'TRAVELING' | 'EXTRACTING' | 'COMPLETED' | 'FAILED';

interface UpgradeItem {
  id: string;
  name: string;
  icon: any;
  level: number;
  baseCost: number;
  desc: string;
}

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [mikelaReserves, setMikelaReserves] = useState(0);
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
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeAds, setActiveAds] = useState<{id: number}[]>([]);
  const [adsDestroyed, setAdsDestroyed] = useState(0);
  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);

  const startExpedition = () => {
    const duration = 30;
    setExpeditionEndTime(Date.now() + (duration * 1000));
    setActiveExpedition(true);
    setPhase('STARTING');
    setProgress(0);
    setAdsDestroyed(0);
    setTimeLeft(duration);
    setActiveAds([{ id: Date.now() }, { id: Date.now() + 1 }]);
  };

  const handleAdDestroyed = (id: number) => {
    setActiveAds(prev => prev.filter(ad => ad.id !== id));
    setAdsDestroyed(prev => prev + 1);
    setTimeout(() => {
      if (activeExpedition && timeLeft > 5) {
        setActiveAds(prev => [...prev, { id: Date.now() }]);
      }
    }, 1200);
  };

  const handleUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => {
      if (item.id === id) {
        const cost = Math.floor(item.baseCost * Math.pow(1.65, item.level - 1));
        if (mikelaReserves >= cost) {
          setMikelaReserves(p => p - cost);
          return { ...item, level: item.level + 1 };
        }
      }
      return item;
    }));
  };

  useEffect(() => {
    if (!activeExpedition || !expeditionEndTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expeditionEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      const currentProgress = Math.min(100, Math.floor(((30 - remaining) / 30) * 100));
      setProgress(currentProgress);
      setPhase(currentProgress < 15 ? 'STARTING' : currentProgress < 85 ? 'TRAVELING' : 'EXTRACTING');
      if (remaining === 0) {
        setPhase('COMPLETED');
        setMikelaReserves(p => p + (adsDestroyed * 50));
        setExpeditionLevel(p => p + 1);
        setActiveAds([]);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeExpedition, expeditionEndTime, adsDestroyed]);

  const playerAtk = upgrades.find(u => u.id === 'atk')?.level || 1;

  return (
    <div className="flex h-full w-full bg-[#050010] relative overflow-hidden">
      {/* Sidebar Nav */}
      <aside className="w-16 md:w-24 border-r border-[#00f3ff]/20 bg-black/80 flex flex-col items-center py-12 z-20">
        <div className="w-12 h-12 border-2 border-[#00f3ff] rotate-45 flex items-center justify-center mb-16 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
           <Shield className="-rotate-45 text-[#00f3ff]" size={24} />
        </div>
        <div className="flex flex-col space-y-12">
          <button onClick={() => {setActiveTab('profile'); setActiveExpedition(false);}} className={`p-4 transition-all ${activeTab === 'profile' ? 'text-[#00f3ff] border-r-4 border-[#00f3ff]' : 'text-white/20 hover:text-white'}`}><User size={24} /></button>
          <button onClick={() => {setActiveTab('expeditions'); setActiveExpedition(false);}} className={`p-4 transition-all ${activeTab === 'expeditions' ? 'text-[#00f3ff] border-r-4 border-[#00f3ff]' : 'text-white/20 hover:text-white'}`}><Sword size={24} /></button>
          <button onClick={() => {setActiveTab('items'); setActiveExpedition(false);}} className={`p-4 transition-all ${activeTab === 'items' ? 'text-[#00f3ff] border-r-4 border-[#00f3ff]' : 'text-white/20 hover:text-white'}`}><Package size={24} /></button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-y-auto custom-scrollbar">
        {activeExpedition ? (
          <div className="flex flex-col min-h-full p-4 md:p-8 animate-in fade-in pb-40">
            {/* Header Box - Matched to Screenshot */}
            <div className="w-full max-w-2xl mx-auto mb-8 relative">
              <div className="border-2 border-[#00f3ff]/40 bg-black/80 flex justify-between items-center p-6 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                <div className="flex items-center gap-6">
                  <Activity className="text-[#00f3ff] animate-pulse" size={32} />
                  <div className="flex flex-col">
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-widest">SEKTOR_0x{expeditionLevel}</h3>
                    <span className="text-[11px] text-[#00f3ff] font-black uppercase tracking-[0.4em] opacity-80 mt-1">{phase}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-black/60 border border-[#00f3ff]/30 px-6 py-4">
                  <Clock className="text-[#00f3ff]" size={24} />
                  <span className="font-mono text-3xl md:text-4xl font-black text-[#00f3ff]">0:{timeLeft < 10 ? '0' : ''}{timeLeft}</span>
                </div>
              </div>
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-[#ff00ff]" />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-[#ff00ff]" />
            </div>

            {/* Battle Area */}
            <div className="flex-1 flex flex-col items-center justify-start space-y-12 py-10 min-h-[500px]">
              {activeAds.length > 0 ? (
                <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-10">
                  {activeAds.map(ad => (
                    <AdBanner key={ad.id} onDestroyed={() => handleAdDestroyed(ad.id)} playerAtk={playerAtk} />
                  ))}
                </div>
              ) : phase === 'COMPLETED' ? (
                <div className="text-center space-y-8 bg-black/90 p-16 border-2 border-[#00f3ff] shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-in zoom-in">
                  <Trophy size={96} className="text-[#00f3ff] mx-auto animate-bounce" />
                  <h2 className="text-5xl font-black text-white italic tracking-tighter">ÚSPĚCH</h2>
                  <button onClick={() => setActiveExpedition(false)} className="w-full py-5 bg-[#00f3ff] text-black font-black uppercase tracking-[0.4em] text-sm">DOKONČIT PŘENOS</button>
                </div>
              ) : (
                <div className="text-center py-20 opacity-30">
                  <Activity size={80} className="mx-auto mb-6 animate-spin-slow text-[#00f3ff]" />
                  <p className="font-black uppercase tracking-[0.3em] text-[#00f3ff]">INICIALIZACE DAT...</p>
                </div>
              )}

              {/* Stabilization Info Box */}
              <div className="max-w-md w-full border-2 border-[#00f3ff]/20 bg-black/60 p-10 text-center shadow-[inset_0_0_20px_rgba(0,243,255,0.05)]">
                 <p className="text-[#00f3ff] font-black uppercase text-base tracking-[0.2em] mb-4 leading-relaxed">
                   LIKVIDUJTE BANNERY PRO STABILIZACI
                 </p>
                 <div className="w-16 h-[2px] bg-[#00f3ff]/40 mx-auto mb-4" />
                 <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">DATA FRAGMENTY: {adsDestroyed}</p>
              </div>
            </div>

            {/* Fixed Bottom Status Bar - Matched to Screenshot */}
            <footer className="fixed bottom-0 left-0 right-0 h-24 bg-black/95 border-t-2 border-[#00f3ff]/30 flex flex-col justify-center px-10 z-[60]">
               <div className="max-w-4xl mx-auto w-full">
                  <div className="flex justify-between text-[12px] font-black text-[#00f3ff] uppercase tracking-[0.4em] mb-3">
                     <span>SYNC: {progress}%</span>
                     <span>DEL: {adsDestroyed}</span>
                  </div>
                  <div className="h-2 bg-white/5 border border-white/10 overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-[#00f3ff] via-[#ff00ff] to-[#00f3ff] shadow-[0_0_15px_#00f3ff] transition-all duration-700 bg-[length:200%_100%] animate-gradient-flow" 
                       style={{ width: `${progress}%` }} 
                     />
                  </div>
               </div>
            </footer>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-24 px-8 space-y-16 pb-40">
            {activeTab === 'profile' && (
              <div className="p-10 border-2 border-[#00f3ff]/20 bg-black/60 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00f3ff]/5 to-transparent pointer-events-none" />
                <div className="w-40 h-40 border-2 border-[#ff00ff] p-1.5 bg-black shrink-0 relative shadow-[0_0_20px_rgba(255,0,255,0.2)]">
                   <div className="w-full h-full bg-white/5 flex items-center justify-center text-[#ff00ff]/20">
                     <User size={80} />
                   </div>
                   <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#ff00ff]" />
                </div>
                <div className="flex-1 text-center md:text-left z-10">
                  <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter neon-glow-cyan">ADMIN_77</h2>
                  <div className="grid grid-cols-2 gap-6 mt-8">
                    <div className="bg-black/80 p-5 border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">RESERVY MIKELA</p>
                      <p className="text-2xl font-black text-[#00f3ff] mt-1">{mikelaReserves} MK</p>
                    </div>
                    <div className="bg-black/80 p-5 border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">REPUTACE_ID</p>
                      <p className="text-2xl font-black text-white mt-1">{reputation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-full max-w-xl border-4 border-[#ff00ff]/30 bg-black/90 p-20 text-center relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#ff00ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Sword size={80} className="text-[#ff00ff] mx-auto mb-10 animate-pulse" />
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-[0.2em] mb-12">HLUBOKÝ_PRŮNIK</h2>
                  <button 
                    onClick={startExpedition} 
                    className="w-full py-6 bg-[#00f3ff] text-black font-black uppercase tracking-[0.6em] text-base hover:bg-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,243,255,0.4)]"
                  >
                    VSTOUPIT DO SÍTĚ
                  </button>
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
                </div>
              </div>
            )}

            {activeTab === 'items' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upgrades.map(u => {
                  const cost = Math.floor(u.baseCost * Math.pow(1.65, u.level - 1));
                  return (
                    <div key={u.id} className="p-10 border-2 border-white/10 bg-black/70 flex flex-col min-h-[260px] hover:border-[#ff00ff]/60 transition-all group relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#ff00ff] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                      <div className="flex justify-between items-center mb-8">
                        <u.icon className="text-[#ff00ff]" size={40} />
                        <span className="text-[#ff00ff] font-black italic text-3xl">LV_{u.level}</span>
                      </div>
                      <h4 className="text-white font-black uppercase text-base mb-3 tracking-widest">{u.name}</h4>
                      <p className="text-[11px] text-white/40 mb-10 uppercase font-bold leading-relaxed tracking-wider">{u.desc}</p>
                      <button 
                        onClick={() => handleUpgrade(u.id)} 
                        disabled={mikelaReserves < cost} 
                        className={`w-full py-5 border-2 font-black text-[12px] uppercase tracking-[0.2em] transition-all mt-auto ${mikelaReserves >= cost ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black shadow-[0_0_15px_rgba(255,0,255,0.2)]' : 'border-gray-800 text-gray-800 opacity-50'}`}
                      >
                        UPGRADE // {cost} MK
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
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes gradient-flow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        .animate-gradient-flow { animation: gradient-flow 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; }
      `}</style>
    </div>
  );
};
