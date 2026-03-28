// ═══════════════════════════════════════════════════════════
// محاكاة المعركة - Battle Simulation Engine
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType, TerrainType, TimeOfDay } from './battle-engine';
import { TROOP_CONFIGS } from './battle-engine';

// ═══════════════════════════════
// أنواع التكتيكات النشطة
// ═══════════════════════════════

export type TacticType = 'smoke_screen' | 'air_support' | 'retreat' | 'flanking' | 'artillery_barrage';

export interface ActiveTactic {
  type: TacticType;
  nameAr: string;
  icon: string;
  description: string;
  cooldown: number; // بالثواني
  duration: number; // مدة التأثير بالثواني
  effect: TacticEffect;
  cost: number; // تكلفة الوقود
}

export interface TacticEffect {
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
  specialEffect?: string;
}

export const ACTIVE_TACTICS: Record<TacticType, ActiveTactic> = {
  smoke_screen: {
    type: 'smoke_screen',
    nameAr: 'ساتر دخاني',
    icon: '💨',
    description: 'حاجز دخاني يزيد دفاع قواتك بـ 30% لمدة 10 ثوانٍ',
    cooldown: 30,
    duration: 10,
    cost: 20,
    effect: { attackModifier: 1.0, defenseModifier: 1.3, speedModifier: 1.0, specialEffect: 'smoke' },
  },
  air_support: {
    type: 'air_support',
    nameAr: 'دعم جوي',
    icon: '✈️',
    description: 'غارة جوية تزيد هجومك بـ 40% لمدة 8 ثوانٍ',
    cooldown: 45,
    duration: 8,
    cost: 40,
    effect: { attackModifier: 1.4, defenseModifier: 1.0, speedModifier: 1.1, specialEffect: 'airstrike' },
  },
  retreat: {
    type: 'retreat',
    nameAr: 'انسحاب تكتيكي',
    icon: '🏁',
    description: 'انسحاب منظم يزيد سرعتك بـ 50% مع خسارة 20% من القوة',
    cooldown: 60,
    duration: 5,
    cost: 10,
    effect: { attackModifier: 0.8, defenseModifier: 0.7, speedModifier: 1.5, specialEffect: 'retreat' },
  },
  flanking: {
    type: 'flanking',
    nameAr: 'التفاف',
    icon: '🔄',
    description: 'مناورة التفاف تخترق دفاع العدو بزيادة 35% للهجوم',
    cooldown: 35,
    duration: 7,
    cost: 30,
    effect: { attackModifier: 1.35, defenseModifier: 0.9, speedModifier: 1.2, specialEffect: 'flank' },
  },
  artillery_barrage: {
    type: 'artillery_barrage',
    nameAr: 'قصف مدفعي',
    icon: '💣',
    description: 'قصف مكثف يقلل دفاع العدو بـ 40% لمدة 12 ثانية',
    cooldown: 50,
    duration: 12,
    cost: 50,
    effect: { attackModifier: 1.1, defenseModifier: 1.0, speedModifier: 0.9, specialEffect: 'artillery' },
  },
};

// ═══════════════════════════════
// حالة المعركة
// ═══════════════════════════════

export interface BattleUnit {
  id: string;
  type: TroopType;
  team: 'player' | 'enemy';
  currentHp: number;
  maxHp: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  attackPower: number;
  defense: number;
  range: number;
  attackCooldown: number;
  lastAttackTime: number;
  isAlive: boolean;
  waveIndex: number;
}

export interface BattleState {
  status: 'preparing' | 'active' | 'paused' | 'victory' | 'defeat';
  elapsedTime: number;
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  activeTactics: ActiveTacticState[];
  playerTotalPower: number;
  enemyTotalPower: number;
  playerCasualties: number;
  enemyCasualties: number;
}

export interface ActiveTacticState {
  tactic: TacticType;
  remainingDuration: number;
  remainingCooldown: number;
  isActive: boolean;
}

