// ═══════════════════════════════════════════════════════════
// خريطة العالم وضباب الحرب - World Map & Fog of War
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

export type SectorType = 'plains' | 'desert' | 'mountains' | 'urban' | 'forest' | 'water' | 'hq';
export type ThreatLevel = 'low' | 'medium' | 'high' | 'fortress';
export type SectorStatus = 'fogged' | 'scouted' | 'cleared' | 'occupied';

export interface HexCoordinate {
  q: number;
  r: number;
}

export interface WorldSector {
  id: string;
  coordinate: HexCoordinate;
  type: SectorType;
  status: SectorStatus;
  threatLevel: ThreatLevel;
  enemyPower: number;
  loot: {
    scrap: number;
    fuel: number;
    intel: number;
  };
  nameAr: string;
  color: string;
}

// ═══════════════════════════════
// تكوين أنواع القطاعات
// ═══════════════════════════════

export const SECTOR_CONFIG: Record<SectorType, {
  nameAr: string;
  icon: string;
  color: string;
  fogColor: string;
  description: string;
}> = {
  plains: {
    nameAr: 'سهول',
    icon: '🌾',
    color: '#4a7c3f',
    fogColor: '#2a3a25',
    description: 'أرض منبسطة مناسبة للحركة السريعة',
  },
  desert: {
    nameAr: 'صحراء',
    icon: '🏜️',
    color: '#c4a535',
    fogColor: '#5a4a20',
    description: 'أرض قاحلة شديدة الحرارة',
  },
  mountains: {
    nameAr: 'جبال',
    icon: '⛰️',
    color: '#7a7a7a',
    fogColor: '#3a3a3a',
    description: 'تضاريس مرتفعة وعرة',
  },
  urban: {
    nameAr: 'حضري',
    icon: '🏙️',
    color: '#8b8070',
    fogColor: '#4a4540',
    description: 'منطقة مبنية بكثافة',
  },
  forest: {
    nameAr: 'غابة',
    icon: '🌲',
    color: '#2d5a1e',
    fogColor: '#1a3510',
    description: 'غابات كثيفة توفر تمويهاً طبيعياً',
  },
  water: {
    nameAr: 'مائي',
    icon: '🌊',
    color: '#2a5a8a',
    fogColor: '#152a40',
    description: 'مسطح مائي لا يمكن عبوره براً',
  },
  hq: {
    nameAr: 'المقر',
    icon: '🏰',
    color: '#c9a227',
    fogColor: '#5a4a10',
    description: 'قاعدة العمليات الرئيسية',
  },
};

export const THREAT_CONFIG: Record<ThreatLevel, {
  nameAr: string;
  color: string;
  icon: string;
  multiplier: number;
}> = {
  low: { nameAr: 'تهديد منخفض', color: '#4ade80', icon: '🟢', multiplier: 0.5 },
  medium: { nameAr: 'تهديد متوسط', color: '#fbbf24', icon: '🟡', multiplier: 1.0 },
  high: { nameAr: 'تهديد عالٍ', color: '#f97316', icon: '🟠', multiplier: 1.5 },
  fortress: { nameAr: 'حصن منيع', color: '#ef4444', icon: '🔴', multiplier: 2.5 },
};

// ═══════════════════════════════
// توليد الخريطة
// ═══════════════════════════════

