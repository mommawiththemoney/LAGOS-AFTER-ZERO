import { Mission, InventoryItem } from './types';
import { soundEngine } from './audio';

export const CAMPAIGN_MISSIONS: Mission[] = [
  {
    id: 'mission_1',
    title: 'MISSION 1: WAKE UP',
    shortDesc: 'Inspect the damaged shelter and find your flashlight.',
    detail: 'You awaken inside an abandoned building in the Lagos Mainland. The city outside is unnaturally silent. Scavenge the room for a flashlight to see in dark corridors.',
    objectiveText: 'Find and equip the Heavy Duty Flashlight in the shelter.',
    targetLocation: { x: -16, z: -8, label: 'Safehouse Shelter' },
    isCompleted: false,
    rewardText: 'Flashlight equipped. Movement and survival basics mastered.',
  },
  {
    id: 'mission_2',
    title: 'MISSION 2: FIRST SUPPLIES',
    shortDesc: 'Scavenge food and drinking water from Mama Ngozi Provisions.',
    detail: 'Dehydration and hunger will quickly set in under the tropical Lagos heat. Head out onto Adeniji Street to locate Mama Ngozi\'s provision store and salvage provisions.',
    objectiveText: 'Collect Pure Mineral Water and Canned Sardines from the store.',
    targetLocation: { x: 16, z: -12, label: 'Mama Ngozi Provisions' },
    isCompleted: false,
    rewardText: 'Supplies acquired. Sustenance will keep your health stable.',
  },
  {
    id: 'mission_3',
    title: 'MISSION 3: THE DEAD SIGNAL',
    shortDesc: 'Find battery cells to power the shortwave radio at your safehouse desk.',
    detail: 'The radio receiver in the shelter emitted an ominous pulse before going dead. Search Alaba Tech & Repairs down the street for lithium batteries, then bring them to the safehouse workbench.',
    objectiveText: 'Salvage Lithium Batteries from Alaba Tech & repair the radio at the workbench.',
    targetLocation: { x: 16, z: 22, label: 'Alaba Tech & Repairs' },
    isCompleted: false,
    rewardText: 'Radio repaired! A faint repeating transmission crackles through the speaker.',
  },
  {
    id: 'mission_4',
    title: 'MISSION 4: SOMEBODY IS OUT THERE',
    shortDesc: 'Investigate the radio transmission beacon coordinates.',
    detail: 'A broadcast transmission references a survivor rendezvous point near the abandoned Danfo intersection and military beacon (Sector 4). Investigate the beacon and locate the log clue.',
    objectiveText: 'Investigate the pulsing Red Beacon near the Danfo checkpoint.',
    targetLocation: { x: -10, z: 20, label: 'Radio Beacon Checkpoint' },
    isCompleted: false,
    rewardText: 'Military dispatch discovered. Zero Hour was caused by a containment breach at Zero Point!',
  },
  {
    id: 'mission_5',
    title: 'MISSION 5: THE LOCKED ROAD',
    shortDesc: 'Retrieve clearance keycard and unlock the bridge barricade to Region B.',
    detail: 'The expressway bridge leading to Victoria Island and the Zero Point facility is barricaded with heavy security gates. Search the military checkpoint booth for the emergency clearance card.',
    objectiveText: 'Retrieve the Island Bridge Access Card from the checkpoint booth and unlock the barricade.',
    targetLocation: { x: 0, z: 52, label: 'Island Bridge Barricade' },
    isCompleted: false,
    rewardText: 'Roadblock unlocked! The road across the lagoon to Region B (The Forgotten Island) is open.',
  },
];

export class MissionManager {
  public activeMissionIndex: number = 0;
  public completedMissionIds: string[] = [];

  public getActiveMission(): Mission | null {
    if (this.activeMissionIndex >= CAMPAIGN_MISSIONS.length) return null;
    return CAMPAIGN_MISSIONS[this.activeMissionIndex];
  }

  /**
   * Check conditions and update mission progression based on real player actions
   */
  public evaluateProgression(
    inventory: InventoryItem[],
    playerPos: [number, number, number],
    radioRepaired: boolean,
    onObjectiveCompleted?: (mission: Mission) => void
  ): boolean {
    const current = this.getActiveMission();
    if (!current) return false;

    let completed = false;

    if (current.id === 'mission_1') {
      // Completed when player collects flashlight
      const hasFlashlight = inventory.some((it) => it.id === 'flashlight');
      if (hasFlashlight) completed = true;
    } else if (current.id === 'mission_2') {
      // Completed when player has water and food
      const hasWater = inventory.some((it) => it.id === 'bottled_water');
      const hasFood = inventory.some((it) => it.id === 'canned_sardines' || it.id === 'plantain_chips');
      if (hasWater && hasFood) completed = true;
    } else if (current.id === 'mission_3') {
      // Completed when radio is repaired or player has repaired radio in inventory
      const hasRepairedRadio = radioRepaired || inventory.some((it) => it.id === 'repaired_radio');
      if (hasRepairedRadio) completed = true;
    } else if (current.id === 'mission_4') {
      // Completed when player reads note 2 near the radio beacon
      const hasNote2 = inventory.some((it) => it.id === 'journal_note_2');
      if (hasNote2) completed = true;
    } else if (current.id === 'mission_5') {
      // Completed when player has access card and reaches the roadblock
      const hasCard = inventory.some((it) => it.id === 'access_card');
      const distToRoadblock = Math.hypot(playerPos[0] - 0, playerPos[2] - 52);
      if (hasCard && distToRoadblock < 6.0) completed = true;
    }

    if (completed) {
      current.isCompleted = true;
      if (!this.completedMissionIds.includes(current.id)) {
        this.completedMissionIds.push(current.id);
      }
      soundEngine.playObjectiveCompleted();
      if (onObjectiveCompleted) onObjectiveCompleted(current);

      this.activeMissionIndex++;
      return true;
    }

    return false;
  }
}