// ═══════════════════════════════
// إنشاء وحدات المعركة
// ═══════════════════════════════

function createBattleUnit(
  id: string,
  type: TroopType,
  team: 'player' | 'enemy',
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  level: number = 1
): BattleUnit {
  const config = TROOP_CONFIGS[type];
  const levelMult = 1 + (level - 1) * 0.15;

  return {
    id,
    type,
    team,
    currentHp: Math.floor(config.basePower * 2 * levelMult),
    maxHp: Math.floor(config.basePower * 2 * levelMult),
    x,
    y,
    targetX,
    targetY,
    speed: type === 'aviation' ? 0.8 : type === 'armor' ? 0.5 : 0.3,
    attackPower: Math.floor(config.basePower * levelMult),
    defense: Math.floor(config.basePower * 0.5 * levelMult),
    range: type === 'aviation' ? 3 : type === 'armor' ? 2 : 1,
    attackCooldown: type === 'aviation' ? 2 : type === 'armor' ? 1.5 : 1,
    lastAttackTime: 0,
    isAlive: true,
    waveIndex: 0,
  };
}

/**
 * إنشاء وحدات اللاعب من نشر الموجات
 */
export function createPlayerUnits(
  waves: { troopType: TroopType | null; count: number }[][],
  buffs?: { attack: number; defense: number; speed: number; morale: number }
): BattleUnit[] {
  const units: BattleUnit[] = [];
  let idCounter = 0;

  waves.forEach((wave, waveIndex) => {
    wave.forEach((slot) => {
      if (!slot.troopType || slot.count <= 0) return;

      const displayCount = Math.min(slot.count, 8); // أقصى 8 وحدات مرئية
      for (let i = 0; i < displayCount; i++) {
        const startX = -6 + Math.random() * 2;
        const startY = -3 + waveIndex * 1.5 + (Math.random() - 0.5) * 0.8;
        const targetX = 4 + Math.random() * 2;
        const targetY = -3 + waveIndex * 1.5 + (Math.random() - 0.5) * 0.8;

        const unit = createBattleUnit(
          `player_${idCounter++}`,
          slot.troopType,
          'player',
          startX,
          startY,
          targetX,
          targetY,
          1
        );

        // تطبيق مكافآت القادة
        if (buffs) {
          unit.attackPower = Math.floor(unit.attackPower * (1 + buffs.attack / 100));
          unit.defense = Math.floor(unit.defense * (1 + buffs.defense / 100));
          unit.speed *= (1 + buffs.speed / 100);
        }

        unit.waveIndex = waveIndex;
        units.push(unit);
      }
    });
  });

  return units;
}

/**
 * إنشاء وحدات العدو
 */
export function createEnemyUnits(enemyPower: number, terrain: TerrainType): BattleUnit[] {
  const units: BattleUnit[] = [];
  let idCounter = 0;
  let remainingPower = enemyPower;

  const types: TroopType[] = ['infantry', 'armor', 'aviation'];
  const weights = terrain === 'urban' ? [0.5, 0.3, 0.2] :
                  terrain === 'mountains' ? [0.6, 0.2, 0.2] :
                  terrain === 'desert' ? [0.3, 0.4, 0.3] :
                  [0.4, 0.35, 0.25]; // plains

  while (remainingPower > 50) {
    const typeRoll = Math.random();
    let type: TroopType;
    if (typeRoll < weights[0]) type = 'infantry';
    else if (typeRoll < weights[0] + weights[1]) type = 'armor';
    else type = 'aviation';

    const level = Math.max(1, Math.floor(Math.random() * 3) + 1);
    const unitCost = TROOP_CONFIGS[type].basePower * level * 2;

    if (remainingPower < unitCost) break;

    const startX = 5 + Math.random() * 2;
    const startY = -3 + Math.random() * 6;
    const targetX = -5 + Math.random() * 2;
    const targetY = -3 + Math.random() * 6;

    const unit = createBattleUnit(
      `enemy_${idCounter++}`,
      type,
      'enemy',
      startX,
      startY,
      targetX,
      targetY,
      level
    );

    units.push(unit);
    remainingPower -= unitCost;
  }

  return units;
}

