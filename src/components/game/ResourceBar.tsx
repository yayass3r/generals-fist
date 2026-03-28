// ═══════════════════════════════════════════════════════════
// شريط الموارد المشترك - Shared Resource Bar
// ═══════════════════════════════════════════════════════════

'use client';

import { useGameStore, useProductionPerHour } from '@/store/game-store';
import { getTotalProductionPerHour } from '@/lib/idle-system';

export default function ResourceBar() {
  const resources = useGameStore((s) => s.resources);
  const buildings = useGameStore((s) => s.buildings);
  const perHour = getTotalProductionPerHour(buildings);

  return (
    <div className="flex gap-2 justify-center pointer-events-auto">
      <ResourceItem icon="⚙️" label="خردة" value={resources.scrap} rate={perHour.scrap} color="#c9a227" />
      <ResourceItem icon="⛽" label="وقود" value={resources.fuel} rate={perHour.fuel} color="#e07020" />
      <ResourceItem icon="📋" label="معلومات" value={resources.intel} rate={perHour.intel} color="#40a0e0" />
    </div>
  );
}

function ResourceItem({ icon, label, value, rate, color }: { icon: string; label: string; value: number; rate: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{
        background: 'rgba(0,0,0,0.5)',
        border: `1px solid ${color}30`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="text-sm">{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[8px] opacity-50" style={{ color }}>{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value.toLocaleString('ar-EG')}
        </span>
      </div>
      {rate > 0 && (
        <span className="text-[8px] opacity-40" style={{ color }}>
          +{rate}/س
        </span>
      )}
    </div>
  );
}
