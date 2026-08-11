"use client";

/** 라이브러리 렌즈 전환기 — 목록 / 지도 / 절차 / 사례 */
const LENSES = [
  { id: "list", route: "library", label: "목록으로", hint: "조건으로 걸러 카드로 훑기" },
  { id: "map", route: "library/map", label: "지도로", hint: "계열·패러다임에서 자리 찾기" },
  { id: "flow", route: "library/flow", label: "절차로", hint: "수집→분석→보고 흐름" },
  { id: "cases", route: "library/cases", label: "사례로", hint: "아키타입 실습 케이스" },
] as const;

export type LibraryLensId = (typeof LENSES)[number]["id"];

export function activeLensFromRoute(route: string): LibraryLensId {
  if (route.startsWith("library/map") || route.startsWith("system")) return "map";
  if (route.startsWith("library/flow") || route.startsWith("process")) return "flow";
  if (route.startsWith("library/cases") || route.startsWith("archetype")) return "cases";
  return "list";
}

export default function LibraryLensTabs({
  active,
  nav,
}: {
  active: LibraryLensId;
  nav: (r: string) => void;
}) {
  return (
    <div role="tablist" aria-label="방법 보기 전환" className="flex flex-wrap gap-2 mb-4">
      {LENSES.map((l) => {
        const selected = active === l.id;
        return (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={selected}
            title={l.hint}
            onClick={() => nav(l.route)}
            className={selected ? "tab tab-active" : "tab"}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
