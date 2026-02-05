import React, { useState, useEffect, useRef } from 'react';
import { User, Sword, Package, Zap, Compass, Truck, Timer, Trophy, Shield, AlertTriangle, ChevronRight, Activity, Clock, Loader2, Coins, X, Terminal, Database, ShieldAlert as AlertIcon, PlayCircle, Lock, ExternalLink, RefreshCw, Eye, Signal, Volume2 } from 'lucide-react';
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

// Updated HilltopAds VAST Tag URL provided by user
const VIDEO_AD_URL = "https://groundedmine.com/d.mGFPz/doGqNEv-ZbGTUR/AeHmI9/uzZoUxlUkMPwToYV3BN/zSY/wDNsD/k/tZNvjAc/3RNijgAA1vMQwg";
const TARGET_AD_SECONDS = 60; 

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
  const [totalWatchedSeconds, setTotalWatchedSeconds] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const [activeCoinId, setActiveCoinId] = useState<string | null>(null);
  const [isVideoForStart, setIsVideoForStart] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerInstance = useRef<any>(null);

  const calculateTotalDuration = (level: number) => Math.max(15, 20 + (level - 1) * 4);

  const addLog = (text: string, type: 'info' | 'warn' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), text, type }, ...prev].slice(0, 12));
  };

  const openVideoAd = (forStart: boolean = false) => {
    setIsVideoForStart(forStart);
    setTotalWatchedSeconds(0);
    setPlayerKey(prev => prev + 1);
    setVideoAdVisible(true);
    setIsAdPlaying(false);
  };

  useEffect(() => {
    let timerInterval: number;

    if (videoAdVisible && videoRef.current && window.fluidPlayer) {
      // Cleanup previous instance
      if (playerInstance.current) {
        try { playerInstance.current.destroy(); } catch(e) {}
        playerInstance.current = null;
      }

      playerInstance.current = window.fluidPlayer(videoRef.current, {
        layoutControls: {
          fillToContainer: true,
          autoPlay: true,
          mute: true,
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
          allowVPAID: true,
          adStartedCallback: () => {
            setIsAdPlaying(true);
            addLog("Uplink Established. Tracking segment...", "info");
            
            // Monitor real-time watch duration
            timerInterval = window.setInterval(() => {
              const video = document.querySelector('.fluid_video_wrapper video') as HTMLVideoElement;
              if (video && !video.paused) {
                setTotalWatchedSeconds(prev => prev + 1);
              }
            }, 1000);
          },
          adFinishedCallback: () => {
            clearInterval(timerInterval);
            setIsAdPlaying(false);
            
            // Re-check total time watched
            setTotalWatchedSeconds(current => {
              if (current < TARGET_AD_SECONDS) {
                addLog(`Segment ended early (${current}s). Re-syncing for remaining ${TARGET_AD_SECONDS - current}s...`, "warn");
                // Reset player for the next segment
                setPlayerKey(k => k + 1);
                return current;
              } else {
                addLog("Total watch duration achieved.", "success");
                return current;
              }
            });
          },
          errorCallback: (err: any) => {
            console.error("VAST load error:", err);
            addLog("VAST protocol error. Retrying link...", "error");
            // If it's a persistent error, we might want to let them close it or retry
            setTimeout(() => setPlayerKey(k => k + 1), 3000);
          }
        }
      });

      return () => {
        clearInterval(timerInterval);
        if (playerInstance.current) {
          try { playerInstance.current.destroy(); } catch(e) {}
          playerInstance.current = null;
        }
      };
    }
  }, [videoAdVisible, playerKey]);

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
    if (totalWatchedSeconds < TARGET_AD_SECONDS) return;
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

      