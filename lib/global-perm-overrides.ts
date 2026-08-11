/**
 * global_permission_overrides 저장소 헬퍼 (all-37 신규)
 *
 * 배경: 기존 perm-overrides.ts 는 "회원 1명"에 대한 메뉴/연구방법/시각화 잠김·허용만
 * 다뤘다. 관리자가 개별 회원마다 일일이 설정하지 않고, "연구방법 메뉴 전체를 모든
 * 회원에게 잠근다/연다" 처럼 전체 사용자 공통 기본값을 한 번에 제어할 방법이 없었다.
 *
 * 해결: 전체 사용자에게 공통으로 적용되는 override 레이어를 하나 더 둔다.
 *  - 적용 우선순위: 등급(plan) 기본값 → 전체 공통(global) override → 회원 개별(per-user)
 *    override 순으로 마지막에 반영된 값이 이긴다(resolveEntitlements 참고).
 *    즉 전체 잠금을 걸어도 특정 회원만 개별로 다시 허용/차단할 수 있고, 반대로
 *    전체를 열어둔 상태에서 특정 회원만 개별 차단할 수도 있다(기존 개별 설정 기능 유지).
 *  - 저장: perm-overrides.ts 와 동일하게 "guaranteed 저장소 + best-effort 보조 저장소"
 *    이중화 패턴을 따른다. 다만 전체 설정에는 자연스러운 Clerk 사용자가 없으므로,
 *    guaranteed 저장소로 서버 프로세스 메모리(in-memory)를 사용하고(로컬/데모 모드에서도
 *    항상 동작), Supabase 테이블(global_permission_overrides)에 best-effort 로 함께 쓴다.
 *    Supabase 가 연결되어 있으면 다중 서버 인스턴스·재배포 간에도 값이 유지된다.
 */
import { getServiceSupabase } from "@/lib/supabase";

export type Overrides = Record<string, boolean | null>;

// 서버 메모리 (guaranteed, 프로세스 수명 — perm-overrides.ts 의 Clerk 저장소 역할을 대신함)
let mem: Overrides = {};

function readMemOverrides(): Overrides {
  return { ...mem };
}
function writeMemOverrides(next: Overrides) {
  mem = { ...next };
}

async function readSupabaseGlobalOverrides(): Promise<Overrides | null> {
  const supabase = getServiceSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("global_permission_overrides").select("permission_code,allowed");
    if (error) {
      console.error("[global-perm-overrides] supabase read error (falling back to memory)", error);
      return null;
    }
    const overrides: Overrides = {};
    (data || []).forEach((r: any) => {
      overrides[r.permission_code] = r.allowed;
    });
    return overrides;
  } catch (e) {
    console.error("[global-perm-overrides] supabase read threw (falling back to memory)", e);
    return null;
  }
}

async function writeSupabaseGlobalOverride(permission_code: string, allowed: boolean | null): Promise<boolean> {
  const supabase = getServiceSupabase();
  if (!supabase) return false;
  try {
    if (allowed === null) {
      const { error } = await supabase.from("global_permission_overrides").delete().eq("permission_code", permission_code);
      if (error) {
        console.error("[global-perm-overrides] supabase delete failed (memory is source of truth)", error);
        return false;
      }
      return true;
    }
    const { error } = await supabase
      .from("global_permission_overrides")
      .upsert({ permission_code, allowed, updated_at: new Date().toISOString() }, { onConflict: "permission_code" });
    if (error) {
      console.error("[global-perm-overrides] supabase upsert failed (memory is source of truth)", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[global-perm-overrides] supabase write threw (memory is source of truth)", e);
    return false;
  }
}

/** 전체 사용자 공통 override 를 읽는다. 메모리를 기본값으로 하고 Supabase 조회가 성공하면 병합. */
export async function readGlobalOverrides(): Promise<{ overrides: Overrides; mode: string }> {
  const memOv = readMemOverrides();
  const supaOv = await readSupabaseGlobalOverrides();
  if (supaOv === null) return { overrides: memOv, mode: "memory-only" };
  const merged: Overrides = { ...memOv, ...supaOv };
  // Supabase 값이 최신이면 메모리도 동기화해 두어, 다음 요청(Supabase 일시 장애 시)에도
  // 최근 값을 잃지 않게 한다.
  writeMemOverrides(merged);
  return { overrides: merged, mode: "merged" };
}

/** 하나의 permission_code 에 대한 전체 공통 허용(true)/잠김(false)/기본(null) 값을 저장. */
export async function writeGlobalOverride(
  permission_code: string,
  allowed: boolean | null
): Promise<{ ok: true; mode: string } | { ok: false; error: string }> {
  const current = readMemOverrides();
  const next = { ...current };
  if (allowed === null) delete next[permission_code];
  else next[permission_code] = allowed;
  writeMemOverrides(next);

  const supaOk = await writeSupabaseGlobalOverride(permission_code, allowed);
  return { ok: true, mode: supaOk ? "dual" : "memory-only" };
}

/** 여러 permission_code 를 한 번에 같은 값으로 저장 (전체 잠금/전체 허용/전체 기본 버튼용). */
export async function writeGlobalOverrideBulk(
  codes: string[],
  allowed: boolean | null
): Promise<{ ok: true; mode: string; count: number }> {
  const current = readMemOverrides();
  const next = { ...current };
  codes.forEach((code) => {
    if (allowed === null) delete next[code];
    else next[code] = allowed;
  });
  writeMemOverrides(next);

  const results = await Promise.all(codes.map((code) => writeSupabaseGlobalOverride(code, allowed)));
  const supaOk = results.every(Boolean);
  return { ok: true, mode: supaOk ? "dual" : "memory-only", count: codes.length };
}
