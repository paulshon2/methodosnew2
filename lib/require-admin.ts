import type { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSuperAdminEmail, clerkConfigured } from "@/lib/admin-config";
import { isAdminRequest, adminRequestUid } from "@/lib/admin-auth";

export type AdminGate =
  | { ok: true; mode: "local" | "cloud"; userId: string; email: string }
  | { ok: false; status: number; error: string };

/**
 * 관리자 API 게이트.
 * all-36: RDOS와 동일하게 2단계로 검증한다.
 *  1) 로컬 관리자 세션(쿠키) 또는 x-admin-secret 헤더/쿼리 — Clerk 완전 불필요.
 *     (ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_API_SECRET, /api/admin/login 발급)
 *  2) 위가 없으면 Clerk 로그인 + sarangred777@gmail.com(슈퍼관리자) 이메일 일치.
 * Clerk Middleware 미설정·ENV 누락·이메일 불일치 등 어느 하나만 어긋나도
 * 관리자 페이지 전체가 막히던 기존 동작을 제거한다.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminGate> {
  // 1) 로컬 관리자 세션 — Clerk 불필요
  if (isAdminRequest(req)) {
    const uid = adminRequestUid(req);
    return { ok: true, mode: "local", userId: uid || "admin-secret", email: "" };
  }

  // 2) Clerk 슈퍼관리자 폴백
  if (!clerkConfigured()) {
    return { ok: false, status: 401, error: "clerk_required" };
  }
  try {
    const { auth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return { ok: false, status: 401, error: "unauthorized" };
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    if (!isSuperAdminEmail(email)) {
      return { ok: false, status: 403, error: "forbidden_not_super_admin" };
    }
    return { ok: true, mode: "cloud", userId, email };
  } catch (e: any) {
    const msg = String(e?.message || e || "admin auth failed");
    if (msg.includes("clerkMiddleware") || msg.includes("auth-middleware")) {
      return { ok: false, status: 500, error: "clerk_middleware_missing" };
    }
    return { ok: false, status: 500, error: msg.slice(0, 200) };
  }
}
