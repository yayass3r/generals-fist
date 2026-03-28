// ═══════════════════════════════════════════════════════════
// نظام الطقس والوقت والتعب - Weather, Time & Fatigue System
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

import type { TroopType } from './battle-engine';

// ═══════════════════════════════
// نظام الطقس
// ═══════════════════════════════

export type WeatherType = 'clear' | 'rain' | 'fog' | 'snow' | 'sandstorm' | 'storm';

export interface WeatherConfig {
  id: WeatherType;
  nameAr: string;
  icon: string;
  description: string;
  // تأثيرات على أنواع القوات
  infantryModifier: { attack: number; defense: number; speed: number; vision: number };
  armorModifier: { attack: number; defense: number; speed: number; vision: number };
  aviationModifier: { attack: number; defense: number; speed: number; vision: number };
  canFly: boolean;
  minDuration: number; // بالدقائق
  maxDuration: number;
  transitionChance: number; // احتمالية التغيير لكل دقيقة
  skyColor: string;
  fogDensity: number; // 0-1
}

export const WEATHER_CONFIG: Record<WeatherType, WeatherConfig> = {
  clear: {
    id: 'clear',
    nameAr: 'صافي',
    icon: '☀️',
    description: 'طقس مثالي - لا تأثيرات سلبية',
    infantryModifier: { attack: 1.0, defense: 1.0, speed: 1.0, vision: 1.0 },
    armorModifier: { attack: 1.0, defense: 1.0, speed: 1.0, vision: 1.0 },
    aviationModifier: { attack: 1.1, defense: 1.0, speed: 1.0, vision: 1.2 },
    canFly: true,
    minDuration: 180, maxDuration: 360,
    transitionChance: 0.005,
    skyColor: '#87ceeb',
    fogDensity: 0,
  },
  rain: {
    id: 'rain',
    nameAr: 'مطر',
    icon: '🌧️',
    description: 'مطر غزير - طين يبطئ المدرعات',
    infantryModifier: { attack: 0.9, defense: 0.85, speed: 0.8, vision: 0.7 },
    armorModifier: { attack: 0.85, defense: 0.9, speed: 0.6, vision: 0.6 },
    aviationModifier: { attack: 0.5, defense: 0.7, speed: 0.7, vision: 0.4 },
    canFly: false,
    minDuration: 90, maxDuration: 240,
    transitionChance: 0.008,
    skyColor: '#5a6a7a',
    fogDensity: 0.15,
  },
  fog: {
    id: 'fog',
    nameAr: 'ضباب',
    icon: '🌫️',
    description: 'ضباب كثيف - رؤية شبه معدومة',
    infantryModifier: { attack: 0.7, defense: 1.1, speed: 0.8, vision: 0.3 },
    armorModifier: { attack: 0.6, defense: 1.0, speed: 0.7, vision: 0.4 },
    aviationModifier: { attack: 0.2, defense: 0.5, speed: 0.5, vision: 0.1 },
    canFly: false,
    minDuration: 60, maxDuration: 150,
    transitionChance: 0.01,
    skyColor: '#8a9aaa',
    fogDensity: 0.6,
  },
  snow: {
    id: 'snow',
    nameAr: 'ثلج',
    icon: '❄️',
    description: 'ثلج كثيف - حركة بطيئة جداً',
    infantryModifier: { attack: 0.8, defense: 0.8, speed: 0.6, vision: 0.6 },
    armorModifier: { attack: 0.75, defense: 0.85, speed: 0.4, vision: 0.5 },
    aviationModifier: { attack: 0.4, defense: 0.5, speed: 0.5, vision: 0.3 },
    canFly: true,
    minDuration: 120, maxDuration: 360,
    transitionChance: 0.006,
    skyColor: '#b0c4d0',
    fogDensity: 0.2,
  },
  sandstorm: {
    id: 'sandstorm',
    nameAr: 'عاصفة رملية',
    icon: '🌪️',
    description: 'رمال تطمر كل شيء - كارثي',
    infantryModifier: { attack: 0.5, defense: 0.4, speed: 0.3, vision: 0.15 },
    armorModifier: { attack: 0.4, defense: 0.5, speed: 0.2, vision: 0.2 },
    aviationModifier: { attack: 0.1, defense: 0.2, speed: 0.3, vision: 0.05 },
    canFly: false,
    minDuration: 60, maxDuration: 210,
    transitionChance: 0.007,
    skyColor: '#c4a050',
    fogDensity: 0.5,
  },
  storm: {
    id: 'storm',
    nameAr: 'عاصفة',
    icon: '🌀',
    description: 'عاصفة رعدية - لا حركة ممكنة',
    infantryModifier: { attack: 0.3, defense: 0.3, speed: 0.2, vision: 0.2 },
    armorModifier: { attack: 0.2, defense: 0.4, speed: 0.1, vision: 0.2 },
    aviationModifier: { attack: 0.05, defense: 0.1, speed: 0.1, vision: 0.05 },
    canFly: false,
    minDuration: 20, maxDuration: 60,
    transitionChance: 0.015,
    skyColor: '#2a3040',
    fogDensity: 0.4,
  },
};

