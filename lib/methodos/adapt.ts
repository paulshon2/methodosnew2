/** 웹판 계산 결과 → 데스크톱판 분석 시각화(dviz)가 읽는 엔진 결과 꼴. 표 id·열 이름은 엔진과 같게 맞춰 두었다. */
import type { MResult } from "./types";

export interface EngineLikeResult {
  analysis_code: string;
  analysis_name: string;
  tables: { table_id: string; title: string; columns: { name: string }[]; rows: (string | number | null)[][] }[];
  effect_sizes: { name: string; value: number; ci_low: number | null; ci_high: number | null; interpretation_band: string | null }[];
  confidence_intervals: { parameter: string; estimate: number; low: number; high: number; level: number; method: string }[];
  variables_used: { name: string; role: string }[];
  assumption_results: null;
  inferential: never[];
  posthoc: null;
}

export function toEngineResult(r: MResult, slots: Record<string, string[]> = {}): EngineLikeResult {
  return {
    analysis_code: r.code,
    analysis_name: r.name,
    tables: r.tables.map((t) => ({ table_id: t.id, title: t.title, columns: t.columns.map((name) => ({ name })), rows: t.rows })),
    effect_sizes: r.effects.map((e) => ({ name: e.name, value: e.value, ci_low: e.ciLow ?? null, ci_high: e.ciHigh ?? null, interpretation_band: null })),
    confidence_intervals: r.cis.map((c) => ({ parameter: c.parameter, estimate: c.estimate, low: c.low, high: c.high, level: 0.95, method: "" })),
    variables_used: Object.entries(slots).flatMap(([role, names]) => names.map((name) => ({ name, role }))),
    assumption_results: null,
    inferential: [],
    posthoc: null,
  };
}
