// ═══════════════════════════════════════════════════════════
// مخزن اللعبة المركزي v2 - Main Game Store (مع الأنظمة الواقعية)
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { ResourceType } from '@/lib/idle-system';
import { getBuildingProductionPerHour, getTotalProductionPerHour, getUpgradeCost } from '@/lib/idle-system';
import type { BuildingState } from '@/lib/idle-system';
import type { TerrainType, TroopType, WaveSlot } from '@/lib/battle-engine';
import { calculateEffectivePower, TROOP_CONFIGS } from '@/lib/battle-engine';
import type { WorldSector } from '@/lib/world-map';
import { generateWorldMap, scoutSector as scoutSectorLogic } from '@/lib/world-map';
import type { BattleState, ActiveTacticState } from '@/lib/battle-simulation';
import { createPlayerUnits, createEnemyUnits, battleTick } from '@/lib/battle-simulation';
import { ACTIVE_TACTICS } from '@/lib/battle-simulation';
import type { Company, Commander } from '@/lib/chain-of-command';
import { calculateCompanyBuffs, createEmptyCompany, createEmptySquad, COMPANY_MAX_SIZE, SQUAD_MAX_SIZE } from '@/lib/chain-of-command';
// الأنظمة الواقعية الجديدة
import { calculateMorale, getMoraleState, type MoraleState } from '@/lib/morale-system';
import { getWeatherModifiers, WEATHER_CONFIG, type WeatherType, tickWeather } from '@/lib/weather-system';
import { getTimePeriod } from '@/lib/weather-system';
import { updateFatigue, getFatigueState, type FatigueState } from '@/lib/weather-system';
import { consumeSupplyInBattle, getSupplyPenalty, type UnitSupply, createDefaultSupply } from '@/lib/supply-system';
import { calculateEffectivenessDamage, getUnitCondition } from '@/lib/effectiveness-table';
import { canResearch, TECH_TREE, calculateTechBonuses, type ResearchState } from '@/lib/tech-tree';

// ═══════════════════════════════
// الشاشات
// ═══════════════════════════════

export type GameScreen = 'war-room' | 'world-map' | 'barracks' | 'battle';

// ═══════════════════════════════
// واجهة الحالة الموسعة
// ═══════════════════════════════

export interface GameState {
  currentScreen: GameScreen;

  // === الموارد ===
  resources: Record<ResourceType, number>;

  // === المنشآت ===
  buildings: BuildingState[];

  // === غرفة العمليات ===
  terrain: TerrainType;
  timeOfDay: 'day' | 'night'; // مبسط للواجهة
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
  battleTimeOfDay: 'day' | 'night';
  selectedSectorForBattle: WorldSector | null;

  // === الأنظمة الواقعية الجديدة ===
  // الطقس
  currentWeather: WeatherType;
  weatherElapsed: number;
  weatherDuration: number;
  gameTimeHour: number; // 0-23 ساعة

  // الروح المعنوية
  playerMorale: number; // 0-100
  enemyMorale: number;

  // التعب
  playerFatigue: number; // 0-100

  // الإمدادات
  playerSupplyStatus: Record<string, UnitSupply>; // لكل وحدة

  // البحث والتطوير
  research: ResearchState;

  // سجل المعركة
  battleLog: { time: number; message: string; type: string }[];

  // === Idle ===
  lastOnlineTime: number;
  idleAccumulated: Record<ResourceType, number>;
  isCollectingIdle: boolean;

