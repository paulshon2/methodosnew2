/** 200개 method-catalog → 표준 시각화 템플릿 매핑 (정밀) */

import { staticAsset } from "./static-asset";
import { preciseTemplateFor } from "./research-viz-profiles";

export type VizTemplateId =
  | "survey"
  | "regression"
  | "timeseries"
  | "experiment"
  | "correlation"
  | "comparative"
  | "meta"
  | "qualitative";

export type CatalogMethodRow = {
  methodId: string;
  name_ko: string;
  macro: string;
  family: string;
  family_ko?: string;
  purpose?: string;
};

const MACRO_COL: Record<string, string> = {
  "조사·설문": "#534AB7",
  "질적·해석": "#888780",
  "양적·통계·모형": "#1D9E75",
  "텍스트·계산언어": "#BA7517",
  "평가·정책": "#378ADD",
  "양적·인과·실험": "#D4537E",
  "역사·비교": "#639922",
  "문헌·근거합성": "#D85A30",
  "혼합·설계": "#534AB7",
  "평가·종합·혼합": "#378ADD",
  "기타": "#5F5E5A",
};

export function templateForCatalogMethod(m: CatalogMethodRow): VizTemplateId {
  return preciseTemplateFor(m);
}

export function colorForMacro(macro: string): string {
  return MACRO_COL[macro] || "#534AB7";
}

export type ExpandedVizMethod = {
  id: string;
  templateId: VizTemplateId;
  cat: string;
  nm: string;
  desc: string;
  n: string;
  dt: string;
  out: string;
  col: string;
  family: string;
  purpose?: string;
};

const TPL_META: Record<
  VizTemplateId,
  { dt: string; out: string; nHint: string; pipeline: string }
> = {
  survey: {
    dt: "Ordinal",
    out: "Distribution",
    nHint: "통상 50–2,000",
    pipeline: "설문 분포·NPS·문항 비교",
  },
  regression: {
    dt: "Continuous",
    out: "Prediction",
    nHint: "통상 30+",
    pipeline: "회귀·계수·잔차 진단",
  },
  timeseries: {
    dt: "Temporal",
    out: "Trend",
    nHint: "12+ 기간",
    pipeline: "추세·이동평균·성장률",
  },
  experiment: {
    dt: "Continuous",
    out: "Causal Effect",
    nHint: "그룹당 20+",
    pipeline: "사전·사후·효과크기",
  },
  correlation: {
    dt: "Continuous",
    out: "Relationship",
    nHint: "통상 30+",
    pipeline: "상관·산점·히트맵",
  },
  comparative: {
    dt: "Mixed",
    out: "Profile",
    nHint: "그룹당 15+",
    pipeline: "KPI 비교·레이더·지수화",
  },
  meta: {
    dt: "Effect Sizes",
    out: "Pooled Effect",
    nHint: "5+ 연구",
    pipeline: "포레스트·퍼널·이질성",
  },
  qualitative: {
    dt: "Text",
    out: "Themes",
    nHint: "6+ 사례",
    pipeline: "테마 빈도·감정·커버리지",
  },
};

export async function loadMethodCatalogMethods(): Promise<CatalogMethodRow[]> {
  if (typeof window === "undefined") return [];
  try {
    // 우선: 아키타입 31 소속 연구방법 기반 추천 목록
    const arch = await fetch(staticAsset("archetype-viz-methods.json"));
    if (arch.ok) {
      const j = await arch.json();
      const rows = (j.methods || []) as Array<{
        id: string;
        nm: string;
        cat: string;
        family?: string;
        purpose?: string;
        templateId?: VizTemplateId;
      }>;
      if (rows.length) {
        return rows.map((r) => ({
          methodId: r.id,
          name_ko: r.nm,
          macro: r.cat,
          family: r.family || r.cat,
          family_ko: r.family,
          purpose: r.purpose,
          _templateId: r.templateId,
        })) as CatalogMethodRow[];
      }
    }
    const res = await fetch(staticAsset("method-catalog.json"));
    if (!res.ok) return [];
    const j = await res.json();
    return (j.methods || []) as CatalogMethodRow[];
  } catch {
    return [];
  }
}

export function expandCatalogMethods(rows: CatalogMethodRow[]): ExpandedVizMethod[] {
  return rows.map((m) => {
    const forced = (m as CatalogMethodRow & { _templateId?: VizTemplateId })._templateId;
    const templateId = forced || preciseTemplateFor(m);
    const meta = TPL_META[templateId];
    return {
      id: m.methodId,
      templateId,
      cat: m.macro || "기타",
      nm: m.name_ko,
      desc: `${m.family_ko || m.family || "연구"} · ${m.macro} — ${meta.pipeline}`,
      n: meta.nHint,
      dt: meta.dt,
      out: meta.out,
      col: colorForMacro(m.macro),
      family: m.family_ko || m.family || "",
      purpose: m.purpose,
    };
  });
}
