import React, { useRef, useState } from 'react';
import { Flashlight, Hand, ArrowUp, Zap } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';

interface MobileControlsProps {
  engine: GameEngine | null;
  onInteract: () => void;
  onToggleFlashlight: () => void;
  isFlashlightOn: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  engine,
  onInteract,
  onToggleFlashlight,
  isFlashlightOn,
}) => {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });
  const [isSprinting, setIsSprinting] = useState(false);

  const touchIdRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera swipe pad refs
  const cameraTouchIdRef = useRef<number | null>(null);
  const lastCameraTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Joystick Touch
  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    setJoystickActive(true);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (touchIdRef.current === null || !engine) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        const maxDist = 45;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        setJoystickKnob({ x: knobX, y: knobY });

        // Map to forward/strafe (-1 to 1)
        const forward = -(knobY / maxDist);
        const strafe = knobX / maxDist;
        engine.mobileInput.forward = Math.abs(forward) > 0.1 ? forward : 0;
        engine.mobileInput.strafe = Math.abs(strafe) > 0.1 ? strafe : 0;
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickKnob({ x: 0, y: 0 });
        if (engine) {
          engine.mobileInput.forward = 0;
          engine.mobileInput.strafe = 0;
        }
        break;
      }
    }
  };

  // Handle Camera drag area
  const handleCameraTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (cameraTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    cameraTouchIdRef.current = touch.identifier;
    lastCameraTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCameraTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (cameraTouchIdRef.current === null || !engine) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchIdRef.current) {
        const dx = touch.clientX - lastCameraTouchRef.current.x;
        const dy = touch.clientY - lastCameraTouchRef.current.y;
        engine.rotateCameraByDelta(dx, dy);
        lastCameraTouchRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchIdRef.current) {
        cameraTouchIdRef.current = null;
        break;
      }
    }
  };

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    if (engine) {
      engine.mobileInput.sprint = next;
    }
  };

  const triggerJump = () => {
    if (!engine) return;
    engine.mobileInput.jump = true;
    setTimeout(() => {
      if (engine) engine.mobileInput.jump = false;
    }, 120);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex select-none overflow-hidden font-sans">
      {/* LEFT: Virtual Joystick Area */}
      <div
        className="w-1/2 h-full pointer-events-auto flex items-end justify-start p-6 pb-24 md:hidden"
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        onTouchCancel={handleJoystickTouchEnd}
      >
        <div className="w-32 h-32 rounded-full border-2 border-neutral-700/60 bg-neutral-950/40 relative flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full bg-neutral-800/80 border border-neutral-600 shadow-xl flex items-center justify-center transition-transform"
            style={{
              transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-red-500/70" />
          </div>
        </div>
      </div>

      {/* RIGHT: Camera Drag & Action Buttons Area */}
      <div
        className="w-1/2 h-full pointer-events-auto flex flex-col justify-end items-end p-6 pb-24 md:hidden"
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
      >
        <div className="flex flex-col gap-3 items-end pointer-events-auto">
          {/* Action Row 1: Flashlight & Sprint */}
          <div className="flex gap-2.5">
            <button
              onClick={onToggleFlashlight}
              className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
                isFlashlightOn
                  ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                  : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
              }`}
              title="Flashlight"
            >
              <Flashlight className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSprint}
              className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
                isSprinting
                  ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200'
                  : 'bg-neutral-900/80 border-neutral-700 text-neutral-300'
              }`}
              title="Sprint"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>

          {/* Action Row 2: Jump & Interact */}
          <div className="flex gap-2.5 items-center">
            <button
              onClick={triggerJump}
              className="w-12 h-12 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-200 flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
              title="Jump"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            <button
              onClick={onInteract}
              className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-500 border-2 border-red-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 cursor-pointer"
              title="Interact"
            >
              <Hand className="w-6 h-6" />
              <span className="text-[9px] font-bold tracking-tighter">USE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
