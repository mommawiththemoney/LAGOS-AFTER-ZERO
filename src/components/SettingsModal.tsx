import React, { useState } from 'react';
import { X, Settings, Volume2, Eye, Sliders } from 'lucide-react';
import { GameSettings } from '../game/types';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  initialSettings: GameSettings;
  onSaveSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialSettings,
  onSaveSettings,
  onClose,
}) => {
  const [settings, setSettings] = useState<GameSettings>({ ...initialSettings });

  const handleVolumeChange = (type: 'master' | 'sfx' | 'ambient', val: number) => {
    const updated = { ...settings, [`${type}Volume`]: val };
    setSettings(updated);
    soundEngine.setVolumes(updated.masterVolume, updated.sfxVolume, updated.ambientVolume);
  };

  const handleApply = () => {
    onSaveSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold font-mono tracking-wider text-neutral-100 uppercase">
              Game Preferences & Audio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
          {/* Audio Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 uppercase font-bold border-b border-neutral-800 pb-1">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio Levels</span>
            </div>

            {/* Master Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono text-neutral-300">
                <span>Master Volume</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-neutral-800 rounded h-2 cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono text-neutral-300">
                <span>Sound Effects (Footsteps, Crafting, Items)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-neutral-800 rounded h-2 cursor-pointer"
              />
            </div>

            {/* Ambient Volume */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono text-neutral-300">
                <span>Atmospheric Wind & Night Crickets</span>
                <span>{Math.round(settings.ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambientVolume}
                onChange={(e) => handleVolumeChange('ambient', parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-neutral-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Controls & Camera Sensitivity */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 uppercase font-bold border-b border-neutral-800 pb-1">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Camera & Controls</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono text-neutral-300">
                <span>Mouse / Touch Camera Sensitivity</span>
                <span>{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) => setSettings({ ...settings, mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 bg-neutral-800 rounded h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Presets */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 uppercase font-bold border-b border-neutral-800 pb-1">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Rendering Performance</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setSettings({ ...settings, graphicsQuality: q })}
                  className={`py-2 rounded-xs font-mono text-xs uppercase transition-colors cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-neutral-800 text-white font-bold border border-sky-500/80 ring-1 ring-sky-500/40'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Adjusts shadow resolution and texture anisotropy for smooth 60fps on mobile or desktop GPUs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xs font-mono text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer shadow-md"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
