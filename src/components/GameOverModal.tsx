import React from 'react';
import { RotateCcw, AlertOctagon, Skull } from 'lucide-react';

interface GameOverModalProps {
  hasSaveData: boolean;
  onReloadSave: () => void;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hasSaveData,
  onReloadSave,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 select-none font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-neutral-950 border border-red-900/60 rounded p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-700/80 flex items-center justify-center mb-4">
          <Skull className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-2xl font-extrabold font-mono tracking-widest text-red-500 uppercase mb-2">
          YOU SUCCUMBED
        </h2>

        <p className="text-sm font-serif italic text-neutral-400 mb-6 max-w-xs">
          The tropical heat, starvation, and hazards of the silent city claimed another survivor.
        </p>

        <div className="flex flex-col gap-3 w-full">
          {hasSaveData && (
            <button
              onClick={onReloadSave}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Last Checkpoint Save
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            Restart From Safehouse Cot
          </button>
        </div>
      </div>
    </div>
  );
};