const SECTOR_NAMES: Record<SectorType, string[]> = {
  plains: ['سهل الصقر', 'وادي السلام', 'مرج النور', 'حقل القمح', 'بيداء الشمس'],
  desert: ['صحراء العطش', 'كثبان الرمال', 'واحة الأمل', 'بحر الرمال', 'هضبة الجدب'],
  mountains: ['جبل الأسد', 'معبر الصعاب', 'قمة العز', 'شعاب الظلام', 'سلسلة الحديد'],
  urban: ['مدينة الأشباح', 'المركز التجاري', 'الحي الصناعي', 'حصن المدينة', 'الضاحية الشرقية'],
  forest: ['غابة الظل', 'أحراج الضباب', 'غابة الصنوبر', 'حظيرة الذئاب', 'الأدغال الكثيفة'],
  water: ['بحيرة السكون', 'نهر القطعان', 'المضيق الخطر', 'الخليج المجهول', 'مصب النهر'],
  hq: ['المقر الرئيسي'],
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * توليد خريطة عالم قطاعية سداسية
 * @param radius نصف قطر الخريطة (عدد الحلقات حول المركز)
 * @param seed بذرة عشوائية
 */
export function generateWorldMap(radius: number = 4, seed: number = 42): WorldSector[] {
  const random = seededRandom(seed);
  const sectors: WorldSector[] = [];

  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;

      const isCenter = q === 0 && r === 0;

      // توزيع أنواع القطاعات بناءً على المسافة من المركز
      const distFromCenter = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      let type: SectorType;

      if (isCenter) {
        type = 'hq';
      } else if (distFromCenter === 1) {
        // الحلقة الأولى: سهول وغابات
        type = random() > 0.4 ? 'plains' : 'forest';
      } else if (distFromCenter === 2) {
        // الحلقة الثانية: تنوع أكبر
        const roll = random();
        if (roll < 0.25) type = 'plains';
        else if (roll < 0.45) type = 'forest';
        else if (roll < 0.65) type = 'desert';
        else if (roll < 0.8) type = 'mountains';
        else type = 'urban';
      } else if (distFromCenter === 3) {
        const roll = random();
        if (roll < 0.15) type = 'plains';
        else if (roll < 0.3) type = 'forest';
        else if (roll < 0.45) type = 'desert';
        else if (roll < 0.6) type = 'mountains';
        else if (roll < 0.75) type = 'urban';
        else if (roll < 0.88) type = 'water';
        else type = 'mountains';
      } else {
        const roll = random();
        if (roll < 0.1) type = 'plains';
        else if (roll < 0.2) type = 'desert';
        else if (roll < 0.4) type = 'mountains';
        else if (roll < 0.55) type = 'urban';
        else if (roll < 0.7) type = 'water';
        else type = random() > 0.5 ? 'mountains' : 'forest';
      }

      // تحديد مستوى التهديد
      let threatLevel: ThreatLevel;
      if (isCenter) {
        threatLevel = 'low';
      } else {
        const threatRoll = random();
        if (distFromCenter <= 1) {
          threatLevel = 'low';
        } else if (distFromCenter === 2) {
          threatLevel = threatRoll < 0.6 ? 'low' : 'medium';
        } else if (distFromCenter === 3) {
          threatLevel = threatRoll < 0.2 ? 'low' : threatRoll < 0.6 ? 'medium' : 'high';
        } else {
          threatLevel = threatRoll < 0.1 ? 'medium' : threatRoll < 0.5 ? 'high' : 'fortress';
        }
      }

      const names = SECTOR_NAMES[type];
      const name = names[Math.floor(random() * names.length)];

      const enemyPower = Math.floor(
        (50 + random() * 200) * THREAT_CONFIG[threatLevel].multiplier * (distFromCenter * 0.5)
      );

      sectors.push({
        id: `sector_${q}_${r}`,
        coordinate: { q, r },
        type,
        status: isCenter ? 'occupied' : 'fogged',
        threatLevel,
        enemyPower: isCenter ? 0 : enemyPower,
        loot: {
          scrap: Math.floor((30 + random() * 100) * distFromCenter),
          fuel: Math.floor((20 + random() * 70) * distFromCenter),
          intel: Math.floor((5 + random() * 30) * distFromCenter),
        },
        nameAr: name,
        color: SECTOR_CONFIG[type].color,
      });
    }
  }

  // كشف القطاعات المجاورة للمقر تلقائياً
  const hq = sectors.find(s => s.type === 'hq');
  if (hq) {
    sectors.forEach(sector => {
      const dist = hexDistance(hq.coordinate, sector.coordinate);
      if (dist <= 1 && sector.status === 'fogged') {
        sector.status = 'scouted';
      }
    });
  }

  return sectors;
}

// ═══════════════════════════════
// أدوات الحساب السداسية
// ═══════════════════════════════

export function hexDistance(a: HexCoordinate, b: HexCoordinate): number {
  return (
    Math.abs(a.q - b.q) +
    Math.abs(a.r - b.r) +
    Math.abs((-a.q - a.r) - (-b.q - b.r))
  ) / 2;
}

export function hexToWorldPosition(q: number, r: number, size: number = 1): [number, number] {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (1.5 * r);
  return [x, y];
}

/**
 * استطلاع قطاع - يستهلك موارد المعلومات
 */
export function scoutSector(
  sectors: WorldSector[],
  sectorId: string,
  currentIntel: number,
  scoutCost: number = 15
): { success: boolean; newIntel: number; updatedSectors: WorldSector[] } | null {
  const sector = sectors.find(s => s.id === sectorId);
  if (!sector || sector.status !== 'fogged') return null;
  if (currentIntel < scoutCost) return { success: false, newIntel: currentIntel, updatedSectors: sectors };

  return {
    success: true,
    newIntel: currentIntel - scoutCost,
    updatedSectors: sectors.map(s =>
      s.id === sectorId ? { ...s, status: 'scouted' as SectorStatus } : s
    ),
  };
}

/**
 * الحصول على القطاعات المكتشفة (غير المضببة)
 */
export function getRevealedSectors(sectors: WorldSector[]): WorldSector[] {
  return sectors.filter(s => s.status !== 'fogged');
}

/**
 * عدد القطاعات الإحصائي
 */
export function getMapStatistics(sectors: WorldSector[]) {
  return {
    total: sectors.length,
    fogged: sectors.filter(s => s.status === 'fogged').length,
    scouted: sectors.filter(s => s.status === 'scouted').length,
    cleared: sectors.filter(s => s.status === 'cleared').length,
    occupied: sectors.filter(s => s.status === 'occupied').length,
  };
}
