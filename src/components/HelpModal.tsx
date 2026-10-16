import React from 'react';
import { X, HelpCircle, Keyboard, Smartphone, Heart, Zap, Home } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold font-mono tracking-wider text-neutral-100 uppercase">
              Field Survival & Controls Guide
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
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6 text-neutral-300">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Controls */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-sky-400 font-mono text-xs uppercase font-bold">
                <Keyboard className="w-4 h-4" />
                <span>PC Keyboard & Mouse</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs font-mono">
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Move Forward/Back/Strafe</span>
                  <span className="text-neutral-200 font-bold">W, A, S, D</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Look & Aim Camera</span>
                  <span className="text-neutral-200 font-bold">Mouse Drag / Click</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Sprint</span>
                  <span className="text-neutral-200 font-bold">Shift</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Jump</span>
                  <span className="text-neutral-200 font-bold">Space</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Interact / Loot / Open</span>
                  <span className="text-neutral-200 font-bold">E</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Toggle Flashlight</span>
                  <span className="text-neutral-200 font-bold">F</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Backpack Inventory</span>
                  <span className="text-neutral-200 font-bold">Tab / I</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Tactical District Map</span>
                  <span className="text-neutral-200 font-bold">M</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-neutral-400">Pause Menu</span>
                  <span className="text-neutral-200 font-bold">Esc</span>
                </li>
              </ul>
            </div>

            {/* Mobile Touch Controls */}
            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-emerald-400 font-mono text-xs uppercase font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Mobile & Tablet Touch</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs font-mono">
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Movement Joystick</span>
                  <span className="text-neutral-200 font-bold">Left Screen Drag</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Orbit Camera</span>
                  <span className="text-neutral-200 font-bold">Right Screen Drag</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Interact Button</span>
                  <span className="text-neutral-200 font-bold">Large Red 'USE' Button</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Sprint Toggle</span>
                  <span className="text-neutral-200 font-bold">Lightning Icon Button</span>
                </li>
                <li className="flex justify-between border-b border-neutral-800/60 pb-1">
                  <span className="text-neutral-400">Jump Action</span>
                  <span className="text-neutral-200 font-bold">Up Arrow Button</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-neutral-400">Inventory / Map</span>
                  <span className="text-neutral-200 font-bold">Bottom Dock Buttons</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Survival Mechanics */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold font-mono text-neutral-100 uppercase border-b border-neutral-800 pb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Survival Systems & Lagos Climate</span>
            </h3>
            <p className="text-xs leading-relaxed text-neutral-300">
              • <strong>Thirst & Hunger:</strong> Tropical humidity accelerates dehydration. Sprinting drains thirst rapidly. Drink sealed pure water and eat canned sardines from Mama Ngozi Provisions to maintain health.
            </p>
            <p className="text-xs leading-relaxed text-neutral-300">
              • <strong>Day / Night Cycle:</strong> Nights after Zero Hour are pitch-black and hazardous. Collect the tactical flashlight from the shelter desk and press [F] to illuminate alleys.
            </p>
            <p className="text-xs leading-relaxed text-neutral-300">
              • <strong>The Safehouse:</strong> Sleep in the cot to recover +40 Health and advance 6 hours. Use the workbench to craft sterile bandages, heavy crowbars, and generator maintenance kits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
