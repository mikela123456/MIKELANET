
import React, { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-8 border-2 border-[#ff00ff] bg-[#0d0221] shadow-[0_0_50px_rgba(255,0,255,0.3)]">
        {/* Decorative corner elements */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00f3ff]" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00f3ff]" />
        
        <h2 className="text-3xl font-black text-[#ff00ff] uppercase italic tracking-tighter mb-8 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {isLogin ? 'Přihlášení' : 'Registrace'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-[#00f3ff] uppercase tracking-[0.3em] font-bold">Uživatelské jméno</label>
            <input 
              type="text" 
              required
              className="w-full bg-black/50 border border-[#00f3ff]/40 p-3 text-[#00f3ff] focus:border-[#ff00ff] focus:outline-none transition-colors font-mono"
              placeholder="Zadejte jméno..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] text-[#00f3ff] uppercase tracking-[0.3em] font-bold">Heslo</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/50 border border-[#00f3ff]/40 p-3 text-[#00f3ff] focus:border-[#ff00ff] focus:outline-none transition-colors font-mono"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-[#ff00ff] text-black font-black uppercase tracking-[0.2em] hover:bg-[#00f3ff] transition-all duration-300 transform hover:scale-[1.02]"
          >
            {isLogin ? 'Vstoupit' : 'Vytvořit účet'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center space-y-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-[#00f3ff] uppercase tracking-widest hover:text-white transition-colors"
          >
            {isLogin ? 'Nemáte účet? Registrujte se' : 'Máte účet? Přihlaste se'}
          </button>
          
          <button 
            onClick={onClose}
            className="text-[10px] text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
