// ═══════════════════════════════════════════════════════════
// شريط التنقل السفلي - Bottom Navigation
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import { useGameStore, type GameScreen } from '@/store/game-store';
import ResourceBar from './ResourceBar';

const NAV_ITEMS: { id: GameScreen; icon: string; label: string }[] = [
  { id: 'war-room', icon: '⚔️', label: 'العمليات' },
  { id: 'world-map', icon: '🗺️', label: 'الخريطة' },
  { id: 'barracks', icon: '🏰', label: 'الثكنات' },
];

export default function Navigation() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const battleState = useGameStore((s) => s.battleState);

  // إخفاء التنقل أثناء المعركة
  if (battleState) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-auto z-50"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(5,8,18,0.95) 20%, rgba(5,8,18,0.99) 100%)',
        paddingTop: '20px',
      }}
    >
      {/* الموارد */}
      <div className="px-3 mb-2">
        <ResourceBar />
      </div>

      {/* أزرار التنقل */}
      <div className="flex items-center gap-1 px-3 pb-4 pt-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-300"
              style={{
                background: isActive ? 'rgba(201,162,39,0.12)' : 'transparent',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div
                className="text-xl transition-transform duration-300"
                style={{ transform: isActive ? 'scale(1.15)' : 'scale(1)', filter: isActive ? 'none' : 'grayscale(0.5)' }}
              >
                {item.icon}
              </div>
              <span
                className="text-[9px] font-bold transition-colors duration-300"
                style={{ color: isActive ? '#c9a227' : 'rgba(255,255,255,0.35)' }}
              >
                {item.label}
              </span>
              {/* مؤشر النشط */}
              {isActive && (
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: '#c9a227', boxShadow: '0 0 6px #c9a227' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* مسافة آمنة للهاتف */}
      <div className="h-2" />
    </div>
  );
}
