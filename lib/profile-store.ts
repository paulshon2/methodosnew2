/**
 * 회원 프로필(등급 plan / 승인상태 approval_status) 저장 헬퍼 (all-34)
 *
 * 배경: all-32까지는 승인/퇴출/등급변경이 모두 Supabase `profiles` 테이블 upsert에만
 * 의존했고, 그 upsert가 실패하면(예: RLS 정책이 INSERT는 허용하지만 UPDATE는 막아둔 경우,
 * 서비스 롤 키 대신 anon 키가 잘못 설정된 경우 등) 즉시 500 오류로 끝나버려 Clerk
 * 메타데이터 갱신 시도조차 하지 못했다. 신규(대기) 회원의 최초 승인은 프로필 행이 방금
 * 막 생성된 직후라 우연히 성공하는 경우가 많지만, 이미 승인된 회원의 "등급변경"처럼 기존
 * 행을 다시 갱신해야 하는 요청은 이 실패 경로에 더 잘 걸린다.
 *
 * 해결: perm-overrides.ts와 동일한 원칙 — Clerk publicMetadata(로그인 자체가 이걸 통해
 * 동작하므로 항상 사용 가능하다고 볼 수 있음)를 guaranteed 저장소로 삼아 항상 먼저 쓰고,
 * Supabase profiles 테이블에는 best-effort 로 함께 반영한다. 읽을 때도 Clerk 메타데이터
 * 값이 있으면 그것을 최신으로 신뢰하고, 없을 때만 Supabase 값을 사용한다.
 */
export type ProfileOverride = {
  plan?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
};

async function getClerkUser(userId: string) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  return { client, user: await client.users.getUser(userId) };
}

export function readProfileFromMeta(publicMetadata: unknown): ProfileOverride {
  const meta = (publicMetadata || {}) as any;
  const out: ProfileOverride = {};
  if (meta.membershipTier) out.plan = String(meta.membershipTier);
  if (meta.approvalStatus) out.approvalStatus = meta.approvalStatus;
  return out;
}

/** 특정 사용자의 Clerk publicMetadata에 저장된 plan/approval 값을 읽는다. */
export async function readClerkProfile(userId: string): Promise<ProfileOverride> {
  try {
    const { user } = await getClerkUser(userId);
    return readProfileFromMeta(user.publicMetadata);
  } catch (e) {
    console.error("[profile-store] readClerkProfile failed", userId, e);
    return {};
  }
}

/** Clerk publicMetadata에 plan/approval 값을 반영한다(guaranteed 저장소). */
export async function writeClerkProfile(userId: string, fields: ProfileOverride): Promise<boolean> {
  try {
    const { client, user } = await getClerkUser(userId);
    const prev = (user.publicMetadata || {}) as Record<string, unknown>;
    const meta: Record<string, unknown> = { ...prev };
    if (fields.plan !== undefined) meta.membershipTier = fields.plan;
    if (fields.approvalStatus !== undefined) meta.approvalStatus = fields.approvalStatus;
    await client.users.updateUserMetadata(userId, { publicMetadata: meta });
    return true;
  } catch (e) {
    console.error("[profile-store] writeClerkProfile failed", userId, e);
    return false;
  }
}

/** Supabase profiles 테이블에 best-effort 로 반영. 실패해도 예외를 던지지 않는다. */
export async function writeSupabaseProfile(
  userId: string,
  fields: ProfileOverride & { email?: string; name?: string }
): Promise<boolean> {
  try {
    const { getServiceSupabase } = await import("@/lib/supabase");
    const supabase = getServiceSupabase();
    if (!supabase) return false;
    const row: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (fields.email) row.email = fields.email;
    if (fields.name) row.name = fields.name;
    if (fields.approvalStatus !== undefined) row.approval_status = fields.approvalStatus;
    if (fields.plan !== undefined) row.plan = fields.plan;
    const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
    if (error) {
      console.error("[profile-store] supabase upsert failed (clerk write is source of truth)", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[profile-store] supabase write threw (clerk write is source of truth)", e);
    return false;
  }
}

/**
 * 승인/퇴출/등급변경을 실행한다. Clerk 메타데이터 쓰기가 guaranteed 경로이고,
 * Supabase는 best-effort 미러링이다. Clerk 쓰기가 성공하면 Supabase가 실패해도 ok:true.
 */
export async function applyApproval(
  userId: string,
  fields: ProfileOverride & { email?: string; name?: string }
): Promise<{ ok: true; mode: string } | { ok: false; error: string }> {
  const clerkOk = await writeClerkProfile(userId, fields);
  const supaOk = await writeSupabaseProfile(userId, fields);
  if (!clerkOk && !supaOk) {
    return { ok: false, error: "저장에 실패했습니다 (Clerk·Supabase 모두 실패). 잠시 후 다시 시도해 주세요." };
  }
  return { ok: true, mode: clerkOk && supaOk ? "dual" : clerkOk ? "clerk-only" : "supabase-only" };
}
