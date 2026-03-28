// ═══════════════════════════════════════════════════════════
// محرك المعارك الواقعي - Realistic Battle Engine (v2)
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';
import { calculateEffectivenessDamage, getConditionModifiers } from './effectiveness-table';
import type { UnitCondition } from './effectiveness-table';
import { getWeatherModifiers, type WeatherType } from './weather-system';
import { getTimePeriod, type TimePeriod } from './weather-system';
import { getFatigueState, type FatigueState } from './weather-system';
import { updateMoraleInBattle, type MoraleState } from './morale-system';
import { consumeSupplyInBattle, getSupplyPenalty, type UnitSupply } from './supply-system';
import { calculateTechBonuses } from './tech-tree';
import { ACTIVE_TACTICS, type TacticType, type ActiveTactic as TacticConfig, type ActiveTacticState } from './battle-simulation';

// ═══════════════════════════════════════════════════════════
// وحدة المعركة الواقعية (موسعة)
// ═══════════════════════════════════════════════════════════

export interface RealisticBattleUnit {
  id: string;
  type: TroopType;
  team: 'player' | 'enemy';
  currentHp: number;
  maxHp: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  baseSpeed: number;
  speed: number;
  attackPower: number;
  defense: number;
  range: number;
  attackCooldown: number;
  lastAttackTime: number;
  isAlive: boolean;
  waveIndex: number;
  // الأنظمة الجديدة
  condition: UnitCondition;
  hpPercent: number;
  morale: MoraleState;
  fatigue: FatigueState;
  supply: UnitSupply;
  supplyPenalty: { canAttack: boolean; canMove: boolean; description: string };
  effectiveAttack: number; // القوة الفعلية بعد كل المعاملات
  effectiveDefense: number;
  effectiveSpeed: number;
  effectiveVision: number;
}

export interface RealisticBattleState {
  status: 'preparing' | 'active' | 'paused' | 'victory' | 'defeat';
  elapsedTime: number;
  playerUnits: RealisticBattleUnit[];
  enemyUnits: RealisticBattleUnit[];
  activeTactics: ActiveTacticState[];
  // الأنظمة الواقعية
  weather: WeatherType;
  gameTime: number; // ساعة من 0-23
  weatherState: { elapsedMinutes: number; durationMinutes: number };
  playerMorale: number; // 0-100
  enemyMorale: number;
  playerFatigue: number;
  enemyFatigue: number;
  // الإحصائيات
  playerTotalPower: number;
  enemyTotalPower: number;
  playerCasualties: number;
  enemyCasualties: number;
  playerWounded: number;
  enemyWounded: number;
  battleLog: BattleLogEntry[];
}

export interface BattleLogEntry {
  time: number;
  type: 'attack' | 'death' | 'wounded' | 'tactic' | 'morale_change' | 'weather' | 'supply_warning' | 'rout';
  team: 'player' | 'enemy' | 'neutral';
  message: string;
}

// ═══════════════════════════════════════════════════════════
// المعادلة الشاملة للقوة الفعلية
// ═══════════════════════════════════════════════════════════

/**
 * المعادلة الشاملة:
 *
 * الهجوم الفعّال = قاعدة_الهجوم
 *   × فعالية_نوع_القوات (الجدول)
 *   × معامل_الإصابة (سليم/مصاب/حرج)
 *   × معامل_الروح_المعنوية
 *   × معامل_التعب
 *   × معامل_الطقس
 *   × معامل_الوقت (فجر/نهار/غسق/ليل)
 *   × معامل_الإمداد (ذخيرة/وقود)
 *   × مكافآت_التكتيكات_النشطة
 *   × مكافآت_التقنيات_المبحوثة
 *   × مكافآت_القادة
 */
export interface CombatModifiers {
  effectiveness: number;
  condition: { attack: number; defense: number; speed: number };
  morale: { attack: number; defense: number; speed: number };
  fatigue: number;
  weather: { attack: number; defense: number; speed: number; vision: number };
  timeOfDay: { attack: number; vision: number; aviation: number };
  supply: { attack: number; defense: number; speed: number; canAttack: boolean; canMove: boolean };
  tactics: { attack: number; defense: number; speed: number };
  tech: { attack: number; defense: number; vision: number };
  commander: { attack: number; defense: number; speed: number; morale: number };
}

