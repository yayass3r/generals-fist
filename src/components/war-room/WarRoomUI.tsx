// ═══════════════════════════════════════════════════════════
// واجهة غرفة العمليات - War Room UI
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useWarRoomStore } from '@/store/war-room';
import {
  TROOP_CONFIGS,
  TERRAIN_CONFIG,
  TIME_CONFIG,
  type TerrainType,
  type TimeOfDay,
  type TroopType,
} from '@/lib/battle-engine';

// ═══════════════════════════════
// شريط الموارد العلوي
// ═══════════════════════════════

function ResourceBar() {
  const resources = useWarRoomStore((s) => s.resources);

  return (
    <div className="flex gap-3 justify-center">
      <ResourceItem icon="⚙️" label="خردة" value={resources.scrap} color="#c9a227" />
      <ResourceItem icon="⛽" label="وقود" value={resources.fuel} color="#e07020" />
      <ResourceItem icon="📋" label="معلومات" value={resources.intel} color="#40a0e0" />
    </div>
  );
}

function ResourceItem({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${color}40`,
      }}
    >
      <span className="text-base">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] opacity-60" style={{ color }}>{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {value.toLocaleString('ar-EG')}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// محدد التضاريس
// ═══════════════════════════════

function TerrainSelector() {
  const terrain = useWarRoomStore((s) => s.terrain);
  const setTerrain = useWarRoomStore((s) => s.setTerrain);

  const terrains: TerrainType[] = ['plains', 'desert', 'mountains', 'urban'];

  return (
    <div className="space-y-2">
      <SectionTitle title="地形 التضاريس" subtitle="اختر نوع أرض المعركة" />
      <div className="grid grid-cols-2 gap-2">
        {terrains.map((t) => {
          const config = TERRAIN_CONFIG[t];
          const isActive = terrain === t;
          return (
            <button
              key={t}
              onClick={() => setTerrain(t)}
              className={`relative flex items-center gap-2 p-2.5 rounded-xl text-right transition-all duration-300 ${
                isActive
                  ? 'scale-[1.02] shadow-lg'
                  : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${config.baseColor}40, ${config.baseColor}20)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isActive ? config.baseColor : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isActive ? `0 0 20px ${config.baseColor}30` : 'none',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: `${config.baseColor}30`,
                  border: `1px solid ${config.baseColor}50`,
                }}
              >
                {config.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate">{config.nameAr}</div>
                <div className="text-[9px] opacity-50 text-white/60 truncate">{config.description.slice(0, 30)}</div>
              </div>
              {isActive && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: config.baseColor }}
                >
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// محدد التوقيت
// ═══════════════════════════════

