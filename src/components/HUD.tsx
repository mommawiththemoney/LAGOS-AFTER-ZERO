import React, { useState } from 'react';
import {
  Heart,
  Droplets,
  Utensils,
  Zap,
  Flashlight,
  Package,
  Map as MapIcon,
  BookOpen,
  Pause,
  ChevronDown,
  ChevronUp,
  Compass,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Mission, SurvivalStats } from '../game/types';

interface HUDProps {
  stats: SurvivalStats;
  activeMission: Mission | null;
  currentPrompt: string | null;
  gameTimeHours: number;
  isFlashlightOn: boolean;
  onToggleFlashlight: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenMap: () => void;
  onOpenJournal: () => void;
  onOpenPause: () => void;
  playerPos?: [number, number, number];
  notification?: { title: string; message: string; type?: 'info' | 'success' | 'danger' } | null;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  activeMission,
  currentPrompt,
  gameTimeHours,
  isFlashlightOn,
  onToggleFlashlight,
  onOpenInventory,
  onOpenCrafting,
  onOpenMap,
  onOpenJournal,
  onOpenPause,
  playerPos = [0, 0, 0],
  notification,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Format game time (0 - 24 hours) into 12-hour AM/PM format
  const hours = Math.floor(gameTimeHours);
  const minutes = Math.floor((gameTimeHours - hours) * 60);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  const isNight = hours < 6 || hours >= 19;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-6 select-none font-sans">
      {/* TOP BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Minimal Title / Spec Badge */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-neutral-950/85 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-sm backdrop-blur-none text-xs font-mono tracking-wider shadow-lg">
            <span className="text-red-500 font-bold tracking-widest">LAGOS: AFTER ZERO</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400">REGION A: SILENT MAINLAND</span>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/75 border border-neutral-800/80 px-2.5 py-1 rounded-sm text-xs font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              <span>POS: {Math.round(playerPos[0])}, {Math.round(playerPos[2])}</span>
            </div>
            <span className="text-neutral-700">•</span>
            <span className={isNight ? 'text-indigo-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {timeString} ({isNight ? 'NIGHT' : 'DAY'})
            </span>
          </div>
        </div>

        {/* Top-Right: Active Objective Widget & Pause */}
        <div className="flex flex-col items-end gap-2 max-w-xs md:max-w-md">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPause}
              className="pointer-events-auto bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 px-2.5 py-1.5 rounded-sm text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              title="Pause (Esc)"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PAUSE (ESC)</span>
            </button>
          </div>

          {activeMission && (
            <div className="bg-neutral-950/90 border-l-4 border-l-red-600 border border-neutral-800 p-3 rounded-sm text-left shadow-xl w-full">
              <div className="text-[10px] uppercase font-mono tracking-wider text-red-500 font-bold mb-0.5">
                Current Objective
              </div>
              <div className="text-xs md:text-sm font-semibold text-neutral-100 mb-1">
                {activeMission.title}
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug">
                {activeMission.objectiveText}
              </p>
              {activeMission.targetLocation && (
                <div className="mt-1.5 pt-1.5 border-t border-neutral-800 text-[10px] font-mono text-amber-400 flex items-center justify-between">
                  <span>MARKER: {activeMission.targetLocation.label}</span>
                  <span>[M] MAP</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="self-center -mt-8 flex items-center gap-2.5 bg-neutral-950/95 border border-neutral-700 px-4 py-2.5 rounded shadow-2xl text-xs md:text-sm transition-all animate-in fade-in slide-in-from-top-4 duration-200">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : notification.type === 'danger' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <div className="flex flex-col text-left">
            <span className="font-bold text-neutral-200 uppercase text-[10px] tracking-wider">
              {notification.title}
            </span>
            <span className="text-neutral-300 text-xs">{notification.message}</span>
          </div>
        </div>
      )}

      {/* CENTER: CONTEXTUAL INTERACTION PROMPT */}
      <div className="self-center flex flex-col items-center">
        {currentPrompt && (
          <div className="bg-neutral-950/90 border border-amber-500/80 text-amber-200 px-4 py-2 rounded-sm shadow-2xl font-mono text-xs md:text-sm tracking-wide animate-pulse">
            {currentPrompt}
          </div>
        )}
      </div>

      {/* UNIFIED BOTTOM CONTROL DOCK (Three.js Skill Directive) */}
      <div className="self-center w-full max-w-4xl flex flex-col items-center pointer-events-auto">
        {/* Collapse / Expand Toggle Tab */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="bg-neutral-950/90 hover:bg-neutral-900 border-t border-x border-neutral-800 text-neutral-400 hover:text-neutral-200 text-[11px] font-mono px-3 py-1 rounded-t-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-md mb-0"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>SHOW HUD (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>ZEN VIEW (H)</span>
            </>
          )}
        </button>

        {/* Collapsible Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full bg-neutral-950/95 border border-neutral-800 rounded-sm p-3 md:p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Survival Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto md:flex-1">
              {/* HEALTH */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-red-500/20 text-red-500" />
                    HEALTH
                  </span>
                  <span className="text-neutral-300 font-bold">{Math.round(stats.health)}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, stats.health))}%` }}
                  />
                </div>
              </div>

              {/* HUNGER */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Utensils className="w-3.5 h-3.5 text-amber-500" />
                    HUNGER
                  </span>
                  <span className="text-neutral-300 font-bold">{Math.round(stats.hunger)}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, stats.hunger))}%` }}
                  />
                </div>
              </div>

              {/* THIRST */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-sky-400 font-bold">
                    <Droplets className="w-3.5 h-3.5 fill-sky-500/20 text-sky-400" />
                    THIRST
                  </span>
                  <span className="text-neutral-300 font-bold">{Math.round(stats.thirst)}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, stats.thirst))}%` }}
                  />
                </div>
              </div>

              {/* STAMINA */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Zap className="w-3.5 h-3.5 fill-emerald-500/20 text-emerald-400" />
                    STAMINA
                  </span>
                  <span className="text-neutral-300 font-bold">{Math.round(stats.stamina)}%</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, stats.stamina))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Navigation / Tool Hotkeys */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center border-t md:border-t-0 md:border-l border-neutral-800 pt-2 md:pt-0 md:pl-4">
              <button
                onClick={onToggleFlashlight}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm border text-xs font-mono transition-colors cursor-pointer ${
                  isFlashlightOn
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Toggle Flashlight (F)"
              >
                <Flashlight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LIGHT (F)</span>
              </button>

              <button
                onClick={onOpenInventory}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-neutral-100 text-xs font-mono transition-colors cursor-pointer"
                title="Backpack Inventory (Tab / I)"
              >
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>ITEMS (TAB)</span>
              </button>

              <button
                onClick={onOpenCrafting}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-neutral-100 text-xs font-mono transition-colors cursor-pointer"
                title="Safehouse Crafting (C)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>CRAFT (C)</span>
              </button>

              <button
                onClick={onOpenMap}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-neutral-100 text-xs font-mono transition-colors cursor-pointer"
                title="Tactical Map (M)"
              >
                <MapIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>MAP (M)</span>
              </button>

              <button
                onClick={onOpenJournal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-neutral-100 text-xs font-mono transition-colors cursor-pointer"
                title="Field Journal & Clues (J)"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>NOTES (J)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