  // === الإجراءات ===
  setScreen: (screen: GameScreen) => void;
  addResource: (type: ResourceType, amount: number) => void;
  spendResource: (type: ResourceType, amount: number) => boolean;
  upgradeBuilding: (buildingId: string) => void;
  collectIdleResources: () => void;
  setTerrain: (terrain: TerrainType) => void;
  setTimeOfDay: (time: 'day' | 'night') => void;
  selectTroopType: (type: TroopType | null) => void;
  assignTroopToWave: (waveIndex: number, slotIndex: number) => void;
  removeTroopFromWave: (waveIndex: number, slotIndex: number) => void;
  increaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  decreaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  resetDeployment: () => void;
  selectWorldSector: (sector: WorldSector | null) => void;
  scoutWorldSector: (sectorId: string) => boolean;
  attackSector: (sectorId: string) => void;
  selectCompany: (company: Company | null) => void;
  addSquadToCompany: (companyId: string) => void;
  recruitToSquad: (companyId: string, squadId: string, count: number) => void;
  assignCommander: (companyId: string, squadId: string, commander: Commander) => void;
  removeCommander: (companyId: string, squadId: string) => void;
  activateTactic: (tacticType: string) => void;
  updateBattle: (deltaTime: number) => void;
  endBattle: () => void;

  // === إجراءات واقعية جديدة ===
  changeWeather: (weather: WeatherType) => void;
  advanceTime: (hours: number) => void;
  startResearch: (techId: string) => void;
  updateResearch: (deltaSeconds: number) => void;
  updateWeatherTick: () => void;
}