function TimeSelector() {
  const timeOfDay = useWarRoomStore((s) => s.timeOfDay);
  const setTimeOfDay = useWarRoomStore((s) => s.setTimeOfDay);

  const times: TimeOfDay[] = ['day', 'night'];

  return (
    <div className="space-y-2">
      <SectionTitle title="⏰ التوقيت" subtitle="حدد وقت الهجوم" />
      <div className="flex gap-2">
        {times.map((t) => {
          const config = TIME_CONFIG[t];
          const isActive = timeOfDay === t;
          return (
            <button
              key={t}
              onClick={() => setTimeOfDay(t)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                isActive ? 'scale-[1.02]' : 'opacity-50 hover:opacity-70'
              }`}
              style={{
                background: isActive
                  ? t === 'day'
                    ? 'linear-gradient(135deg, rgba(255,200,50,0.2), rgba(255,150,30,0.1))'
                    : 'linear-gradient(135deg, rgba(30,50,100,0.4), rgba(20,30,70,0.3))'
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isActive ? (t === 'day' ? '#c9a227' : '#4466aa') : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isActive
                  ? `0 0 20px ${t === 'day' ? 'rgba(200,160,40,0.3)' : 'rgba(40,60,140,0.3)'}`
                  : 'none',
              }}
            >
              <span className="text-xl">{config.icon}</span>
              <div className="text-right">
                <div className="text-xs font-bold text-white">{config.nameAr}</div>
                <div className="text-[9px] opacity-50 text-white/60">
                  ×{config.globalMultiplier} قوة
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// مقياس القوة الفعالة
// ═══════════════════════════════

function PowerMeter() {
  const powerBreakdown = useWarRoomStore((s) => s.powerBreakdown);
  const showBreakdown = useWarRoomStore((s) => s.showBreakdown);
  const toggleBreakdown = useWarRoomStore((s) => s.toggleBreakdown);

  if (!powerBreakdown) return null;

  const maxPower = 5000;
  const percentage = Math.min(100, (powerBreakdown.totalPower / maxPower) * 100);
  const barColor =
    percentage > 70 ? '#4ade80' : percentage > 40 ? '#fbbf24' : percentage > 15 ? '#f97316' : '#ef4444';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionTitle title="⚡ القوة الفعالة" subtitle="القوة الإجمالية لقواتك" />
        <button
          onClick={toggleBreakdown}
          className="text-[9px] px-2 py-1 rounded-md opacity-50 hover:opacity-80 transition-opacity"
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#c9a227',
          }}
        >
          {showBreakdown ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
        </button>
      </div>

      {/* الرقم الرئيسي */}
      <div
        className="relative rounded-xl p-4 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
          border: `1px solid ${barColor}40`,
        }}
      >
        {/* توهج خلفي */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 80%, ${barColor}, transparent 70%)`,
          }}
        />

        <div className="relative">
          <div className="text-3xl font-black tabular-nums tracking-wide" style={{ color: barColor }}>
            {powerBreakdown.totalPower.toLocaleString('ar-EG')}
          </div>
          <div className="text-[10px] opacity-40 text-white/60 mt-1">قوة قتالية إجمالية</div>
        </div>

        {/* شريط التقدم */}
        <div className="relative mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${barColor}80, ${barColor})`,
              boxShadow: `0 0 12px ${barColor}60`,
            }}
          />
        </div>
      </div>

      {/* تفاصيل القوة */}
      {showBreakdown && (
        <div
          className="rounded-xl p-3 space-y-2 text-[10px]"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex justify-between text-white/70">
            <span>القوة الأساسية</span>
            <span className="font-bold text-white">{powerBreakdown.basePower.toLocaleString('ar-EG')}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>مكافأة التضاريس (×{powerBreakdown.terrainModifier})</span>
            <span className="font-bold" style={{ color: powerBreakdown.terrainBonus >= 0 ? '#4ade80' : '#ef4444' }}>
              {powerBreakdown.terrainBonus >= 0 ? '+' : ''}{powerBreakdown.terrainBonus.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>معامل التوقيت (×{powerBreakdown.timeModifier})</span>
            <span className="font-bold" style={{ color: powerBreakdown.timeBonus >= 0 ? '#4ade80' : '#ef4444' }}>
              {powerBreakdown.timeBonus >= 0 ? '+' : ''}{powerBreakdown.timeBonus.toLocaleString('ar-EG')}
            </span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>مكافأة الموجات (×{powerBreakdown.waveBonus})</span>
            <span className="font-bold text-[#c9a227]">استراتيجي</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
            <span className="text-white">الإجمالي</span>
            <span style={{ color: barColor }}>{powerBreakdown.totalPower.toLocaleString('ar-EG')}</span>
          </div>

          {/* تفصيل القوات */}
          <div className="border-t border-white/10 pt-2 space-y-1">
            {Object.entries(powerBreakdown.details).map(([type, detail]) => {
              if (detail.count === 0) return null;
              const config = TROOP_CONFIGS[type as TroopType];
              return (
                <div key={type} className="flex justify-between text-white/60">
                  <span>{config.icon} {config.nameAr} (×{detail.count})</span>
                  <span className="text-white/80">{detail.power.toLocaleString('ar-EG')}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════
// لوحة اختيار القوات
// ═══════════════════════════════

function TroopSelector() {
  const selectedTroopType = useWarRoomStore((s) => s.selectedTroopType);
  const selectTroopType = useWarRoomStore((s) => s.selectTroopType);
  const troops = useWarRoomStore((s) => s.troops);

  const troopTypes: TroopType[] = ['infantry', 'armor', 'aviation'];

  return (
    <div className="space-y-2">
      <SectionTitle title="🎖️ القوات المتاحة" subtitle="اختر ثم اضغط على الموجات" />
      <div className="flex gap-2">
        {troopTypes.map((type) => {
          const config = TROOP_CONFIGS[type];
          const isActive = selectedTroopType === type;
          const available = troops[type];
          return (
            <button
              key={type}
              onClick={() => selectTroopType(isActive ? null : type)}
              className={`flex-1 p-2.5 rounded-xl text-center transition-all duration-300 ${
                isActive ? 'scale-[1.03]' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${config.color}40, ${config.color}20)`
                  : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isActive ? config.color : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isActive ? `0 0 15px ${config.color}30` : 'none',
              }}
            >
              <div className="text-2xl mb-1">{config.icon}</div>
              <div className="text-[10px] font-bold text-white">{config.nameAr}</div>
              <div className="text-[10px] text-white/50">×{available}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// خانات نشر الموجات
// ═══════════════════════════════

function WaveSlots() {
  const waves = useWarRoomStore((s) => s.waves);
  const selectedTroopType = useWarRoomStore((s) => s.selectedTroopType);
  const assignTroopToWave = useWarRoomStore((s) => s.assignTroopToWave);
  const removeTroopFromWave = useWarRoomStore((s) => s.removeTroopFromWave);
  const increaseTroopCount = useWarRoomStore((s) => s.increaseTroopCount);
  const decreaseTroopCount = useWarRoomStore((s) => s.decreaseTroopCount);
  const resetDeployment = useWarRoomStore((s) => s.resetDeployment);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SectionTitle title="🌊 الموجات الهجومية" subtitle="وزع قواتك على 3 موجات" />
        <button
          onClick={resetDeployment}
          className="text-[9px] px-2 py-1 rounded-md opacity-50 hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#ef4444' }}
        >
          إعادة تعيين
        </button>
      </div>

      <div className="space-y-2">
        {waves.map((wave, waveIndex) => {
          const hasTroops = wave.some((s) => s.troopType !== null);
          return (
            <div
              key={waveIndex}
              className="rounded-xl p-2.5 space-y-1.5"
              style={{
                background: hasTroops ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hasTroops ? 'rgba(201,162,39,0.2)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/70">
                  الموجة {waveIndex + 1}
                </span>
                {hasTroops && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    نشطة
                  </span>
                )}
              </div>

              <div className="flex gap-1.5">
                {wave.map((slot, slotIndex) => (
                  <div
                    key={slotIndex}
                    className="flex-1"
                  >
                    {slot.troopType ? (
                      // مربع ممتلئ
                      <div
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{
                          background: `${TROOP_CONFIGS[slot.troopType].color}20`,
                          border: `1px solid ${TROOP_CONFIGS[slot.troopType].color}40`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm">{TROOP_CONFIGS[slot.troopType].icon}</span>
                          <span className="text-[10px] text-white/80 truncate">
                            {TROOP_CONFIGS[slot.troopType].nameAr}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => decreaseTroopCount(waveIndex, slotIndex)}
                            className="w-5 h-5 rounded flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/10 text-xs"
                          >
                            −
                          </button>
                          <span className="text-[10px] font-bold text-white min-w-[20px] text-center">
                            {slot.count}
                          </span>
                          <button
                            onClick={() => increaseTroopCount(waveIndex, slotIndex)}
                            className="w-5 h-5 rounded flex items-center justify-center text-white/60 hover:text-white bg-white/5 hover:bg-white/10 text-xs"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeTroopFromWave(waveIndex, slotIndex)}
                            className="w-5 h-5 rounded flex items-center justify-center text-red-400/60 hover:text-red-400 bg-white/5 hover:bg-red-500/10 text-xs ml-0.5"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      // مربع فارغ
                      <button
                        onClick={() => assignTroopToWave(waveIndex, slotIndex)}
                        className={`w-full p-2 rounded-lg border-2 border-dashed transition-all duration-300 ${
                          selectedTroopType
                            ? 'border-[#c9a227]/40 bg-[#c9a227]/5 hover:bg-[#c9a227]/10 hover:border-[#c9a227]/60'
                            : 'border-white/10 opacity-30'
                        }`}
                      >
                        <span className="text-[10px] text-white/40">
                          {selectedTroopType ? `+ ${TROOP_CONFIGS[selectedTroopType].nameAr}` : 'فارغ'}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// زر بدء الهجوم
// ═══════════════════════════════

function AttackButton() {
  const isBattleStarting = useWarRoomStore((s) => s.isBattleStarting);
  const isBattleActive = useWarRoomStore((s) => s.isBattleActive);
  const startBattle = useWarRoomStore((s) => s.startBattle);
  const powerBreakdown = useWarRoomStore((s) => s.powerBreakdown);
  const waves = useWarRoomStore((s) => s.waves);

  const hasTroops = waves.some((w) => w.some((s) => s.troopType !== null));
  const isDisabled = !hasTroops || isBattleStarting || isBattleActive;

  return (
    <button
      onClick={startBattle}
      disabled={isDisabled}
      className={`relative w-full py-4 rounded-xl text-base font-black transition-all duration-300 overflow-hidden ${
        isDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'
      }`}
      style={{
        background: isDisabled
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(135deg, #8b2500, #a03000, #8b2500)',
        border: isDisabled
          ? '1px solid rgba(255,255,255,0.1)'
          : '2px solid #c94020',
        boxShadow: isDisabled ? 'none' : '0 4px 25px rgba(180,50,20,0.4)',
        color: isDisabled ? 'rgba(255,255,255,0.4)' : '#fff',
      }}
    >
      {/* تأثير التوهج */}
      {!isDisabled && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,200,100,0.4), transparent)',
            animation: 'sweepGlow 2s infinite linear',
          }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {isBattleStarting && (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isBattleActive ? '⚔️ المعركة جارية...' : isBattleStarting ? 'جاري التحضير...' : '⚔️ بدء الهجوم'}
      </span>

      {powerBreakdown && powerBreakdown.totalPower > 0 && (
        <div className="relative z-10 text-[10px] opacity-60 mt-1">
          القوة: {powerBreakdown.totalPower.toLocaleString('ar-EG')}
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════
// عنوان القسم
// ═══════════════════════════════

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-white">{title}</div>
      <div className="text-[9px] text-white/40">{subtitle}</div>
    </div>
  );
}

// ═══════════════════════════════
// واجهة غرفة العمليات الرئيسية
// ═══════════════════════════════

export default function WarRoomUI() {
  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none" dir="rtl">
      {/* الشريط العلوي */}
      <div className="pointer-events-auto p-3 space-y-3">
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-sm font-black text-[#c9a227] tracking-wide">
            ⚔️ غرفة العمليات ⚔️
          </h1>
          <p className="text-[9px] text-white/30">The War Room — قبضة الجنرال</p>
        </div>
        <ResourceBar />
      </div>

      {/* المساحة المتبقية */}
      <div className="flex-1" />

      {/* لوحة التحكم السفلية */}
      <div
        className="pointer-events-auto rounded-t-3xl p-4 pt-5 space-y-4 overflow-y-auto relative"
        style={{
          maxHeight: '55vh',
          background: 'linear-gradient(180deg, rgba(8,12,24,0.92) 0%, rgba(5,8,18,0.98) 100%)',
          borderTop: '1px solid rgba(201,162,39,0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1.5 w-10 h-1 rounded-full"
          style={{ background: 'rgba(201,162,39,0.3)' }}
        />

        <TerrainSelector />
        <TimeSelector />
        <TroopSelector />
        <PowerMeter />
        <WaveSlots />
        <AttackButton />

        {/* مسافة آمنة للهاتف */}
        <div className="h-4" />
      </div>
    </div>
  );
}
