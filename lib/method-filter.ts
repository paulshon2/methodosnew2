/** 방법 지도 필터 — 순수 함수. 컴포넌트에서 분리해 테스트할 수 있게 둔다. */

import type { Approach, DataKind, Level, Method, Purpose } from "./method-map-catalog";

export type Filters = {
  approach: Approach[];
  purpose: Purpose[];
  data: DataKind[];
  level: Level[];
};

export const EMPTY_FILTERS: Filters = { approach: [], purpose: [], data: [], level: [] };

export const APPROACH_OPTIONS: { id: Approach; label: string }[] = [
  { id: "quant", label: "양적" },
  { id: "qual", label: "질적" },
  { id: "mixed", label: "혼합" },
];

export const PURPOSE_OPTIONS: { id: Purpose; label: string }[] = [
  { id: "탐색", label: "탐색(무엇이 있는지)" },
  { id: "기술", label: "기술(얼마나)" },
  { id: "설명", label: "설명(왜)" },
  { id: "평가", label: "평가(효과가 있는지)" },
];

export const DATA_OPTIONS: { id: DataKind; label: string }[] = [
  { id: "수치", label: "수치·척도" },
  { id: "텍스트", label: "면담·문서 텍스트" },
  { id: "관찰", label: "현장 관찰" },
  { id: "기존", label: "기존 2차 자료" },
];

export const LEVEL_OPTIONS: { id: Level; label: string }[] = [
  { id: 1, label: "입문(학부)" },
  { id: 2, label: "중급(석사)" },
  { id: 3, label: "고급(전문 훈련)" },
];

export function filterCount(f: Filters): number {
  return f.approach.length + f.purpose.length + f.data.length + f.level.length;
}

/** 필터를 통과하는가. 축 안에서는 OR, 축 사이는 AND. */
export function passes(m: Method, f: Filters): boolean {
  if (f.approach.length && !f.approach.includes(m.approach)) return false;
  if (f.purpose.length && !f.purpose.some((p) => m.purpose.includes(p))) return false;
  if (f.data.length && !f.data.some((d) => m.data.includes(d))) return false;
  if (f.level.length && !f.level.includes(m.level)) return false;
  return true;
}

/** 검색어에 걸리는가. 이름·영문명·방법군·정의를 본다. */
export function matchesQuery(m: Method, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  return [m.name, m.en, m.family, m.def].some((v) => v.toLowerCase().includes(s));
}

export function applyFilters(methods: Method[], f: Filters): Method[] {
  return methods.filter((m) => passes(m, f));
}

/** 토글 헬퍼 — 배열 안에 있으면 빼고 없으면 넣는다. */
export function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
