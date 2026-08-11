import { NextRequest, NextResponse } from "next/server";
import { MENU_CATALOG, TOP_LOCK_MENUS, methodCode, vizCode, ALL_CHART_IDS } from "@/lib/menu-catalog";
import { CHART_CATALOG } from "@/lib/charts";
import { requireAdmin } from "@/lib/require-admin";
import { readGlobalOverrides, writeGlobalOverride, writeGlobalOverrideBulk } from "@/lib/global-perm-overrides";
import { readFile } from "fs/promises";
import path from "path";

async function loadMethodCatalog(): Promise<{ code: string; label: string; id: string }[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "registry.json"), "utf8");
    const reg = JSON.parse(raw);
    const list = Array.isArray(reg.methods) ? reg.methods : [];
    return list.map((m: any) => ({
      id: String(m.id),
      code: methodCode(String(m.id)),
      label: String(m.name_ko || m.name || m.id),
    }));
  } catch {
    return [];
  }
}

function chartCatalog() {
  return CHART_CATALOG.flatMap((cat) =>
    cat.charts.map((ch) => ({
      id: ch.id,
      code: vizCode(ch.id),
      label: `${ch.name} · ${cat.catKo}`,
      category: cat.key,
      catKo: cat.catKo,
    }))
  );
}

/**
 * 관리자가 "전체 메뉴(잠김/허용)" 화면에서 다루는 전체 사용자 공통 권한 API.
 * 개별 회원(app/api/admin/member-permissions)과 별개로, 전체 사용자에게 동시에
 * 적용되는 기본값을 조회/저장한다.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate.ok === false) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const methods = await loadMethodCatalog();
  const charts = chartCatalog();
  const { overrides, mode } = await readGlobalOverrides();

  return NextResponse.json({
    catalog: MENU_CATALOG,
    topMenus: TOP_LOCK_MENUS,
    methods,
    charts,
    chartCategories: CHART_CATALOG.map((c) => ({ key: c.key, catKo: c.catKo, count: c.charts.length })),
    allChartIds: ALL_CHART_IDS,
    overrides,
    mode,
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate.ok === false) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await req.json().catch(() => ({}));

  // 단일 코드 저장
  if (typeof body.permission_code === "string" && body.permission_code) {
    const allowed = body.allowed as boolean | null;
    const result = await writeGlobalOverride(body.permission_code, allowed);
    if (result.ok === false) return NextResponse.json({ error: (result as any).error }, { status: 500 });
    return NextResponse.json({ ok: true, mode: result.mode });
  }

  // 대량 저장: 전체 잠금 / 전체 허용 / 전체 기본값 복원
  // scope: "top" | "methods" | "viz" | "all"  ·  allowed: true(허용) | false(잠김) | null(기본)
  const scope = String(body.scope || "all");
  const allowed = (body.allowed === undefined ? null : body.allowed) as boolean | null;

  const methods = await loadMethodCatalog();
  const charts = chartCatalog();

  let codes: string[] = [];
  if (scope === "top" || scope === "all") codes = codes.concat(TOP_LOCK_MENUS.map((m) => m.code));
  if (scope === "methods" || scope === "all") codes = codes.concat(methods.map((m) => m.code));
  if (scope === "viz" || scope === "all") codes = codes.concat(charts.map((c) => c.code));

  if (!codes.length) return NextResponse.json({ error: "invalid scope" }, { status: 400 });

  const result = await writeGlobalOverrideBulk(codes, allowed);
  return NextResponse.json({ ok: true, mode: result.mode, count: result.count });
}
