// ═══════════════════════════════════════════════════════════
// نظام القيادة الهرمي - Chain of Command System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';

// ═══════════════════════════════
// أنواع الوحدات
// ═══════════════════════════════

export type UnitSize = 'squad' | 'company';
export type CommanderRank = 'none' | 'sergeant' | 'lieutenant' | 'captain' | 'major';

export interface Commander {
  id: string;
  nameAr: string;
  rank: CommanderRank;
  troopType: TroopType;
  buffType: BuffType;
  buffValue: number; // نسبة مئوية (مثال: 10 يعني 10%)
  icon: string;
  description: string;
  cost: number;
}

export interface Squad {
  id: string;
  troopType: TroopType;
  size: number; // عدد الجنود الفعلي (1-10)
  commander: Commander | null;
}

export interface Company {
  id: string;
  nameAr: string;
  troopType: TroopType;
  squads: Squad[];
  commander: Commander | null;
}

// ═══════════════════════════════
// أنواع المكافآت
// ═══════════════════════════════

export type BuffType = 'attack' | 'defense' | 'speed' | 'morale';

export const BUFF_CONFIG: Record<BuffType, { nameAr: string; icon: string; color: string }> = {
  attack: { nameAr: 'قوة الهجوم', icon: '⚔️', color: '#ef4444' },
  defense: { nameAr: 'الدفاع', icon: '🛡️', color: '#3b82f6' },
  speed: { nameAr: 'السرعة', icon: '💨', color: '#22c55e' },
  morale: { nameAr: 'الروح المعنوية', icon: '⭐', color: '#f59e0b' },
};

// ═══════════════════════════════
// رتب القادة المتاحة
// ═══════════════════════════════

export const AVAILABLE_COMMANDERS: Commander[] = [
  {
    id: 'sgt_infantry_1',
    nameAr: 'الرقيب أسد',
    rank: 'sergeant',
    troopType: 'infantry',
    buffType: 'attack',
    buffValue: 10,
    icon: '🎖️',
    description: 'محارب مخضرم يزيد هجوم المشاة بـ 10%',
    cost: 150,
  },
  {
    id: 'sgt_armor_1',
    nameAr: 'الرقيب حديد',
    rank: 'sergeant',
    troopType: 'armor',
    buffType: 'defense',
    buffValue: 12,
    icon: '🎖️',
    description: 'خبير مدرعات يزيد دفاع المدرعات بـ 12%',
    cost: 200,
  },
  {
    id: 'lt_air_1',
    nameAr: 'الملازم صقر',
    rank: 'lieutenant',
    troopType: 'aviation',
    buffType: 'attack',
    buffValue: 15,
    icon: '🏅',
    description: 'طيار متمرس يزيد هجوم الطيران بـ 15%',
    cost: 300,
  },
  {
    id: 'cpt_all_1',
    nameAr: 'النقيب عاصفة',
    rank: 'captain',
    troopType: 'infantry',
    buffType: 'morale',
    buffValue: 20,
    icon: '🎖️‍✈️',
    description: 'قائد ملهم يرفع الروح المعنوية لجميع القوات بـ 20%',
    cost: 500,
  },
  {
    id: 'maj_all_1',
    nameAr: 'الرائد فولاذ',
    rank: 'major',
    troopType: 'armor',
    buffType: 'defense',
    buffValue: 25,
    icon: '⭐',
    description: 'قائد استراتيجي يزيد دفاع السرية بـ 25%',
    cost: 800,
  },
  {
    id: 'sgt_speed_1',
    nameAr: 'الرقيب برق',
    rank: 'sergeant',
    troopType: 'infantry',
    buffType: 'speed',
    buffValue: 10,
    icon: '🎖️',
    description: 'خبير حركة سريعة يزيد سرعة التقدم بـ 10%',
    cost: 180,
  },
];

// ═══════════════════════════════
// ثوابت الوحدات
// ═══════════════════════════════

export const SQUAD_MAX_SIZE = 10;
export const COMPANY_MAX_SQUADS = 10;
export const COMPANY_MAX_SIZE = 100;

// تكلفة تجنيد القوات
export const RECRUIT_COST: Record<TroopType, number> = {
  infantry: 10,
  armor: 30,
  aviation: 50,
};

// ═══════════════════════════════
// حساب مكافآت القائد
// ═══════════════════════════════

export interface BuffsResult {
  attack: number;
  defense: number;
  speed: number;
  morale: number;
}

/**
 * حساب إجمالي المكافآت من القادة المعينين
 */
export function calculateBuffs(squads: Squad[]): BuffsResult {
  const buffs: BuffsResult = { attack: 0, defense: 0, speed: 0, morale: 0 };

  for (const squad of squads) {
    if (squad.commander) {
      const cmd = squad.commander;
      buffs[cmd.buffType] += cmd.buffValue;
    }
  }

  return buffs;
}

/**
 * حساب المكافآت على مستوى السرية
 */
export function calculateCompanyBuffs(company: Company): BuffsResult {
  let buffs: BuffsResult = { attack: 0, defense: 0, speed: 0, morale: 0 };

  // مكافآت قادة الحظائر
  for (const squad of company.squads) {
    if (squad.commander) {
      buffs[squad.commander.buffType] += squad.commander.buffValue;
    }
  }

  // مكافأة قائد السرية
  if (company.commander) {
    buffs[company.commander.buffType] += company.commander.buffValue;
  }

  return buffs;
}

/**
 * إجمالي القوات في السرية
 */
export function getCompanyTroopCount(company: Company): number {
  return company.squads.reduce((sum, sq) => sum + sq.size, 0);
}

/**
 * إجمالي القوات من نوع معين
 */
export function getTroopCountByType(companies: Company[], type: TroopType): number {
  let total = 0;
  for (const company of companies) {
    if (company.troopType === type) {
      total += getCompanyTroopCount(company);
    }
  }
  return total;
}

// ═══════════════════════════════
// إنشاء سرية فارغة
// ═══════════════════════════════

export function createEmptyCompany(troopType: TroopType, index: number): Company {
  return {
    id: `company_${troopType}_${index}`,
    nameAr: troopType === 'infantry' ? `سرية المشاة ${index + 1}` : troopType === 'armor' ? `سرية المدرعات ${index + 1}` : `سرية الطيران ${index + 1}`,
    troopType,
    squads: [],
    commander: null,
  };
}

export function createEmptySquad(troopType: TroopType, index: number): Squad {
  return {
    id: `squad_${troopType}_${index}`,
    troopType,
    size: 0,
    commander: null,
  };
}
