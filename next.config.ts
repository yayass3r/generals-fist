import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // التصدير الثابت لتطبيق Capacitor
  output: "export",
  // مسار أساسي للعمل داخل WebView
  basePath: "",
  // تعطيل الصور المحسّنة (غير متوافق مع التصدير الثابت)
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
