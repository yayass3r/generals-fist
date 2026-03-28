// ═══════════════════════════════════════════════════════════
// واجهة غرفة العمليات المحسّنة - Enhanced War Room UI
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useGameStore } from '@/store/game-store';
import {
  TROOP_CONFIGS,
  TERRAIN_CONFIG,
  TIME_CONFIG,
  type TerrainType,
  type TimeOfDay,
  type TroopType,
} from '@/lib/battle-engine';

export default function WarRoomUI() {
  const terrain = useGameStore((s) => s.terrain);
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const setTerrain = useGameStore((s) => s.setTerrain);
  const setTimeOfDay = useGameStore((s) => s.setTimeOfDay);
  const selectedTroopType = useGameStore((s) => s.selectedTroopType);
  const selectTroopType = useGameStore((s) => s.selectTroopType);
  const waves = useGameStore((s) => s.waves);
  const assignTroopToWave = useGameStore((s) => s.assignTroopToWave);
  const removeTroopFromWave = useGameStore((s) => s.removeTroopFromWave);
  const increaseTroopCount = useGameStore((s) => s.increaseTroopCount);
  const decreaseTroopCount = useGameStore((s) => s.decreaseTroopCount);
  const resetDeployment = useGameStore((s) => s.resetDeployment);
  const powerBreakdown = useGameStore((s) => s.powerBreakdown);
  const companies = useGameStore((s) => s.companies);
  const selectedSector = useGameStore((s) => s.selectedSector);
  const attackSector = useGameStore((s) => s.attackSector);
  const setScreen = useGameStore((s) => s.setScreen);

  const hasTroops = waves.some(w => w.some(s => s.troopType !== null));

  // حساب القوات المتاحة من الثكنات
  const availableTroops: Record<TroopType, number> = {
    infantry: companies.filter(c => c.troopType === 'infantry').reduce((s, c) => s + c.squads.reduce((ss, sq) => ss + sq.size, 0), 0),
    armor: companies.filter(c => c.troopType === 'armor').reduce((s, c) => s + c.squads.reduce((ss, sq) => ss + sq.size, 0), 0),
    aviation: companies.filter(c => c.troopType === 'aviation').reduce((s, c) => s + c.squads.reduce((ss, sq) => ss + sq.size, 0), 0),
  };

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none" dir="rtl">
      {/* الشريط العلوي */}
      <div className="pointer-events-auto p-3 space-y-2">
        <h1 className="text-sm font-black text-[#c9a227] text-center">⚔️ غرفة العمليات ⚔️</h1>
      </div>

      <div className="flex-1" />

      {/* لوحة التحكم */}
      <div
        className="pointer-events-auto rounded-t-3xl p-4 pt-5 space-y-3 overflow-y-auto relative"
        style={{
          maxHeight: '58vh',
          background: 'linear-gradient(180deg, rgba(8,12,24,0.92), rgba(5,8,18,0.98))',
          borderTop: '1px solid rgba(201,162,39,0.15)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1.5 w-10 h-1 rounded-full" style={{ background: 'rgba(201,162,39,0.3)' }} />

        {/* التضاريس */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-white/60">🏞️ التضاريس</div>
          <div className="grid grid-cols-4 gap-1.5">
            {(['plains', 'desert', 'mountains', 'urban'] as TerrainType[]).map((t) => {
              const config = TERRAIN_CONFIG[t];
              const isActive = terrain === t;
              return (
                <button key={t} onClick={() => setTerrain(t)}
                  className="p-2 rounded-xl text-center transition-all"
                  style={{
                    background: isActive ? `${config.baseColor}25` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isActive ? config.baseColor : 'rgba(255,255,255,0.06)'}`,
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  <div className="text-base">{config.icon}</div>
                  <div className="text-[8px] font-bold text-white">{config.nameAr}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* التوقيت */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-white/60">⏰ التوقيت</div>
          <div className="flex gap-1.5">
            {(['day', 'night'] as TimeOfDay[]).map((t) => {
              const config = TIME_CONFIG[t];
              const isActive = timeOfDay === t;
              return (
                <button key={t} onClick={() => setTimeOfDay(t)}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all"
                  style={{
                    background: isActive ? (t === 'day' ? 'rgba(255,200,50,0.12)' : 'rgba(30,50,100,0.3)') : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isActive ? (t === 'day' ? '#c9a227' : '#4466aa') : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-lg">{config.icon}</span>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white">{config.nameAr}</div>
                    <div className="text-[8px] text-white/30">×{config.globalMultiplier}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* القوات */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-white/60">🎖️ القوات المتاحة</div>
          <div className="flex gap-1.5">
            {(['infantry', 'armor', 'aviation'] as TroopType[]).map((type) => {
              const config = TROOP_CONFIGS[type];
              const isActive = selectedTroopType === type;
              return (
                <button key={type} onClick={() => selectTroopType(isActive ? null : type)}
                  className="flex-1 p-2 rounded-xl text-center transition-all"
                  style={{
                    background: isActive ? `${config.color}25` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${isActive ? config.color : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="text-lg">{config.icon}</div>
                  <div className="text-[9px] font-bold text-white">{config.nameAr}</div>
                  <div className="text-[9px] text-white/40">×{availableTroops[type]}</div>
                </button>
              );
            })}
          </div>
          {availableTroops.infantry + availableTroops.armor + availableTroops.aviation === 0 && (
            <button
              onClick={() => setScreen('barracks')}
              className="w-full text-[9px] py-2 rounded-lg text-center"
              style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', color: '#c9a227' }}
            >
              ➡️ اذهب للثكنات لتجنيد القوات
            </button>
          )}
        </div>

        {/* القوة الفعالة */}
        {powerBreakdown && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-white/60">⚡ القوة الفعالة</div>
              <div className="text-[8px] text-white/20">
                تضاريس ×{powerBreakdown.terrainModifier} · توقيت ×{powerBreakdown.timeModifier}
              </div>
            </div>
            <div className="rounded-xl p-3 text-center relative overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201,162,39,0.15)' }}>
              <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 80%, ${powerBreakdown.totalPower > 1000 ? '#4ade80' : powerBreakdown.totalPower > 0 ? '#fbbf24' : '#ef4444'}, transparent)` }} />
              <div className="relative text-2xl font-black tabular-nums" style={{ color: powerBreakdown.totalPower > 1000 ? '#4ade80' : powerBreakdown.totalPower > 0 ? '#fbbf24' : '#ef4444' }}>
                {powerBreakdown.totalPower.toLocaleString('ar-EG')}
              </div>
              <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (powerBreakdown.totalPower / 5000) * 100)}%`, background: powerBreakdown.totalPower > 1000 ? '#4ade80' : powerBreakdown.totalPower > 0 ? '#fbbf24' : '#ef4444' }} />
              </div>
            </div>
          </div>
        )}

        {/* الموجات */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-white/60">🌊 الموجات الهجومية</div>
            <button onClick={resetDeployment} className="text-[8px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>إعادة</button>
          </div>
          {waves.map((wave, wi) => (
            <div key={wi} className="space-y-1">
              <div className="text-[8px] text-white/30">الموجة {wi + 1}</div>
              <div className="flex gap-1">
                {wave.map((slot, si) => (
                  <div key={si} className="flex-1">
                    {slot.troopType ? (
                      <div className="flex items-center justify-between p-1.5 rounded-lg" style={{ background: `${TROOP_CONFIGS[slot.troopType].color}15`, border: `1px solid ${TROOP_CONFIGS[slot.troopType].color}30` }}>
                        <span className="text-xs">{TROOP_CONFIGS[slot.troopType].icon}</span>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => decreaseTroopCount(wi, si)} className="w-5 h-5 rounded text-white/40 hover:text-white text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>−</button>
                          <span className="text-[9px] font-bold text-white min-w-[16px] text-center">{slot.count}</span>
                          <button onClick={() => increaseTroopCount(wi, si)} className="w-5 h-5 rounded text-white/40 hover:text-white text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>+</button>
                          <button onClick={() => removeTroopFromWave(wi, si)} className="w-5 h-5 rounded text-red-400/40 hover:text-red-400 text-xs" style={{ background: 'rgba(255,255,255,0.05)' }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => assignTroopToWave(wi, si)}
                        className={`w-full p-2 rounded-lg border border-dashed text-[9px] transition-all ${selectedTroopType ? 'border-[#c9a227]/30 bg-[#c9a227]/5' : 'border-white/8 opacity-20'}`}
                      >
                        {selectedTroopType ? `+ ${TROOP_CONFIGS[selectedTroopType].nameAr}` : 'فارغ'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* زر الهجوم */}
        <button
          onClick={() => {
            if (selectedSector) {
              attackSector(selectedSector.id);
            } else {
              setScreen('world-map');
            }
          }}
          disabled={!hasTroops}
          className="w-full py-3.5 rounded-xl text-sm font-black transition-all overflow-hidden relative"
          style={{
            background: hasTroops ? 'linear-gradient(135deg, #8b2500, #a03000)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${hasTroops ? '#c94020' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: hasTroops ? '0 4px 20px rgba(180,50,20,0.3)' : 'none',
            color: hasTroops ? '#fff' : 'rgba(255,255,255,0.2)',
          }}
        >
          {!hasTroops && <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,200,100,0.2), transparent)', animation: 'sweepGlow 2s infinite linear' }} />}
          <span className="relative z-10">⚔️ {selectedSector ? 'بدء الهجوم على ' + selectedSector.nameAr : 'اختر هدف من الخريطة'}</span>
          {powerBreakdown && powerBreakdown.totalPower > 0 && (
            <div className="relative z-10 text-[9px] opacity-50 mt-0.5">القوة: {powerBreakdown.totalPower.toLocaleString('ar-EG')}</div>
          )}
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
