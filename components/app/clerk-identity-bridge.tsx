"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { clerkConfiguredClient } from "@/lib/clerk-client";
import { isSuperAdminEmail } from "@/lib/admin-config";

/** Clerk useUser로 이메일을 부모에 전달 — 슈퍼관리자 사이드바 표시용 */
export function ClerkIdentityBridge({
  onIdentity,
}: {
  onIdentity: (info: { email: string; name: string; userId: string; isAdmin: boolean }) => void;
}) {
  if (!clerkConfiguredClient()) return null;
  return <ClerkIdentityInner onIdentity={onIdentity} />;
}

function ClerkIdentityInner({
  onIdentity,
}: {
  onIdentity: (info: { email: string; name: string; userId: string; isAdmin: boolean }) => void;
}) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email;
    onIdentity({
      email,
      name,
      userId: user.id,
      isAdmin: isSuperAdminEmail(email),
    });
  }, [isLoaded, user, onIdentity]);

  return null;
}
