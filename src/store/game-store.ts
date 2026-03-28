// ═══════════════════════════════════════════════════════════
// مخزن اللعبة المركزي - Main Game Store
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { ResourceType } from '@/lib/idle-system';
import { getBuildingProductionPerHour, getTotalProductionPerHour, getUpgradeCost } from '@/lib/idle-system';
import type { BuildingState } from '@/lib/idle-system';
import type { TerrainType, TimeOfDay, TroopType, WaveSlot } from '@/lib/battle-engine';
import { calculateEffectivePower } from '@/lib/battle-engine';
import type { WorldSector } from '@/lib/world-map';
import { generateWorldMap, scoutSector as scoutSectorLogic } from '@/lib/world-map';
import type { BattleState, BattleUnit, ActiveTacticState } from '@/lib/battle-simulation';
import { createPlayerUnits, createEnemyUnits, battleTick } from '@/lib/battle-simulation';
import { ACTIVE_TACTICS } from '@/lib/battle-simulation';
import type { Company, Squad, Commander } from '@/lib/chain-of-command';
import { calculateCompanyBuffs, createEmptyCompany, createEmptySquad, COMPANY_MAX_SIZE, SQUAD_MAX_SIZE } from '@/lib/chain-of-command';

// ═══════════════════════════════
// الشاشات
// ═══════════════════════════════

export type GameScreen = 'war-room' | 'world-map' | 'barracks' | 'battle';

// ═══════════════════════════════
// واجهة الحالة
// ═══════════════════════════════

export interface GameState {
  // الشاشة الحالية
  currentScreen: GameScreen;

  // === الموارد ===
  resources: Record<ResourceType, number>;

  // === المنشآت ===
  buildings: BuildingState[];

  // === غرفة العمليات ===
  terrain: TerrainType;
  timeOfDay: TimeOfDay;
  waves: WaveSlot[][];
  selectedTroopType: TroopType | null;
  powerBreakdown: ReturnType<typeof calculateEffectivePower> | null;

  // === خريطة العالم ===
  worldSectors: WorldSector[];
  selectedSector: WorldSector | null;

  // === الثكنات / القيادة ===
  companies: Company[];
  selectedCompany: Company | null;

  // === المعركة ===
  battleState: BattleState | null;
  battleTerrain: TerrainType;
  battleTimeOfDay: TimeOfDay;
  selectedSectorForBattle: WorldSector | null;

  // === Idle System ===
  lastOnlineTime: number;
  idleAccumulated: Record<ResourceType, number>;
  isCollectingIdle: boolean;

  // === الإجراءات ===
  setScreen: (screen: GameScreen) => void;
  // موارد
  addResource: (type: ResourceType, amount: number) => void;
  spendResource: (type: ResourceType, amount: number) => boolean;
  // منشآت
  upgradeBuilding: (buildingId: string) => void;
  collectIdleResources: () => void;
  // غرفة العمليات
  setTerrain: (terrain: TerrainType) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  selectTroopType: (type: TroopType | null) => void;
  assignTroopToWave: (waveIndex: number, slotIndex: number) => void;
  removeTroopFromWave: (waveIndex: number, slotIndex: number) => void;
  increaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  decreaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  resetDeployment: () => void;
  // خريطة العالم
  selectWorldSector: (sector: WorldSector | null) => void;
  scoutWorldSector: (sectorId: string) => boolean;
  attackSector: (sectorId: string) => void;
  // ثكنات
  selectCompany: (company: Company | null) => void;
  addSquadToCompany: (companyId: string) => void;
  recruitToSquad: (companyId: string, squadId: string, count: number) => void;
  assignCommander: (companyId: string, squadId: string, commander: Commander) => void;
  removeCommander: (companyId: string, squadId: string) => void;
  // معركة
  activateTactic: (tacticType: string) => void;
  updateBattle: (deltaTime: number) => void;
  endBattle: () => void;
}

// ═══════════════════════════════
// الحالة الأولية
// ═══════════════════════════════

const emptyWaves: WaveSlot[][] = [
  [{ troopType: null, count: 0 }, { troopType: null, count: 0 }],
  [{ troopType: null, count: 0 }, { troopType: null, count: 0 }],
  [{ troopType: null, count: 0 }, { troopType: null, count: 0 }],
];