// ═══════════════════════════════
// محرك المحاكاة
// ═══════════════════════════════

export interface BattleTickResult {
  updatedState: BattleState;
  events: BattleEvent[];
}

export interface BattleEvent {
  type: 'attack' | 'death' | 'tactic_activated' | 'tactic_expired' | 'victory' | 'defeat';
  sourceId?: string;
  targetId?: string;
  damage?: number;
  description: string;
  position?: { x: number; y: number };
}

/**
 * تحديث سريك واحد من المعركة (كل 100ms)
 */
export function battleTick(state: BattleState, deltaTime: number): BattleTickResult {
  if (state.status !== 'active') {
    return { updatedState: state, events: [] };
  }

  const events: BattleEvent[] = [];
  const newState = { ...state, elapsedTime: state.elapsedTime + deltaTime };

  // تحديث التكتيكات النشطة
  newState.activeTactics = state.activeTactics.map(tactic => {
    if (tactic.isActive) {
      const newDuration = tactic.remainingDuration - deltaTime;
      if (newDuration <= 0) {
        events.push({
          type: 'tactic_expired',
          description: `انتهى تأثير ${ACTIVE_TACTICS[tactic.tactic].nameAr}`,
        });
        return { ...tactic, isActive: false, remainingDuration: 0, remainingCooldown: ACTIVE_TACTICS[tactic.tactic].cooldown };
      }
      return { ...tactic, remainingDuration: newDuration };
    } else if (tactic.remainingCooldown > 0) {
      return { ...tactic, remainingCooldown: Math.max(0, tactic.remainingCooldown - deltaTime) };
    }
    return tactic;
  });

  // حساب مكافآت التكتيكات النشطة
  let activeAttackMod = 1.0;
  let activeDefenseMod = 1.0;
  let activeSpeedMod = 1.0;
  let enemyDefenseReduction = 1.0;

  for (const tactic of newState.activeTactics) {
    if (!tactic.isActive) continue;
    const effect = ACTIVE_TACTICS[tactic.tactic].effect;
    activeAttackMod *= effect.attackModifier;
    activeDefenseMod *= effect.defenseModifier;
    activeSpeedMod *= effect.speedModifier;
    if (effect.specialEffect === 'artillery') {
      enemyDefenseReduction = 0.6;
    }
  }

  // تحريك وحدات اللاعب
  newState.playerUnits = state.playerUnits.map(unit => {
    if (!unit.isAlive) return unit;

    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.3) {
      const moveSpeed = unit.speed * activeSpeedMod * deltaTime;
      return {
        ...unit,
        x: unit.x + (dx / dist) * Math.min(moveSpeed, dist),
        y: unit.y + (dy / dist) * Math.min(moveSpeed, dist),
      };
    }

    return unit;
  });

  // تحريك وحدات العدو
  newState.enemyUnits = state.enemyUnits.map(unit => {
    if (!unit.isAlive) return unit;

    const dx = unit.targetX - unit.x;
    const dy = unit.targetY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.3) {
      const moveSpeed = unit.speed * deltaTime;
      return {
        ...unit,
        x: unit.x + (dx / dist) * Math.min(moveSpeed, dist),
        y: unit.y + (dy / dist) * Math.min(moveSpeed, dist),
      };
    }

    return unit;
  });

  // القتال
  const alivePlayers = newState.playerUnits.filter(u => u.isAlive);
  const aliveEnemies = newState.enemyUnits.filter(u => u.isAlive);

  newState.playerUnits = newState.playerUnits.map(playerUnit => {
    if (!playerUnit.isAlive) return playerUnit;

    // البحث عن أقرب عدو
    let closestEnemy: BattleUnit | null = null;
    let closestDist = Infinity;

    for (const enemy of aliveEnemies) {
      const dx = playerUnit.x - enemy.x;
      const dy = playerUnit.y - enemy.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist && d <= playerUnit.range) {
        closestDist = d;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy && newState.elapsedTime - playerUnit.lastAttackTime >= playerUnit.attackCooldown) {
      const damage = Math.max(1, Math.floor(
        playerUnit.attackPower * activeAttackMod - closestEnemy.defense * activeDefenseMod * enemyDefenseReduction * 0.3
      ));

      events.push({
        type: 'attack',
        sourceId: playerUnit.id,
        targetId: closestEnemy.id,
        damage,
        description: `${playerUnit.type === 'infantry' ? 'مشاة' : playerUnit.type === 'armor' ? 'مدرعات' : 'طيران'} يهاجم!`,
        position: { x: closestEnemy.x, y: closestEnemy.y },
      });

      // تحديث HP العدو
      newState.enemyUnits = newState.enemyUnits.map(e =>
        e.id === closestEnemy!.id ? { ...e, currentHp: e.currentHp - damage } : e
      );

      return { ...playerUnit, lastAttackTime: newState.elapsedTime };
    }

    return playerUnit;
  });

  // هجوم العدو
  newState.enemyUnits = newState.enemyUnits.map(enemyUnit => {
    if (!enemyUnit.isAlive) return enemyUnit;

    let closestPlayer: BattleUnit | null = null;
    let closestDist = Infinity;

    for (const player of alivePlayers) {
      const dx = enemyUnit.x - player.x;
      const dy = enemyUnit.y - player.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist && d <= enemyUnit.range) {
        closestDist = d;
        closestPlayer = player;
      }
    }

    if (closestPlayer && newState.elapsedTime - enemyUnit.lastAttackTime >= enemyUnit.attackCooldown) {
      const damage = Math.max(1, Math.floor(
        enemyUnit.attackPower - closestPlayer.defense * activeDefenseMod * 0.3
      ));

      events.push({
        type: 'attack',
        sourceId: enemyUnit.id,
        targetId: closestPlayer.id,
        damage,
        description: `العدو يهاجم!`,
        position: { x: closestPlayer.x, y: closestPlayer.y },
      });

      newState.playerUnits = newState.playerUnits.map(p =>
        p.id === closestPlayer!.id ? { ...p, currentHp: p.currentHp - damage } : p
      );

      return { ...enemyUnit, lastAttackTime: newState.elapsedTime };
    }

    return enemyUnit;
  });

  // فحص الوفيات
  newState.enemyUnits = newState.enemyUnits.map(u => {
    if (u.currentHp <= 0 && u.isAlive) {
      newState.enemyCasualties++;
      events.push({ type: 'death', targetId: u.id, description: 'وحدة عدو تم تدميرها!' });
      return { ...u, isAlive: false };
    }
    return u;
  });

  newState.playerUnits = newState.playerUnits.map(u => {
    if (u.currentHp <= 0 && u.isAlive) {
      newState.playerCasualties++;
      events.push({ type: 'death', targetId: u.id, description: 'خسارة في صفوفنا!' });
      return { ...u, isAlive: false };
    }
    return u;
  });

  // فحص النصر/الهزيمة
  const playerAlive = newState.playerUnits.filter(u => u.isAlive).length;
  const enemyAlive = newState.enemyUnits.filter(u => u.isAlive).length;

  if (enemyAlive === 0 && newState.enemyUnits.length > 0) {
    newState.status = 'victory';
    events.push({ type: 'victory', description: '🎉 نصر مؤزر! تم تحرير القطاع!' });
  } else if (playerAlive === 0 && newState.playerUnits.length > 0) {
    newState.status = 'defeat';
    events.push({ type: 'defeat', description: '💀 هزيمة... تحتاج لتعزيز قواتك' });
  }

  return { updatedState: newState, events };
}
