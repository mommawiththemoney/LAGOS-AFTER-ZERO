import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PlayerCharacter, BoxCollider } from './character';
import { WorldManager } from './world';
import { SurvivalManager, ITEM_DATABASE } from './survival';
import { MissionManager, CAMPAIGN_MISSIONS } from './missions';
import { SaveSystem, DEFAULT_SETTINGS } from './saveSystem';
import { soundEngine } from './audio';
import {
  GameSaveData,
  GameSettings,
  InventoryItem,
  JournalEntry,
  Mission,
  SafehouseState,
  SurvivalStats,
  WorldCollectible,
} from './types';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: SurvivalStats) => void;
  onInventoryUpdate: (inventory: InventoryItem[]) => void;
  onMissionUpdate: (mission: Mission | null, completedIds: string[]) => void;
  onPromptUpdate: (prompt: string | null) => void;
  onTimeUpdate: (gameTimeHours: number) => void;
  onNotification: (title: string, message: string, type?: 'info' | 'success' | 'danger') => void;
  onGameOver: () => void;
  onStorageUpdate: (storage: InventoryItem[]) => void;
  onSafehouseUpdate: (safehouse: SafehouseState) => void;
  onInteractAction: (actionType: 'storage' | 'workbench' | 'bed' | 'generator' | 'radio' | null) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  public player: PlayerCharacter;
  public world: WorldManager;
  public survival: SurvivalManager;
  public missions: MissionManager;

  // Active game state
  public inventory: InventoryItem[] = [];
  public safehouse: SafehouseState = {
    hasGeneratorPower: false,
    radioRepaired: false,
    defenseLevel: 1,
    storage: [],
  };
  public journalEntries: JournalEntry[] = [];
  public discoveredLocations: string[] = ['Safehouse Shelter'];
  public gameTimeHours: number = 2.5; // Starts in dead of night (Zero Hour)
  public settings: GameSettings = { ...DEFAULT_SETTINGS };

  // Contextual interaction
  public currentPrompt: string | null = null;
  public activeInteractable: {
    type: 'collectible' | 'bed' | 'workbench' | 'storage' | 'generator' | 'radio';
    id?: string;
    data?: unknown;
  } | null = null;

  // Input states
  public keyboardInput = {
    forward: 0,
    strafe: 0,
    sprint: false,
    jump: false,
  };
  public mobileInput = {
    forward: 0,
    strafe: 0,
    sprint: false,
    jump: false,
  };
  private isPointerLocked: boolean = false;
  public isPaused: boolean = false;
  private callbacks: GameEngineCallbacks;

  // Sound timers
  private cricketTimer: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks, initialSaveData?: GameSaveData | null) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 250);

    // 3. WebGLRenderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio environment map for realistic PBR metal and reflections
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('PMREM environment reflection failed to generate:', e);
    }

    // 5. Instantiate subsystems
    this.world = new WorldManager(this.scene);
    this.player = new PlayerCharacter(this.scene);
    this.survival = new SurvivalManager();
    this.missions = new MissionManager();

    // 6. Apply Save Data if provided, or initialize new game
    if (initialSaveData) {
      this.loadFromSaveData(initialSaveData);
    } else {
      const fresh = SaveSystem.createNewGameData();
      this.loadFromSaveData(fresh);
    }

    // 7. Bind window resize and inputs
    this.setupEventListeners();

    // 8. Pre-compile shaders
    this.renderer.compile(this.scene, this.camera);

    // 9. Start animation loop
    this.clock.start();
    this.loop();
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / (height || 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.isPaused) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keyboardInput.forward = 1;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keyboardInput.forward = -1;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keyboardInput.strafe = -1;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keyboardInput.strafe = 1;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keyboardInput.sprint = true;
        break;
      case 'Space':
        this.keyboardInput.jump = true;
        break;
      case 'KeyF':
        this.toggleFlashlight();
        break;
      case 'KeyE':
        this.handleInteract();
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        if (this.keyboardInput.forward > 0) this.keyboardInput.forward = 0;
        break;
      case 'KeyS':
      case 'ArrowDown':
        if (this.keyboardInput.forward < 0) this.keyboardInput.forward = 0;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        if (this.keyboardInput.strafe < 0) this.keyboardInput.strafe = 0;
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (this.keyboardInput.strafe > 0) this.keyboardInput.strafe = 0;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keyboardInput.sprint = false;
        break;
      case 'Space':
        this.keyboardInput.jump = false;
        break;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (this.isPaused) return;
    // Allow camera drag with mouse or pointerlock
    const sens = 0.0022 * this.settings.mouseSensitivity;
    if (document.pointerLockElement === this.renderer.domElement || e.buttons === 1) {
      this.player.cameraYaw += e.movementX * sens;
      this.player.cameraPitch = THREE.MathUtils.clamp(
        this.player.cameraPitch - e.movementY * sens,
        -0.35,
        0.95
      );
    }
  };

  public rotateCameraByDelta(deltaYaw: number, deltaPitch: number) {
    const sens = 0.0035 * this.settings.mouseSensitivity;
    this.player.cameraYaw += deltaYaw * sens;
    this.player.cameraPitch = THREE.MathUtils.clamp(
      this.player.cameraPitch - deltaPitch * sens,
      -0.35,
      0.95
    );
  }

  public toggleFlashlight(): boolean {
    const state = this.player.toggleFlashlight();
    return state;
  }

  /**
   * Main Game Loop
   */
  private loop = () => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    const delta = this.clock.getDelta();

    if (this.isPaused) return;

    // 1. Advance Game Time (1 real sec = 20 game seconds -> 1 game hour in 3 minutes)
    this.gameTimeHours = (this.gameTimeHours + (delta * 20) / 3600) % 24;
    this.callbacks.onTimeUpdate(this.gameTimeHours);

    // 2. Sound updates (night crickets)
    const isNight = this.gameTimeHours < 5.5 || this.gameTimeHours > 18.5;
    if (isNight) {
      this.cricketTimer += delta;
      if (this.cricketTimer > 3.5 + Math.random() * 4) {
        soundEngine.triggerCricket();
        this.cricketTimer = 0;
      }
    }

    // 3. Combine keyboard & mobile touch inputs
    const inputForward = this.keyboardInput.forward !== 0 ? this.keyboardInput.forward : this.mobileInput.forward;
    const inputStrafe = this.keyboardInput.strafe !== 0 ? this.keyboardInput.strafe : this.mobileInput.strafe;
    const isSprintRequested = this.keyboardInput.sprint || this.mobileInput.sprint;
    const isJumpRequested = this.keyboardInput.jump || this.mobileInput.jump;

    // 4. Update survival statistics
    const canSprint = this.survival.stats.stamina > 5;
    const { isDead } = this.survival.update(delta, this.player.isMoving, this.player.isSprinting);
    this.callbacks.onStatsUpdate({ ...this.survival.stats });

    if (isDead) {
      this.callbacks.onGameOver();
      this.isPaused = true;
      return;
    }

    // 5. Update player movement & physics
    this.player.update(
      delta,
      {
        forward: inputForward,
        strafe: inputStrafe,
        sprint: isSprintRequested,
        jump: isJumpRequested,
      },
      this.world.colliders,
      canSprint
    );

    // 6. Update camera with smooth follow & wall collision avoidance
    this.player.updateCamera(this.camera, delta, this.world.colliders);

    // 7. Update environmental world lighting and weather
    this.world.updateEnvironment(this.gameTimeHours, delta);

    // 8. Contextual Interaction Raycast & Proximity Check
    this.evaluateInteractionProximity();

    // 9. Evaluate Story Missions Progression
    this.missions.evaluateProgression(
      this.inventory,
      [this.player.position.x, this.player.position.y, this.player.position.z],
      this.safehouse.radioRepaired,
      (completedMission) => {
        this.callbacks.onNotification('MISSION COMPLETED', `${completedMission.title}: ${completedMission.rewardText}`, 'success');
        this.callbacks.onMissionUpdate(this.missions.getActiveMission(), this.missions.completedMissionIds);

        // If Mission 3 completed, unlock radio broadcast
        if (completedMission.id === 'mission_3') {
          soundEngine.playRadioStatic(4000);
        }
        // If Mission 5 completed, unlock roadblock gate
        if (completedMission.id === 'mission_5') {
          this.world.unlockRoadblockGate();
        }
      }
    );

    // 10. Render frame
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Proximity evaluation for picking up items or interacting with safehouse stations
   */
  private evaluateInteractionProximity() {
    const px = this.player.position.x;
    const py = this.player.position.y;
    const pz = this.player.position.z;

    let closestDist = 2.4;
    let foundInteractable: typeof this.activeInteractable = null;
    let prompt: string | null = null;

    // Check world collectibles
    for (const item of this.world.collectibles) {
      if (item.collected) continue;
      const dist = Math.hypot(px - item.position[0], pz - item.position[2]);
      if (dist < closestDist) {
        closestDist = dist;
        foundInteractable = { type: 'collectible', id: item.id, data: item };
        prompt = `[E] ${item.promptText}`;
      }
    }

    // Check safehouse stations
    const stations = [
      { id: 'bed', pos: [-19.2, -12.5], prompt: '[E] Rest in Bed (Restore Health & Advance Time)', type: 'bed' as const },
      { id: 'workbench', pos: [-19.2, -3.0], prompt: '[E] Use Crafting Workbench', type: 'workbench' as const },
      { id: 'storage', pos: [-20.2, -6.8], prompt: '[E] Open Safehouse Storage Chest', type: 'storage' as const },
      { id: 'radio', pos: [-12.0, -12.5], prompt: '[E] Use Shortwave Radio', type: 'radio' as const },
      { id: 'generator', pos: [-8.5, -3.5], prompt: '[E] Inspect Backup Generator', type: 'generator' as const },
    ];

    for (const st of stations) {
      const dist = Math.hypot(px - st.pos[0], pz - st.pos[1]);
      if (dist < closestDist) {
        closestDist = dist;
        foundInteractable = { type: st.type };
        prompt = st.prompt;
      }
    }

    this.activeInteractable = foundInteractable;
    this.currentPrompt = prompt;
    this.callbacks.onPromptUpdate(prompt);
  }

  /**
   * Action trigger when [E] or Mobile Interact button is pressed
   */
  public handleInteract() {
    if (!this.activeInteractable) return;

    if (this.activeInteractable.type === 'collectible') {
      const item = this.activeInteractable.data as WorldCollectible;
      this.collectWorldItem(item);
    } else if (this.activeInteractable.type === 'bed') {
      const { healthGained } = this.survival.restInBed();
      this.gameTimeHours = (this.gameTimeHours + 6) % 24;
      soundEngine.playUIClick();
      this.callbacks.onNotification('RESTED IN SHELTER', `You slept for 6 hours. Restored +${healthGained} Health.`, 'info');
      this.callbacks.onStatsUpdate({ ...this.survival.stats });
      this.callbacks.onTimeUpdate(this.gameTimeHours);
    } else if (this.activeInteractable.type === 'workbench') {
      this.callbacks.onInteractAction('workbench');
    } else if (this.activeInteractable.type === 'storage') {
      this.callbacks.onInteractAction('storage');
    } else if (this.activeInteractable.type === 'radio') {
      this.interactWithRadio();
    } else if (this.activeInteractable.type === 'generator') {
      this.interactWithGenerator();
    }
  }

  /**
   * Pick up a world collectible item
   */
  private collectWorldItem(item: WorldCollectible) {
    this.world.markItemCollected(item.id);
    soundEngine.playPickup();

    // Add to inventory
    this.addItemToInventory(item.itemId, 1);

    // If it's a journal note, add to lore journal
    if (item.category === 'clue') {
      const noteEntry = this.createJournalFromItem(item.itemId);
      if (noteEntry) {
        this.journalEntries.push(noteEntry);
        this.callbacks.onNotification('NEW CLUE DISCOVERED', noteEntry.title, 'info');
      }
    } else {
      this.callbacks.onNotification('ITEM COLLECTED', item.name, 'info');
    }

    // If it's the flashlight, equip and enable it automatically
    if (item.itemId === 'flashlight') {
      this.player.setFlashlight(true);
      this.callbacks.onNotification('FLASHLIGHT ON', 'Press [F] to toggle flashlight beam.', 'info');
    }

    this.callbacks.onInventoryUpdate([...this.inventory]);
  }

  private createJournalFromItem(itemId: string): JournalEntry | null {
    if (itemId === 'journal_note_1') {
      return {
        id: 'note_1',
        title: 'Shelter Scratchpad: The Disappearance',
        date: '2042-10-16 01:15',
        source: 'Mainland Shelter',
        content:
          'Everyone is gone. My neighbours, the danfo drivers, the market vendors at Tejuosho. The radio had a garbled broadcast before the towers dropped: "All units, Zero Point breach at Sector 4. Non-biological vanishings reported." Is it an experiment? Or something worse?',
        discoveredAt: Date.now(),
      };
    } else if (itemId === 'journal_note_2') {
      return {
        id: 'note_2',
        title: 'Military Dispatch: Sector 4 Containment',
        date: '2042-10-15 23:45',
        source: 'Checkpoint Radio Mast',
        content:
          'PRIORITY RED: Phase-resonance frequency detected under Victoria Island facility. The resonant field triggered human cellular translocation. Evacuate all personnel to Mainland. Do NOT cross the Lagoon bridge without emergency clearance.',
        discoveredAt: Date.now(),
      };
    } else if (itemId === 'journal_note_3') {
      return {
        id: 'note_3',
        title: 'Zero Point Facility Blueprint Memo',
        date: '2042-10-16 03:00',
        source: 'Bridge Security Booth',
        content:
          'The core underground elevator is locked down. If anyone can reach the Island, the override terminals must be activated in sequence. There may still be surviving researchers sealed inside the subterranean bunkers.',
        discoveredAt: Date.now(),
      };
    }
    return null;
  }

  public addItemToInventory(itemId: string, count: number = 1) {
    const dbItem = ITEM_DATABASE[itemId];
    if (!dbItem) return;

    const existing = this.inventory.find((i) => i.id === itemId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + count, dbItem.maxStack);
    } else {
      this.inventory.push({
        ...dbItem,
        quantity: count,
      });
    }
    this.callbacks.onInventoryUpdate([...this.inventory]);
  }

  public removeItemFromInventory(itemId: string, count: number = 1): boolean {
    const idx = this.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;

    if (this.inventory[idx].quantity > count) {
      this.inventory[idx].quantity -= count;
    } else {
      this.inventory.splice(idx, 1);
    }
    this.callbacks.onInventoryUpdate([...this.inventory]);
    return true;
  }

  public getItemCount(itemId: string): number {
    const item = this.inventory.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  }

  /**
   * Interact with Safehouse Shortwave Radio
   */
  public interactWithRadio() {
    if (!this.safehouse.radioRepaired) {
      // Check if player has batteries to repair it
      const hasBatteries = this.getItemCount('batteries') > 0;
      if (hasBatteries) {
        this.removeItemFromInventory('batteries', 1);
        this.safehouse.radioRepaired = true;
        this.callbacks.onSafehouseUpdate({ ...this.safehouse });
        soundEngine.playCrafting();
        setTimeout(() => soundEngine.playRadioStatic(4500), 400);
        this.callbacks.onNotification(
          'RADIO REPAIRED',
          'You inserted the lithium battery cells! Shortwave receiver is receiving a pulsing signal from Sector 4.',
          'success'
        );
      } else {
        this.callbacks.onNotification(
          'RADIO POWER NEEDED',
          'The shortwave radio needs battery cells. Search Alaba Tech & Repairs down the street.',
          'danger'
        );
      }
    } else {
      // Play eerie transmission
      soundEngine.playRadioStatic(3500);
      this.callbacks.onNotification(
        'RADIO BROADCAST',
        '"Mayday... if any survivors remain on the Mainland, rendezvous at the Sector 4 Danfo checkpoint..."',
        'info'
      );
    }
  }

  /**
   * Interact with Safehouse Backup Generator
   */
  public interactWithGenerator() {
    if (this.safehouse.hasGeneratorPower) {
      this.callbacks.onNotification('GENERATOR RUNNING', 'The diesel generator is humming smoothly, powering the shelter.', 'info');
      return;
    }

    const hasRepairKit = this.getItemCount('repair_kit') > 0;
    if (hasRepairKit) {
      this.removeItemFromInventory('repair_kit', 1);
      this.safehouse.hasGeneratorPower = true;
      this.world.setSafehousePower(true);
      this.callbacks.onSafehouseUpdate({ ...this.safehouse });
      soundEngine.playCrafting();
      this.callbacks.onNotification(
        'GENERATOR REPAIRED!',
        'You replaced the blown relays and starter wiring. Safehouse power restored!',
        'success'
      );
    } else {
      this.callbacks.onNotification(
        'GENERATOR BROKEN',
        'Generator starter is burned out. Craft a Generator Maintenance Kit at the workbench (Scrap Metal x2 + Battery x1).',
        'danger'
      );
    }
  }

  /**
   * Craft an item at the workbench
   */
  public craftItem(recipeId: string): boolean {
    const recipe = [
      {
        id: 'craft_bandage',
        resultItemId: 'sterile_bandage',
        ingredients: [{ itemId: 'cloth', count: 1 }],
      },
      {
        id: 'craft_crowbar',
        resultItemId: 'basic_tool',
        ingredients: [
          { itemId: 'scrap_metal', count: 2 },
          { itemId: 'cloth', count: 1 },
        ],
      },
      {
        id: 'craft_repair_kit',
        resultItemId: 'repair_kit',
        ingredients: [
          { itemId: 'scrap_metal', count: 2 },
          { itemId: 'batteries', count: 1 },
        ],
      },
    ].find((r) => r.id === recipeId);

    if (!recipe) return false;

    // Check ingredients
    for (const ing of recipe.ingredients) {
      if (this.getItemCount(ing.itemId) < ing.count) {
        return false;
      }
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      this.removeItemFromInventory(ing.itemId, ing.count);
    }

    // Add crafted item
    this.addItemToInventory(recipe.resultItemId, 1);
    soundEngine.playCrafting();
    return true;
  }

  /**
   * Storage chest: transfer item between backpack and safehouse storage
   */
  public transferToStorage(itemId: string, count: number = 1): boolean {
    if (this.removeItemFromInventory(itemId, count)) {
      const dbItem = ITEM_DATABASE[itemId];
      if (!dbItem) return false;
      const existing = this.safehouse.storage.find((i) => i.id === itemId);
      if (existing) {
        existing.quantity += count;
      } else {
        this.safehouse.storage.push({ ...dbItem, quantity: count });
      }
      this.callbacks.onStorageUpdate([...this.safehouse.storage]);
      return true;
    }
    return false;
  }

  public transferFromStorage(itemId: string, count: number = 1): boolean {
    const idx = this.safehouse.storage.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;

    if (this.safehouse.storage[idx].quantity > count) {
      this.safehouse.storage[idx].quantity -= count;
    } else {
      this.safehouse.storage.splice(idx, 1);
    }
    this.addItemToInventory(itemId, count);
    this.callbacks.onStorageUpdate([...this.safehouse.storage]);
    return true;
  }

  /**
   * Save game state
   */
  public saveGame(): boolean {
    const collectedIds = this.world.collectibles.filter((c) => c.collected).map((c) => c.id);
    const saveData: GameSaveData = {
      version: 1,
      timestamp: Date.now(),
      playerPos: [this.player.position.x, this.player.position.y, this.player.position.z],
      playerRotY: this.player.rotationY,
      stats: { ...this.survival.stats },
      inventory: [...this.inventory],
      safehouse: { ...this.safehouse },
      activeMissionId: this.missions.getActiveMission()?.id || 'completed',
      completedMissions: [...this.missions.completedMissionIds],
      discoveredLocations: [...this.discoveredLocations],
      collectedWorldItemIds: collectedIds,
      journalEntries: [...this.journalEntries],
      gameTimeHours: this.gameTimeHours,
      flashlightOn: this.player.isFlashlightOn,
      settings: { ...this.settings },
    };

    const success = SaveSystem.save(saveData);
    if (success) {
      this.callbacks.onNotification('PROGRESS SAVED', 'Game state successfully saved to browser storage.', 'success');
    }
    return success;
  }

  /**
   * Load game state from SaveData
   */
  public loadFromSaveData(data: GameSaveData) {
    this.player.position.set(...data.playerPos);
    this.player.rotationY = data.playerRotY;
    this.player.setFlashlight(data.flashlightOn);
    this.survival.stats = { ...data.stats };
    this.inventory = [...data.inventory];
    this.safehouse = { ...data.safehouse };
    this.discoveredLocations = [...data.discoveredLocations];
    this.journalEntries = [...data.journalEntries];
    this.gameTimeHours = data.gameTimeHours;
    this.settings = { ...data.settings };

    // Apply safehouse generator power visual
    this.world.setSafehousePower(this.safehouse.hasGeneratorPower);

    // Mark collected items
    if (data.collectedWorldItemIds) {
      data.collectedWorldItemIds.forEach((id) => this.world.markItemCollected(id));
    }

    // Set mission index
    const mIndex = CAMPAIGN_MISSIONS.findIndex((m) => m.id === data.activeMissionId);
    this.missions.activeMissionIndex = mIndex !== -1 ? mIndex : CAMPAIGN_MISSIONS.length;
    this.missions.completedMissionIds = [...data.completedMissions];

    if (this.missions.completedMissionIds.includes('mission_5')) {
      this.world.unlockRoadblockGate();
    }

    // Trigger initial updates
    this.callbacks.onStatsUpdate({ ...this.survival.stats });
    this.callbacks.onInventoryUpdate([...this.inventory]);
    this.callbacks.onMissionUpdate(this.missions.getActiveMission(), this.missions.completedMissionIds);
    this.callbacks.onTimeUpdate(this.gameTimeHours);
    this.callbacks.onStorageUpdate([...this.safehouse.storage]);
    this.callbacks.onSafehouseUpdate({ ...this.safehouse });
  }

  /**
   * Clean up WebGL resources and event listeners
   */
  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
