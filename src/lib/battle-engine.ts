// ═══════════════════════════════════════════════════════════
// محرك المعارك التكتيكي - Tactical Battle Engine
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

export type TerrainType = 'plains' | 'desert' | 'mountains' | 'urban';
export type TimeOfDay = 'day' | 'night';
export type TroopType = 'infantry' | 'armor' | 'aviation';

export interface TroopConfig {
  type: TroopType;
  nameAr: string;
  basePower: number;
  cost: number;
  // Terrain affinity multipliers
  terrainBonus: Record<TerrainType, number>;
  // Time affinity multipliers
  timeBonus: Record<TimeOfDay, number>;
  color: string;
  icon: string;
}

export interface WaveSlot {
  troopType: TroopType | null;
  count: number;
}

export const TROOP_CONFIGS: Record<TroopType, TroopConfig> = {
  infantry: {
    type: 'infantry',
    nameAr: 'مشاة',
    basePower: 25,
    cost: 10,
    terrainBonus: { plains: 1.15, desert: 0.8, mountains: 1.3, urban: 1.0 },
    timeBonus: { day: 1.0, night: 0.7 },
    color: '#4a7c3f',
    icon: '🪖',
  },
  armor: {
    type: 'armor',
    nameAr: 'مدرعات',
    basePower: 60,
    cost: 30,
    terrainBonus: { plains: 1.2, desert: 0.9, mountains: 0.6, urban: 1.1 },
    timeBonus: { day: 1.1, night: 0.85 },
    color: '#5a6b3a',
    icon: '🛡️',
  },
  aviation: {
    type: 'aviation',
    nameAr: 'طيران',
    basePower: 80,
    cost: 50,
    terrainBonus: { plains: 1.3, desert: 1.2, mountains: 0.7, urban: 0.9 },
    timeBonus: { day: 1.2, night: 0.5 },
    color: '#6a7a8a',
    icon: '✈️',
  },
};

export const TERRAIN_CONFIG: Record<TerrainType, {
  nameAr: string;
  description: string;
  defenseBonus: number;
  baseColor: string;
  variants: string[];
  icon: string;
}> = {
  plains: {
    nameAr: 'سهول مفتوحة',
    description: 'أرض منبسطة تمنح المشاة والمدرعات حرية حركة عالية',
    defenseBonus: 0.9,
    baseColor: '#4a7c3f',
    variants: ['#3d6d32', '#5a8c4f', '#4a7c3f', '#527a42', '#3f7035'],
    icon: '🌾',
  },
  desert: {
    nameAr: 'صحراء قاحلة',
    description: 'رمال مفتوحة تقلل الرؤية وتجهد القوات',
    defenseBonus: 0.75,
    baseColor: '#c4a535',
    variants: ['#b8943a', '#d4b54f', '#c4a535', '#bea040', '#ccb240'],
    icon: '🏜️',
  },
  mountains: {
    nameAr: 'جبال وعرة',
    description: 'تضاريس مرتفعة توفر مواقع دفاعية ممتازة للمشاة',
    defenseBonus: 1.3,
    baseColor: '#7a7a7a',
    variants: ['#6d6d6d', '#8b7d6b', '#7a7a7a', '#848484', '#757575'],
    icon: '⛰️',
  },
  urban: {
    nameAr: 'منطقة حضرية',
    description: 'مباني وشوارع تتيح قتال الشوارع والتمركز في المباني',
    defenseBonus: 1.1,
    baseColor: '#8b8070',
    variants: ['#a09080', '#706060', '#8b8070', '#959080', '#787068'],
    icon: '🏙️',
  },
};

export const TIME_CONFIG: Record<TimeOfDay, {
  nameAr: string;
  description: string;
  globalMultiplier: number;
  lightColor: string;
  lightIntensity: number;
  ambientIntensity: number;
  skyColor: string;
  fogColor: string;
  icon: string;
}> = {
  day: {
    nameAr: 'نهاري',
    description: 'رؤية واضحة، أفضل أداء للطيران والهجوم المباشر',
    globalMultiplier: 1.0,
    lightColor: '#fff5e0',
    lightIntensity: 1.2,
    ambientIntensity: 0.5,
    skyColor: '#87ceeb',
    fogColor: '#c8dce8',
    icon: '☀️',
  },
  night: {
    nameAr: 'ليلي',
    description: 'تقليل الرؤية، فرصة للكمائن لكن ضعف الطيران',
    globalMultiplier: 0.85,
    lightColor: '#4466aa',
    lightIntensity: 0.3,
    ambientIntensity: 0.15,
    skyColor: '#0a1628',
    fogColor: '#0a1020',
    icon: '🌙',
  },
};

