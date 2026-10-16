import { GameSaveData, GameSettings, InventoryItem, JournalEntry, SafehouseState, SurvivalStats } from './types';

const SAVE_KEY = 'lagos_after_zero_save_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.2,
  masterVolume: 0.85,
  sfxVolume: 0.85,
  ambientVolume: 0.65,
  graphicsQuality: 'medium',
  showMinimap: true,
};

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal_zero_hour',
    title: 'October 16, 2042 — Midnight Record',
    date: '2042-10-16 00:00',
    source: 'Torn Pocket Diary',
    content:
      'The clocks hit 00:00. In an instant, every neon billboard from Oshodi to Victoria Island vanished. No roar, no sirens—just total dead silence. When I looked out the window, the streets were deserted. Vehicles stood abandoned with their engines running. What happened to everyone?',
    discoveredAt: Date.now(),
  },
];

export class SaveSystem {
  public static hasSave(): boolean {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      return !!data;
    } catch {
      return false;
    }
  }

  public static load(): GameSaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed: GameSaveData = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return null;
      return parsed;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return null;
    }
  }

  public static save(data: GameSaveData): boolean {
    try {
      data.timestamp = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to write save data:', e);
      return false;
    }
  }

  public static createNewGameData(settings: GameSettings = DEFAULT_SETTINGS): GameSaveData {
    return {
      version: 1,
      timestamp: Date.now(),
      playerPos: [-14.0, 0.0, -8.0], // inside the safehouse shelter
      playerRotY: Math.PI / 2, // facing entrance
      stats: {
        health: 100,
        hunger: 15,
        thirst: 20,
        stamina: 100,
        isSprinting: false,
      },
      inventory: [
        // Starts with basic pocket lint & matches
        {
          id: 'cloth',
          name: 'Clean Fabric Scrap',
          category: 'material',
          description: 'A strip of clean fabric from your torn shirt.',
          quantity: 1,
          maxStack: 16,
          icon: 'layers',
        },
      ],
      safehouse: {
        hasGeneratorPower: false,
        radioRepaired: false,
        defenseLevel: 1,
        storage: [],
      },
      activeMissionId: 'mission_1',
      completedMissions: [],
      discoveredLocations: ['Safehouse Shelter'],
      collectedWorldItemIds: [],
      journalEntries: [...INITIAL_JOURNAL_ENTRIES],
      gameTimeHours: 2.5, // 2:30 AM (deep night after Zero Hour)
      flashlightOn: false,
      settings,
    };
  }

  public static deleteSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  }
}
