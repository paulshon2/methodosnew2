import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { applyApproval } from "@/lib/profile-store";

/**
 * 승인/퇴출 + 등급(plan) 설정.
 * action: approve | reject | set_plan
 * set_plan — 이미 승인된 회원의 등급만 변경
 *
 * all-34: Clerk publicMetadata를 guaranteed 저장소로 삼아 항상 먼저 반영하고,
 * Supabase profiles 테이블에는 best-effort 로 함께 반영한다(lib/profile-store.ts).
 * 이전에는 Supabase upsert 실패 시 즉시 500으로 끝나 Clerk 메타데이터조차 갱신되지
 * 않아 "등급변경만 유독 안 됨" 현상이 있었는데, 이제는 Supabase가 실패해도 Clerk
 * 쪽 반영이 성공하면 정상 처리된다.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate.ok === false) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const action = String(body.action || "") as "approve" | "reject" | "set_plan";
  const membershipTier = String(body.membershipTier || "free").toLowerCase();
  const allowedTiers = ["free", "basic", "scholar", "university"];
  if (!userId || !["approve", "reject", "set_plan"].includes(action)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!allowedTiers.includes(membershipTier) && action !== "reject") {
    return NextResponse.json({ error: "invalid membershipTier" }, { status: 400 });
  }

  const status = action === "reject" ? "rejected" : "approved";

  let email = "";
  let name = "";
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email;
  } catch {
    /* Clerk 조회 실패해도 갱신은 시도 */
  }

  const fields: { plan?: string; approvalStatus?: "pending" | "approved" | "rejected"; email?: string; name?: string } = {
    approvalStatus: status,
    email: email || undefined,
    name: name || undefined,
  };
  if (action !== "reject") fields.plan = membershipTier;

  const result = await applyApproval(userId, fields);
  if (result.ok === false) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    userId,
    status,
    plan: action === "reject" ? undefined : membershipTier,
  });
}
