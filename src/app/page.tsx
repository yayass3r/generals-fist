'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/game-store';
import Navigation from '@/components/game/Navigation';
import ErrorBoundary from '@/components/game/ErrorBoundary';
import WarRoomUI from '@/components/game/WarRoomUI';
import WorldMapUI from '@/components/game/WorldMapUI';
import BarracksUI from '@/components/game/BarracksUI';
import BattleUI from '@/components/game/BattleUI';

// تحميل المشاهد ثلاثية الأبعاد بدون SSR
const IsometricScene = dynamic(() => import('@/components/war-room/IsometricScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#050810' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#c9a227]/30 border-t-[#c9a227] rounded-full animate-spin mx-auto" />
        <p className="text-[#c9a227]/60 text-xs mt-3">جاري التحميل...</p>
      </div>
    </div>
  ),
});

const WorldMapScene = dynamic(() => import('@/components/game/WorldMapScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#050810' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#40a0e0]/30 border-t-[#40a0e0] rounded-full animate-spin mx-auto" />
        <p className="text-[#40a0e0]/60 text-xs mt-3">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
});

const BattleScene = dynamic(() => import('@/components/game/BattleScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#0a0808' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#ef4444]/30 border-t-[#ef4444] rounded-full animate-spin mx-auto" />
        <p className="text-[#ef4444]/60 text-xs mt-3">جاري تجهيز المعركة...</p>
      </div>
    </div>
  ),
});

// شاشة التحميل الثابتة (تطابق HTML المُولّد من SSR)
function SplashScreen() {
  return (
    <div
      className="w-full h-dvh flex flex-col items-center justify-center"
      style={{ background: '#050810' }}
    >
      <div className="text-5xl mb-6">⚔️</div>
      <h1
        className="text-xl font-bold mb-3"
        style={{ color: '#c9a227' }}
      >
        قبضة الجنرال
      </h1>
      <div className="w-10 h-10 border-2 border-[#c9a227]/30 border-t-[#c9a227] rounded-full animate-spin" />
      <p className="text-[#c9a227]/40 text-xs mt-4">جاري تجهيز المعركة...</p>
    </div>
  );
}

export default function Home() {
  // تأخير العرض حتى يكتمل الـ mount على الجهاز فقط
  // هذا يمنع Hydration Mismatch (خطأ React #185)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SplashScreen />;
  }

  return <GameApp />;
}

function GameApp() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const battleState = useGameStore((s) => s.battleState);

  return (
    <ErrorBoundary>
      {/* أثناء المعركة، اعرض المشهد والواجهة */}
      {battleState ? (
        <div className="w-full h-dvh overflow-hidden relative" style={{ background: '#0a0808' }}>
          <BattleScene />
          <BattleUI />
        </div>
      ) : (
        <div className="w-full h-dvh overflow-hidden relative" style={{ background: '#050810' }}>
          {/* المشهد ثلاثي الأبعاد حسب الشاشة */}
          {currentScreen === 'war-room' && <IsometricScene />}
          {currentScreen === 'world-map' && <WorldMapScene />}
          {currentScreen === 'barracks' && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a1018, #050810)' }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <span className="text-[200px]">🏰</span>
              </div>
            </div>
          )}

          {/* واجهة المستخدم */}
          {currentScreen === 'war-room' && <WarRoomUI />}
          {currentScreen === 'world-map' && <WorldMapUI />}
          {currentScreen === 'barracks' && <BarracksUI />}

          {/* التنقل السفلي */}
          <Navigation />
        </div>
      )}
    </ErrorBoundary>
  );
}
