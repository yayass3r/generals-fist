// ═══════════════════════════════════════════════════════════
// نظام الروح المعنوية - Morale System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

export type MoraleLevel = 'rout' | 'demoralized' | 'shaken' | 'steady' | 'high';

export interface MoraleState {
  value: number; // 0-100
  level: MoraleLevel;
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
}

export const MORALE_CONFIG: Record<MoraleLevel, {
  range: [number, number];
  nameAr: string;
  icon: string;
  color: string;
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  description: string;
}> = {
  rout: {
    range: [0, 20],
    nameAr: 'هروب',
    icon: '🏃',
    color: '#ef4444',
    attackMod: 0.1,
    defenseMod: 0.2,
    speedMod: 1.8, // يهربون بسرعة!
    description: 'القوات تفرّ وتهرب من ساحة المعركة',
  },
  demoralized: {
    range: [20, 40],
    nameAr: 'محبط',
    icon: '😞',
    color: '#f97316',
    attackMod: 0.5,
    defenseMod: 0.6,
    speedMod: 0.5,
    description: 'معنويات منخفضة جداً، أداء ضعيف',
  },
  shaken: {
    range: [40, 60],
    nameAr: 'متذبذب',
    icon: '😰',
    color: '#fbbf24',
    attackMod: 0.75,
    defenseMod: 0.8,
    speedMod: 0.85,
    description: 'القوات قلقة لكنها ما زالت تقاتل',
  },
  steady: {
    range: [60, 80],
    nameAr: 'ثابت',
    icon: '💪',
    color: '#22c55e',
    attackMod: 1.0,
    defenseMod: 1.0,
    speedMod: 1.0,
    description: 'أداء طبيعي ومعنويات مستقرة',
  },
  high: {
    range: [80, 100],
    nameAr: 'عالي',
    icon: '🔥',
    color: '#3b82f6',
    attackMod: 1.2,
    defenseMod: 1.1,
    speedMod: 1.1,
    description: 'معنويات عالية، قوات تقاتل بشراسة',
  },
};

// ═══════════════════════════════
// عوامل الروح المعنوية
// ═══════════════════════════════

export interface MoraleFactors {
  previousVictory: boolean;       // +15
  nearbyCommanderBonus: number;   // +10 لكل قائد في نطاق 2
  suppliesAvailable: boolean;     // +10
  numericalAdvantage: number;     // +20 إذا 2:1
  restHours: number;              // +10 إذا > 6 ساعات
  casualties: number;             // -20 إذا > 30%
  surroundedFromSides: number;    // -25 إذا محاصَر من 3 جهات
  supplyCutHours: number;         // -30 إذا > 3 ساعات بدون إمداد
  nightAttackNoGear: boolean;     // -15
  numericalDisadvantage: boolean; // -15 إذا < 50%
  hasReinforcements: boolean;     // +5
  enemyRetreating: boolean;       // +10
}

/**
 * حساب الروح المعنوية الأولية
 */
export function calculateMorale(factors: MoraleFactors): MoraleState {
  let morale = 50; // خط الأساس

  // العوامل الإيجابية
  if (factors.previousVictory) morale += 15;
  morale += Math.min(factors.nearbyCommanderBonus, 20); // أقصى 20 من القادة
  if (factors.suppliesAvailable) morale += 10;
  if (factors.numericalAdvantage >= 2.0) morale += 20;
  else if (factors.numericalAdvantage >= 1.5) morale += 10;
  if (factors.restHours >= 6) morale += 10;
  if (factors.hasReinforcements) morale += 5;
  if (factors.enemyRetreating) morale += 10;

  // العوامل السلبية
  if (factors.casualties > 50) morale -= 30;
  else if (factors.casualties > 30) morale -= 20;
  else if (factors.casualties > 15) morale -= 10;
  if (factors.surroundedFromSides >= 3) morale -= 25;
  else if (factors.surroundedFromSides >= 2) morale -= 15;
  if (factors.supplyCutHours > 3) morale -= 30;
  else if (factors.supplyCutHours > 1) morale -= 15;
  if (factors.nightAttackNoGear) morale -= 15;
  if (factors.numericalDisadvantage) morale -= 15;

  // تقييد بين 0 و 100
  morale = Math.max(0, Math.min(100, morale));

  return getMoraleState(morale);
}

/**
 * تحديث الروح المعنوية أثناء المعركة (كل ثانية)
 */
export function updateMoraleInBattle(
  currentMorale: number,
  recentEvents: {
    allyKilled: boolean;
    enemyKilled: boolean;
    tacticActivated: boolean;
    flanked: boolean;
    supplyLow: boolean;
  }
): MoraleState {
  let delta = 0;

  // أحداث إيجابية
  if (recentEvents.enemyKilled) delta += 2;
  if (recentEvents.tacticActivated) delta += 5;

  // أحداث سلبية
  if (recentEvents.allyKilled) delta -= 3;
  if (recentEvents.flanked) delta -= 8;
  if (recentEvents.supplyLow) delta -= 1; // تأثير تراكمي

  // تجنب الارتفاع السريع جداً
  if (delta > 0) delta *= 0.7;

  const newMorale = Math.max(0, Math.min(100, currentMorale + delta));
  return getMoraleState(newMorale);
}

/**
 * تحويل القيمة الرقمية إلى حالة معنوية
 */
export function getMoraleState(value: number): MoraleState {
  const clamped = Math.max(0, Math.min(100, value));
  let level: MoraleLevel;

  if (clamped < 20) level = 'rout';
  else if (clamped < 40) level = 'demoralized';
  else if (clamped < 60) level = 'shaken';
  else if (clamped < 80) level = 'steady';
  else level = 'high';

  const config = MORALE_CONFIG[level];

  return {
    value: clamped,
    level,
    attackModifier: config.attackMod,
    defenseModifier: config.defenseMod,
    speedModifier: config.speedMod,
  };
}

/**
 * التأثير التراكمي لانقطاع الإمداد على الروح
 */
export function getSupplyCutMoralePenalty(hoursCut: number): number {
  if (hoursCut <= 0) return 0;
  return Math.min(40, Math.floor(hoursCut * 8));
}
