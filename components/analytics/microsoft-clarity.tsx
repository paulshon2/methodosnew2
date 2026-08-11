"use client";

import Script from "next/script";

/** 기본 프로젝트 ID (사용자 제공). env로 덮어쓸 수 있음. */
const CLARITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "xlpzvkjzsd";

/**
 * Microsoft Clarity — 랜딩·앱 전역 로드.
 * NEXT_PUBLIC_CLARITY_PROJECT_ID 로 교체 가능. 빈 문자열이면 비활성.
 */
export function MicrosoftClarity() {
  if (!CLARITY_PROJECT_ID) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">{`
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
    `}</Script>
  );
}
