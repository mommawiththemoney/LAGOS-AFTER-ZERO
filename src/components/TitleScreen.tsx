import React from 'react';
import { Play, RotateCcw, Settings, HelpCircle, ShieldAlert, Radio } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface TitleScreenProps {
  hasSaveData: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSaveData,
  onNewGame,
  onContinue,
  onOpenSettings,
  onOpenHelp,
}) => {
  const handleStartGame = (isContinue: boolean) => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.playUIClick();
    if (isContinue) {
      onContinue();
    } else {
      onNewGame();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-12 bg-neutral-950 text-neutral-100 select-none overflow-hidden font-sans">
      {/* Atmospheric Background Styling */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(185, 28, 28, 0.25) 0%, rgba(10, 10, 12, 0.95) 80%)',
        }}
      />

      {/* Grid Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-800/80 rounded-xs text-[11px] font-mono text-red-400 tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
          <span>ZERO HOUR BROADCAST: OCTOBER 16, 2042</span>
        </div>
        <div className="text-[11px] font-mono text-neutral-500">
          PROTOTYPE BUILD v1.0 • LAGOS MAINLAND
        </div>
      </div>

      {/* Center Title & Core Branding */}
      <div className="relative z-10 max-w-2xl my-auto text-left">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-red-500 font-bold mb-2">
          SURVIVAL ADVENTURE • 3D OPEN WORLD
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-mono tracking-tight text-neutral-100 leading-none mb-3">
          LAGOS: <span className="text-red-600">AFTER ZERO</span>
        </h1>
        <p className="text-base sm:text-xl font-serif italic text-neutral-400 tracking-wide mb-8 border-l-2 border-red-600 pl-4">
          "The city went silent. The truth did not."
        </p>

        {/* Menu Actions */}
        <div className="flex flex-col gap-3 max-w-xs">
          {hasSaveData && (
            <button
              onClick={() => handleStartGame(true)}
              className="w-full py-3.5 px-6 bg-red-700 hover:bg-red-600 text-white font-mono text-xs uppercase font-bold tracking-widest rounded-xs transition-all flex items-center justify-between shadow-2xl active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4" />
                <span>CONTINUE GAME</span>
              </div>
              <span className="text-[10px] text-red-200 font-mono">SAVED</span>
            </button>
          )}

          <button
            onClick={() => handleStartGame(false)}
            className={`w-full py-3.5 px-6 font-mono text-xs uppercase font-bold tracking-widest rounded-xs transition-all flex items-center justify-between shadow-lg active:scale-98 cursor-pointer ${
              hasSaveData
                ? 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200'
                : 'bg-red-700 hover:bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Play className="w-4 h-4 fill-current" />
              <span>NEW GAME</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">OCT 2042</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onOpenSettings}
              className="py-3 px-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>SETTINGS</span>
            </button>

            <button
              onClick={onOpenHelp}
              className="py-3 px-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>GUIDE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Credits & Story Synopsis */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-neutral-500 border-t border-neutral-900 pt-4 gap-2">
        <span>SETTING: ABANDONED LAGOS MAINLAND • 2042</span>
        <span>PC: WASD + MOUSE • MOBILE: VIRTUAL JOYSTICK & TOUCH</span>
      </div>
    </div>
  );
};
