// ═══════════════════════════════════════════════════════════
// نظام الذخيرة والوقود والإمدادات - Supply & Logistics System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';

// ═══════════════════════════════
// أنواع الإمدادات
// ═══════════════════════════════

export type SupplyType = 'food' | 'ammo' | 'fuel' | 'medical' | 'parts';

export interface SupplyConfig {
  id: SupplyType;
  nameAr: string;
  icon: string;
  color: string;
  description: string;
  // كم يستهلك كل وحدة في الساعة
  consumptionPerHour: Record<TroopType, number>;
}

export const SUPPLY_CONFIG: Record<SupplyType, SupplyConfig> = {
  food: {
    id: 'food',
    nameAr: 'مؤن غذائية',
    icon: '🍞',
    color: '#c9a227',
    description: 'طعام ومياه للقوات — الروح المعنوية تنخفض بدونها',
    consumptionPerHour: { infantry: 2, armor: 1, aviation: 1 },
  },
  ammo: {
    id: 'ammo',
    nameAr: 'ذخيرة',
    icon: '🔫',
    color: '#ef4444',
    description: 'رصاصة وقذائف — بدونها لا تستطيع القوات الهجوم',
    consumptionPerHour: { infantry: 3, armor: 5, aviation: 8 },
  },
  fuel: {
    id: 'fuel',
    nameAr: 'وقود',
    icon: '⛽',
    color: '#e07020',
    description: 'بنزين وديزل — المدرعات والطيران تتوقف بدونه',
    consumptionPerHour: { infantry: 0.5, armor: 8, aviation: 12 },
  },
  medical: {
    id: 'medical',
    nameAr: 'طبي',
    icon: '🩹',
    color: '#22c55e',
    description: 'مستلزمات طبية — المصابون يموتون بدونها',
    consumptionPerHour: { infantry: 1, armor: 0.5, aviation: 0.5 },
  },
  parts: {
    id: 'parts',
    nameAr: 'قطع غيار',
    icon: '🔧',
    color: '#8b8070',
    description: 'قطع تبديل — المدرعات تعطل بدونها',
    consumptionPerHour: { infantry: 0.2, armor: 2, aviation: 3 },
  },
};

// ═══════════════════════════════
// حالة الإمدادات لكل وحدة
// ═══════════════════════════════

export interface UnitSupply {
  food: number;     // 0-100 نسبة ممتلئ
  ammo: number;     // 0-100
  fuel: number;     // 0-100
  medical: number;  // 0-100
  parts: number;    // 0-100
}

export function createDefaultSupply(): UnitSupply {
  return { food: 100, ammo: 100, fuel: 100, medical: 100, parts: 100 };
}

/**
 * استهلاك الإمدادات أثناء القتال (أسرع 3 مرات من الطبيعي)
 */
export function consumeSupplyInBattle(supply: UnitSupply, type: TroopType, deltaSeconds: number): UnitSupply {
  const rate = deltaSeconds / 3600 * 3; // 3x أثناء القتال
  const newSupply = { ...supply };

  for (const supplyType of ['food', 'ammo', 'fuel', 'medical', 'parts'] as SupplyType[]) {
    const consumption = SUPPLY_CONFIG[supplyType].consumptionPerHour[type] * rate;
    newSupply[supplyType] = Math.max(0, newSupply[supplyType] - consumption);
  }

  return newSupply;
}

/**
 * استهلاك الإمدادات أثناء الراحة (معدل طبيعي)
 */
export function consumeSupplyIdle(supply: UnitSupply, type: TroopType, deltaSeconds: number): UnitSupply {
  const rate = deltaSeconds / 3600;
  const newSupply = { ...supply };

  for (const supplyType of ['food', 'ammo', 'fuel', 'medical', 'parts'] as SupplyType[]) {
    const consumption = SUPPLY_CONFIG[supplyType].consumptionPerHour[type] * rate * 0.3; // 30% من المعدل
    newSupply[supplyType] = Math.max(0, newSupply[supplyType] - consumption);
  }

  return newSupply;
}

// ═══════════════════════════════
// معاملات نفاد الإمدادات
// ═══════════════════════════════

export interface SupplyPenalty {
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
  canAttack: boolean;
  canMove: boolean;
  description: string;
}

