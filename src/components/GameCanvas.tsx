import React, { useEffect, useRef } from 'react';
import { GameEngine, GameEngineCallbacks } from '../game/GameEngine';
import { GameSaveData } from '../game/types';

interface GameCanvasProps {
  callbacks: GameEngineCallbacks;
  initialSaveData?: GameSaveData | null;
  onEngineReady: (engine: GameEngine) => void;
  onPointerLockChange?: (locked: boolean) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  callbacks,
  initialSaveData,
  onEngineReady,
  onPointerLockChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Instantiate engine once
    const engine = new GameEngine(mountRef.current, callbacks, initialSaveData);
    engineRef.current = engine;
    onEngineReady(engine);

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === engine['renderer'].domElement;
      if (onPointerLockChange) onPointerLockChange(isLocked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-black select-none touch-none cursor-crosshair"
      onClick={() => {
        // Request pointer lock on desktop canvas click if desired
        if (engineRef.current && window.innerWidth >= 768) {
          const canvas = mountRef.current?.querySelector('canvas');
          if (canvas && document.pointerLockElement !== canvas) {
            canvas.requestPointerLock?.();
          }
        }
      }}
    />
  );
};
