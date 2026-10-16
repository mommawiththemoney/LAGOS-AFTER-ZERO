import React from 'react';
import { X, MapPin, Compass, ShieldAlert, Radio, Home, ShoppingBag, Wrench, Lock, Unlock } from 'lucide-react';
import { Mission } from '../game/types';

interface MapModalProps {
  playerPos: [number, number, number];
  playerRotY: number;
  activeMission: Mission | null;
  isGateUnlocked: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  playerPos,
  playerRotY,
  activeMission,
  isGateUnlocked,
  onClose,
}) => {
  // Map dimensions represent X: [-50, 50], Z: [-55, 65]
  const mapWidth = 520;
  const mapHeight = 520;

  const worldToMap = (x: number, z: number) => {
    // x in [-50, 50] -> [0, mapWidth]
    // z in [-55, 65] -> [0, mapHeight]
    const mx = ((x + 50) / 100) * mapWidth;
    const my = ((z + 55) / 120) * mapHeight;
    return { x: mx, y: my };
  };

  const pMap = worldToMap(playerPos[0], playerPos[2]);

  // Landmarks
  const landmarks = [
    {
      name: 'Safehouse Shelter',
      desc: 'Player Base (Bed, Workbench, Generator, Radio)',
      x: -16,
      z: -8,
      icon: <Home className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500 bg-emerald-950/70 text-emerald-300',
    },
    {
      name: 'Mama Ngozi Provisions',
      desc: 'Adeniji St. Grocery (Food, Bottled Water)',
      x: 16,
      z: -12,
      icon: <ShoppingBag className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500 bg-amber-950/70 text-amber-300',
    },
    {
      name: 'Alaba Tech & Repairs',
      desc: 'Electronics Kiosk (Batteries, Scrap Metal)',
      x: 16,
      z: 22,
      icon: <Wrench className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-500 bg-sky-950/70 text-sky-300',
    },
    {
      name: 'Radio Beacon Mast',
      desc: 'Survivor Emergency Signal (Sector 4)',
      x: -10,
      z: 20,
      icon: <Radio className="w-4 h-4 text-red-400" />,
      color: 'border-red-500 bg-red-950/70 text-red-300',
    },
    {
      name: 'Island Bridge Barricade',
      desc: isGateUnlocked ? 'Passage to Region B (UNLOCKED)' : 'Passage to Region B (LOCKED)',
      x: 0,
      z: 52,
      icon: isGateUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />,
      color: isGateUnlocked
        ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
        : 'border-red-600 bg-red-950/70 text-red-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base md:text-lg font-bold font-mono tracking-wider text-neutral-100 uppercase">
                Tactical District Map
              </h2>
              <span className="text-[11px] font-mono text-neutral-400">
                Region A: The Silent Mainland • Grid 2042-Zero
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Canvas / Visual Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* 2D Interactive Tactical Grid */}
          <div className="md:col-span-2 p-4 bg-neutral-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800 overflow-auto">
            <div className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] bg-neutral-900/90 border-2 border-neutral-800 rounded shadow-inner overflow-hidden">
              {/* Radar Grid Lines */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #444 1px, transparent 1px), linear-gradient(to bottom, #444 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Roads representations */}
              {/* Main Adeniji Avenue (Vertical) */}
              <div className="absolute left-[45%] top-0 bottom-0 w-[10%] bg-neutral-800/80 border-x border-neutral-700/60 flex items-center justify-center">
                <div className="w-[2px] h-full border-r border-dashed border-amber-500/50" />
              </div>

              {/* Cross Street (Horizontal) */}
              <div className="absolute top-[55%] left-0 right-0 h-[8%] bg-neutral-800/80 border-y border-neutral-700/60" />

              {/* Bridge Barricade Zone at South end */}
              <div className="absolute bottom-[3%] left-[10%] right-[10%] h-[6%] bg-red-950/40 border border-red-700/50 flex items-center justify-center">
                <span className="text-[8px] sm:text-[9px] font-mono text-red-300 font-bold uppercase tracking-wider">
                  {isGateUnlocked ? 'ISLAND BRIDGE ACCESS: OPEN' : 'SECURITY ROADBLOCK: ACCESS CARD REQUIRED'}
                </span>
              </div>

              {/* Landmark Pins */}
              {landmarks.map((lm, idx) => {
                const pos = worldToMap(lm.x, lm.z);
                const leftPercent = (pos.x / mapWidth) * 100;
                const topPercent = (pos.y / mapHeight) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    <div className={`p-1 rounded-full border shadow-lg ${lm.color}`}>
                      {lm.icon}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-30">
                      <div className="bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-[10px] font-mono text-neutral-200 shadow-xl">
                        {lm.name}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Player Position & Orientation Blip */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{
                  left: `${(pMap.x / mapWidth) * 100}%`,
                  top: `${(pMap.y / mapHeight) * 100}%`,
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500 animate-ping absolute" />
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white flex items-center justify-center text-white"
                    style={{ transform: `rotate(${playerRotY}rad)` }}
                  >
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* District Legend & Objective Tracker */}
          <div className="p-4 bg-neutral-950 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-400 font-bold">
                  Active Story Waypoint
                </span>
                {activeMission?.targetLocation ? (
                  <div className="mt-1.5 p-3 rounded-sm bg-neutral-900/80 border border-amber-600/60 text-left">
                    <span className="text-xs font-bold text-amber-300 block">
                      {activeMission.targetLocation.label}
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {activeMission.objectiveText}
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 font-mono mt-1">
                    No active navigation target
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-neutral-400 font-bold mb-2 block">
                  District Key
                </span>
                <div className="flex flex-col gap-2">
                  {landmarks.map((lm, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-sm bg-neutral-900/40 border border-neutral-800 flex items-start gap-2.5"
                    >
                      <div className="mt-0.5">{lm.icon}</div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-neutral-200">{lm.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{lm.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] font-mono text-neutral-500 text-center">
              Coordinates: [{Math.round(playerPos[0])}, {Math.round(playerPos[2])}]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
