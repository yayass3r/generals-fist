import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.generalsfist.app',
  appName: 'قبضة الجنرال',
  webDir: 'out',
  // اللغة والاتجاه
  language: 'ar',
  // خادم محلي لتحميل الأصول
  server: {
    androidScheme: 'https',
    // تعطيل التحديث التلقائي
    // لا حاجة لخادم خارجي - التطبيق يعمل بالكامل محلياً
  },
  // شاشة البداية
  splashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    backgroundColor: '#050810',
    showSpinner: true,
    spinnerColor: '#c9a227',
    androidScaleType: 'CENTER_CROP',
  },
  // شريط الحالة
  statusBar: {
    style: 'DARK',
    backgroundColor: '#050810',
  },
  // اتجاه الشاشة
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050810',
      showSpinner: true,
      spinnerColor: '#c9a227',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050810',
    },
  },
};

export default config;
