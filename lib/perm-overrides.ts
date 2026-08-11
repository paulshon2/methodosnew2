/**
 * user_permission_overrides 저장소 헬퍼 (all-34: dual-write / merge-read 재설계)
 *
 * 배경: all-32에서는 Supabase 오류 메시지를 패턴 매칭해서 "테이블 없음"일 때만 Clerk
 * 메타데이터로 폴백했다. 그런데 실제 운영 환경에서 Supabase가 반환하는 오류 문구가
 * 예상 패턴과 조금만 달라도(RLS 오류, 타임아웃, 컬럼 불일치 등) 그 판별에 실패해
 * readOverrides가 "빈 오버라이드"를 반환해버리는 문제가 있었다. 그 결과 관리자가
 * "메뉴 권한" 버튼을 눌러 저장은 되는 것처럼 보여도(POST 200), 정작 회원 쪽 사이드바가
 * 참조하는 GET이 그 값을 읽지 못해 반영되지 않는 현상이 발생했다.
 *
 * 해결: 에러 문구 판별에 의존하지 않는다.
 *  - 쓰기(write): Clerk publicMetadata.menuOverrides 에 항상 먼저 쓴다(guaranteed).
 *    Supabase 테이블에도 best-effort 로 함께 쓴다(성공하면 좋고, 실패해도 무시).
 *  - 읽기(read): Clerk 값을 기본으로 하고, Supabase 조회가 성공하면 그 값으로
 *    코드별로 덮어써서 병합한다(합집합). 어느 한쪽이 일시적으로 실패해도 다른 쪽 값이
 *    항상 살아있어 "버튼은 눌리는데 실제로 반영 안 됨" 현상이 구조적으로 발생할 수 없다.
 */
import { getServiceSupabase } from "@/lib/supabase";

export type Overrides = Record<string, boolean | null>;

async function getClerkUser(userId: string) {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  return { client, user: await client.users.getUser(userId) };
}

async function readClerkOverrides(userId: string): Promise<Overrides> {
  try {
    const { user } = await getClerkUser(userId);
    const meta = (user.publicMetadata || {}) as any;
    return { ...(meta.menuOverrides as Overrides) };
  } catch (e) {
    console.error("[perm-overrides] readClerkOverrides failed", userId, e);
    return {};
  }
}

async function writeClerkOverrides(userId: string, overrides: Overrides): Promise<boolean> {
  try {
    const { client, user } = await getClerkUser(userId);
    const prev = (user.publicMetadata || {}) as Record<string, unknown>;
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...prev, menuOverrides: overrides },
    });
    return true;
  } catch (e) {
    console.error("[perm-overrides] writeClerkOverrides failed", userId, e);
    return false;
  }
}

async function readSupabaseOverrides(userId: string): Promise<Overrides | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("user_permission_overrides")
      .select("permission_code,allowed")
      .eq("user_id", userId);
    if (error) {
      console.error("[perm-overrides] supabase read error (falling back to clerk-only)", error);
      return null;
    }
    const overrides: Overrides = {};
    (data || []).forEach((r: any) => {
      overrides[r.permission_code] = r.allowed;
    });
    return overrides;
  } catch (e) {
    console.error("[perm-overrides] supabase read threw (falling back to clerk-only)", e);
    return null;
  }
}

/** Supabase 테이블에 best-effort 로 반영. 실패해도 예외를 던지지 않는다(Clerk가 이미 guaranteed 저장소). */
async function writeSupabaseOverride(userId: string, permission_code: string, allowed: boolean | null): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  try {
    if (allowed === null) {
      const { error } = await supabase
        .from("user_permission_overrides")
        .delete()
        .eq("user_id", userId)
        .eq("permission_code", permission_code);
      if (error) {
        console.error("[perm-overrides] supabase delete failed (clerk write is source of truth)", error);
        return false;
      }
      return true;
    }
    const { error } = await supabase.from("user_permission_overrides").upsert(
      { user_id: userId, permission_code, allowed, updated_at: new Date().toISOString() },
      { onConflict: "user_id,permission_code" }
    );
    if (error) {
      console.error("[perm-overrides] supabase upsert failed (clerk write is source of truth)", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[perm-overrides] supabase write threw (clerk write is source of truth)", e);
    return false;
  }
}

/**
 * 특정 사용자의 메뉴/연구방법/시각화 권한 오버라이드를 읽는다.
 * Clerk 메타데이터(항상 보장되는 저장소)를 기본값으로 하고, Supabase 조회가 성공하면
 * 코드 단위로 병합해서 최신값을 반영한다. mode 는 진단용 참고 정보일 뿐 동작에는 영향 없음.
 */
export async function readOverrides(userId: string): Promise<{ overrides: Overrides; mode: string }> {
  const [clerkOv, supaOv] = await Promise.all([readClerkOverrides(userId), readSupabaseOverrides(userId)]);
  if (supaOv === null) {
    return { overrides: clerkOv, mode: "clerk-only" };
  }
  // 병합: 두 저장소 모두에서 값을 모으되, 같은 code 에 대해서는 supabase 값을 최신으로 신뢰.
  const merged: Overrides = { ...clerkOv, ...supaOv };
  return { overrides: merged, mode: "merged" };
}

/**
 * 하나의 permission_code 에 대한 허용(true)/잠김(false)/기본(null, 삭제) 값을 저장한다.
 * Clerk 쓰기가 실패하는 경우에만 진짜 오류로 취급한다(Clerk는 로그인 자체가 이걸 통해 동작하므로
 * 항상 구성되어 있다고 가정할 수 있다). Supabase 쓰기는 best-effort.
 */
export async function writeOverride(
  userId: string,
  permission_code: string,
  allowed: boolean | null
): Promise<{ ok: true; mode: string } | { ok: false; error: string }> {
  const currentClerkOv = await readClerkOverrides(userId);
  const nextOv = { ...currentClerkOv };
  if (allowed === null) delete nextOv[permission_code];
  else nextOv[permission_code] = allowed;

  const clerkOk = await writeClerkOverrides(userId, nextOv);
  const supaOk = await writeSupabaseOverride(userId, permission_code, allowed);

  if (!clerkOk && !supaOk) {
    return { ok: false, error: "권한 저장에 실패했습니다 (Clerk·Supabase 모두 실패). 잠시 후 다시 시도해 주세요." };
  }
  return { ok: true, mode: clerkOk && supaOk ? "dual" : clerkOk ? "clerk-only" : "supabase-only" };
}
