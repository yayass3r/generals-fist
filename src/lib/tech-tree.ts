// ═══════════════════════════════════════════════════════════
// شجرة البحث والتطوير - Tech Tree & Research System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';

// ═══════════════════════════════
// أنواع البحث
// ═══════════════════════════════

export type TechCategory = 'weapons' | 'defense' | 'logistics' | 'intelligence' | 'special';
export type TechTier = 1 | 2 | 3;

export interface TechNode {
  id: string;
  nameAr: string;
  description: string;
  icon: string;
  category: TechCategory;
  tier: TechTier;
  cost: { scrap: number; intel: number };
  researchTime: number; // بالثواني
  prerequisites: string[]; // IDs of required techs
  effects: TechEffect[];
  color: string;
}

export interface TechEffect {
  type: 'troop_attack' | 'troop_defense' | 'troop_speed' | 'troop_vision' | 'supply_efficiency' | 'morale_bonus' | 'special';
  troopType?: TroopType;
  value: number; // نسبة مئوية أو قيمة مطلقة
  description: string;
}

// ═══════════════════════════════
// جميع التقنيات القابلة للبحث
// ═══════════════════════════════

export const TECH_TREE: TechNode[] = [
  // ════ المستوى الأول: أساسي ════
  {
    id: 'improved_rifles',
    nameAr: 'بنادق محسّنة',
    description: 'تعديلات على البنادق تزيد دقة وفعالية نيران المشاة',
    icon: '🔫',
    category: 'weapons',
    tier: 1,
    cost: { scrap: 100, intel: 20 },
    researchTime: 120,
    prerequisites: [],
    effects: [
      { type: 'troop_attack', troopType: 'infantry', value: 15, description: 'هجوم مشاة +15%' },
    ],
    color: '#ef4444',
  },
  {
    id: 'extra_armor',
    nameAr: 'دروع إضافية',
    description: 'لوحات دروع مضافة للمركبات والجنود',
    icon: '🛡️',
    category: 'defense',
    tier: 1,
    cost: { scrap: 120, intel: 15 },
    researchTime: 150,
    prerequisites: [],
    effects: [
      { type: 'troop_defense', value: 15, description: 'دفاع جميع القوات +15%' },
    ],
    color: '#3b82f6',
  },
  {
    id: 'basic_radar',
    nameAr: 'رادار أساسي',
    description: 'نظام رادار بسيط لزيادة مدى الرؤية',
    icon: '📡',
    category: 'intelligence',
    tier: 1,
    cost: { scrap: 80, intel: 40 },
    researchTime: 180,
    prerequisites: [],
    effects: [
      { type: 'troop_vision', value: 25, description: 'رؤية +25%' },
    ],
    color: '#22c55e',
  },
  {
    id: 'supply_optimization',
    nameAr: 'تحسين الإمدادات',
    description: 'أنظمة توزيع إمدادات أكثر كفاءة',
    icon: '📦',
    category: 'logistics',
    tier: 1,
    cost: { scrap: 90, intel: 25 },
    researchTime: 100,
    prerequisites: [],
    effects: [
      { type: 'supply_efficiency', value: 20, description: 'كفاءة إمداد +20%' },
    ],
    color: '#e07020',
  },
  {
    id: 'combat_training',
    nameAr: 'تدريب قتالي',
    description: 'برنامج تدريب مكثف يرفع الروح المعنوية القتالية',
    icon: '🎖️',
    category: 'special',
    tier: 1,
    cost: { scrap: 60, intel: 30 },
    researchTime: 90,
    prerequisites: [],
    effects: [
      { type: 'morale_bonus', value: 10, description: 'روح معنوية أساسية +10' },
    ],
    color: '#f59e0b',
  },

  // ════ المستوى الثاني: متوسط ════
  {
    id: 'guided_missiles',
    nameAr: 'صواريخ موجهة',
    description: 'صواريخ مضادة للدروع ذات توجيه دقيق',
    icon: '🚀',
    category: 'weapons',
    tier: 2,
    cost: { scrap: 300, intel: 60 },
    researchTime: 300,
    prerequisites: ['improved_rifles'],
    effects: [
      { type: 'troop_attack', troopType: 'infantry', value: 25, description: 'هجوم مشاة ضد مدرعات +25%' },
      { type: 'troop_attack', troopType: 'armor', value: 15, description: 'هجوم مدرعات +15%' },
    ],
    color: '#ef4444',
  },
  {
    id: 'reactive_armor',
    nameAr: 'دروع تفاعلية',
    description: 'دروع تفاعلية تحيّي التهديدات الصاروخية',
    icon: '🛡️',
    category: 'defense',
    tier: 2,
    cost: { scrap: 350, intel: 50 },
    researchTime: 360,
    prerequisites: ['extra_armor'],
    effects: [
      { type: 'troop_defense', troopType: 'armor', value: 30, description: 'دفاع مدرعات +30%' },
    ],
    color: '#3b82f6',
  },
  {
    id: 'advanced_radar',
    nameAr: 'رادار متقدم',
    description: 'رادار متطور يكشف التمويه والوحدات المخفية',
    icon: '📡',
    category: 'intelligence',
    tier: 2,
    cost: { scrap: 250, intel: 100 },
    researchTime: 400,
    prerequisites: ['basic_radar'],
    effects: [
      { type: 'troop_vision', value: 40, description: 'رؤية +40%' },
    ],
    color: '#22c55e',
  },
  {
    id: 'supply_trucks',
    nameAr: 'شاحنات إمداد محسّنة',
    description: 'شاحنات إمداد أسرع بقدرة تحميل أكبر',
    icon: '🚛',
    category: 'logistics',
    tier: 2,
    cost: { scrap: 200, intel: 40 },
    researchTime: 200,
    prerequisites: ['supply_optimization'],
    effects: [
      { type: 'supply_efficiency', value: 30, description: 'كفاءة إمداد +30%' },
      { type: 'troop_speed', troopType: 'armor', value: 10, description: 'سرعة الإمداد +10%' },
    ],
    color: '#e07020',
  },
  {
    id: 'night_vision',
    nameAr: 'معدات ليلية',
    description: 'نظارات الرؤية الليلية للعمليات المظلمة',
    icon: '🔭',
    category: 'special',
    tier: 2,
    cost: { scrap: 280, intel: 80 },
    researchTime: 350,
    prerequisites: ['basic_radar', 'combat_training'],
    effects: [
      { type: 'troop_vision', value: 60, description: 'رؤية ليلية +60%' },
      { type: 'troop_attack', value: 10, description: 'هجوم ليلي +10%' },
    ],
    color: '#f59e0b',
  },

  // ════ المستوى الثالث: متقدم ════
  {
    id: 'stealth_tech',
    nameAr: 'تكنولوجيا التخفي',
    description: 'طلاء خاص وتقنيات تمويه متقدمة',
    icon: '🕵️',
    category: 'special',
    tier: 3,
    cost: { scrap: 500, intel: 150 },
    researchTime: 600,
    prerequisites: ['night_vision', 'advanced_radar'],
    effects: [
      { type: 'troop_defense', value: 25, description: 'تمويه +25% دفاع' },
      { type: 'troop_vision', value: 20, description: 'رؤية +20%' },
    ],
    color: '#8b5cf6',
  },
  {
    id: 'self_propelled_artillery',
    nameAr: 'مدفعية ذاتية الحركة',
    description: 'مدفعية ثقيلة متحركة بقوة تدمير هائلة',
    icon: '💣',
    category: 'weapons',
    tier: 3,
    cost: { scrap: 600, intel: 100 },
    researchTime: 500,
    prerequisites: ['guided_missiles'],
    effects: [
      { type: 'troop_attack', value: 40, description: 'هجوم جميع القوات +40%' },
      { type: 'troop_speed', troopType: 'armor', value: -10, description: 'سرعة مدرعات -10%' },
    ],
    color: '#ef4444',
  },
  {
    id: 'drone_recon',
    nameAr: 'طائرات مسيرة',
    description: 'مسيرات استطلاع تعمل على مدار الساعة',
    icon: '🛸',
    category: 'intelligence',
    tier: 3,
    cost: { scrap: 450, intel: 200 },
    researchTime: 480,
    prerequisites: ['advanced_radar', 'stealth_tech'],
    effects: [
      { type: 'troop_vision', value: 50, description: 'استطلاع تلقائي +50% رؤية' },
      { type: 'special', value: 2, description: 'يكشف 2 قطاعات إضافية' },
    ],
    color: '#22c55e',
  },
  {
    id: 'elite_training',
    nameAr: 'تدريب النخبة',
    description: 'برنامج تدريب متقدم يصنع قوات نخبة',
    icon: '⭐',
    category: 'special',
    tier: 3,
    cost: { scrap: 400, intel: 120 },
    researchTime: 450,
    prerequisites: ['combat_training', 'night_vision'],
    effects: [
      { type: 'morale_bonus', value: 20, description: 'روح معنوية +20' },
      { type: 'troop_attack', value: 15, description: 'هجوم +15%' },
      { type: 'troop_defense', value: 10, description: 'دفاع +10%' },
    ],
    color: '#f59e0b',
  },
];

