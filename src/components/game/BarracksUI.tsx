// ═══════════════════════════════════════════════════════════
// واجهة الثكنات ونظام القيادة الهرمي - Barracks & Chain of Command
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import {
  TROOP_CONFIGS,
} from '@/lib/battle-engine';
import {
  AVAILABLE_COMMANDERS,
  BUFF_CONFIG,
  calculateCompanyBuffs,
  getCompanyTroopCount,
  RECRUIT_COST,
  SQUAD_MAX_SIZE,
  COMPANY_MAX_SIZE,
  type Commander,
} from '@/lib/chain-of-command';
import { BUILDINGS, getUpgradeCost, getBuildingProductionPerHour } from '@/lib/idle-system';
import { getTotalProductionPerHour } from '@/lib/idle-system';
import type { TroopType } from '@/lib/battle-engine';
import type { BuildingState } from '@/lib/idle-system';

type BarracksTab = 'production' | 'squads' | 'commanders';

export default function BarracksUI() {
  const [activeTab, setActiveTab] = useState<BarracksTab>('squads');

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none" dir="rtl">
      {/* الشريط العلوي */}
      <div className="pointer-events-auto p-3 space-y-3">
        <h1 className="text-sm font-black text-[#c9a227] text-center">🏰 الثكنات</h1>
        <ResourceBarInline />
      </div>

      {/* التبويبات */}
      <div className="pointer-events-auto flex gap-1 mx-3">
        {([
          { id: 'squads' as const, label: '🎖️ القوات', },
          { id: 'production' as const, label: '🏭 الإنتاج', },
          { id: 'commanders' as const, label: '⭐ القادة', },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.05)'}`,
              color: activeTab === tab.id ? '#c9a227' : 'rgba(255,255,255,0.4)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      <div className="flex-1 overflow-y-auto mt-2 pointer-events-auto px-3 pb-20">
        {activeTab === 'squads' && <SquadsTab />}
        {activeTab === 'production' && <ProductionTab />}
        {activeTab === 'commanders' && <CommandersTab />}
      </div>
    </div>
  );
}

function ResourceBarInline() {
  const resources = useGameStore((s) => s.resources);
  const buildings = useGameStore((s) => s.buildings);
  const perHour = getTotalProductionPerHour(buildings);

  return (
    <div className="flex gap-2 justify-center">
      {[
        { icon: '⚙️', val: resources.scrap, rate: perHour.scrap, color: '#c9a227' },
        { icon: '⛽', val: resources.fuel, rate: perHour.fuel, color: '#e07020' },
        { icon: '📋', val: resources.intel, rate: perHour.intel, color: '#40a0e0' },
      ].map(r => (
        <div key={r.icon} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${r.color}20` }}>
          <span className="text-xs">{r.icon}</span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: r.color }}>{r.val}</span>
          {r.rate > 0 && <span className="text-[8px] opacity-40" style={{ color: r.color }}>+{r.rate}/س</span>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════
// تبويب القوات
// ═══════════════════════════════

function SquadsTab() {
  const companies = useGameStore((s) => s.companies);
  const resources = useGameStore((s) => s.resources);
  const addSquadToCompany = useGameStore((s) => s.addSquadToCompany);
  const recruitToSquad = useGameStore((s) => s.recruitToSquad);

  return (
    <div className="space-y-3 mt-2">
      {companies.map((company) => {
        const totalTroops = getCompanyTroopCount(company);
        const buffs = calculateCompanyBuffs(company);
        const config = TROOP_CONFIGS[company.troopType];
        const cost = RECRUIT_COST[company.troopType];
        const canRecruit = resources.scrap >= cost;

        return (
          <div
            key={company.id}
            className="rounded-2xl p-3 space-y-2"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${config.color}30`,
            }}
          >
            {/* رأس السرية */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <div className="text-[11px] font-bold text-white">{company.nameAr}</div>
                  <div className="text-[9px] text-white/40">
                    {totalTroops}/{COMPANY_MAX_SIZE} جندي · {company.squads.length}/10 حظائر
                  </div>
                </div>
              </div>
              <button
                onClick={() => addSquadToCompany(company.id)}
                disabled={company.squads.length >= 10 || totalTroops >= COMPANY_MAX_SIZE}
                className="text-[9px] px-2 py-1 rounded-lg"
                style={{
                  background: canRecruit ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${canRecruit ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  color: canRecruit ? '#c9a227' : 'rgba(255,255,255,0.2)',
                }}
              >
                + حظيرة جديدة
              </button>
            </div>

            {/* شريط التقدم */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(totalTroops / COMPANY_MAX_SIZE) * 100}%`,
                  background: config.color,
                }}
              />
            </div>

            {/* المكافآت */}
            {(buffs.attack > 0 || buffs.defense > 0 || buffs.speed > 0 || buffs.morale > 0) && (
              <div className="flex gap-1.5 flex-wrap">
                {buffs.attack > 0 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#ef444420', color: '#ef4444' }}>
                    ⚔️ +{buffs.attack}%
                  </span>
                )}
                {buffs.defense > 0 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                    🛡️ +{buffs.defense}%
                  </span>
                )}
                {buffs.speed > 0 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#22c55e20', color: '#22c55e' }}>
                    💨 +{buffs.speed}%
                  </span>
                )}
                {buffs.morale > 0 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                    ⭐ +{buffs.morale}%
                  </span>
                )}
              </div>
            )}

            {/* الحظائر */}
            <div className="space-y-1.5">
              {company.squads.length === 0 && (
                <div className="text-center py-3 text-[9px] text-white/20">
                  لا توجد حظائر - أضف حظيرة جديدة
                </div>
              )}
              {company.squads.map((squad) => (
                <div
                  key={squad.id}
                  className="flex items-center justify-between p-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center gap-2">
                    {squad.commander ? (
                      <span className="text-sm">{squad.commander.icon}</span>
                    ) : (
                      <span className="text-sm opacity-20">🎖️</span>
                    )}
                    <div>
                      <div className="text-[10px] text-white/70">
                        {squad.commander ? squad.commander.nameAr : 'حظيرة بدون قائد'}
                      </div>
                      <div className="text-[9px] text-white/30">
                        {squad.size}/{SQUAD_MAX_SIZE} جندي
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => recruitToSquad(company.id, squad.id, 5)}
                      disabled={!canRecruit || squad.size >= SQUAD_MAX_SIZE || totalTroops >= COMPANY_MAX_SIZE}
                      className="text-[9px] px-2 py-1 rounded-lg font-bold"
                      style={{
                        background: canRecruit ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${canRecruit ? `${config.color}40` : 'rgba(255,255,255,0.05)'}`,
                        color: canRecruit ? config.color : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      +5 ({cost} خردة)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════
// تبويب الإنتاج
// ═══════════════════════════════

function ProductionTab() {
  const buildings = useGameStore((s) => s.buildings);
  const resources = useGameStore((s) => s.resources);
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);

  return (
    <div className="space-y-3 mt-2">
      <div className="text-[10px] text-white/30 text-center">
        قم بترقية المنشآت لزيادة الإنتاج التلقائي أثناء غيابك
      </div>
      {Object.values(BUILDINGS).map((config) => {
        const building = buildings.find(b => b.id === config.id);
        if (!building) return null;

        const cost = getUpgradeCost(config.id, building.level);
        const canUpgrade = resources.scrap >= cost && building.level < config.maxLevel;
        const production = getBuildingProductionPerHour(config.id, building.level);
        const totalProd = Object.values(production).reduce((s, v) => s + v, 0);

        return (
          <div
            key={config.id}
            className="rounded-2xl p-3 space-y-2"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${config.color}25`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}>
                  {config.icon}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">{config.nameAr}</div>
                  <div className="text-[9px] text-white/30">المستوى {building.level}/{config.maxLevel}</div>
                </div>
              </div>
              <button
                onClick={() => upgradeBuilding(config.id)}
                disabled={!canUpgrade}
                className="text-[9px] px-3 py-2 rounded-xl font-bold transition-all"
                style={{
                  background: canUpgrade ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${canUpgrade ? `${config.color}40` : 'rgba(255,255,255,0.05)'}`,
                  color: canUpgrade ? config.color : 'rgba(255,255,255,0.2)',
                }}
              >
                ترقية ⬆️
              </button>
            </div>

            <div className="text-[9px] text-white/30">{config.description}</div>

            {/* الإنتاج */}
            <div className="grid grid-cols-3 gap-1.5">
              {production.scrap > 0 && (
                <div className="text-center p-1.5 rounded-lg" style={{ background: '#c9a22708' }}>
                  <div className="text-[8px] text-white/30">⚙️ خردة</div>
                  <div className="text-[10px] font-bold" style={{ color: '#c9a227' }}>+{production.scrap}/س</div>
                </div>
              )}
              {production.fuel > 0 && (
                <div className="text-center p-1.5 rounded-lg" style={{ background: '#e0702008' }}>
                  <div className="text-[8px] text-white/30">⛽ وقود</div>
                  <div className="text-[10px] font-bold" style={{ color: '#e07020' }}>+{production.fuel}/س</div>
                </div>
              )}
              {production.intel > 0 && (
                <div className="text-center p-1.5 rounded-lg" style={{ background: '#40a0e008' }}>
                  <div className="text-[8px] text-white/30">📋 معلومات</div>
                  <div className="text-[10px] font-bold" style={{ color: '#40a0e0' }}>+{production.intel}/س</div>
                </div>
              )}
            </div>

            {/* تكلفة الترقية */}
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-white/30">تكلفة الترقية:</span>
              <span className="font-bold" style={{ color: canUpgrade ? '#c9a227' : '#ef4444' }}>
                ⚙️ {cost.toLocaleString('ar-EG')} خردة
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════
// تبويب القادة
// ═══════════════════════════════

function CommandersTab() {
  const companies = useGameStore((s) => s.companies);
  const resources = useGameStore((s) => s.resources);
  const assignCommander = useGameStore((s) => s.assignCommander);

  return (
    <div className="space-y-3 mt-2">
      <div className="text-[10px] text-white/30 text-center">
        عيّن القادة على الحظائر لمنح مكافآت قتالية
      </div>

      {AVAILABLE_COMMANDERS.map((commander) => {
        const canAfford = resources.scrap >= commander.cost;
        const isAssigned = companies.some(c =>
          c.squads.some(sq => sq.commander?.id === commander.id)
        );
        const buffConfig = BUFF_CONFIG[commander.buffType];

        return (
          <div
            key={commander.id}
            className="rounded-2xl p-3 space-y-2"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${isAssigned ? `${buffConfig.color}30` : 'rgba(255,255,255,0.05)'}`,
              opacity: isAssigned ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${buffConfig.color}15`, border: `1px solid ${buffConfig.color}30` }}
              >
                {commander.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white">{commander.nameAr}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${buffConfig.color}15`, color: buffConfig.color }}>
                    {buffConfig.icon} +{commander.buffValue}%
                  </span>
                </div>
                <div className="text-[9px] text-white/30">{commander.description}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/30">
                {TROOP_CONFIGS[commander.troopType].icon} {TROOP_CONFIGS[commander.troopType].nameAr} فقط
              </span>
              {!isAssigned && (
                <button
                  onClick={() => {
                    // تعيين على أول حظيرة فارغة من نفس النوع
                    const targetCompany = companies.find(c => c.troopType === commander.troopType);
                    if (!targetCompany) return;
                    const emptySquad = targetCompany.squads.find(sq => !sq.commander);
                    if (emptySquad) {
                      assignCommander(targetCompany.id, emptySquad.id, commander);
                    }
                  }}
                  disabled={!canAfford}
                  className="text-[9px] px-2 py-1 rounded-lg font-bold"
                  style={{
                    background: canAfford ? `${buffConfig.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${canAfford ? `${buffConfig.color}30` : 'rgba(255,255,255,0.05)'}`,
                    color: canAfford ? buffConfig.color : 'rgba(255,255,255,0.2)',
                  }}
                >
                  تعيين (⚙️{commander.cost})
                </button>
              )}
              {isAssigned && (
                <span className="text-[9px] text-white/20">✓ معيّن</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