export function getSupplyPenalty(supply: UnitSupply, type: TroopType): SupplyPenalty {
  const ammoLow = supply.ammo < 30;
  const ammoEmpty = supply.ammo <= 0;
  const fuelLow = supply.fuel < 25;
  const fuelEmpty = supply.fuel <= 0;
  const foodLow = supply.food < 20;

  let attackMod = 1.0;
  let defenseMod = 1.0;
  let speedMod = 1.0;
  let canAttack = true;
  let canMove = true;
  const descriptions: string[] = [];

  // ذخيرة
  if (ammoEmpty) {
    attackMod = 0.1; // قتال بالسكاكين فقط
    canAttack = false;
    descriptions.push('🔴 لا ذخيرة!');
  } else if (ammoLow) {
    attackMod = 0.4; // تقنين الذخيرة
    descriptions.push('🟡 ذخيرة منخفضة');
  }

  // وقود
  if (fuelEmpty) {
    speedMod = 0.05;
    canMove = type !== 'infantry'; // المشاة تمشي
    descriptions.push('🔴 لا وقود!');
  } else if (fuelLow) {
    speedMod = 0.4;
    descriptions.push('🟡 وقود منخفض');
  }

  // طعام
  if (foodLow) {
    defenseMod *= 0.8;
    descriptions.push('🟡 جوع - معنويات متأثرة');
  }

  return {
    attackModifier: attackMod,
    defenseModifier: defenseMod,
    speedModifier: speedMod,
    canAttack,
    canMove,
    description: descriptions.length > 0 ? descriptions.join(' | ') : '✅ إمدادات كاملة',
  };
}

// ═══════════════════════════════
// خطوط الإمداد (Supply Lines)
// ═══════════════════════════════

export interface SupplyLine {
  sectors: string[]; // قائمة القطاعات من المقر إلى الجبهة
  isIntact: boolean;
  cutHours: number; // كم ساعة وهي مقطوعة
  efficiency: number; // 0-100
}

/**
 * حساب كفاءة خط الإمداد
 * depends on:
 * - عدد القطاعات المحررة في الخط
 * - نوع الطرق بين القطاعات
 * - المسافة من المقر
 */
export function calculateSupplyLineEfficiency(
  totalSectors: number,
  clearedSectors: number,
  distance: number
): number {
  const integrityRatio = clearedSectors / totalSectors;
  const distancePenalty = Math.max(0.2, 1.0 - distance * 0.05);
  return Math.floor(Math.min(100, integrityRatio * distancePenalty * 100));
}

/**
 * معاقبة انقطاع الإمداد
 */
export function getSupplyCutPenalty(hoursCut: number): {
  ammoDrain: number; // نسبة استنزاف إضافي لكل ساعة
  fuelDrain: number;
  moralePenalty: number;
} {
  if (hoursCut <= 0) return { ammoDrain: 0, fuelDrain: 0, moralePenalty: 0 };

  return {
    ammoDrain: Math.min(30, hoursCut * 5), // 5% إضافي لكل ساعة
    fuelDrain: Math.min(20, hoursCut * 3),
    moralePenalty: Math.min(40, hoursCut * 8),
  };
}

// ═══════════════════════════════
// وحدة الإمداد (Supply Truck)
// ═══════════════════════════════

export interface SupplyTruck {
  id: string;
  capacity: Record<SupplyType, number>;
  remaining: Record<SupplyType, number>;
  range: number; // عدد القطاعات التي يمكنها الوصول إليها
  speed: number; // سرعة التنقل
}

export function createSupplyTruck(id: string): SupplyTruck {
  return {
    id,
    capacity: { food: 200, ammo: 300, fuel: 500, medical: 100, parts: 150 },
    remaining: { food: 200, ammo: 300, fuel: 500, medical: 100, parts: 150 },
    range: 3,
    speed: 0.4,
  };
}

/**
 * إعادة تموين وحدة من شاحنة الإمداد
 */
export function resupplyUnit(
  truck: SupplyTruck,
  unitSupply: UnitSupply,
  type: TroopType
): { truck: SupplyTruck; unitSupply: UnitSupply; resupplied: boolean } {
  const newTruck = { ...truck, remaining: { ...truck.remaining } };
  const newSupply = { ...unitSupply };
  let resupplied = false;

  for (const supplyType of ['food', 'ammo', 'fuel', 'medical', 'parts'] as SupplyType[]) {
    const needed = 100 - newSupply[supplyType];
    if (needed <= 0) continue;

    const available = newTruck.remaining[supplyType];
    const transfer = Math.min(needed, available);

    if (transfer > 0) {
      newSupply[supplyType] += transfer;
      newTruck.remaining[supplyType] -= transfer;
      resupplied = true;
    }
  }

  return { truck: newTruck, unitSupply: newSupply, resupplied };
}