/**
 * الحصول على معاملات الطقس لنوع قوات محدد
 */
export function getWeatherModifiers(weather: WeatherType, troopType: TroopType): {
  attack: number;
  defense: number;
  speed: number;
  vision: number;
  canOperate: boolean;
} {
  const config = WEATHER_CONFIG[weather];

  const modifiers = troopType === 'infantry'
    ? config.infantryModifier
    : troopType === 'armor'
      ? config.armorModifier
      : config.aviationModifier;

  return {
    ...modifiers,
    canOperate: troopType !== 'aviation' || config.canFly,
  };
}

// ═══════════════════════════════
// نظام الوقت الحقيقي (24 ساعة)
// ═══════════════════════════════

export type TimePeriod = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeOfDayConfig {
  nameAr: string;
  icon: string;
  hours: [number, number]; // [بداية, نهاية] 24 ساعة
  visionModifier: number;
  attackModifier: number;
  aviationModifier: number;
  surpriseBonus: number; // مكافأة المفاجأة
  skyColor: string;
  lightIntensity: number;
  ambientIntensity: number;
  fogColor: string;
  description: string;
}

export const TIME_PERIODS: Record<TimePeriod, TimeOfDayConfig> = {
  dawn: {
    nameAr: 'فجر',
    icon: '🌅',
    hours: [5, 8],
    visionModifier: 0.6,
    attackModifier: 1.15, // هجوم الفجر مفاجئ
    aviationModifier: 0.8,
    surpriseBonus: 15, // +15% ضرر من المفاجأة
    skyColor: '#d4826a',
    lightIntensity: 0.7,
    ambientIntensity: 0.3,
    fogColor: '#7a6050',
    description: 'رؤية محدودة لكن هجوم الفجر فعّال',
  },
  day: {
    nameAr: 'نهار',
    icon: '☀️',
    hours: [8, 16],
    visionModifier: 1.0,
    attackModifier: 1.0,
    aviationModifier: 1.2, // أفضل وقت للطيران
    surpriseBonus: 0,
    skyColor: '#87ceeb',
    lightIntensity: 1.2,
    ambientIntensity: 0.5,
    fogColor: '#c8dce8',
    description: 'رؤية كاملة - الطيران في ذروة أدائه',
  },
  dusk: {
    nameAr: 'غسق',
    icon: '🌆',
    hours: [16, 19],
    visionModifier: 0.5,
    attackModifier: 0.9,
    aviationModifier: 0.7,
    surpriseBonus: 5,
    skyColor: '#c87050',
    lightIntensity: 0.5,
    ambientIntensity: 0.25,
    fogColor: '#5a4040',
    description: 'رؤية مت decreasingة - الطيران يضعف',
  },
  night: {
    nameAr: 'ليل',
    icon: '🌙',
    hours: [19, 5],
    visionModifier: 0.3,
    attackModifier: 0.85,
    aviationModifier: 0.4,
    surpriseBonus: 20, // أكبر مكافأة مفاجأة
    skyColor: '#0a1628',
    lightIntensity: 0.3,
    ambientIntensity: 0.15,
    fogColor: '#0a1020',
    description: 'رؤية ضعيفة - لكن الكمائن فعّالة جداً',
  },
};

/**
 * تحديد فترة اليوم بناءً على الساعة (0-23)
 */
export function getTimePeriod(hour: number): TimeOfDayConfig {
  if (hour >= 5 && hour < 8) return TIME_PERIODS.dawn;
  if (hour >= 8 && hour < 16) return TIME_PERIODS.day;
  if (hour >= 16 && hour < 19) return TIME_PERIODS.dusk;
  return TIME_PERIODS.night;
}

// ═══════════════════════════════
// نظام التعب والإرهاق (Fatigue)
// ═══════════════════════════════

export type FatigueLevel = 'fresh' | 'tired' | 'exhausted' | 'spent';

