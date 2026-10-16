import React, { useState } from 'react';
import { X, Package, Droplets, Utensils, HeartPulse, Wrench, Shield, FileText, Key, Check } from 'lucide-react';
import { InventoryItem, ItemCategory } from '../game/types';
import { GameEngine } from '../game/GameEngine';

interface InventoryModalProps {
  inventory: InventoryItem[];
  engine: GameEngine | null;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, engine, onClose }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(inventory[0] || null);
  const [filter, setFilter] = useState<ItemCategory | 'all'>('all');

  const filteredItems = inventory.filter((item) => filter === 'all' || item.category === filter);

  const handleConsume = (item: InventoryItem) => {
    if (!engine) return;
    const success = engine.survival.consumeItem(item);
    if (success) {
      engine.removeItemFromInventory(item.id, 1);
      if (selectedItem?.id === item.id) {
        const remaining = engine.getItemCount(item.id);
        if (remaining <= 0) {
          setSelectedItem(null);
        } else {
          setSelectedItem({ ...item, quantity: remaining });
        }
      }
    }
  };

  const handleDrop = (item: InventoryItem) => {
    if (!engine) return;
    engine.removeItemFromInventory(item.id, 1);
    const remaining = engine.getItemCount(item.id);
    if (remaining <= 0) {
      setSelectedItem(null);
    } else {
      setSelectedItem({ ...item, quantity: remaining });
    }
  };

  const getItemIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'water':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'food':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-red-400" />;
      case 'tool':
        return <Wrench className="w-5 h-5 text-blue-400" />;
      case 'material':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'clue':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'quest':
        return <Key className="w-5 h-5 text-yellow-400" />;
      default:
        return <Package className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base md:text-lg font-bold font-mono tracking-wider text-neutral-100 uppercase">
              Survivor Backpack Inventory
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-neutral-800 bg-neutral-950/70 overflow-x-auto text-xs font-mono">
          {(['all', 'food', 'water', 'medical', 'material', 'tool', 'clue', 'quest'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-sm capitalize transition-colors whitespace-nowrap cursor-pointer ${
                filter === cat
                  ? 'bg-neutral-800 text-white font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Body: Grid & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Inventory Grid */}
          <div className="md:col-span-2 p-4 overflow-y-auto border-b md:border-b-0 md:border-r border-neutral-800 max-h-[50vh] md:max-h-[60vh]">
            {filteredItems.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-neutral-500 font-mono text-sm">
                <Package className="w-10 h-10 mb-2 opacity-30" />
                <span>No items in this category</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-sm border flex flex-col items-start justify-between min-h-[90px] text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 border-emerald-500/80 ring-1 ring-emerald-500/50'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        {getItemIcon(item.category)}
                        <span className="font-mono text-xs font-bold bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded-xs">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="mt-2 w-full">
                        <div className="text-xs font-semibold text-neutral-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] uppercase font-mono text-neutral-500">
                          {item.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details / Actions Panel */}
          <div className="p-4 bg-neutral-950 flex flex-col justify-between overflow-y-auto">
            {selectedItem ? (
              <div className="flex flex-col gap-4">
                <div className="border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    {getItemIcon(selectedItem.category)}
                    <h3 className="font-bold text-sm md:text-base text-neutral-100">
                      {selectedItem.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-xs">
                    {selectedItem.category}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-neutral-300 leading-relaxed font-sans">
                  {selectedItem.description}
                </p>

                {/* Stat Restorations */}
                <div className="flex flex-col gap-1.5 text-xs font-mono">
                  {selectedItem.hungerRestore && (
                    <div className="flex justify-between text-amber-400 bg-amber-950/20 px-2 py-1 border border-amber-900/40 rounded-xs">
                      <span>Hunger Reduction</span>
                      <span>-{selectedItem.hungerRestore}%</span>
                    </div>
                  )}
                  {selectedItem.thirstRestore && (
                    <div className="flex justify-between text-sky-400 bg-sky-950/20 px-2 py-1 border border-sky-900/40 rounded-xs">
                      <span>Hydration Restore</span>
                      <span>+{selectedItem.thirstRestore}%</span>
                    </div>
                  )}
                  {selectedItem.healthRestore && (
                    <div className="flex justify-between text-red-400 bg-red-950/20 px-2 py-1 border border-red-900/40 rounded-xs">
                      <span>Health Restore</span>
                      <span>+{selectedItem.healthRestore}%</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-neutral-800">
                  {selectedItem.isConsumable && (
                    <button
                      onClick={() => handleConsume(selectedItem)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs uppercase tracking-wider rounded-xs font-semibold transition-colors cursor-pointer"
                    >
                      Consume / Use
                    </button>
                  )}
                  <button
                    onClick={() => handleDrop(selectedItem)}
                    className="w-full py-2 bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-300 font-mono text-xs uppercase rounded-xs transition-colors cursor-pointer"
                  >
                    Drop (1x)
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                Select an item to view properties
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
