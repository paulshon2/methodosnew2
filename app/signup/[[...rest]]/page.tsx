"use client";
import Link from "next/link";
import { clerkConfiguredClient } from "@/lib/clerk-client";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkSignUp } from "@/components/auth/clerk-sign-up";

export default function SignupPage() {
  if (!clerkConfiguredClient()) {
    return (
      <AuthShell title="회원가입">
        <p className="text-[13px] text-[#64748b]">Clerk 키가 없어 로컬 모드입니다.</p>
        <Link
          href="/app"
          className="mt-6 inline-block rounded-full bg-[#2563eb] px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          /app 열기
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="회원가입">
      <ClerkSignUp />
    </AuthShell>
  );
}
