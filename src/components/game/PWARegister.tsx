'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker مسجل بنجاح:', registration.scope);

          // التحقق من وجود تحديث
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[PWA] تم تحديث Service Worker');
                  // إشعار المستخدم بوجود تحديث
                  if (confirm('يوجد تحديث جديد! هل تريد إعادة التحميل؟')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] فشل تسجيل Service Worker:', error);
        });
    }
  }, []);

  return null;
}
