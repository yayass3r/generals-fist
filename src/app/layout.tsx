import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "قبضة الجنرال — The General's Fist",
  description: "لعبة استراتيجية Idle - غرفة العمليات",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚔️</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050810",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased`}
        style={{
          background: '#050810',
          color: '#ffffff',
          overflow: 'hidden',
          touchAction: 'none',
          position: 'fixed',
          inset: 0,
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
