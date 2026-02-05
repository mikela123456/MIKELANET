
import React, { useState, useEffect } from 'react';
import { TerminalHeader } from './components/TerminalHeader';
import { GlitchEye } from './components/GlitchEye';
import { SystemStatus } from './components/SystemStatus';
import { GeometricDecorations } from './components/GeometricDecorations';
import { AuthModal } from './components/AuthModal';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { GameView } from './components/GameView';

type ViewState = 'LANDING' | 'DASHBOARD' | 'GAME';

const App: React.FC = () => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('cs-CZ', { hour12: false }));
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('cs-CZ', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuth(false);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('LANDING');
  };

  const enterGame = () => {
    setCurrentView('GAME');
  };

  return (
    <div className="relative w-screen h-screen bg-[#0d0221] flex flex-col items-center justify-start select-none overflow-hidden text-[#00f3ff]">
      {/* Persistent Background Effects */}
      <div className="scanline" />
      <div className="crt-overlay" />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2a0845] via-[#0d0221] to-[#0d0221]" />
      </div>

      {/* Decorative Decorations */}
      <GeometricDecorations />

      {isLoggedIn ? (
        <div className="relative w-full h-full flex flex-col z-10">
          <Navigation onLogout={handleLogout} />
          
          {/* Main content area with scroll support */}
          <div className="flex-1 w-full h-full pt-16 overflow-hidden">
            {currentView === 'DASHBOARD' && (
              <Dashboard onEnterGame={enterGame} />
            )}
            
            {currentView === 'GAME' && (
              <GameView />
            )}
          </div>
        </div>
      ) : (
        <main className="z-10 flex flex-col items-center justify-center min-h-screen space-y-12 animate-in fade-in duration-700 pt-16">
          <TerminalHeader />
          <GlitchEye />
          <SystemStatus time={time} />
          <div className="mt-8 flex flex-col items-center animate-bounce-slow">
             <button 
                onClick={() => setShowAuth(true)}
                className="group relative px-10 py-3 overflow-hidden border-2 border-[#00f3ff] bg-black/40 backdrop-blur-sm transition-transform active:scale-95"
              >
                <div className="absolute inset-0 w-1/4 bg-[#00f3ff]/10 group-hover:w-full transition-all duration-300" />
                <span className="relative text-[#00f3ff] font-black uppercase tracking-[0.4em] text-sm md:text-base neon-glow-cyan">
                  PŘIHLÁŠENÍ / REGISTRACE
                </span>
                <div className="absolute -left-1 top-0 w-1 h-full bg-[#ff00ff] opacity-50 group-hover:animate-pulse" />
                <div className="absolute -right-1 bottom-0 w-1 h-full bg-[#ff00ff] opacity-50 group-hover:animate-pulse" />
              </button>
          </div>
        </main>
      )}

      {showAuth && !isLoggedIn && (
        <AuthModal 
          onClose={() => setShowAuth(false)} 
          onLogin={handleLogin} 
        />
      )}

      <div className="absolute bottom-6 border border-[#ff00ff] px-8 py-2 bg-black/40 backdrop-blur-sm z-20 pointer-events-none">
        <span className="text-[#ff00ff] font-bold tracking-[0.2em] text-xl">
          {time} CET
        </span>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