// ═══════════════════════════════════════════
// خوارزمية حساب القوة الفعالة
// Effective Power Calculation Algorithm
// ═══════════════════════════════════════════

export interface PowerBreakdown {
  basePower: number;
  terrainModifier: number;
  terrainBonus: number;
  timeModifier: number;
  timeBonus: number;
  waveBonus: number;
  terrainDefenseBonus: number;
  totalPower: number;
  details: {
    infantry: { count: number; power: number };
    armor: { count: number; power: number };
    aviation: { count: number; power: number };
  };
}

/**
 * حساب القوة الفعالة الإجمالية
 * Total Effective Power Calculation
 *
 * المعادلة:
 * القوة الفعالة = القوة الأساسية × معامل التضاريس × معامل التوقيت × مكافأة الترتيب
 *
 * حيث:
 * - القوة الأساسية = مجموع (عدد القوات × قوة الفرد × معامل التضاريس النوعي × معامل التوقيت النوعي)
 * - معامل التضاريس = مكافأة الدفاع التضاريسي
 * - معامل التوقيت = المضاعف الزمني العام
 * - مكافأة الترتيب = مكافأة توزيع الموجات
 */
export function calculateEffectivePower(
  waves: WaveSlot[][],
  terrain: TerrainType,
  timeOfDay: TimeOfDay
): PowerBreakdown {
  const troopConfig = TROOP_CONFIGS;
  const terrainConf = TERRAIN_CONFIG[terrain];
  const timeConf = TIME_CONFIG[timeOfDay];

  let totalBase = 0;
  const details: PowerBreakdown['details'] = {
    infantry: { count: 0, power: 0 },
    armor: { count: 0, power: 0 },
    aviation: { count: 0, power: 0 },
  };

  // حساب القوة الأساسية لكل نوع قوات في كل موجة
  waves.forEach((wave) => {
    wave.forEach((slot) => {
      if (slot.troopType && slot.count > 0) {
        const config = troopConfig[slot.troopType];
        const terrainAffinity = config.terrainBonus[terrain];
        const timeAffinity = config.timeBonus[timeOfDay];
        const unitPower = config.basePower * slot.count * terrainAffinity * timeAffinity;
        totalBase += unitPower;

        details[slot.troopType].count += slot.count;
        details[slot.troopType].power += unitPower;
      }
    });
  });

  // حساب معاملات الموجات - توزيع متوازن يمنح مكافأة
  let waveBonus = 1.0;
  const activeWaves = waves.filter(w => w.some(s => s.troopType !== null));
  if (activeWaves.length === 3) {
    waveBonus = 1.15; // توزيع على 3 موجات - مكافأة التمركز الاستراتيجي
  } else if (activeWaves.length === 2) {
    waveBonus = 1.08; // موجة احتياطية
  }

  const terrainModifier = terrainConf.defenseBonus;
  const timeModifier = timeConf.globalMultiplier;

  const totalPower = Math.round(totalBase * terrainModifier * timeModifier * waveBonus);

  return {
    basePower: Math.round(totalBase),
    terrainModifier,
    terrainBonus: Math.round(totalBase * (terrainModifier - 1)),
    timeModifier,
    timeBonus: Math.round(totalBase * terrainModifier * (timeModifier - 1)),
    waveBonus,
    terrainDefenseBonus: terrainConf.defenseBonus,
    totalPower: Math.max(0, totalPower),
    details,
  };
}

/**
 * حساب تكلفة الترقية الأسية
 * Exponential Pricing Formula
 * التكلفة = التكلفة الأساسية × (معامل النمو)^(المستوى - 1)
 */
export function calculateUpgradeCost(baseCost: number, level: number, growthRate: number = 1.5): number {
  return Math.floor(baseCost * Math.pow(growthRate, level - 1));
}

/**
 * حساب إنتاج الموارد التلقائي
 * Idle Resource Production
 * الإنتاج = الإنتاج الأساسي × مضاعف المستوى × وقت الغياب (بالثواني)
 */
export function calculateIdleProduction(
  baseRate: number,
  level: number,
  offlineSeconds: number,
  efficiency: number = 0.8
): number {
  const rate = baseRate * level * efficiency;
  return Math.floor(rate * offlineSeconds / 3600); // تحويل إلى ساعات
}
