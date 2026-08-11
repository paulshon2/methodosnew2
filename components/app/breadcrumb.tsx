"use client";

const LABELS: Record<string, string> = {
  home: "홈",
  dashboard: "홈",
  find: "방법 찾기",
  recommend: "방법 찾기",
  library: "방법 라이브러리",
  methods: "방법 라이브러리",
  map: "지도로",
  flow: "절차로",
  cases: "사례로",
  method: "방법",
  projects: "내 연구 프로젝트",
  project: "프로젝트",
  tools: "작업",
  survey: "설문 만들기",
  coding: "코딩·분류",
  stats: "통계 계산",
  "basic-stats": "통계 계산",
  charts: "그래프 그리기",
  viz: "그래프 그리기",
  viztype: "그래프 유형",
  vizmake: "그래프 만들기",
  writing: "원고 쓰기",
  "method-writing": "원고 쓰기",
  settings: "설정",
  admin: "관리자",
  process: "절차로",
  stages: "단계별 상세",
  common: "공통절차",
  summary: "절차",
  archetype: "사례로",
  system: "지도로",
  overview: "개요",
  practice: "실습",
  glossary: "용어",
};

export function breadcrumbItems(route: string): { label: string; href?: string }[] {
  const parts = route.split("/").filter(Boolean);
  if (!parts.length) return [{ label: "홈" }];
  const items: { label: string; href?: string }[] = [{ label: "홈", href: "home" }];
  let acc = "";
  parts.forEach((p, i) => {
    acc = acc ? `${acc}/${p}` : p;
    const decoded = decodeURIComponent(p);
    const label = LABELS[decoded] || LABELS[p] || (decoded.length > 24 ? decoded.slice(0, 22) + "…" : decoded);
    items.push(i === parts.length - 1 ? { label } : { label, href: acc });
  });
  // collapse dashboard→home duplicate
  if (items.length >= 2 && items[1].label === "홈") items.splice(1, 1);
  return items;
}

export default function Breadcrumb({
  route,
  nav,
}: {
  route: string;
  nav: (r: string) => void;
}) {
  const items = breadcrumbItems(route);
  if (items.length <= 1 && (route === "home" || route === "dashboard" || !route)) return null;
  return (
    <nav aria-label="현재 위치" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 ty-small text-ink-3">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {it.href ? (
              <button type="button" className="hover:underline text-ink-2" onClick={() => nav(it.href!)}>
                {it.label}
              </button>
            ) : (
              <span aria-current="page" className="font-semibold text-[var(--color-text-primary)]">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
