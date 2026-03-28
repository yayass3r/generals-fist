'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // التحقق إذا كان التطبيق مثبتاً بالفعل
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as unknown as { standalone: boolean }).standalone === true;

    if (isInstalled) return;

    // التحقق إذا كان المستخدم أغلق الإشعار مسبقاً
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneDay) {
        setDismissed(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // إظهار الإشعار بعد تأخير بسيط
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] تم قبول التثبيت');
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // مراقبة حالة التثبيت
  useEffect(() => {
    const handler = () => {
      console.log('[PWA] تم تثبيت التطبيق');
      setShowPrompt(false);
    };

    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  if (!showPrompt || dismissed || !deferredPrompt) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-6 px-4"
      style={{ pointerEvents: 'none' }}
    >
      {/* خلفية معتمة */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
        onClick={handleDismiss}
      />

      {/* بطاقة التثبيت */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl p-5 shadow-2xl border"
        style={{
          pointerEvents: 'auto',
          background: 'linear-gradient(135deg, #0a1428 0%, #0d1a30 100%)',
          borderColor: 'rgba(201, 162, 39, 0.3)',
          animation: 'slideUp 0.4s ease-out',
        }}
      >
        {/* زر الإغلاق */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          ✕
        </button>

        {/* محتوى البطاقة */}
        <div className="flex items-start gap-4 mb-4">
          {/* أيقونة التطبيق */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #c9a227, #a07d1a)',
            }}
          >
            <img src="/icon-192.png" alt="قبضة الجنرال" className="w-12 h-12 rounded-lg" />
          </div>

          {/* النص */}
          <div className="flex-1 pt-1">
            <h3
              className="text-white font-bold text-sm mb-1"
              style={{ fontFamily: 'var(--font-geist-mono)' }}
            >
              ثبّت قبضة الجنرال
            </h3>
            <p className="text-white/50 text-xs leading-relaxed">
              أضف التطبيق لشاشتك الرئيسية لتجربة أفضل وأسرع بدون متصفح
            </p>
          </div>
        </div>

        {/* أزرار */}
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #c9a227, #e0b830)',
            }}
          >
            تثبيت التطبيق
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            لاحقاً
          </button>
        </div>

        {/* مزايا سريعة */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <span>⚡</span> سريع
          </span>
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <span>📱</span> بدون متصفح
          </span>
          <span className="text-[10px] text-white/30 flex items-center gap-1">
            <span>🌐</span> يعمل بدون إنترنت
          </span>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
