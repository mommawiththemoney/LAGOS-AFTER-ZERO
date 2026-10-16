import React from 'react';
import { X, Archive, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { InventoryItem } from '../game/types';
import { GameEngine } from '../game/GameEngine';

interface StorageModalProps {
  inventory: InventoryItem[];
  storage: InventoryItem[];
  engine: GameEngine | null;
  onClose: () => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  inventory,
  storage,
  engine,
  onClose,
}) => {
  const handleStore = (item: InventoryItem) => {
    if (!engine) return;
    engine.transferToStorage(item.id, 1);
  };

  const handleRetrieve = (item: InventoryItem) => {
    if (!engine) return;
    engine.transferFromStorage(item.id, 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-sky-400" />
            <h2 className="text-base md:text-lg font-bold font-mono tracking-wider text-neutral-100 uppercase">
              Safehouse Storage Chest
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns (Backpack <-> Storage) */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          {/* Backpack Column */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto max-h-[45vh] md:max-h-[60vh]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
              <span className="font-mono text-xs uppercase font-bold text-neutral-300">
                Backpack Gear ({inventory.length} items)
              </span>
            </div>

            {inventory.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-neutral-600 font-mono text-xs">
                Backpack is empty
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-sm bg-neutral-900/60 border border-neutral-800 flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">{item.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Qty: {item.quantity} • {item.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStore(item)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-sky-900 border border-neutral-700 text-sky-300 rounded-xs text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Store</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Locker Column */}
          <div className="p-4 bg-neutral-950 overflow-y-auto max-h-[45vh] md:max-h-[60vh]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-800">
              <span className="font-mono text-xs uppercase font-bold text-sky-400">
                Safehouse Locker ({storage.length} items)
              </span>
            </div>

            {storage.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-neutral-600 font-mono text-xs">
                Locker is empty
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {storage.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-sm bg-neutral-900/40 border border-neutral-800 flex items-center justify-between"
                  >
                    <button
                      onClick={() => handleRetrieve(item)}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-emerald-900 border border-neutral-700 text-emerald-300 rounded-xs text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Take</span>
                    </button>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-neutral-200">{item.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Qty: {item.quantity} • {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
