"use client";
import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { clerkAuthAppearance } from "./clerk-appearance";

/** 마운트 후에만 Clerk UI 렌더 — SSR/하이드레이션 예외 방지 */
export function ClerkSignIn() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="flex h-40 w-full max-w-[400px] items-center justify-center rounded-2xl border border-[#dbeafe] bg-white text-[13px] text-[#64748b]">
        로그인 준비 중…
      </div>
    );
  }

  return (
    <SignIn
      path="/login"
      routing="path"
      signUpUrl="/signup"
      forceRedirectUrl="/app"
      fallbackRedirectUrl="/app"
      appearance={clerkAuthAppearance}
    />
  );
}
