// ═══════════════════════════════════════════════════════════
// واجهة خريطة العالم - World Map UI Overlay
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useGameStore } from '@/store/game-store';
import { SECTOR_CONFIG, THREAT_CONFIG, getMapStatistics } from '@/lib/world-map';

export default function WorldMapUI() {
  const selectedSector = useGameStore((s) => s.selectedSector);
  const resources = useGameStore((s) => s.resources);
  const scoutWorldSector = useGameStore((s) => s.scoutWorldSector);
  const attackSector = useGameStore((s) => s.attackSector);
  const selectWorldSector = useGameStore((s) => s.selectWorldSector);
  const setScreen = useGameStore((s) => s.setScreen);
  const sectors = useGameStore((s) => s.worldSectors);
  const stats = getMapStatistics(sectors);
  const hasTroops = useGameStore((s) => s.waves.some(w => w.some(sl => sl.troopType !== null)));

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none" dir="rtl">
      {/* الشريط العلوي */}
      <div className="pointer-events-auto p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-black text-[#c9a227]">🗺️ خريطة العالم</h1>
          <div className="flex gap-2 text-[9px] text-white/50">
            <span>🟢 محرر {stats.cleared}</span>
            <span>👁️ مكتشف {stats.scouted}</span>
            <span>🌫️ مضبب {stats.fogged}</span>
          </div>
        </div>

        {/* دليل الألوان */}
        <div className="flex gap-2 flex-wrap justify-center">
          {Object.entries(SECTOR_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1 text-[8px] text-white/40">
              <div className="w-2 h-2 rounded-full" style={{ background: config.color }} />
              {config.nameAr}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* لوحة القطاع المحدد */}
      {selectedSector && (
        <div
          className="pointer-events-auto mx-3 mb-2 rounded-2xl p-4 space-y-3"
          style={{
            background: 'linear-gradient(180deg, rgba(8,12,24,0.95), rgba(5,8,18,0.98))',
            border: `1px solid ${SECTOR_CONFIG[selectedSector.type].color}40`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* رأس اللوحة */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${SECTOR_CONFIG[selectedSector.type].color}20`, border: `1px solid ${SECTOR_CONFIG[selectedSector.type].color}40` }}
              >
                {SECTOR_CONFIG[selectedSector.type].icon}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{selectedSector.nameAr}</div>
                <div className="text-[9px] text-white/40">{SECTOR_CONFIG[selectedSector.type].description}</div>
              </div>
            </div>
            <button
              onClick={() => selectWorldSector(null)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              ✕
            </button>
          </div>

          {/* معلومات القطاع */}
          <div className="grid grid-cols-3 gap-2">
            <InfoBox
              label="التهديد"
              value={THREAT_CONFIG[selectedSector.threatLevel].nameAr}
              color={THREAT_CONFIG[selectedSector.threatLevel].color}
              icon={THREAT_CONFIG[selectedSector.threatLevel].icon}
            />
            <InfoBox
              label="قوة العدو"
              value={selectedSector.enemyPower.toLocaleString('ar-EG')}
              color="#ef4444"
              icon="⚔️"
            />
            <InfoBox
              label="الحالة"
              value={
                selectedSector.status === 'fogged' ? 'مضبب' :
                selectedSector.status === 'scouted' ? 'مكتشف' :
                selectedSector.status === 'cleared' ? 'محرر' : 'مقرنا'
              }
              color={
                selectedSector.status === 'fogged' ? '#6b7280' :
                selectedSector.status === 'scouted' ? '#40a0e0' :
                selectedSector.status === 'cleared' ? '#4ade80' : '#c9a227'
              }
              icon={
                selectedSector.status === 'fogged' ? '🌫️' :
                selectedSector.status === 'scouted' ? '👁️' :
                selectedSector.status === 'cleared' ? '✅' : '🏰'
              }
            />
          </div>

          {/* الغنائم */}
          {(selectedSector.status !== 'fogged' && selectedSector.type !== 'hq') && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,162,39,0.1)' }}
            >
              <div className="text-[10px] font-bold text-white/60 mb-2">💰 الغنائم المحتملة</div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/40">⚙️ خردة</span>
                <span className="font-bold" style={{ color: '#c9a227' }}>+{selectedSector.loot.scrap}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/40">⛽ وقود</span>
                <span className="font-bold" style={{ color: '#e07020' }}>+{selectedSector.loot.fuel}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/40">📋 معلومات</span>
                <span className="font-bold" style={{ color: '#40a0e0' }}>+{selectedSector.loot.intel}</span>
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-2">
            {selectedSector.status === 'fogged' && (
              <button
                onClick={() => scoutWorldSector(selectedSector.id)}
                disabled={resources.intel < 15}
                className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: resources.intel >= 15
                    ? 'linear-gradient(135deg, #40a0e0, #3070b0)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${resources.intel >= 15 ? '#40a0e0' : 'rgba(255,255,255,0.1)'}`,
                  color: resources.intel >= 15 ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                🔍 استطلاع (15 معلومات)
              </button>
            )}
            {selectedSector.status === 'scouted' && (
              <>
                <button
                  onClick={() => {
                    attackSector(selectedSector.id);
                  }}
                  disabled={!hasTroops}
                  className="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: hasTroops
                      ? 'linear-gradient(135deg, #8b2500, #a03000)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${hasTroops ? '#c94020' : 'rgba(255,255,255,0.1)'}`,
                    color: hasTroops ? '#fff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  ⚔️ هجوم
                </button>
                <button
                  onClick={() => {
                    setScreen('war-room');
                    selectWorldSector(null);
                  }}
                  className="py-3 px-4 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227' }}
                >
                  📋 تجهيز
                </button>
              </>
            )}
            {selectedSector.status === 'cleared' && (
              <div className="flex-1 py-3 rounded-xl text-xs font-bold text-center text-[#4ade80]"
                style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                ✅ تم تحرير القطاع
              </div>
            )}
          </div>
        </div>
      )}

      {/* تعليمات عند عدم التحديد */}
      {!selectedSector && (
        <div
          className="pointer-events-none mx-3 mb-3 rounded-2xl p-4 text-center"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="text-2xl mb-1">👆</div>
          <div className="text-[10px] text-white/40">اضغط على أي قطاع لعرض التفاصيل</div>
          <div className="text-[9px] text-white/20 mt-1">استخدم أعصابك للاستطلاع قبل الهجوم</div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="rounded-xl p-2 text-center" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <div className="text-lg">{icon}</div>
      <div className="text-[8px] text-white/40">{label}</div>
      <div className="text-[10px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
