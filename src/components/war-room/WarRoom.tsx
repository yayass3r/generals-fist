// ═══════════════════════════════════════════════════════════
// غرفة العمليات - المكون الرئيسي
// قبضة الجنرال - The General's Fist
// ═══════════════════════════════════════════════════════════

'use client';

import dynamic from 'next/dynamic';
import WarRoomUI from './WarRoomUI';

// تحميل المشهد ثلاثي الأبعاد ديناميكياً بدون SSR
// لتفادي مشاكل Three.js مع التشغيل من جهة الخادم
const IsometricScene = dynamic(() => import('./IsometricScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#c9a227]/30 border-t-[#c9a227] rounded-full animate-spin mx-auto" />
        <p className="text-[#c9a227]/60 text-xs mt-3">جاري تحميل ساحة المعركة...</p>
      </div>
    </div>
  ),
});

export default function WarRoom() {
  return (
    <div className="w-full h-dvh overflow-hidden relative" style={{ background: '#050810' }}>
      {/* المشهد ثلاثي الأبعاد */}
      <IsometricScene />

      {/* واجهة المستخدم */}
      <WarRoomUI />
    </div>
  );
}