export function calculateFullModifiers(params: {
  unitType: TroopType;
  target?: TroopType;
  hpPercent: number;
  morale: MoraleState;
  fatigue: FatigueState;
  weather: WeatherType;
  gameTime: number;
  supply: UnitSupply;
  activeTactics: ActiveTacticState[];
  techAttack?: number;
  techDefense?: number;
  techVision?: number;
  commanderAttack?: number;
  commanderDefense?: number;
}): CombatModifiers {
  // فعالية نوع القوات
  const effectiveness = params.target
    ? 1.0 // يتم حسابها لاحقاً عند المعرفة
    : 1.0;

  // حالة الإصابة
  const condition = getConditionModifiers(params.hpPercent);

  // الروح المعنوية
  const morale = {
    attack: params.morale.attackModifier,
    defense: params.morale.defenseModifier,
    speed: params.morale.speedModifier,
  };

  // التعب
  const fatigue = params.fatigue.performanceModifier;

  // الطقس
  const weather = getWeatherModifiers(params.weather, params.unitType);

  // الوقت
  const timeConfig = getTimePeriod(params.gameTime);
  const timeOfDay = {
    attack: timeConfig.attackModifier,
    vision: timeConfig.visionModifier,
    aviation: timeConfig.aviationModifier,
  };

  // الإمداد
  const supplyPen = getSupplyPenalty(params.supply, params.unitType);
  const supply = {
    attack: supplyPen.attackModifier,
    defense: supplyPen.defenseModifier,
    speed: supplyPen.speedModifier,
    canAttack: supplyPen.canAttack,
    canMove: supplyPen.canMove,
  };

  // التكتيكات النشطة
  let tactics = { attack: 1.0, defense: 1.0, speed: 1.0 };
  for (const t of params.activeTactics) {
    if (!t.isActive) continue;
    const tacticConfig = ACTIVE_TACTICS[t.tactic as TacticType];
    if (tacticConfig) {
      tactics.attack *= tacticConfig.effect.attackModifier;
      tactics.defense *= tacticConfig.effect.defenseModifier;
      tactics.speed *= tacticConfig.effect.speedModifier;
    }
  }

  // التقنيات
  const tech = {
    attack: 1 + (params.techAttack || 0) / 100,
    defense: 1 + (params.techDefense || 0) / 100,
    vision: params.techVision || 0,
  };

  // القادة
  const commander = {
    attack: 1 + (params.commanderAttack || 0) / 100,
    defense: 1 + (params.commanderDefense || 0) / 100,
    speed: 1,
    morale: params.commanderMorale || 0,
  };

  return { effectiveness, condition, morale, fatigue, weather, timeOfDay, supply, tactics, tech, commander };
}

/**
 * حساب الهجوم الفعّال النهائي
 */
export function calculateEffectiveAttack(
  baseAttack: number,
  modifiers: CombatModifiers,
  effectivenessVsTarget?: number
): number {
  const eff = effectivenessVsTarget || 1.0;
  return Math.floor(
    baseAttack
    * eff
    * modifiers.condition.attack
    * modifiers.morale.attack
    * modifiers.fatigue
    * modifiers.weather.attack
    * modifiers.timeOfDay.attack
    * modifiers.supply.attack
    * modifiers.tactics.attack
    * modifiers.tech.attack
    * modifiers.commander.attack
  );
}

/**
 * حساب الضرر الفعلي
 * damage = effectiveAttack - (effectiveDefense × 0.3)
 * الحد الأدنى للضرر = 1
 */
export function calculateDamage(
  attack: number,
  defense: number,
  attackerModifiers: CombatModifiers,
  defenderModifiers: CombatModifiers
): number {
  const effectiveAttack = calculateEffectiveAttack(attack, attackerModifiers);
  const effectiveDefense = Math.floor(
    defense
    * defenderModifiers.condition.defense
    * defenderModifiers.morale.defense
    * defenderModifiers.weather.defense
    * defenderModifiers.supply.defense
    * defenderModifiers.tactics.defense
    * defenderModifiers.tech.defense
  );

  return Math.max(1, effectiveAttack - Math.floor(effectiveDefense * 0.3));
}