export interface FatigueState {
  value: number; // 0-100
  level: FatigueLevel;
  performanceModifier: number;
  nameAr: string;
  icon: string;
  color: string;
}

export const FATIGUE_CONFIG: Record<FatigueLevel, {
  range: [number, number];
  nameAr: string;
  icon: string;
  color: string;
  performance: number;
}> = {
  fresh: { range: [0, 25], nameAr: 'طازج', icon: '✨', color: '#4ade80', performance: 1.0 },
  tired: { range: [25, 50], nameAr: 'متعب', icon: '😴', color: '#fbbf24', performance: 0.85 },
  exhausted: { range: [50, 75], nameAr: 'مرهق', icon: '😵', color: '#f97316', performance: 0.6 },
  spent: { range: [75, 100], nameAr: 'مُنهَك', icon: '💀', color: '#ef4444', performance: 0.3 },
};

/**
 * تحديث التعب أثناء القتال
 * يزداد 10 نقاط كل 4 ساعات قتال
 */
export function updateFatigue(current: number, combatSeconds: number, isResting: boolean): FatigueState {
  let delta = 0;

  if (isResting) {
    // راحة: -5 نقاط لكل ساعة
    delta = -(combatSeconds / 3600) * 5;
  } else {
    // قتال: +10 نقاط كل 4 ساعات
    delta = (combatSeconds / 3600) * 2.5;
  }

  const newValue = Math.max(0, Math.min(100, current + delta));
  return getFatigueState(newValue);
}

/**
 * تحويل القيمة لحالة التعب
 */
export function getFatigueState(value: number): FatigueState {
  const clamped = Math.max(0, Math.min(100, value));
  let level: FatigueLevel;

  if (clamped < 25) level = 'fresh';
  else if (clamped < 50) level = 'tired';
  else if (clamped < 75) level = 'exhausted';
  else level = 'spent';

  const config = FATIGUE_CONFIG[level];

  return {
    value: clamped,
    level,
    performanceModifier: config.performance,
    nameAr: config.nameAr,
    icon: config.icon,
    color: config.color,
  };
}

// ═══════════════════════════════
// محرك الطقس الديناميكي
// ═══════════════════════════════

export interface WeatherState {
  current: WeatherType;
  elapsedMinutes: number;
  durationMinutes: number;
}

/**
 * محاكاة تغير الطقس
 * يُستدعى كل دقيقة لتحديث الطقس
 */
export function tickWeather(state: WeatherState): WeatherState {
  const elapsed = state.elapsedMinutes + 1;

  // هل انتهت مدة الطقس الحالي؟
  if (elapsed >= state.durationMinutes) {
    return transitionWeather(state.current);
  }

  // احتمالية تغيير مفاجئ
  if (Math.random() < WEATHER_CONFIG[state.current].transitionChance) {
    return transitionWeather(state.current);
  }

  return { ...state, elapsedMinutes: elapsed };
}

function transitionWeather(from: WeatherType): WeatherState {
  const weathers: WeatherType[] = ['clear', 'rain', 'fog', 'snow', 'sandstorm', 'storm'];

  // أوزان الانتقال (طقس واقعي)
  const weights: Record<WeatherType, Record<WeatherType, number>> = {
    clear:    { clear: 3, rain: 2, fog: 1, snow: 0.5, sandstorm: 0.5, storm: 0.2 },
    rain:     { clear: 1, rain: 2, fog: 2, snow: 1, sandstorm: 0.1, storm: 0.5 },
    fog:      { clear: 2, rain: 1, fog: 2, snow: 0.5, sandstorm: 0.3, storm: 0.1 },
    snow:     { clear: 1, rain: 0.5, fog: 1, snow: 3, sandstorm: 0, storm: 0.2 },
    sandstorm:{ clear: 2, rain: 0.2, fog: 0.5, snow: 0, sandstorm: 2, storm: 0.3 },
    storm:    { clear: 1, rain: 3, fog: 1, snow: 0.5, sandstorm: 0, storm: 1 },
  };

  const options = weathers.filter(w => w !== from);
  const totalWeight = options.reduce((sum, w) => sum + weights[from][w], 0);
  let roll = Math.random() * totalWeight;

  let next: WeatherType = 'clear';
  for (const w of options) {
    roll -= weights[from][w];
    if (roll <= 0) { next = w; break; }
  }

  const config = WEATHER_CONFIG[next];
  const duration = config.minDuration + Math.random() * (config.maxDuration - config.minDuration);

  return {
    current: next,
    elapsedMinutes: 0,
    durationMinutes: Math.floor(duration),
  };
}
