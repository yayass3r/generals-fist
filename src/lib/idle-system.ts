// ═══════════════════════════════════════════════════════════
// نظام الموارد التلقائي - Idle Resource System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

export type ResourceType = 'scrap' | 'fuel' | 'intel';

export interface BuildingConfig {
  id: string;
  nameAr: string;
  description: string;
  icon: string;
  baseProduction: Record<ResourceType, number>;
  upgradeCost: number;
  costGrowthRate: number;
  maxLevel: number;
  color: string;
}

export const BUILDINGS: Record<string, BuildingConfig> = {
  scrapyard: {
    id: 'scrapyard',
    nameAr: 'ساحة الخردة',
    description: 'يجمع خبراء الهندسة الخردة من أنقاض المعارك لإعادة تدويرها',
    icon: '⚙️',
    baseProduction: { scrap: 50, fuel: 0, intel: 0 },
    upgradeCost: 100,
    costGrowthRate: 1.6,
    maxLevel: 20,
    color: '#c9a227',
  },
  fuelDepot: {
    id: 'fuelDepot',
    nameAr: 'مستودع الوقود',
    description: 'محطة تكرير متحركة تنتج الوقود من مصادر محلية',
    icon: '⛽',
    baseProduction: { scrap: 0, fuel: 30, intel: 0 },
    upgradeCost: 150,
    costGrowthRate: 1.65,
    maxLevel: 20,
    color: '#e07020',
  },
  intelCenter: {
    id: 'intelCenter',
    nameAr: 'مركز الاستخبارات',
    description: 'فرق استطلاع تجمع المعلومات من المنطقة المحيطة',
    icon: '📋',
    baseProduction: { scrap: 0, fuel: 0, intel: 10 },
    upgradeCost: 200,
    costGrowthRate: 1.7,
    maxLevel: 15,
    color: '#40a0e0',
  },
  warFactory: {
    id: 'warFactory',
    nameAr: 'مصنع الأسلحة',
    description: 'خط إنتاج متقدم يصنع المعدات العسكرية ويولّد خردة إضافية',
    icon: '🏭',
    baseProduction: { scrap: 20, fuel: 10, intel: 2 },
    upgradeCost: 300,
    costGrowthRate: 1.75,
    maxLevel: 15,
    color: '#8b6914',
  },
  trainingCamp: {
    id: 'trainingCamp',
    nameAr: 'معسكر التدريب',
    description: 'مركز تدريب يرفع كفاءة القوات ويوفر معلومات استخبارية',
    icon: '🏕️',
    baseProduction: { scrap: 5, fuel: 5, intel: 8 },
    upgradeCost: 250,
    costGrowthRate: 1.6,
    maxLevel: 15,
    color: '#4a7c3f',
  },
};

export interface BuildingState {
  id: string;
  level: number;
  isActive: boolean;
}

// ═══════════════════════════════
// حساب الإنتاج التلقائي
// ═══════════════════════════════

/**
 * حساب الإنتاج لكل ساعة لمنشأة واحدة
 * Production per hour = baseProduction × level × efficiencyMultiplier
 */
export function getBuildingProductionPerHour(
  buildingId: string,
  level: number
): Record<ResourceType, number> {
  const config = BUILDINGS[buildingId];
  if (!config || level <= 0) return { scrap: 0, fuel: 0, intel: 0 };

  return {
    scrap: Math.floor(config.baseProduction.scrap * level * (1 + level * 0.1)),
    fuel: Math.floor(config.baseProduction.fuel * level * (1 + level * 0.1)),
    intel: Math.floor(config.baseProduction.intel * level * (1 + level * 0.1)),
  };
}

/**
 * حساب إجمالي الإنتاج لكل ساعة من جميع المنشآت
 */
export function getTotalProductionPerHour(
  buildings: BuildingState[]
): Record<ResourceType, number> {
  const total = { scrap: 0, fuel: 0, intel: 0 };

  for (const building of buildings) {
    if (!building.isActive || building.level <= 0) continue;
    const production = getBuildingProductionPerHour(building.id, building.level);
    total.scrap += production.scrap;
    total.fuel += production.fuel;
    total.intel += production.intel;
  }

  return total;
}

/**
 * حساب الموارد المتراكمة أثناء الغياب
 * idleProduction = productionPerHour × (offlineSeconds / 3600) × offlineEfficiency
 * offlineEfficiency = 0.8 (80% من الإنتاج العادي)
 */
export function calculateIdleAccumulation(
  buildings: BuildingState[],
  offlineSeconds: number,
  offlineEfficiency: number = 0.8
): Record<ResourceType, number> {
  const perHour = getTotalProductionPerHour(buildings);
  const hours = offlineSeconds / 3600;

  return {
    scrap: Math.floor(perHour.scrap * hours * offlineEfficiency),
    fuel: Math.floor(perHour.fuel * hours * offlineEfficiency),
    intel: Math.floor(perHour.intel * hours * offlineEfficiency),
  };
}

/**
 * تكلفة ترقية المنشأة (تسعير أسّي)
 * cost = baseCost × growthRate^(level-1)
 */
export function getUpgradeCost(buildingId: string, currentLevel: number): number {
  const config = BUILDINGS[buildingId];
  if (!config) return Infinity;
  return Math.floor(config.upgradeCost * Math.pow(config.costGrowthRate, currentLevel - 1));
}

/**
 * التحقق من إمكانية الترقية
 */
export function canUpgrade(buildingId: string, currentLevel: number, resources: Record<ResourceType, number>): boolean {
  const cost = getUpgradeCost(buildingId, currentLevel);
  return resources.scrap >= cost;
}
