import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { isSuperAdminEmail, clerkConfigured } from "@/lib/admin-config";
import { resolveEntitlements, ALL_CHART_IDS, MENU_CATALOG } from "@/lib/menu-catalog";
import { readOverrides } from "@/lib/perm-overrides";
import { readGlobalOverrides } from "@/lib/global-perm-overrides";
import { readProfileFromMeta } from "@/lib/profile-store";
import { isAdminRequest, adminRequestUid } from "@/lib/admin-auth";
import { readFile } from "fs/promises";
import path from "path";

async function loadMethodIds(): Promise<string[]> {
  // Prefer method-catalog.json (V61 / RWOS-6 virtual learning). Fall back to registry.json.
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "method-catalog.json"), "utf8");
    const cat = JSON.parse(raw);
    const list = Array.isArray(cat.methods) ? cat.methods : [];
    const ids = list.map((m: { methodId?: string }) => String(m.methodId || "")).filter(Boolean);
    if (ids.length) return ids;
  } catch {
    /* fall through */
  }
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "registry.json"), "utf8");
    const reg = JSON.parse(raw);
    const list = Array.isArray(reg.methods) ? reg.methods : Array.isArray(reg) ? reg : [];
    return list.map((m: { id?: string }) => String(m.id || "")).filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  // all-36: 로컬 관리자 세션(쿠키/x-admin-secret) — Clerk 불필요.
  // /api/admin/login 으로 발급된 세션이면 사이드바 "관리자" 메뉴와
  // 전체 등급(University) 권한을 즉시 부여한다.
  if (isAdminRequest(req)) {
    const methodIds = await loadMethodIds();
    const menus = new Set(MENU_CATALOG.map((m) => m.code));
    return NextResponse.json({
      mode: "local-admin",
      allowed: [...Array.from(menus), ...methodIds.map((id) => `method.${id}`), ...ALL_CHART_IDS.map((id) => `viz.${id}`)],
      menus: Array.from(menus),
      methods: methodIds,
      charts: ALL_CHART_IDS,
      isAdmin: true,
      email: null,
      userId: adminRequestUid(req) || "admin-secret",
      plan: "university",
    });
  }

  if (!clerkConfigured()) {
    const methodIds = await loadMethodIds();
    const { overrides: globalOverrides } = await readGlobalOverrides();
    const ent = resolveEntitlements({
      plan: "university",
      isSuperAdmin: false,
      overrides: {},
      globalOverrides: Object.fromEntries(
        Object.entries(globalOverrides).filter(([, v]) => v !== null && v !== undefined) as [string, boolean][]
      ),
      allMethodIds: methodIds,
      allChartIds: ALL_CHART_IDS,
    });
    // 로컬: 네비·전체 기능 검증용 — 상위 메뉴 전부 허용(관리자 제외)하되, 관리자가
    // "전체 메뉴(잠김/허용)"에서 설정한 전체 공통 잠금은 그대로 반영한다.
    const menus = new Set(Array.from(ent.menus).filter((c) => c !== "menu.admin"));
    return NextResponse.json({
      mode: "local",
      allowed: [
        ...Array.from(menus),
        ...Array.from(ent.methods).map((id) => `method.${id}`),
        ...Array.from(ent.charts).map((id) => `viz.${id}`),
      ],
      menus: Array.from(menus),
      methods: Array.from(ent.methods),
      charts: Array.from(ent.charts),
      isAdmin: false,
      email: null,
      userId: "local-user",
      plan: "local",
    });
  }

  try {
    const { auth, clerkClient } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      "";
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email;
    const superAdmin = isSuperAdminEmail(email);
    const supabase = getServiceSupabase();
    const methodIds = await loadMethodIds();

    let plan = "free";
    const overrides: Record<string, boolean> = {};
    const metaProfile = readProfileFromMeta(user.publicMetadata);

    if (supabase) {
      if (superAdmin) {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            email,
            name,
            plan: "university",
            role: "admin",
            approval_status: "approved",
            is_special_member: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("plan,role,approval_status")
        .eq("id", userId)
        .maybeSingle();
      if (profileErr) console.error("[permissions/me] supabase profile read failed, using clerk meta", profileErr);
      // Clerk publicMetadata는 승인/퇴출/등급변경 API가 항상 반영하는 guaranteed 저장소이므로,
      // 값이 있으면 Supabase에 저장된(구 버전일 수 있는) plan보다 우선한다.
      if (metaProfile.plan) plan = metaProfile.plan;
      else if (profile?.plan) plan = profile.plan;
      const { overrides: ov } = await readOverrides(userId);
      Object.entries(ov).forEach(([code, v]) => {
        if (v !== null && v !== undefined) overrides[code] = !!v;
      });
    } else {
      if (metaProfile.plan) plan = metaProfile.plan;
      const meta = (user.publicMetadata || {}) as any;
      const mo = (meta.menuOverrides || {}) as Record<string, boolean | null>;
      Object.entries(mo).forEach(([k, v]) => {
        if (v !== null && v !== undefined) overrides[k] = !!v;
      });
    }

    const { overrides: globalOverridesRaw } = await readGlobalOverrides();
    const globalOverrides = Object.fromEntries(
      Object.entries(globalOverridesRaw).filter(([, v]) => v !== null && v !== undefined) as [string, boolean][]
    );

    const ent = resolveEntitlements({
      plan,
      isSuperAdmin: superAdmin,
      overrides,
      globalOverrides,
      allMethodIds: methodIds,
      allChartIds: ALL_CHART_IDS,
    });

    return NextResponse.json({
      mode: "cloud",
      allowed: ent.allowed,
      menus: Array.from(ent.menus),
      methods: Array.from(ent.methods),
      charts: Array.from(ent.charts),
      isAdmin: superAdmin,
      email,
      name,
      userId,
      plan: superAdmin ? "university" : plan,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "permissions failed" }, { status: 500 });
  }
}
