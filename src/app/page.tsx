'use client';

import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/game-store';
import Navigation from '@/components/game/Navigation';
import PWAInstallPrompt from '@/components/game/PWAInstallPrompt';
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

export default function Home() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const battleState = useGameStore((s) => s.battleState);

  // أثناء المعركة، اعرض المشهد والواجهة
  if (battleState) {
    return (
      <div className="w-full h-dvh overflow-hidden relative" style={{ background: '#0a0808' }}>
        <BattleScene />
        <BattleUI />
      </div>
    );
  }

  return (
    <div className="w-full h-dvh overflow-hidden relative" style={{ background: '#050810' }}>
      {/* المشهد ثلاثي الأبعاد حسب الشاشة */}
      {currentScreen === 'war-room' && <IsometricScene />}
      {currentScreen === 'world-map' && <WorldMapScene />}
      {currentScreen === 'barracks' && (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a1018, #050810)' }}>
          {/* خلفية بسيطة للثكنات */}
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

      {/* إشعار تثبيت PWA */}
      <PWAInstallPrompt />
    </div>
  );
}
