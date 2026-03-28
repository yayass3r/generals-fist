// ═══════════════════════════════════════════════════════════
// مخزن غرفة العمليات - War Room Store (Zustand)
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  type TerrainType,
  type TimeOfDay,
  type TroopType,
  type WaveSlot,
  type PowerBreakdown,
  calculateEffectivePower,
} from '@/lib/battle-engine';

// ═══════════════════════════════
// واجهة حالة اللعبة
// ═══════════════════════════════

export interface TroopInventory {
  infantry: number;
  armor: number;
  aviation: number;
}

export interface WarRoomState {
  // === الخريطة والتضاريس ===
  terrain: TerrainType;
  timeOfDay: TimeOfDay;

  // === المخزون ===
  troops: TroopInventory;
  resources: {
    scrap: number;
    fuel: number;
    intel: number;
  };

  // === نشر القوات ===
  waves: WaveSlot[][];
  selectedTroopType: TroopType | null;

  // === نتائج المعركة ===
  powerBreakdown: PowerBreakdown | null;

  // === حالة المعركة ===
  isBattleStarting: boolean;
  isBattleActive: boolean;

  // === واجهة المستخدم ===
  showBreakdown: boolean;

  // === الإجراءات ===
  setTerrain: (terrain: TerrainType) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  selectTroopType: (type: TroopType | null) => void;
  assignTroopToWave: (waveIndex: number, slotIndex: number) => void;
  removeTroopFromWave: (waveIndex: number, slotIndex: number) => void;
  increaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  decreaseTroopCount: (waveIndex: number, slotIndex: number) => void;
  startBattle: () => void;
  toggleBreakdown: () => void;
  resetDeployment: () => void;
}

// ═══════════════════════════════
// القيم الافتراضية
// ═══════════════════════════════

const emptyWaves: WaveSlot[][] = [
  [
    { troopType: null, count: 0 },
    { troopType: null, count: 0 },
  ],
  [
    { troopType: null, count: 0 },
    { troopType: null, count: 0 },
  ],
  [
    { troopType: null, count: 0 },
    { troopType: null, count: 0 },
  ],
];

const defaultTroops: TroopInventory = {
  infantry: 20,
  armor: 8,
  aviation: 4,
};

const defaultResources = {
  scrap: 500,
  fuel: 300,
  intel: 100,
};

// ═══════════════════════════════
// إنشاء المخزن
// ═══════════════════════════════

export const useWarRoomStore = create<WarRoomState>((set, get) => {
  const initialState = {
    terrain: 'plains' as TerrainType,
    timeOfDay: 'day' as TimeOfDay,
    troops: defaultTroops,
    resources: defaultResources,
    waves: emptyWaves,
    selectedTroopType: null as TroopType | null,
    powerBreakdown: null as PowerBreakdown | null,
    isBattleStarting: false,
    isBattleActive: false,
    showBreakdown: false,
  };

  // حساب القوة الأولي
  initialState.powerBreakdown = calculateEffectivePower(
    initialState.waves,
    initialState.terrain,
    initialState.timeOfDay
  );

  return {
    ...initialState,

    setTerrain: (terrain) => {
      const state = get();
      const powerBreakdown = calculateEffectivePower(state.waves, terrain, state.timeOfDay);
      set({ terrain, powerBreakdown });
    },

    setTimeOfDay: (timeOfDay) => {
      const state = get();
      const powerBreakdown = calculateEffectivePower(state.waves, state.terrain, timeOfDay);
      set({ timeOfDay, powerBreakdown });
    },

    selectTroopType: (type) => {
      set({ selectedTroopType: type });
    },

    assignTroopToWave: (waveIndex, slotIndex) => {
      const state = get();
      if (!state.selectedTroopType) return;

      const troopType = state.selectedTroopType;
      const currentSlot = state.waves[waveIndex][slotIndex];

      // إذا كان المربع ممتلئاً بنفس نوع القوات، زِد العدد
      if (currentSlot.troopType === troopType) {
        const newCount = currentSlot.count + 5;
        if (newCount <= state.troops[troopType]) {
          const newWaves = state.waves.map((wave, wi) =>
            wave.map((slot, si) =>
              wi === waveIndex && si === slotIndex
                ? { ...slot, count: newCount }
                : slot
            )
          );
          const powerBreakdown = calculateEffectivePower(
            newWaves,
            state.terrain,
            state.timeOfDay
          );
          set({ waves: newWaves, powerBreakdown });
        }
        return;
      }

      // إذا كان المربع فارغاً، ضع 5 جنود كحد أدنى
      if (currentSlot.troopType === null && state.troops[troopType] >= 5) {
        const newWaves = state.waves.map((wave, wi) =>
          wave.map((slot, si) =>
            wi === waveIndex && si === slotIndex
              ? { troopType, count: 5 }
              : slot
          )
        );
        const powerBreakdown = calculateEffectivePower(
          newWaves,
          state.terrain,
          state.timeOfDay
        );
        set({ waves: newWaves, powerBreakdown });
      }
    },

    removeTroopFromWave: (waveIndex, slotIndex) => {
      const state = get();
      const newWaves = state.waves.map((wave, wi) =>
        wave.map((slot, si) =>
          wi === waveIndex && si === slotIndex
            ? { troopType: null, count: 0 }
            : slot
        )
      );
      const powerBreakdown = calculateEffectivePower(
        newWaves,
        state.terrain,
        state.timeOfDay
      );
      set({ waves: newWaves, powerBreakdown });
    },

    increaseTroopCount: (waveIndex, slotIndex) => {
      const state = get();
      const slot = state.waves[waveIndex][slotIndex];
      if (!slot.troopType) return;

      const newCount = Math.min(slot.count + 5, state.troops[slot.troopType]);
      const newWaves = state.waves.map((wave, wi) =>
        wave.map((s, si) =>
          wi === waveIndex && si === slotIndex
            ? { ...s, count: newCount }
            : s
        )
      );
      const powerBreakdown = calculateEffectivePower(
        newWaves,
        state.terrain,
        state.timeOfDay
      );
      set({ waves: newWaves, powerBreakdown });
    },

    decreaseTroopCount: (waveIndex, slotIndex) => {
      const state = get();
      const slot = state.waves[waveIndex][slotIndex];
      if (!slot.troopType || slot.count <= 5) return;

      const newCount = slot.count - 5;
      const newWaves = state.waves.map((wave, wi) =>
        wave.map((s, si) =>
          wi === waveIndex && si === slotIndex
            ? { ...s, count: newCount }
            : s
        )
      );
      const powerBreakdown = calculateEffectivePower(
        newWaves,
        state.terrain,
        state.timeOfDay
      );
      set({ waves: newWaves, powerBreakdown });
    },

    startBattle: () => {
      set({ isBattleStarting: true });
      setTimeout(() => {
        set({ isBattleStarting: false, isBattleActive: true });
        setTimeout(() => {
          set({ isBattleActive: false });
        }, 5000);
      }, 1500);
    },

    toggleBreakdown: () => {
      set((s) => ({ showBreakdown: !s.showBreakdown }));
    },

    resetDeployment: () => {
      const state = get();
      const powerBreakdown = calculateEffectivePower(
        emptyWaves,
        state.terrain,
        state.timeOfDay
      );
      set({ waves: emptyWaves, powerBreakdown, selectedTroopType: null });
    },
  };
});
