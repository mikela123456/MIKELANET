
import React, { useState, useEffect } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, RefreshCw, Shield, AlertTriangle, Cpu, ChevronRight, Activity, Clock } from 'lucide-react';
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

export const GameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GameTab>('profile');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Player Stats
  const [mikelaReserves, setMikelaReserves] = useState(0);
  const [reputation, setReputation] = useState(1240);
  const [expeditionLevel, setExpeditionLevel] = useState(1);

  // Upgrade State
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: 'atk', name: 'Útočný Protokol', icon: Zap, level: 1, baseCost: 50, desc: 'Zvyšuje sílu úderu proti bannerům.' },
    { id: 'spd', name: 'Tachyonový Pohon', icon: Compass, level: 1, baseCost: 40, desc: 'Zkracuje čas trvání mise.' },
    { id: 'trns', name: 'Datový Uzel', icon: Truck, level: 1, baseCost: 30, desc: 'Efektivnější přenos vytěžených dat.' },
    { id: 'tm', name: 'Forging Modul', icon: Timer, level: 1, baseCost: 60, desc: 'Zvyšuje výnos MIKELA z jedné mise.' },
  ]);

  // Expedition State
  const [activeExpedition, setActiveExpedition] = useState<boolean>(false);
  const [phase, setPhase] = useState<ExpeditionPhase>('STARTING');
  const [logs, setLogs] = useState<ExpeditionLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Ad Management
  const [activeAds, setActiveAds] = useState<{id: number, type: string}[]>([]);
  const [adsDestroyed, setAdsDestroyed] = useState(0);
  
  const [expeditionEndTime, setExpeditionEndTime] = useState<number | null>(null);
  const [currentExpeditionDuration, setCurrentExpeditionDuration] = useState<number>(0);

  const calculateTotalDuration = (level: number) => Math.max(15, 30 + (level - 1) * 8);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 10));
  };

  const startExpedition = () => {
    const baseDuration = calculateTotalDuration(expeditionLevel);
    const spdLevel = upgrades.find(u => u.id === 'spd')?.level || 1;
    const effectiveDuration = Math.ceil(baseDuration * (1 - Math.min(0.7, (spdLevel - 1) * 0.07)));
    
    setExpeditionEndTime(Date.now() + (effectiveDuration * 1000));
    setCurrentExpeditionDuration(effectiveDuration);
    setActiveExpedition(true);
    setPhase('STARTING');
    setLogs([]);
    setProgress(0);
    setAdsDestroyed(0);
    setTimeLeft(effectiveDuration);
    
    setActiveAds([{ id: Date.now(), type: 'primary' }, { id: Date.now() + 1, type: 'secondary' }]);
    addLog(`Navazování spojení se Sektorem 0x${expeditionLevel.toString(16).toUpperCase()}...`, 'info');
  };

  const handleAdDestroyed = (id: number) => {
    setActiveAds(prev => prev.filter(ad => ad.id !== id));
    setAdsDestroyed(prev => prev + 1);
    addLog(`Banner eliminován. Integrita linku +10%`, 'success');
    
    setTimeout(() => {
      if (activeExpedition && timeLeft > 3) {
        setActiveAds(prev => [...prev, { id: Date.now(), type: 'respawn' }]);
      }
    }, 1500);
  };

  const handleUpgrade = (id: string) => {
    setUpgrades(prev => prev.map(item => {
      if (item.id === id) {
        const cost = Math.floor(item.baseCost * Math.pow(1.65, item.level - 1));
        if (mikelaReserves >= cost) {
          setMikelaReserves(prev => prev - cost);
          return { ...item, level: item.level + 1 };
        }
      }
      return item;
    }));
  };

  const generateAvatar = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Cyberpunk pixel art portrait, neon glitch aesthetic.',
      });
      setAvatarUrl(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${Math.random()}`);
    } catch (e) {
      setAvatarUrl(`https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback`);
    } finally {
      setIsGenerating(false);
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

      if (activeAds.length === 0 && remaining > 4 && phase !== 'STARTING') {
        setActiveAds([{ id: Date.now(), type: 'auto' }]);
      }

      if (now >= expeditionEndTime) {
        clearInterval(interval);
        const required = Math.floor(expeditionLevel * 1.5);
        const success = adsDestroyed >= required || Math.random() > 0.4;

        if (success) {
          setPhase('COMPLETED');
          const reward = Math.floor(150 * expeditionLevel + (adsDestroyed * 25));
          setMikelaReserves(p => p + reward);
          setReputation(p => p + expeditionLevel * 60);
          setExpeditionLevel(p => p + 1);
        } else {
          setPhase('FAILED');
        }
        setActiveAds([]);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [activeExpedition, expeditionEndTime, adsDestroyed, expeditionLevel, activeAds, phase]);

  const playerAtk = upgrades.find(u => u.id === 'atk')?.level || 1;

  return (
    <div className="flex h-full w-full bg-black/40 border-t border-[#00f3ff]/20 relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-[#00f3ff]/20 bg-black/90 flex flex-col py-6 shrink-0 z-20">
        <div className="mb-10 flex flex-col items-center">
          <div className="w-8 h-8 border border-[#00f3ff] rotate-45 flex items-center justify-center mb-4 shadow-[0_0_10px_rgba(0,243,255,0.3)]">
             <Shield className="-rotate-45 text-[#00f3ff]" size={16} />
          </div>
          <span className="hidden md:block text-[7px] text-[#00f3ff]/60 uppercase tracking-[0.4em] font-black italic">CONTROL_UNIT</span>
        </div>
        <nav className="flex-1 space-y-3 px-1">
          {[
            { id: 'profile' as GameTab, icon: User, label: 'Profil' },
            { id: 'expeditions' as GameTab, icon: Sword, label: 'Mise' },
            { id: 'items' as GameTab, icon: Package, label: 'Arzenál' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setActiveExpedition(false); }}
              className={`w-full flex items-center justify-center md:justify-start space-x-3 p-3 transition-all ${activeTab === item.id ? 'bg-[#00f3ff]/10 text-[#00f3ff] border-r-2 border-[#00f3ff]' : 'text-white/20 hover:text-[#00f3ff]'}`}
            >
              <item.icon size={18} />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-y-auto custom-scrollbar pb-24">
        {activeExpedition ? (
          <div className="flex flex-col min-h-full p-4 md:p-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-center bg-black/95 p-5 border-2 border-[#00f3ff]/30 mb-6 shadow-2xl relative">
              <div className="flex items-center gap-4">
                <Activity className="text-[#00f3ff] animate-pulse" size={24} />
                <div className="leading-tight">
                  <h3 className="text-base md:text-xl font-black italic uppercase tracking-[0.1em] text-white">Sektor_0x{expeditionLevel.toString(16).toUpperCase()}</h3>
                  <span className="text-[9px] text-[#00f3ff] font-black uppercase tracking-widest opacity-80">{phase}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-black border border-[#00f3ff]/40 px-5 py-2">
                <Clock className="text-[#00f3ff]" size={16} />
                <span className="font-mono text-2xl font-black text-[#00f3ff]">{formatTime(timeLeft)}</span>
              </div>
            </header>

            <div className="flex-1 min-h-[500px] relative bg-[#020202] border-2 border-white/5 overflow-hidden flex flex-col shadow-[inset_0_0_120px_rgba(0,0,0,1)]">
              {/* Reklamy Layer - Vycentrováno pro striktní 320x50 */}
              <div className="absolute inset-x-0 top-0 h-1/2 z-30 p-6 flex flex-col items-center justify-center gap-4 pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-4">
                  {activeAds.map(ad => (
                    <AdBanner 
                      key={ad.id} 
                      onDestroyed={() => handleAdDestroyed(ad.id)} 
                      playerAtk={playerAtk} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative z-10 pointer-events-none">
                {(phase === 'TRAVELING' || phase === 'EXTRACTING') && (
                  <div className="space-y-6">
                     <Activity size={72} className="text-[#00f3ff] animate-pulse mx-auto opacity-30" />
                     <div className="bg-black/80 p-5 border border-[#00f3ff]/20">
                        <p className="text-[#00f3ff] font-black uppercase tracking-[0.2em] text-xs">Likvidujte bannery pro stabilizaci</p>
                        <p className="text-white/20 text-[9px] uppercase mt-2">Data Fragmenty: {adsDestroyed}</p>
                     </div>
                  </div>
                )}

                {phase === 'COMPLETED' && (
                  <div className="animate-in zoom-in duration-500 space-y-8 pointer-events-auto bg-black/95 p-12 border-2 border-[#00f3ff]">
                    <Trophy size={96} className="text-[#00f3ff] mx-auto animate-bounce" />
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase">ÚSPĚCH</h2>
                    <button onClick={() => setActiveExpedition(false)} className="w-full py-5 bg-[#00f3ff] text-black font-black uppercase tracking-[0.3em]">NÁVRAT</button>
                  </div>
                )}

                {phase === 'FAILED' && (
                  <div className="space-y-8 pointer-events-auto bg-black/95 p-12 border-2 border-red-500">
                    <AlertTriangle size={96} className="text-red-600 mx-auto" />
                    <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase">SELHÁNÍ</h2>
                    <button onClick={() => setActiveExpedition(false)} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em]">REBOOT</button>
                  </div>
                )}
              </div>

              <div className="bg-black/95 p-6 border-t border-[#00f3ff]/30 z-40">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2 text-[#00f3ff]">
                  <span>SYNC: {progress}%</span>
                  <span>DEL: {adsDestroyed}</span>
                </div>
                <div className="h-1 bg-white/5 overflow-hidden">
                  <div className="h-full bg-[#00f3ff] shadow-[0_0_10px_#00f3ff] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-8 space-y-3 mb-10">
               {logs.map((log) => (
                 <div key={log.id} className={`text-[9px] font-black uppercase p-3 border-l-4 bg-black/70 flex items-center gap-4 animate-in slide-in-from-left ${log.type === 'success' ? 'border-green-500 text-green-500' : 'border-[#00f3ff] text-[#00f3ff]'}`}>
                    <ChevronRight size={10} />
                    <span>{log.text}</span>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-10 px-6 flex flex-col gap-10">
            {activeTab === 'profile' && (
              <div className="p-10 border border-[#00f3ff]/30 bg-black/60 flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 border-2 border-[#ff00ff] p-1.5 bg-black">
                  {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover pixelated" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><User size={48} /></div>}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">ADMIN_77</h2>
                  <div className="flex gap-4 mt-6">
                    <div className="bg-white/5 p-4 border border-white/10 flex-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black">MIKELA</p>
                      <p className="text-xl font-black text-[#00f3ff]">{mikelaReserves} MK</p>
                    </div>
                    <div className="bg-white/5 p-4 border border-white/10 flex-1">
                      <p className="text-[9px] text-gray-500 uppercase font-black">SCORE</p>
                      <p className="text-xl font-black text-white">{reputation}</p>
                    </div>
                  </div>
                  <button onClick={generateAvatar} className="mt-6 text-[10px] text-[#ff00ff] uppercase font-bold hover:underline">Re-Sync Avatar</button>
                </div>
              </div>
            )}

            {activeTab === 'expeditions' && (
              <div className="flex items-center justify-center py-10">
                <div className="w-full max-w-xl border-2 border-[#ff00ff]/40 bg-black/80 p-16 text-center">
                  <Sword size={64} className="text-[#ff00ff] mx-auto mb-8" />
                  <h2 className="text-3xl font-black text-white uppercase italic mb-4 tracking-widest">HLUBOKÝ_PRŮNIK</h2>
                  <button onClick={startExpedition} className="px-16 py-5 bg-[#00f3ff] text-black font-black uppercase tracking-[0.3em] hover:bg-white transition-all">START_MISE</button>
                </div>
              </div>
            )}

            {activeTab === 'items' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {upgrades.map(u => {
                    const cost = Math.floor(u.baseCost * Math.pow(1.65, u.level - 1));
                    return (
                      <div key={u.id} className="p-8 border border-white/10 bg-black/60 flex flex-col min-h-[200px]">
                        <div className="flex justify-between items-center mb-6">
                          <u.icon className="text-[#ff00ff]" size={32} />
                          <span className="text-[#ff00ff] font-black italic text-2xl">LV_{u.level}</span>
                        </div>
                        <h4 className="text-white font-black uppercase text-sm mb-2">{u.name}</h4>
                        <p className="text-[10px] text-white/40 mb-8 uppercase font-bold">{u.desc}</p>
                        <button 
                          onClick={() => handleUpgrade(u.id)} 
                          disabled={mikelaReserves < cost} 
                          className={`w-full py-4 border-2 font-black text-[11px] uppercase transition-all mt-auto ${mikelaReserves >= cost ? 'border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black' : 'border-gray-800 text-gray-800 opacity-50'}`}
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #00f3ff; }
        .pixelated { image-rendering: pixelated; }
      `}</style>
    </div>
  );
};
