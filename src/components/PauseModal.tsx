import React from 'react';
import { Play, Save, Settings, LogOut, ShieldAlert, HelpCircle } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onSave,
  onOpenSettings,
  onOpenHelp,
  onQuitToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-sm p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold font-mono tracking-widest text-neutral-100 uppercase">
            GAME PAUSED
          </h2>
        </div>
        <p className="text-xs text-neutral-400 font-mono mb-6">
          Lagos: After Zero • Survival Suspended
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Play className="w-4 h-4 fill-white" />
            Resume Survival
          </button>

          <button
            onClick={onSave}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            Save Progress
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            Settings
          </button>

          <button
            onClick={onOpenHelp}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Field Survival Guide
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-3 mt-2 bg-neutral-950 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-300 font-mono text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
