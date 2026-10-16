import { InventoryItem, CraftingRecipe, SurvivalStats } from './types';
import { soundEngine } from './audio';

export const ITEM_DATABASE: Record<string, Omit<InventoryItem, 'quantity'>> = {
  flashlight: {
    id: 'flashlight',
    name: 'Heavy Duty Flashlight',
    category: 'tool',
    description: 'High-power tactical flashlight with rechargeable battery. Crucial for exploring unlit interiors and nighttime Lagos streets.',
    maxStack: 1,
    icon: 'flashlight',
  },
  bottled_water: {
    id: 'bottled_water',
    name: 'Pure Mineral Water',
    category: 'water',
    description: 'Sealed 75cl bottle of pure drinking water. Relieves dehydration.',
    maxStack: 8,
    icon: 'droplets',
    thirstRestore: 35,
    isConsumable: true,
  },
  canned_sardines: {
    id: 'canned_sardines',
    name: 'Titus Canned Sardines',
    category: 'food',
    description: 'Protein-packed canned sardines in spiced oil. Relieves significant hunger and slightly restores health.',
    maxStack: 6,
    icon: 'fish',
    hungerRestore: 40,
    healthRestore: 8,
    isConsumable: true,
  },
  plantain_chips: {
    id: 'plantain_chips',
    name: 'Crunchy Plantain Chips',
    category: 'food',
    description: 'Sealed packet of salted ripe plantain crisps scavenged from a roadside provision shelf.',
    maxStack: 6,
    icon: 'utensils',
    hungerRestore: 25,
    isConsumable: true,
  },
  cloth: {
    id: 'cloth',
    name: 'Clean Fabric Scrap',
    category: 'material',
    description: 'Clean cotton textile salvaged from vehicle upholstery or clothing. Used to craft sterile bandages and tool grips.',
    maxStack: 16,
    icon: 'layers',
  },
  scrap_metal: {
    id: 'scrap_metal',
    name: 'Industrial Scrap Metal',
    category: 'material',
    description: 'Galvanized steel plates, screws, and brackets salvaged from machinery and damaged shopfronts.',
    maxStack: 16,
    icon: 'shield',
  },
  batteries: {
    id: 'batteries',
    name: 'Lithium Battery Cells',
    category: 'material',
    description: 'Rechargeable dry cell batteries. Essential for reviving communications equipment and safehouse relays.',
    maxStack: 8,
    icon: 'battery-charging',
  },
  sterile_bandage: {
    id: 'sterile_bandage',
    name: 'Sterile Field Bandage',
    category: 'medical',
    description: 'Tightly woven sterile bandage treated with disinfectant. Restores +30 health.',
    maxStack: 5,
    icon: 'heart-pulse',
    healthRestore: 30,
    isConsumable: true,
  },
  first_aid_kit: {
    id: 'first_aid_kit',
    name: 'Emergency Trauma Kit',
    category: 'medical',
    description: 'Comprehensive medical trauma kit containing coagulants, saline, and antibiotics. Restores +55 health.',
    maxStack: 3,
    icon: 'cross',
    healthRestore: 55,
    isConsumable: true,
  },
  basic_tool: {
    id: 'basic_tool',
    name: 'Heavy Salvage Crowbar',
    category: 'tool',
    description: 'Sturdy steel pry-tool with rubberized grip. Useful for clearing barricades and forcing open locked containers.',
    maxStack: 1,
    icon: 'wrench',
  },
  repair_kit: {
    id: 'repair_kit',
    name: 'Generator Maintenance Kit',
    category: 'tool',
    description: 'Mechanical repair pack containing spark plugs, wiring, and gaskets. Capable of restoring the safehouse diesel generator.',
    maxStack: 2,
    icon: 'cpu',
  },
  damaged_radio: {
    id: 'damaged_radio',
    name: 'Shortwave Radio Receiver',
    category: 'quest',
    description: 'Military-grade tactical emergency radio receiver with burned-out fuse and empty battery chamber.',
    maxStack: 1,
    icon: 'radio',
  },
  repaired_radio: {
    id: 'repaired_radio',
    name: 'Repaired Shortwave Radio',
    category: 'quest',
    description: 'The repaired tactical radio is broadcasting a looped frequency signal from the survivor coordinates.',
    maxStack: 1,
    icon: 'radio',
  },
  access_card: {
    id: 'access_card',
    name: 'Island Bridge Access Card',
    category: 'quest',
    description: 'Encrypted magnetic keycard issued during Zero Hour evacuation. Grants clearance past the security checkpoint.',
    maxStack: 1,
    icon: 'key',
  },
  journal_note_1: {
    id: 'journal_note_1',
    name: 'Survivor Note: The Silent Midnight',
    category: 'clue',
    description: 'A hastily scrawled note found in the shelter detailing the eerie silence that fell over Lagos at midnight.',
    maxStack: 1,
    icon: 'file-text',
  },
  journal_note_2: {
    id: 'journal_note_2',
    name: 'Military Dispatch: Zero Hour Protocol',
    category: 'clue',
    description: 'An official security memo referencing anomalous energy surges originating from the Zero Point research facility.',
    maxStack: 1,
    icon: 'file-text',
  },
  journal_note_3: {
    id: 'journal_note_3',
    name: 'Zero Point Facility Blueprint Clue',
    category: 'clue',
    description: 'A classified schematic showing underground access tunnels beneath the Island financial district.',
    maxStack: 1,
    icon: 'file-text',
  },
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_bandage',
    resultItemId: 'sterile_bandage',
    resultName: 'Sterile Field Bandage',
    resultCount: 1,
    category: 'medical',
    description: 'Fashion clean textile scraps into an effective sterile dressing to stop bleeding.',
    ingredients: [{ itemId: 'cloth', name: 'Clean Fabric Scrap', count: 1 }],
  },
  {
    id: 'craft_crowbar',
    resultItemId: 'basic_tool',
    resultName: 'Heavy Salvage Crowbar',
    resultCount: 1,
    category: 'tool',
    description: 'Forge scrap steel and wrapped cloth into a robust prying tool.',
    ingredients: [
      { itemId: 'scrap_metal', name: 'Industrial Scrap Metal', count: 2 },
      { itemId: 'cloth', name: 'Clean Fabric Scrap', count: 1 },
    ],
  },
  {
    id: 'craft_repair_kit',
    resultItemId: 'repair_kit',
    resultName: 'Generator Maintenance Kit',
    resultCount: 1,
    category: 'tool',
    description: 'Assemble wiring, fasteners, and scrap plating to service the safehouse generator.',
    ingredients: [
      { itemId: 'scrap_metal', name: 'Industrial Scrap Metal', count: 2 },
      { itemId: 'batteries', name: 'Lithium Battery Cells', count: 1 },
    ],
  },
];

