import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { InventoryModal } from './components/InventoryModal';
import { CraftingModal } from './components/CraftingModal';
import { StorageModal } from './components/StorageModal';
import { MapModal } from './components/MapModal';
import { JournalModal } from './components/JournalModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { GameEngine, GameEngineCallbacks } from './game/GameEngine';
import { SaveSystem } from './game/saveSystem';
import {
  GameSaveData,
  GameSettings,
  InventoryItem,
  JournalEntry,
  Mission,
  SafehouseState,
  SurvivalStats,
} from './game/types';
import { soundEngine } from './game/audio';

export default function App() {
  const [screen, setScreen] = useState<'title' | 'game'>('title');
  const [hasSaveData, setHasSaveData] = useState<boolean>(() => SaveSystem.hasSave());
  const [activeSaveToLoad, setActiveSaveToLoad] = useState<GameSaveData | null>(null);

  // Active game states
  const [stats, setStats] = useState<SurvivalStats>({
    health: 100,
    hunger: 15,
    thirst: 20,
    stamina: 100,
    isSprinting: false,
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [gameTimeHours, setGameTimeHours] = useState<number>(2.5);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [safehouse, setSafehouse] = useState<SafehouseState>({
    hasGeneratorPower: false,
    radioRepaired: false,
    defenseLevel: 1,
    storage: [],
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([-14, 0, -8]);
  const [playerRotY, setPlayerRotY] = useState<number>(Math.PI / 2);

  // Modals
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'success' | 'danger';
  } | null>(null);
  const notificationTimerRef = useRef<number | null>(null);

  const engineRef = useRef<GameEngine | null>(null);

  // Notification helper
  const triggerNotification = useCallback(
    (title: string, message: string, type: 'info' | 'success' | 'danger' = 'info') => {
      setNotification({ title, message, type });
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = window.setTimeout(() => {
        setNotification(null);
      }, 3500);
    },
    []
  );

  // Engine callbacks
  const callbacks: GameEngineCallbacks = {
    onStatsUpdate: (s) => setStats(s),
    onInventoryUpdate: (inv) => setInventory(inv),
    onMissionUpdate: (m, cIds) => {
      setActiveMission(m);
      setCompletedMissionIds(cIds);
    },
    onPromptUpdate: (p) => setCurrentPrompt(p),
    onTimeUpdate: (t) => {
      setGameTimeHours(t);
      if (engineRef.current) {
        setPlayerPos([
          engineRef.current.player.position.x,
          engineRef.current.player.position.y,
          engineRef.current.player.position.z,
        ]);
        setPlayerRotY(engineRef.current.player.rotationY);
        setIsFlashlightOn(engineRef.current.player.isFlashlightOn);
        setJournalEntries([...engineRef.current.journalEntries]);
      }
    },
    onNotification: triggerNotification,
    onGameOver: () => setIsGameOver(true),
    onStorageUpdate: (store) => {
      setSafehouse((prev) => ({ ...prev, storage: store }));
    },
    onSafehouseUpdate: (sh) => setSafehouse(sh),
    onInteractAction: (action) => {
      if (action === 'workbench') setIsCraftingOpen(true);
      else if (action === 'storage') setIsStorageOpen(true);
    },
  };

  // Keyboard hotkeys for UI modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game' || isGameOver) return;

      if (e.code === 'KeyI' || e.code === 'Tab') {
        e.preventDefault();
        setIsInventoryOpen((prev) => !prev);
        setIsCraftingOpen(false);
        setIsMapOpen(false);
        setIsJournalOpen(false);
        setIsPauseOpen(false);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMapOpen((prev) => !prev);
        setIsInventoryOpen(false);
        setIsCraftingOpen(false);
        setIsJournalOpen(false);
        setIsPauseOpen(false);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCraftingOpen((prev) => !prev);
        setIsInventoryOpen(false);
        setIsMapOpen(false);
        setIsJournalOpen(false);
        setIsPauseOpen(false);
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        setIsJournalOpen((prev) => !prev);
        setIsInventoryOpen(false);
        setIsCraftingOpen(false);
        setIsMapOpen(false);
        setIsPauseOpen(false);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        // If any modal is open, close it; otherwise open Pause modal
        if (
          isInventoryOpen ||
          isCraftingOpen ||
          isStorageOpen ||
          isMapOpen ||
          isJournalOpen ||
          isSettingsOpen ||
          isHelpOpen
        ) {
          setIsInventoryOpen(false);
          setIsCraftingOpen(false);
          setIsStorageOpen(false);
          setIsMapOpen(false);
          setIsJournalOpen(false);
          setIsSettingsOpen(false);
          setIsHelpOpen(false);
        } else {
          setIsPauseOpen((prev) => {
            const next = !prev;
            if (engineRef.current) engineRef.current.isPaused = next;
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    screen,
    isGameOver,
    isInventoryOpen,
    isCraftingOpen,
    isStorageOpen,
    isMapOpen,
    isJournalOpen,
    isSettingsOpen,
    isHelpOpen,
  ]);

  // Sync engine pause state when modal opens
  const anyModalOpen =
    isInventoryOpen ||
    isCraftingOpen ||
    isStorageOpen ||
    isMapOpen ||
    isJournalOpen ||
    isPauseOpen ||
    isSettingsOpen ||
    isHelpOpen ||
    isGameOver;

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = anyModalOpen;
    }
  }, [anyModalOpen]);

  // Launch New Game
  const handleNewGame = () => {
    setActiveSaveToLoad(null);
    setScreen('game');
  };

  // Continue Game
  const handleContinue = () => {
    const saved = SaveSystem.load();
    if (saved) {
      setActiveSaveToLoad(saved);
      setScreen('game');
    } else {
      handleNewGame();
    }
  };

  // Manual Save
  const handleSaveProgress = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
      setHasSaveData(true);
    }
  };

  // Restart after Game Over
  const handleRestart = () => {
    setIsGameOver(false);
    const fresh = SaveSystem.createNewGameData();
    if (engineRef.current) {
      engineRef.current.loadFromSaveData(fresh);
      engineRef.current.isPaused = false;
    }
  };

  // Reload Save after Game Over
  const handleReloadSave = () => {
    setIsGameOver(false);
    const saved = SaveSystem.load();
    if (saved && engineRef.current) {
      engineRef.current.loadFromSaveData(saved);
      engineRef.current.isPaused = false;
    } else {
      handleRestart();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-neutral-100 select-none font-sans">
      {screen === 'title' ? (
        <TitleScreen
          hasSaveData={hasSaveData}
          onNewGame={handleNewGame}
          onContinue={handleContinue}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      ) : (
        <>
          {/* WebGL Canvas */}
          <GameCanvas
            callbacks={callbacks}
            initialSaveData={activeSaveToLoad}
            onEngineReady={(engine) => {
              engineRef.current = engine;
            }}
          />

          {/* In-Game Heads-Up Display (HUD) */}
          <HUD
            stats={stats}
            activeMission={activeMission}
            currentPrompt={currentPrompt}
            gameTimeHours={gameTimeHours}
            isFlashlightOn={isFlashlightOn}
            onToggleFlashlight={() => {
              if (engineRef.current) {
                const on = engineRef.current.toggleFlashlight();
                setIsFlashlightOn(on);
              }
            }}
            onOpenInventory={() => setIsInventoryOpen(true)}
            onOpenCrafting={() => setIsCraftingOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenJournal={() => setIsJournalOpen(true)}
            onOpenPause={() => {
              setIsPauseOpen(true);
              if (engineRef.current) engineRef.current.isPaused = true;
            }}
            playerPos={playerPos}
            notification={notification}
          />

          {/* Touch Virtual Controls on Mobile */}
          <MobileControls
            engine={engineRef.current}
            onInteract={() => {
              if (engineRef.current) engineRef.current.handleInteract();
            }}
            onToggleFlashlight={() => {
              if (engineRef.current) {
                const on = engineRef.current.toggleFlashlight();
                setIsFlashlightOn(on);
              }
            }}
            isFlashlightOn={isFlashlightOn}
          />

          {/* Modals & Menus */}
          {isInventoryOpen && (
            <InventoryModal
              inventory={inventory}
              engine={engineRef.current}
              onClose={() => setIsInventoryOpen(false)}
            />
          )}

          {isCraftingOpen && (
            <CraftingModal
              engine={engineRef.current}
              onClose={() => setIsCraftingOpen(false)}
            />
          )}

          {isStorageOpen && (
            <StorageModal
              inventory={inventory}
              storage={safehouse.storage}
              engine={engineRef.current}
              onClose={() => setIsStorageOpen(false)}
            />
          )}

          {isMapOpen && (
            <MapModal
              playerPos={playerPos}
              playerRotY={playerRotY}
              activeMission={activeMission}
              isGateUnlocked={completedMissionIds.includes('mission_5')}
              onClose={() => setIsMapOpen(false)}
            />
          )}

          {isJournalOpen && (
            <JournalModal
              entries={journalEntries}
              onClose={() => setIsJournalOpen(false)}
            />
          )}

          {isPauseOpen && (
            <PauseModal
              onResume={() => {
                setIsPauseOpen(false);
                if (engineRef.current) engineRef.current.isPaused = false;
              }}
              onSave={handleSaveProgress}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
              onQuitToTitle={() => {
                setIsPauseOpen(false);
                setScreen('title');
                setHasSaveData(SaveSystem.hasSave());
              }}
            />
          )}

          {isGameOver && (
            <GameOverModal
              hasSaveData={hasSaveData}
              onReloadSave={handleReloadSave}
              onRestart={handleRestart}
            />
          )}
        </>
      )}

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          initialSettings={engineRef.current?.settings || {
            mouseSensitivity: 1.2,
            masterVolume: 0.85,
            sfxVolume: 0.85,
            ambientVolume: 0.65,
            graphicsQuality: 'medium',
            showMinimap: true,
          }}
          onSaveSettings={(s) => {
            if (engineRef.current) {
              engineRef.current.settings = { ...s };
            }
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Field Survival Guide Modal */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