// ═════════════════════════════
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
  // أنظمة واقعية
  currentWeather: 'clear',
  weatherElapsed: 0,
  weatherDuration: 240,
  gameTimeHour: 10,
  playerMorale: 70,
  enemyMorale: 60,
  playerFatigue: 10,
  playerSupplyStatus: {},
  research: { completedTechs: [], inProgress: null, progressPercent: 0, startTime: 0 },
  battleLog: [],

  setScreen: (screen) => set({ currentScreen: screen }),

  addResource: (type, amount) =>
    set((s) => ({ resources: { ...s.resources, [type]: s.resources[type] + amount } })),

  spendResource: (type, amount) => {
    const state = get();
    if (state.resources[type] < amount) return false;
    set((s) => ({ resources: { ...s.resources, [type]: s.resources[type] - amount } }));
    return true;
  },

  upgradeBuilding: (buildingId) => {
    const state = get();
    const building = state.buildings.find(b => b.id === buildingId);
    if (!building) return;
    const cost = getUpgradeCost(buildingId, building.level);
    if (state.resources.scrap < cost) return;
    set({
      resources: { ...state.resources, scrap: state.resources.scrap - cost },
      buildings: state.buildings.map(b => b.id === buildingId ? { ...b, level: b.level + 1 } : b),
    });
  },

  collectIdleResources: () => {
    const state = get();
    const acc = state.idleAccumulated;
    if (acc.scrap === 0 && acc.fuel === 0 && acc.intel === 0) return;
    set((s) => ({
      resources: { scrap: s.resources.scrap + s.idleAccumulated.scrap, fuel: s.resources.fuel + s.idleAccumulated.fuel, intel: s.resources.intel + s.idleAccumulated.intel },
      idleAccumulated: { scrap: 0, fuel: 0, intel: 0 },
      lastOnlineTime: Date.now(),
      isCollectingIdle: false,
    }));
  },

  setTerrain: (terrain) => {
    const state = get();
    set({ terrain, powerBreakdown: calculateEffectivePower(state.waves, terrain, state.timeOfDay) });
  },

  setTimeOfDay: (timeOfDay) => {
    const state = get();
    set({ timeOfDay, powerBreakdown: calculateEffectivePower(state.waves, state.terrain, timeOfDay) });
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
        const newWaves = state.waves.map((w, wi) => w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: newCount } : s)));
        set({ waves: newWaves, powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay) });
      }
    } else if (currentSlot.troopType === null && available >= 5) {
      const newWaves = state.waves.map((w, wi) => w.map((s, si) => (wi === waveIndex && si === slotIndex ? { troopType, count: 5 } : s)));
      set({ waves: newWaves, powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay) });
    }
  },

  removeTroopFromWave: (waveIndex, slotIndex) => {
    const state = get();
    const newWaves = state.waves.map((w, wi) => w.map((s, si) => (wi === waveIndex && si === slotIndex ? { troopType: null, count: 0 } : s)));
    set({ waves: newWaves, powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay) });
  },

  increaseTroopCount: (waveIndex, slotIndex) => {
    const state = get();
    const slot = state.waves[waveIndex][slotIndex];
    if (!slot.troopType) return;
    const available = getTroopCount(state.companies, slot.troopType);
    const newCount = Math.min(slot.count + 5, available);
    if (newCount <= slot.count) return;
    const newWaves = state.waves.map((w, wi) => w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: newCount } : s)));
    set({ waves: newWaves, powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay) });
  },

  decreaseTroopCount: (waveIndex, slotIndex) => {
    const state = get();
    const slot = state.waves[waveIndex][slotIndex];
    if (!slot.troopType || slot.count <= 5) return;
    const newWaves = state.waves.map((w, wi) => w.map((s, si) => (wi === waveIndex && si === slotIndex ? { ...s, count: slot.count - 5 } : s)));
    set({ waves: newWaves, powerBreakdown: calculateEffectivePower(newWaves, state.terrain, state.timeOfDay) });
  },

  resetDeployment: () => {
    const state = get();
    set({ waves: emptyWaves, powerBreakdown: calculateEffectivePower(emptyWaves, state.terrain, state.timeOfDay), selectedTroopType: null });
  },

  selectWorldSector: (sector) => set({ selectedSector: sector }),

  scoutWorldSector: (sectorId) => {
    const state = get();
    const result = scoutSectorLogic(state.worldSectors, sectorId, state.resources.intel, 15);
    if (!result || !result.success) return false;
    set({ resources: { ...state.resources, intel: result.newIntel }, worldSectors: result.updatedSectors });
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
    const techBonuses = calculateTechBonuses(state.research.completedTechs);

    const battleState: BattleState = {
      status: 'active',
      elapsedTime: 0,
      playerUnits: playerUnits.map(u => ({
        ...u,
        attackPower: Math.floor(u.attackPower * (1 + (buffs?.attack ?? 0) / 100) * (1 + (techBonuses.attack[u.type] || 0) / 100)),
        defense: Math.floor(u.defense * (1 + (buffs?.defense ?? 0) / 100) * (1 + techBonuses.defense / 100)),
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
      battleLog: [{ time: 0, message: `⚔️ بدء الهجوم على ${sector.nameAr}`, type: 'start' }],
    });
  },

  selectCompany: (company) => set({ selectedCompany: company }),

  addSquadToCompany: (companyId) => {
    const state = get();
    const company = state.companies.find(c => c.id === companyId);
    if (!company || company.squads.length >= 10) return;
    const totalTroops = company.squads.reduce((s, sq) => s + sq.size, 0);
    if (totalTroops >= COMPANY_MAX_SIZE) return;
    set({
      companies: state.companies.map(c =>
        c.id === companyId ? { ...c, squads: [...c.squads, createEmptySquad(c.troopType, c.squads.length)] } : c
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
        c.id === companyId ? { ...c, squads: c.squads.map(sq => sq.id === squadId ? { ...sq, size: sq.size + available } : sq) } : c
      ),
    });
  },

  assignCommander: (companyId, squadId, commander) => {
    const state = get();
    if (state.resources.scrap < commander.cost) return;
    set({
      resources: { ...state.resources, scrap: state.resources.scrap - commander.cost },
      companies: state.companies.map(c =>
        c.id === companyId ? { ...c, squads: c.squads.map(sq => sq.id === squadId ? { ...sq, commander } : sq) } : c
      ),
    });
  },

  removeCommander: (companyId, squadId) => {
    set((s) => ({
      companies: s.companies.map(c =>
        c.id === companyId ? { ...c, squads: c.squads.map(sq => sq.id === squadId ? { ...sq, commander: null } : sq) } : c
      ),
    }));
  },

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
          t.tactic === tacticType ? { ...t, isActive: true, remainingDuration: tactic.duration } : t
        ),
      },
      battleLog: [...state.battleLog, { time: state.battleState.elapsedTime, message: `🎯 تفعيل: ${tactic.nameAr}`, type: 'tactic' }],
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
        resources: { scrap: state.resources.scrap + loot.scrap, fuel: state.resources.fuel + loot.fuel, intel: state.resources.intel + loot.intel },
        worldSectors: state.worldSectors.map(s => s.id === state.selectedSectorForBattle!.id ? { ...s, status: 'cleared' as const } : s),
        battleState: null,
        selectedSectorForBattle: null,
        currentScreen: 'world-map',
        playerMorale: Math.min(100, state.playerMorale + 15), // النصر يرفع الروح
        playerFatigue: Math.min(100, state.playerFatigue + 20), // لكن التعبد
      });
    } else {
      set({
        battleState: null,
        selectedSectorForBattle: null,
        currentScreen: 'war-room',
        playerMorale: Math.max(0, state.playerMorale - 10), // الهزيمة تخفض الروح
      });
    }
  },

  // === إجراءات واقعية جديدة ===
  changeWeather: (weather) => {
    const config = WEATHER_CONFIG[weather];
    set({
      currentWeather: weather,
      weatherElapsed: 0,
      weatherDuration: config.minDuration + Math.floor(Math.random() * (config.maxDuration - config.minDuration)),
    });
  },

  advanceTime: (hours) => {
    set((s) => ({
      gameTimeHour: (s.gameTimeHour + hours) % 24,
    }));
  },

  startResearch: (techId) => {
    const state = get();
    if (state.research.inProgress) return;
    const tech = TECH_TREE.find(t => t.id === techId);
    if (!tech) return;
    if (!canResearch(techId, state.research.completedTechs, state.research.inProgress, state.resources)) return;

    set({
      resources: {
        scrap: state.resources.scrap - tech.cost.scrap,
        intel: state.resources.intel - tech.cost.intel,
      },
      research: {
        ...state.research,
        inProgress: techId,
        progressPercent: 0,
        startTime: Date.now(),
      },
    });
  },

  updateResearch: (deltaSeconds) => {
    const state = get();
    if (!state.research.inProgress) return;

    const tech = TECH_TREE.find(t => t.id === state.research.inProgress);
    if (!tech) return;

    const progress = (deltaSeconds / tech.researchTime) * 100;
    const newPercent = state.research.progressPercent + progress;

    if (newPercent >= 100) {
      set({
        research: {
          completedTechs: [...state.research.completedTechs, tech.id],
          inProgress: null,
          progressPercent: 0,
          startTime: 0,
        },
      });
    } else {
      set({
        research: { ...state.research, progressPercent: newPercent },
      });
    }
  },

  updateWeatherTick: () => {
    const state = get();
    const newWeather = tickWeather({
      current: state.currentWeather,
      elapsedMinutes: state.weatherElapsed,
      durationMinutes: state.weatherDuration,
    });

    if (newWeather.current !== state.currentWeather) {
      set({
        currentWeather: newWeather.current,
        weatherElapsed: newWeather.elapsedMinutes,
        weatherDuration: newWeather.durationMinutes,
      });
    } else {
      set({ weatherElapsed: newWeather.elapsedMinutes });
    }
  },
}));

function getTroopCount(companies: Company[], type: TroopType): number {
  return companies.filter(c => c.troopType === type).reduce((sum, c) => sum + c.squads.reduce((s, sq) => s + sq.size, 0), 0);
}

export function useProductionPerHour() {
  return useGameStore((s) => getTotalProductionPerHour(s.buildings));
}

export function useWeatherState() {
  return useGameStore((s) => ({
    weather: s.currentWeather,
    config: WEATHER_CONFIG[s.currentWeather],
    gameTime: s.gameTimeHour,
    timePeriod: getTimePeriod(s.gameTimeHour),
  }));
}

export function useMoraleState() {
  return useGameStore((s) => getMoraleState(s.playerMorale));
}

export function useFatigueState() {
  return useGameStore((s) => getFatigueState(s.playerFatigue));
}

export function useTechBonuses() {
  return useGameStore((s) => calculateTechBonuses(s.research.completedTechs));
}