const initialBuildings: BuildingState[] = [
  { id: 'scrapyard', level: 1, isActive: true },
  { id: 'fuelDepot', level: 1, isActive: true },
  { id: 'intelCenter', level: 1, isActive: true },
  { id: 'warFactory', level: 1, isActive: false },
  { id: 'trainingCamp', level: 1, isActive: false },
];

const initialWorld = generateWorldMap(4, 42);

const initialCompanies: Company[] = [
  createEmptyCompany('infantry', 0),
  createEmptyCompany('armor', 0),
  createEmptyCompany('aviation', 0),
];

// ═══════════════════════════════
// إنشاء المخزن
// ═══════════════════════════════

export const useGameStore = create<GameState>((set, get) => ({
  currentScreen: 'war-room',
  resources: { scrap: 500, fuel: 300, intel: 100 },
  buildings: initialBuildings,
  terrain: 'plains',
  timeOfDay: 'day',
  waves: emptyWaves,
  selectedTroopType: null,
  powerBreakdown: calculateEffectivePower(emptyWaves, 'plains', 'day'),
  worldSectors: initialWorld,
  selectedSector: null,
  companies: initialCompanies,
  selectedCompany: null,
  battleState: null,
  battleTerrain: 'plains',
  battleTimeOfDay: 'day',
  selectedSectorForBattle: null,
  lastOnlineTime: Date.now(),
  idleAccumulated: { scrap: 0, fuel: 0, intel: 0 },
  isCollectingIdle: false,

  // === التنقل ===
  setScreen: (screen) => set({ currentScreen: screen }),

  // === الموارد ===
  addResource: (type, amount) =>
    set((s) => ({ resources: { ...s.resources, [type]: s.resources[type] + amount } })),

  spendResource: (type, amount) => {
    const state = get();
    if (state.resources[type] < amount) return false;
    set((s) => ({ resources: { ...s.resources, [type]: s.resources[type] - amount } }));
    return true;
  },

  // === المنشآت ===
  upgradeBuilding: (buildingId) => {
    const state = get();
    const building = state.buildings.find(b => b.id === buildingId);
    if (!building) return;

    const cost = getUpgradeCost(buildingId, building.level);
    if (state.resources.scrap < cost) return;

    set({
      resources: { ...state.resources, scrap: state.resources.scrap - cost },
      buildings: state.buildings.map(b =>
        b.id === buildingId ? { ...b, level: b.level + 1 } : b
      ),
    });
  },

  collectIdleResources: () => {
    const state = get();
    const acc = state.idleAccumulated;
    if (acc.scrap === 0 && acc.fuel === 0 && acc.intel === 0) return;

    set((s) => ({
      resources: {
        scrap: s.resources.scrap + s.idleAccumulated.scrap,
        fuel: s.resources.fuel + s.idleAccumulated.fuel,
        intel: s.resources.intel + s.idleAccumulated.intel,
      },
      idleAccumulated: { scrap: 0, fuel: 0, intel: 0 },
      lastOnlineTime: Date.now(),
      isCollectingIdle: false,
    }));
  },

  // === غرفة العمليات ===
  setTerrain: (terrain) => {
    const state = get();
    set({
      terrain,
      powerBreakdown: calculateEffectivePower(state.waves, terrain, state.timeOfDay),
    });
  },

  setTimeOfDay: (timeOfDay) => {
    const state = get();
    set({
      timeOfDay,
      powerBreakdown: calculateEffectivePower(state.waves, state.terrain, timeOfDay),
    });
  },

  selectTroopType: (type) => set({ selectedTroopType: type }),

  assignTroopToWave: (waveIndex, slotIndex) => {
    const state = get();
    if (!state.selectedTroopType) return;

    const troopType = state.selectedTroopType;
    const currentSlot = state.waves[waveIndex][slotIndex];
    const available = getTroopCount(state.companies, troopType);

    if (currentSlot.troopType === troopType) {
      const newCount = Math.min(currentSlot.count + 5, available);
      if (newCount > currentSlot.count) {
        const newWaves = state.waves.map((w, wi) =>
          w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: newCount } : s))
        );
        set({
          waves: newWaves,
          powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay),
        });
      }
    } else if (currentSlot.troopType === null && available >= 5) {
      const newWaves = state.waves.map((w, wi) =>
        w.map((s, si) => (wi === waveIndex && si === slotIndex ? { troopType, count: 5 } : s))
      );
      set({
        waves: newWaves,
        powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay),
      });
    }
  },

  removeTroopFromWave: (waveIndex, slotIndex) => {
    const state = get();
    const newWaves = state.waves.map((w, wi) =>
      w.map((s, si) => (wi === waveIndex && si === slotIndex ? { troopType: null, count: 0 } : s))
    );
    set({
      waves: newWaves,
      powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay),
    });
  },

  increaseTroopCount: (waveIndex, slotIndex) => {
    const state = get();
    const slot = state.waves[waveIndex][slotIndex];
    if (!slot.troopType) return;
    const available = getTroopCount(state.companies, slot.troopType);
    const newCount = Math.min(slot.count + 5, available);
    if (newCount <= slot.count) return;

    const newWaves = state.waves.map((w, wi) =>
      w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: newCount } : s))
    );
    set({
      waves: newWaves,
      powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay),
    });
  },

  decreaseTroopCount: (waveIndex, slotIndex) => {
    const state = get();
    const slot = state.waves[waveIndex][slotIndex];
    if (!slot.troopType || slot.count <= 5) return;

    const newWaves = state.waves.map((w, wi) =>
      w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: slot.count - 5 } : s))
    );
    set({
      waves: newWaves,
      powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay),
    });
  },

  resetDeployment: () => {
    const state = get();
    set({
      waves: emptyWaves,
      powerBreakdown: calculateEffectivePower(emptyWaves, state.terrain, state.timeOfDay),
      selectedTroopType: null,
    });
  },

  // === خريطة العالم ===
  selectWorldSector: (sector) => set({ selectedSector: sector }),

  scoutWorldSector: (sectorId) => {
    const state = get();
    const result = scoutSectorLogic(state.worldSectors, sectorId, state.resources.intel, 15);
    if (!result || !result.success) return false;

    set({
      resources: { ...state.resources, intel: result.newIntel },
      worldSectors: result.updatedSectors,
    });
    return true;
  },

  attackSector: (sectorId) => {
    const state = get();
    const sector = state.worldSectors.find(s => s.id === sectorId);
    if (!sector) return;

    const hasTroops = state.waves.some(w => w.some(s => s.troopType !== null));
    if (!hasTroops) return;

    const playerUnits = createPlayerUnits(state.waves);
    const enemyUnits = createEnemyUnits(sector.enemyPower, state.terrain);

    const buffs = state.selectedCompany ? calculateCompanyBuffs(state.selectedCompany) : undefined;

    const battleState: BattleState = {
      status: 'active',
      elapsedTime: 0,
      playerUnits: playerUnits.map(u => ({
        ...u,
        attackPower: Math.floor(u.attackPower * (1 + (buffs?.attack ?? 0) / 100)),
        defense: Math.floor(u.defense * (1 + (buffs?.defense ?? 0) / 100)),
      })),
      enemyUnits,
      activeTactics: Object.keys(ACTIVE_TACTICS).map(t => ({
        tactic: t as BattleState['activeTactics'][0]['tactic'],
        remainingDuration: 0,
        remainingCooldown: 0,
        isActive: false,
      })),
      playerTotalPower: playerUnits.reduce((s, u) => s + u.attackPower, 0),
      enemyTotalPower: enemyUnits.reduce((s, u) => s + u.attackPower, 0),
      playerCasualties: 0,
      enemyCasualties: 0,
    };

    set({
      battleState,
      battleTerrain: state.terrain,
      battleTimeOfDay: state.timeOfDay,
      selectedSectorForBattle: sector,
      currentScreen: 'battle',
    });
  },

  // === الثكنات ===
  selectCompany: (company) => set({ selectedCompany: company }),

  addSquadToCompany: (companyId) => {
    const state = get();
    const company = state.companies.find(c => c.id === companyId);
    if (!company) return;
    if (company.squads.length >= 10) return;

    const totalTroops = company.squads.reduce((s, sq) => s + sq.size, 0);
    if (totalTroops >= COMPANY_MAX_SIZE) return;

    set({
      companies: state.companies.map(c =>
        c.id === companyId
          ? { ...c, squads: [...c.squads, createEmptySquad(c.troopType, c.squads.length)] }
          : c
      ),
    });
  },

  recruitToSquad: (companyId, squadId, count) => {
    const state = get();
    const company = state.companies.find(c => c.id === companyId);
    if (!company) return;

    const costPerUnit = { infantry: 10, armor: 30, aviation: 50 }[company.troopType];
    const totalCost = costPerUnit * count;
    if (state.resources.scrap < totalCost) return;

    const squad = company.squads.find(sq => sq.id === squadId);
    if (!squad) return;

    const totalTroops = company.squads.reduce((s, sq) => s + sq.size, 0);
    const available = Math.min(count, SQUAD_MAX_SIZE - squad.size, COMPANY_MAX_SIZE - totalTroops);
    if (available <= 0) return;

    set({
      resources: { ...state.resources, scrap: state.resources.scrap - (costPerUnit * available) },
      companies: state.companies.map(c =>
        c.id === companyId
          ? {
              ...c,
              squads: c.squads.map(sq =>
                sq.id === squadId ? { ...sq, size: sq.size + available } : sq
              ),
            }
          : c
      ),
    });
  },

  assignCommander: (companyId, squadId, commander) => {
    const state = get();
    if (state.resources.scrap < commander.cost) return;

    set({
      resources: { ...state.resources, scrap: state.resources.scrap - commander.cost },
      companies: state.companies.map(c =>
        c.id === companyId
          ? {
              ...c,
              squads: c.squads.map(sq =>
                sq.id === squadId ? { ...sq, commander } : sq
              ),
            }
          : c
      ),
    });
  },

  removeCommander: (companyId, squadId) => {
    set((s) => ({
      companies: s.companies.map(c =>
        c.id === companyId
          ? {
              ...c,
              squads: c.squads.map(sq =>
                sq.id === squadId ? { ...sq, commander: null } : sq
              ),
            }
          : c
      ),
    }));
  },

  // === المعركة ===
  activateTactic: (tacticType) => {
    const state = get();
    if (!state.battleState || state.battleState.status !== 'active') return;

    const tacticState = state.battleState.activeTactics.find(t => t.tactic === tacticType);
    if (!tacticState || tacticState.isActive || tacticState.remainingCooldown > 0) return;

    const tactic = ACTIVE_TACTICS[tacticType as keyof typeof ACTIVE_TACTICS];
    if (state.resources.fuel < tactic.cost) return;

    set({
      resources: { ...state.resources, fuel: state.resources.fuel - tactic.cost },
      battleState: {
        ...state.battleState,
        activeTactics: state.battleState.activeTactics.map(t =>
          t.tactic === tacticType
            ? { ...t, isActive: true, remainingDuration: tactic.duration }
            : t
        ),
      },
    });
  },

  updateBattle: (deltaTime) => {
    const state = get();
    if (!state.battleState) return;

    const result = battleTick(state.battleState, deltaTime);
    set({ battleState: result.updatedState });
  },

  endBattle: () => {
    const state = get();
    if (!state.battleState) return;

    const wasVictory = state.battleState.status === 'victory';
    if (wasVictory && state.selectedSectorForBattle) {
      const loot = state.selectedSectorForBattle.loot;
      set({
        resources: {
          scrap: state.resources.scrap + loot.scrap,
          fuel: state.resources.fuel + loot.fuel,
          intel: state.resources.intel + loot.intel,
        },
        worldSectors: state.worldSectors.map(s =>
          s.id === state.selectedSectorForBattle!.id
            ? { ...s, status: 'cleared' as const }
            : s
        ),
        battleState: null,
        selectedSectorForBattle: null,
        currentScreen: 'world-map',
      });
    } else {
      set({
        battleState: null,
        selectedSectorForBattle: null,
        currentScreen: 'war-room',
      });
    }
  },
}));

// ═══════════════════════════════
// مساعدات
// ═══════════════════════════════

function getTroopCount(companies: Company[], type: TroopType): number {
  return companies
    .filter(c => c.troopType === type)
    .reduce((sum, c) => sum + c.squads.reduce((s, sq) => s + sq.size, 0), 0);
}

// Hook مريح للإنتاج التلقائي
export function useProductionPerHour() {
  return useGameStore((s) => getTotalProductionPerHour(s.buildings));
}
