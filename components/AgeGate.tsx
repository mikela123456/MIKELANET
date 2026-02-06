import React from 'react';
import { ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

interface AgeGateProps {
  onVerify: () => void;
  onCancel: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onVerify, onCancel }) => {
  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg p-12 border-2 border-red-600 bg-[#0d0221] shadow-[0_0_100px_rgba(220,38,38,0.3)]">
        {/* Decorative elements */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-red-600" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-red-600" />
        
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="relative">
            <ShieldAlert size={80} className="text-red-600 animate-pulse" />
            <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              OVĚŘENÍ VĚKU
            </h2>
            <div className="h-1 w-24 bg-red-600 mx-auto" />
          </div>

          <div className="space-y-6 text-sm leading-relaxed text-red-200/80 font-mono uppercase tracking-wider">
            <p>
              Vstupem do tohoto systému potvrzujete, že jste dosáhli věku minimálně <strong>18 let</strong>.
            </p>
            <p className="text-[10px] opacity-60">
              V souladu se zákony České republiky (zejména zákon č. 65/2017 Sb., o ochraně zdraví před škodlivými účinky návykových látek) je přístup k tomuto obsahu omezen pouze pro plnoleté osoby. 
            </p>
            <p className="border border-red-600/30 p-4 bg-red-600/5 text-xs">
              Upozornění: Provozovatel nenese odpovědnost za nepravdivé prohlášení uživatele o jeho věku.
            </p>
          </div>

          <div className="w-full flex flex-col space-y-4 pt-4">
            <button 
              onClick={onVerify}
              className="group relative w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              <div className="relative z-10 flex items-center justify-center gap-3">
                <CheckCircle2 size={20} />
                POTVRZUJI, ŽE JE MI 18+ LET
              </div>
            </button>
            
            <div className="flex gap-2">
               <button 
                onClick={handleExit}
                className="flex-1 py-3 border border-red-600/40 text-red-600 font-bold uppercase tracking-widest text-[10px] hover:bg-red-600/10 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={12} /> OPUSTIT STRÁNKU
              </button>
              <button 
                onClick={onCancel}
                className="px-6 py-3 border border-gray-600 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                ZAVŘÍT
              </button>
            </div>
          </div>
        </div>
        
        {/* Technical footer */}
        <div className="mt-8 pt-4 border-t border-red-600/20 flex justify-between items-center text-[8px] text-red-600/40 font-mono tracking-widest uppercase">
          <span>SECURE_ID: AGE_GATE_CZE_LAW_65_2017</span>
          <span>SYSTEM_LOCK: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};