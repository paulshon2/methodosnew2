"use client";
import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "./clerk-appearance";

/** 마운트 후에만 Clerk UI 렌더 — SSR/하이드레이션 예외 방지 */
export function ClerkSignUp() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="flex h-40 w-full max-w-[400px] items-center justify-center rounded-2xl border border-[#dbeafe] bg-white text-[13px] text-[#64748b]">
        회원가입 준비 중…
      </div>
    );
  }

  return (
    <SignUp
      path="/signup"
      routing="path"
      signInUrl="/login"
      forceRedirectUrl="/app"
      fallbackRedirectUrl="/app"
      appearance={clerkAuthAppearance}
    />
  );
}
