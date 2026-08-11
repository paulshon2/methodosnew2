import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import "./globals.css";

export const metadata: Metadata = {
  title: "MethodOS — 연구방법 자동화",
  description: "표준 프로토콜 연구방법 엔진 · 추천 · 프로세스 · Clerk + Supabase",
  // 상대 경로 — 모바일 홈화면(PWA)·하위 경로 배포에서 /manifest 절대경로 404 방지
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MethodOS" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

// 페인트 전 테마·플랫폼(iOS/안드로이드/standalone) 적용 (RDOS-v14 패턴)
const INIT = `
(function(){try{
  // 저장된 설정은 zustand persist(methodos.v1) 안에 있다. 그 값이 없으면 기본은 glass.
  var t = localStorage.getItem('methodos.theme');
  if (!t) { var raw = localStorage.getItem('methodos.v1');
    if (raw) { var s = JSON.parse(raw); t = s && s.state && s.state.settings && s.state.settings.theme; } }
  if (!t) t = 'glass';
  if (t !== 'light') document.documentElement.classList.add('theme-'+t);
  var ua = navigator.userAgent||"";
  var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  var os = iOS ? "ios" : (/Android/.test(ua) ? "android" : "web");
  document.documentElement.setAttribute("data-os", os);
  if ((window.navigator.standalone===true) || (window.matchMedia && matchMedia('(display-mode: standalone)').matches))
    document.documentElement.setAttribute("data-standalone","true");
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: INIT }} /></head>
      <body className="font-body">
        <MicrosoftClarity />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
