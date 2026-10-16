import React, { useState } from 'react';
import { X, Hammer, Shield, Check, AlertTriangle } from 'lucide-react';
import { CRAFTING_RECIPES } from '../game/survival';
import { CraftingRecipe } from '../game/types';
import { GameEngine } from '../game/GameEngine';

interface CraftingModalProps {
  engine: GameEngine | null;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({ engine, onClose }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe>(CRAFTING_RECIPES[0]);

  const canCraft = (recipe: CraftingRecipe): boolean => {
    if (!engine) return false;
    for (const ing of recipe.ingredients) {
      if (engine.getItemCount(ing.itemId) < ing.count) return false;
    }
    return true;
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!engine || !canCraft(recipe)) return;
    const success = engine.craftItem(recipe.id);
    if (success) {
      engine['callbacks'].onNotification('ITEM CRAFTED', `Crafted ${recipe.resultName}!`, 'success');
      // Trigger re-render
      setSelectedRecipe({ ...recipe });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <Hammer className="w-5 h-5 text-amber-500" />
            <h2 className="text-base md:text-lg font-bold font-mono tracking-wider text-neutral-100 uppercase">
              Safehouse Crafting Workbench
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          {/* Recipes List */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto max-h-[50vh] md:max-h-[60vh] flex flex-col gap-2">
            <div className="text-xs font-mono uppercase text-neutral-400 font-semibold mb-1">
              Available Blueprints
            </div>
            {CRAFTING_RECIPES.map((recipe) => {
              const craftable = canCraft(recipe);
              const isSelected = selectedRecipe.id === recipe.id;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 rounded-sm border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-200">
                      {recipe.resultName}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Category: {recipe.category}
                    </span>
                  </div>
                  {craftable ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-xs">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-xs">
                      Missing Parts
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Recipe Details & Crafting Action */}
          <div className="p-5 bg-neutral-950 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col gap-4">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-base font-bold text-neutral-100">
                  {selectedRecipe.resultName}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  {selectedRecipe.description}
                </p>
              </div>

              {/* Required Ingredients */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono text-neutral-400 uppercase font-semibold">
                  Required Components
                </span>
                {selectedRecipe.ingredients.map((ing) => {
                  const owned = engine?.getItemCount(ing.itemId) || 0;
                  const hasEnough = owned >= ing.count;
                  return (
                    <div
                      key={ing.itemId}
                      className={`flex items-center justify-between p-2.5 rounded-sm border font-mono text-xs ${
                        hasEnough
                          ? 'bg-neutral-900/80 border-neutral-800 text-neutral-200'
                          : 'bg-red-950/20 border-red-900/40 text-red-300'
                      }`}
                    >
                      <span>{ing.name}</span>
                      <span className={hasEnough ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {owned} / {ing.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Craft Button */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                disabled={!canCraft(selectedRecipe)}
                onClick={() => handleCraft(selectedRecipe)}
                className={`w-full py-3 rounded-xs font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  canCraft(selectedRecipe)
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg active:scale-98'
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                <Hammer className="w-4 h-4" />
                Assemble Component
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
