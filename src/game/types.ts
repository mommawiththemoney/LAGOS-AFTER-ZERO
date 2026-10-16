export type ItemCategory = 'food' | 'water' | 'medical' | 'material' | 'tool' | 'clue' | 'quest';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  maxStack: number;
  icon: string;
  hungerRestore?: number;
  thirstRestore?: number;
  healthRestore?: number;
  isConsumable?: boolean;
}

export interface CraftingRecipe {
  id: string;
  resultItemId: string;
  resultName: string;
  resultCount: number;
  category: ItemCategory;
  description: string;
  ingredients: { itemId: string; name: string; count: number }[];
}

export interface Mission {
  id: string;
  title: string;
  shortDesc: string;
  detail: string;
  objectiveText: string;
  targetLocation?: { x: number; z: number; label: string };
  isCompleted: boolean;
  rewardText: string;
}

export interface SurvivalStats {
  health: number; // 0 - 100
  hunger: number; // 0 - 100 (100 = starving)
  thirst: number; // 0 - 100 (100 = dehydrated)
  stamina: number; // 0 - 100
  isSprinting: boolean;
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  source: string;
  content: string;
  discoveredAt: number;
}

export interface WorldCollectible {
  id: string;
  itemId: string;
  name: string;
  position: [number, number, number];
  category: ItemCategory;
  collected: boolean;
  promptText: string;
  respawnTime?: number;
}

export interface SafehouseState {
  hasGeneratorPower: boolean;
  radioRepaired: boolean;
  defenseLevel: number;
  storage: InventoryItem[];
}

export interface GameSettings {
  mouseSensitivity: number; // 0.5 to 2.5
  masterVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  ambientVolume: number; // 0 to 1
  graphicsQuality: 'low' | 'medium' | 'high';
  showMinimap: boolean;
}

export interface GameSaveData {
  version: number;
  timestamp: number;
  playerPos: [number, number, number];
  playerRotY: number;
  stats: SurvivalStats;
  inventory: InventoryItem[];
  safehouse: SafehouseState;
  activeMissionId: string;
  completedMissions: string[];
  discoveredLocations: string[];
  collectedWorldItemIds: string[];
  journalEntries: JournalEntry[];
  gameTimeHours: number; // 0 - 24
  flashlightOn: boolean;
  settings: GameSettings;
}
