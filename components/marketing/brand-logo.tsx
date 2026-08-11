"use client";

type Props = {
  variant?: "nav" | "hero" | "footer";
  className?: string;
};

/** methodos 공식 로고 — 흰 바탕 랜딩/앱과 동일 톤 */
export function BrandLogo({ variant = "nav", className = "" }: Props) {
  if (variant === "nav") {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-[#e8eaef] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/methodos-logo.png" alt="methodos" className="h-7 w-7 object-contain" />
        </span>
        <span className="text-[14px] font-semibold tracking-tight text-[#1a1d26]">
          method<span className="text-[#534ab7]">os</span>
        </span>
      </span>
    );
  }

  if (variant === "footer") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-[#e8eaef] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/methodos-logo.png" alt="methodos" className="h-8 w-8 object-contain" />
        </span>
        <span className="text-[15px] font-semibold text-[#1a1d26]">methodos</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#e8eaef] bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/methodos-logo.png" alt="methodos" className="h-14 w-14 object-contain" />
      </span>
      <span className="mt-3 text-sm font-medium tracking-[0.18em] text-[#6b7280] uppercase">methodos</span>
    </div>
  );
}
