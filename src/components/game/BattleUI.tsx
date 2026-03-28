// ═══════════════════════════════════════════════════════════
// واجهة المعركة والتكتيكات النشطة - Battle UI & Active Tactics
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { ACTIVE_TACTICS, type TacticType } from '@/lib/battle-simulation';

export default function BattleUI() {
  const battleState = useGameStore((s) => s.battleState);
  const resources = useGameStore((s) => s.resources);
  const activateTactic = useGameStore((s) => s.activateTactic);
  const updateBattle = useGameStore((s) => s.updateBattle);
  const endBattle = useGameStore((s) => s.endBattle);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // حلقة تحديث المعركة
  useEffect(() => {
    if (!battleState || battleState.status !== 'active') return;

    lastTimeRef.current = performance.now();

    const tick = (time: number) => {
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1); // تحديد بحد أقصى 100ms
      lastTimeRef.current = time;
      updateBattle(delta);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [battleState?.status, updateBattle]);

  if (!battleState) return null;

  const playerAlive = battleState.playerUnits.filter(u => u.isAlive).length;
  const enemyAlive = battleState.enemyUnits.filter(u => u.isAlive).length;
  const playerTotalHp = battleState.playerUnits.filter(u => u.isAlive).reduce((s, u) => s + u.currentHp, 0);
  const playerMaxHp = battleState.playerUnits.reduce((s, u) => s + u.maxHp, 0);
  const enemyTotalHp = battleState.enemyUnits.filter(u => u.isAlive).reduce((s, u) => s + u.currentHp, 0);
  const enemyMaxHp = battleState.enemyUnits.reduce((s, u) => s + u.maxHp, 0);
  const playerHpPercent = playerMaxHp > 0 ? (playerTotalHp / playerMaxHp) * 100 : 0;
  const enemyHpPercent = enemyMaxHp > 0 ? (enemyTotalHp / enemyMaxHp) * 100 : 0;
  const elapsed = Math.floor(battleState.elapsedTime);

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none" dir="rtl">
      {/* شريط الحالة العلوي */}
      <div className="pointer-events-auto p-3 space-y-2">
        {/* مؤشرات الجانبين */}
        <div className="flex gap-2 items-center">
          {/* اللاعب */}
          <div className="flex-1 rounded-xl p-2" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-[#4ade80]">🛡️ قواتنا</span>
              <span className="text-[10px] font-bold text-white">{playerAlive} حيّ</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${playerHpPercent}%`, background: '#4ade80' }} />
            </div>
            <div className="text-[8px] text-white/30 mt-0.5">
              {Math.floor(playerTotalHp).toLocaleString('ar-EG')} / {playerMaxHp.toLocaleString('ar-EG')} HP
            </div>
          </div>

          {/* VS */}
          <div className="text-center px-2">
            <div className="text-[10px] font-black text-[#c9a227]">VS</div>
            <div className="text-[8px] text-white/30">{elapsed}ث</div>
          </div>

          {/* العدو */}
          <div className="flex-1 rounded-xl p-2" style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-[#ef4444]">💀 العدو</span>
              <span className="text-[10px] font-bold text-white">{enemyAlive} حيّ</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${enemyHpPercent}%`, background: '#ef4444' }} />
            </div>
            <div className="text-[8px] text-white/30 mt-0.5">
              {Math.floor(enemyTotalHp).toLocaleString('ar-EG')} / {enemyMaxHp.toLocaleString('ar-EG')} HP
            </div>
          </div>
        </div>

        {/* الإحصائيات */}
        <div className="flex gap-2 justify-center text-[8px]">
          <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            خسائرنا: {battleState.playerCasualties}
          </span>
          <span className="px-2 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
            إصابات العدو: {battleState.enemyCasualties}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* أزرار التكتيكات النشطة */}
      {(battleState.status === 'active' || battleState.status === 'preparing') && (
        <div className="pointer-events-auto p-3 space-y-2">
          <div className="text-[10px] font-bold text-white/50 text-center mb-1">🎯 التكتيكات النشطة</div>
          <div className="flex gap-2">
            {Object.values(ACTIVE_TACTICS).map((tactic) => {
              const tacticState = battleState.activeTactics.find(t => t.tactic === tactic.type);
              if (!tacticState) return null;

              const canUse = !tacticState.isActive && tacticState.remainingCooldown <= 0 && resources.fuel >= tactic.cost;
              const isOnCooldown = !tacticState.isActive && tacticState.remainingCooldown > 0;

              return (
                <button
                  key={tactic.type}
                  onClick={() => canUse && activateTactic(tactic.type)}
                  disabled={!canUse}
                  className={`flex-1 relative rounded-xl p-2 text-center transition-all overflow-hidden ${
                    tacticState.isActive ? 'scale-105' : ''
                  }`}
                  style={{
                    background: tacticState.isActive
                      ? `linear-gradient(135deg, ${tactic.effect.attackModifier > 1.1 ? '#ef444430' : '#3b82f630'}, ${tactic.effect.defenseModifier > 1.1 ? '#3b82f620' : '#ef444420'})`
                      : canUse
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.3)',
                    border: `2px solid ${
                      tacticState.isActive
                        ? '#c9a227'
                        : canUse
                          ? 'rgba(201,162,39,0.3)'
                          : 'rgba(255,255,255,0.05)'
                    }`,
                    opacity: isOnCooldown ? 0.4 : 1,
                  }}
                >
                  {/* توهج عند التفعيل */}
                  {tacticState.isActive && (
                    <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,162,39,0.4), transparent)', animation: 'sweepGlow 1.5s infinite linear' }} />
                  )}

                  <div className="relative">
                    <div className="text-lg">{tactic.icon}</div>
                    <div className="text-[8px] font-bold text-white">{tactic.nameAr}</div>
                    <div className="text-[7px] text-white/30">⛽{tactic.cost}</div>

                    {/* حالة التكتيك */}
                    {tacticState.isActive && (
                      <div className="mt-1">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className="h-full rounded-full bg-[#c9a227] transition-all"
                            style={{ width: `${(tacticState.remainingDuration / tactic.duration) * 100}%` }}
                          />
                        </div>
                        <div className="text-[7px] text-[#c9a227]">{Math.ceil(tacticState.remainingDuration)}ث</div>
                      </div>
                    )}

                    {isOnCooldown && (
                      <div className="mt-1">
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div
                            className="h-full rounded-full bg-white/20 transition-all"
                            style={{ width: `${(1 - tacticState.remainingCooldown / tactic.cooldown) * 100}%` }}
                          />
                        </div>
                        <div className="text-[7px] text-white/30">{Math.ceil(tacticState.remainingCooldown)}ث</div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* نتيجة المعركة */}
      {(battleState.status === 'victory' || battleState.status === 'defeat') && (
        <div className="pointer-events-auto p-4 space-y-3">
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: battleState.status === 'victory'
                ? 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.05))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
              border: `2px solid ${battleState.status === 'victory' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="text-3xl mb-2">{battleState.status === 'victory' ? '🏆' : '💀'}</div>
            <div className="text-base font-black mb-1" style={{ color: battleState.status === 'victory' ? '#4ade80' : '#ef4444' }}>
              {battleState.status === 'victory' ? 'نصر مؤزر!' : 'هزيمة...'}
            </div>
            <div className="text-[10px] text-white/40 mb-3">
              {battleState.status === 'victory'
                ? 'تم تحرير القطاع بنجاح!'
                : 'حتاج لتعزيز قواتك والمحاولة مرة أخرى'}
            </div>

            <div className="flex gap-4 justify-center text-[9px] mb-3">
              <div className="text-center">
                <div className="text-white/40">الوقت</div>
                <div className="font-bold text-white">{elapsed} ثانية</div>
              </div>
              <div className="text-center">
                <div className="text-white/40">خسائرنا</div>
                <div className="font-bold text-[#ef4444]">{battleState.playerCasualties}</div>
              </div>
              <div className="text-center">
                <div className="text-white/40">إصابات العدو</div>
                <div className="font-bold text-[#4ade80]">{battleState.enemyCasualties}</div>
              </div>
            </div>

            <button
              onClick={endBattle}
              className="w-full py-3 rounded-xl text-xs font-bold transition-all"
              style={{
                background: battleState.status === 'victory'
                  ? 'linear-gradient(135deg, #2d5016, #4a7c3f)'
                  : 'linear-gradient(135deg, #8b2500, #a03000)',
                border: `1px solid ${battleState.status === 'victory' ? '#4ade80' : '#ef4444'}40`,
                color: '#fff',
              }}
            >
              {battleState.status === 'victory' ? '✅ العودة للخريطة' : '🔄 العودة للتحضير'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
