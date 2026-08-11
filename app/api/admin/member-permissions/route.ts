import { NextRequest, NextResponse } from "next/server";
import { MENU_CATALOG, TOP_LOCK_MENUS, methodCode, vizCode, ALL_CHART_IDS } from "@/lib/menu-catalog";
import { CHART_CATALOG } from "@/lib/charts";
import { requireAdmin } from "@/lib/require-admin";
import { readOverrides, writeOverride } from "@/lib/perm-overrides";
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

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate.ok === false) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const userId = new URL(req.url).searchParams.get("userId") || "";
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const methods = await loadMethodCatalog();
  const charts = chartCatalog();

  // Supabase의 user_permission_overrides 테이블이 아직 없거나(스키마 캐시 오류) 일시
  // 오류가 나도 Clerk 메타데이터로 자동 폴백하므로 이 GET은 항상 200을 반환한다.
  const { overrides, mode } = await readOverrides(userId);

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
  const userId = String(body.userId || "");
  const permission_code = String(body.permission_code || "");
  const allowed = body.allowed as boolean | null;
  if (!userId || !permission_code) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const result = await writeOverride(userId, permission_code, allowed);
  if (result.ok === false) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, mode: result.mode });
}