// ═══════════════════════════════
// حالة البحث في اللعبة
// ═══════════════════════════════

export interface ResearchState {
  completedTechs: string[];
  inProgress: string | null;
  progressPercent: number; // 0-100
  startTime: number; // timestamp
}

/**
 * حساب المكافآت التراكمية من التقنيات المكتملة
 */
export function calculateTechBonuses(completedTechIds: string[]): {
  attack: Partial<Record<TroopType, number>>;
  defense: number;
  speed: Partial<Record<TroopType, number>>;
  vision: number;
  supplyEfficiency: number;
  moraleBonus: number;
  specialEffects: TechEffect[];
} {
  const completed = TECH_TREE.filter(t => completedTechIds.includes(t.id));
  const attack: Partial<Record<TroopType, number>> = {};
  const speed: Partial<Record<TroopType, number>> = {};
  let defense = 0;
  let vision = 0;
  let supplyEfficiency = 0;
  let moraleBonus = 0;
  const specialEffects: TechEffect[] = [];

  for (const tech of completed) {
    for (const effect of tech.effects) {
      switch (effect.type) {
        case 'troop_attack':
          if (effect.troopType) {
            attack[effect.troopType] = (attack[effect.troopType] || 0) + effect.value;
          } else {
            // تطبق على الكل
            for (const t of ['infantry', 'armor', 'aviation'] as TroopType[]) {
              attack[t] = (attack[t] || 0) + effect.value;
            }
          }
          break;
        case 'troop_defense':
          if (effect.troopType) {
            // خاص بنوع
          } else {
            defense += effect.value;
          }
          break;
        case 'troop_speed':
          if (effect.troopType) {
            speed[effect.troopType] = (speed[effect.troopType] || 0) + effect.value;
          }
          break;
        case 'troop_vision':
          vision += effect.value;
          break;
        case 'supply_efficiency':
          supplyEfficiency += effect.value;
          break;
        case 'morale_bonus':
          moraleBonus += effect.value;
          break;
        case 'special':
          specialEffects.push(effect);
          break;
      }
    }
  }

  return { attack, defense, speed, vision, supplyEfficiency, moraleBonus, specialEffects };
}

/**
 * التحقق من إمكانية البحث
 */
export function canResearch(techId: string, completedTechs: string[], inProgress: string | null, resources: { scrap: number; intel: number }): boolean {
  if (inProgress) return false;
  if (completedTechs.includes(techId)) return false;

  const tech = TECH_TREE.find(t => t.id === techId);
  if (!tech) return false;

  // التحقق من المتطلبات
  for (const prereq of tech.prerequisites) {
    if (!completedTechs.includes(prereq)) return false;
  }

  // التحقق من الموارد
  if (resources.scrap < tech.cost.scrap) return false;
  if (resources.intel < tech.cost.intel) return false;

  return true;
}

/**
 * الحصول على التقنيات المتاحة للبحث (المتطلبات مستوفاة)
 */
export function getAvailableTechs(completedTechs: string[]): TechNode[] {
  return TECH_TREE.filter(tech => {
    if (completedTechs.includes(tech.id)) return false;
    return tech.prerequisites.every(prereq => completedTechs.includes(prereq));
  });
}
