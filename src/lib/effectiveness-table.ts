// ═══════════════════════════════════════════════════════════
// نظام الفعالية والإصابات - Effectiveness Table & Injury System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';

// ═══════════════════════════════
// جدول الفعالية (Rock-Paper-Scissors متعدد الطبقات)
// ═══════════════════════════════

export type AdvancedTroopType = TroopType | 'artillery' | 'anti_air' | 'recon' | 'medic';

/**
 * جدول الفعالية: attacker vs defender
 * القيم تمثل معامل الضرر
 * >1.0 = فعال جداً | =1.0 = محايد | <1.0 = غير فعال
 */
export const EFFECTIVENESS_TABLE: Record<TroopType, Record<TroopType, number>> = {
  infantry: {
    infantry: 1.0,
    armor: 0.3,    // RPG يمكن يوقف دبابة لكن ليس دائماً
    aviation: 0.2, // جندي ضد طائرة = شبه مستحيل
  },
  armor: {
    infantry: 2.0,    // دبابة تحصد المشاة
    armor: 1.0,
    aviation: 0.5,    // رشاش مضاد طائرات محدود
  },
  aviation: {
    infantry: 2.5,   // قصف جوي مدمر
    armor: 1.8,      // صواريخ جو-أرض
    aviation: 1.0,
  },
};

/**
 * حساب الضرر الفعلي مع الفعالية
 * damage = baseDamage × effectiveness[attacker][defender] × otherModifiers
 */
export function calculateEffectivenessDamage(
  baseDamage: number,
  attackerType: TroopType,
  defenderType: TroopType
): number {
  const effectiveness = EFFECTIVENESS_TABLE[attackerType][defenderType];
  return Math.floor(baseDamage * effectiveness);
}

// ═══════════════════════════════
// نظام الإصابات (4 حالات)
// ═══════════════════════════════

export type UnitCondition = 'healthy' | 'wounded' | 'critical' | 'dead';

export interface ConditionConfig {
  nameAr: string;
  icon: string;
  color: string;
  hpRange: [number, number]; // نسبة HP
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
  description: string;
}

export const CONDITION_CONFIG: Record<UnitCondition, ConditionConfig> = {
  healthy: {
    nameAr: 'سليم',
    icon: '🟢',
    color: '#4ade80',
    hpRange: [70, 100],
    attackModifier: 1.0,
    defenseModifier: 1.0,
    speedModifier: 1.0,
    description: 'الوحدة بحالة كاملة الأهبة',
  },
  wounded: {
    nameAr: 'مصاب',
    icon: '🟡',
    color: '#fbbf24',
    hpRange: [30, 70],
    attackModifier: 0.6,
    defenseModifier: 0.7,
    speedModifier: 0.7,
    description: 'إصابات متوسطة - أداء منخفض',
  },
  critical: {
    nameAr: 'حرج',
    icon: '🔴',
    color: '#ef4444',
    hpRange: [1, 30],
    attackModifier: 0.3,
    defenseModifier: 0.4,
    speedModifier: 0.4,
    description: 'إصابات خطيرة - يحتاج إخلاء فوري',
  },
  dead: {
    nameAr: 'قتيل',
    icon: '💀',
    color: '#6b7280',
    hpRange: [0, 0],
    attackModifier: 0,
    defenseModifier: 0,
    speedModifier: 0,
    description: 'خارج المعركة',
  },
};

/**
 * تحديد حالة الوحدة بناءً على HP
 */
export function getUnitCondition(hpPercent: number): UnitCondition & { config: ConditionConfig } {
  let condition: UnitCondition;

  if (hpPercent <= 0) condition = 'dead';
  else if (hpPercent <= 30) condition = 'critical';
  else if (hpPercent <= 70) condition = 'wounded';
  else condition = 'healthy';

  const config = CONDITION_CONFIG[condition];

  return {
    ...condition,
    config,
  };
}

/**
 * حساب معاملات الحالة الشاملة
 */
export function getConditionModifiers(hpPercent: number): {
  attack: number;
  defense: number;
  speed: number;
} {
  const cond = getUnitCondition(hpPercent);
  return {
    attack: cond.config.attackModifier,
    defense: cond.config.defenseModifier,
    speed: cond.config.speedModifier,
  };
}

// ═══════════════════════════════
// نظام الإخلاء الطبي
// ═══════════════════════════════

export interface MedicalStats {
  totalDead: number;
  recoverable: number; // يمكن إنقاذهم (80% من القتلى)
  totalWounded: number;
  healed: number;
}

/**
 * محاكاة نتائج المعركة الطبية
 * - 20% من القتلى قابلة للإنقاذ بفريق إسعاف
 * - المصابون يتعافون بمرور الوقت
 */
export function calculateBattleMedicalResults(
  totalCasualties: number,
  hasMedicTeam: boolean,
  battleDurationSeconds: number
): MedicalStats {
  const recoverableRatio = hasMedicTeam ? 0.3 : 0.2;
  const recoverable = Math.floor(totalCasualties * recoverableRatio);

  // المصابون الذين يمكن علاجهم
  const totalWounded = Math.floor(totalCasualties * 0.6);
  const healingRate = hasMedicTeam ? 0.15 : 0.05; // 15% أو 5% لكل ساعة
  const hours = battleDurationSeconds / 3600;
  const healed = Math.floor(totalWounded * healingRate * hours);

  return {
    totalDead: totalCasualties - recoverable,
    recoverable,
    totalWounded,
    healed,
  };
}
