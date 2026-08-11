import type { Method, Registry } from "@/lib/types";
import type { MethodCatalog, MethodCatalogEntry } from "@/lib/method-catalog";

export type DisplayMethod = Method & {
  catalog?: MethodCatalogEntry;
  f11: boolean;
  perfSlug?: string;
  legacyPerf?: "ca" | "gt" | "q" | null;
  macro?: string;
};

function stubStages(n: number): Method["stages"] {
  const names = [
    "연구 초점 설정",
    "연구 윤리 협의",
    "문헌 검토",
    "연구 설계 확정",
    "방법 고유 실행",
    "보고 및 성찰",
  ];
  return Array.from({ length: Math.max(1, n) }, (_, i) => ({
    id: `stub.s${i + 1}`,
    order: i + 1,
    name: names[i] || `절차 단계 ${i + 1}`,
    goal: "",
    io: { inputs: [], outputs: [], artifacts: [] },
    fields: [],
    example: { text: "", table: { title: "", columns: [], rows: [] }, figure: { type: "flow", inputs: [], outputs: [], step: "" } },
    explain: { expert: "", easy: "", kid: "", why: "", action_now: "", next_preview: "", ai_can_do: [], common_mistakes: [] },
    modes: { default: "hybrid", rule: { desc: "", raw: {} }, ai: { desc: "", raw: {} }, hybrid: { desc: "", raw: {} } },
    comparison: [],
    validators: [],
    quality: [],
    decisions: [],
    idempotent: true,
  }));
}

/** 목록용: 표준 방법명(변형 접미 없음). */
export function methodListTitle(m: { name_ko?: string | null; name?: string; catalog?: MethodCatalogEntry | null }): string {
  return m.catalog?.canonicalName || m.catalog?.name_ko || m.name_ko || m.name || "";
}

/** 상세 전용: 한국어(English) 병기 + 변형 접미(이름1·이름2). */
export function methodDisplayTitle(m: { name_ko?: string | null; name?: string; catalog?: MethodCatalogEntry | null }): string {
  const bilingual = m.catalog?.name_ko || m.name_ko || m.name || "";
  const v = m.catalog?.variant;
  const total = m.catalog?.variantTotal || 1;
  if (v != null && total > 1) return `${bilingual}${v}`;
  return bilingual;
}

/** 학습 목록을 L1 단위로 접는다. 같은 methodKey(또는 pending 시 canonicalName)는 1줄. */
export function collapseToCanonicalMethods(methods: DisplayMethod[]): DisplayMethod[] {
  const by = new Map<string, DisplayMethod>();
  for (const m of methods) {
    const mk = m.catalog?.methodKey;
    const key = mk
      ? `mk:${mk}`
      : `cn:${m.catalog?.canonicalName || m.catalog?.name_ko || m.name_ko || m.id}`;
    const prev = by.get(key);
    if (!prev) {
      by.set(key, m);
      continue;
    }
    const pv = prev.catalog?.variant ?? 1;
    const cv = m.catalog?.variant ?? 1;
    if (cv < pv) by.set(key, m);
  }
  return Array.from(by.values());
}

/** 같은 L1 그룹의 학습 변형(methodId 목록). */
export function learningVariantsFor(methods: DisplayMethod[], representative: DisplayMethod): DisplayMethod[] {
  const mk = representative.catalog?.methodKey;
  const cn = representative.catalog?.canonicalName || representative.catalog?.name_ko;
  return methods
    .filter((m) => {
      if (mk) return m.catalog?.methodKey === mk;
      return (m.catalog?.canonicalName || m.catalog?.name_ko) === cn;
    })
    .sort((a, b) => (a.catalog?.variant ?? 0) - (b.catalog?.variant ?? 0));
}

export function methodFromCatalogEntry(e: MethodCatalogEntry): DisplayMethod {
  const n = e.stageCount || 11;
  return {
    id: e.methodId,
    name: e.name_hint || e.name_ko,
    name_ko: e.name_ko,
    family: e.family_ko || e.family || e.macro,
    source: { author: "", title: e.source || "", year: "" },
    purpose: e.purpose || "",
    philosophy: { paradigm: e.macro || "", epistemology: "", ontology: "" },
    default_mode: "hybrid",
    folder: e.methodId,
    stage_count: n,
    stages: stubStages(n),
    recommendation: { fit: {}, flags: {} },
    catalog: e,
    f11: true,
    perfSlug: e.perfSlug,
    legacyPerf: e.legacyPerf || null,
    macro: e.macro,
  };
}

export function displayMethodById(reg: Registry | null, cat: MethodCatalog | null, id: string): DisplayMethod | undefined {
  const ce = cat?.methods.find((m) => m.methodId === id);
  const rm = reg?.methods.find((m) => m.id === id);
  if (rm && ce) {
    return {
      ...rm,
      // 카탈로그 병기 명칭을 우선 표시 (예: TX-002(Content Analysis))
      name_ko: ce.name_ko || rm.name_ko,
      stage_count: ce.stageCount || rm.stage_count,
      purpose: ce.purpose || rm.purpose,
      catalog: ce,
      f11: true,
      perfSlug: ce.perfSlug,
      legacyPerf: ce.legacyPerf || null,
      macro: ce.macro,
    };
  }
  if (rm) {
    const inCat = cat?.methods.find((m) => m.methodId === id);
    if (inCat) {
      return {
        ...rm,
        name_ko: inCat.name_ko || rm.name_ko,
        catalog: inCat,
        f11: true,
        perfSlug: inCat.perfSlug,
        legacyPerf: inCat.legacyPerf || null,
        macro: inCat.macro,
        stage_count: inCat.stageCount || 11,
      };
    }
    return { ...rm, f11: false };
  }
  if (ce) return methodFromCatalogEntry(ce);
  return undefined;
}

export function allDisplayMethods(reg: Registry | null, cat: MethodCatalog | null): DisplayMethod[] {
  if (!cat?.methods?.length) return (reg?.methods || []).map((m) => ({ ...m, f11: false }));
  return cat.methods.map((e) => displayMethodById(reg, cat, e.methodId) || methodFromCatalogEntry(e));
}