export class SurvivalManager {
  public stats: SurvivalStats = {
    health: 100,
    hunger: 15,
    thirst: 20,
    stamina: 100,
    isSprinting: false,
  };

  /**
   * Update survival stats in real-time
   */
  public update(delta: number, isMoving: boolean, isSprinting: boolean): { isDead: boolean } {
    const dt = Math.min(delta, 0.2);

    // Stamina drain or recovery
    if (isSprinting && isMoving) {
      this.stats.stamina = Math.max(0, this.stats.stamina - 22 * dt);
      this.stats.isSprinting = true;
    } else {
      this.stats.stamina = Math.min(100, this.stats.stamina + 18 * dt);
      this.stats.isSprinting = false;
    }

    // Hunger and Thirst gradual increase
    // Higher consumption when sprinting in humid Lagos heat
    const exertionMult = isSprinting ? 2.2 : isMoving ? 1.3 : 1.0;
    this.stats.thirst = Math.min(100, this.stats.thirst + 0.35 * exertionMult * dt);
    this.stats.hunger = Math.min(100, this.stats.hunger + 0.22 * exertionMult * dt);

    // Health damage if starving or critically dehydrated
    if (this.stats.thirst >= 95 || this.stats.hunger >= 95) {
      this.stats.health = Math.max(0, this.stats.health - 2.5 * dt);
    } else if (this.stats.hunger < 40 && this.stats.thirst < 40 && this.stats.health < 100) {
      // Gentle natural regeneration when well-fed & hydrated
      this.stats.health = Math.min(100, this.stats.health + 0.4 * dt);
    }

    // Low-health heartbeat trigger
    soundEngine.setHeartbeat(this.stats.health < 28 && this.stats.health > 0);

    return {
      isDead: this.stats.health <= 0,
    };
  }

  /**
   * Consume an item
   */
  public consumeItem(item: InventoryItem): boolean {
    const dbItem = ITEM_DATABASE[item.id];
    if (!dbItem || !dbItem.isConsumable) return false;

    if (dbItem.hungerRestore) {
      this.stats.hunger = Math.max(0, this.stats.hunger - dbItem.hungerRestore);
    }
    if (dbItem.thirstRestore) {
      this.stats.thirst = Math.max(0, this.stats.thirst - dbItem.thirstRestore);
    }
    if (dbItem.healthRestore) {
      this.stats.health = Math.min(100, this.stats.health + dbItem.healthRestore);
    }

    soundEngine.playConsume(dbItem.category === 'water');
    return true;
  }

  /**
   * Rest in Safehouse Bed
   * Restores health, resets stamina, advances time
   */
  public restInBed(): { healthGained: number } {
    const prevHealth = this.stats.health;
    this.stats.health = Math.min(100, this.stats.health + 40);
    this.stats.stamina = 100;
    this.stats.hunger = Math.min(100, this.stats.hunger + 15);
    this.stats.thirst = Math.min(100, this.stats.thirst + 20);

    return {
      healthGained: Math.round(this.stats.health - prevHealth),
    };
  }
}
