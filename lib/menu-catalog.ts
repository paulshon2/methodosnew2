/**
 * 등급·메뉴·연구방법·그래프 권한 (all-35)
 * - free: 연구방법 2개 + 기본 그래프 10
 * - basic: 연구방법 3개 + 기본·분포통계 그래프
 * - scholar/university: 전부
 */

import { CHART_CATALOG, allCharts } from "./charts";

export type MenuNode = { code: string; label: string };

/** 사이드바·전체 메뉴 (대시보드~시각화 잠김/허용 대상 포함) */
export const MENU_CATALOG: MenuNode[] = [
  { code: "menu.dashboard", label: "홈" },
  { code: "menu.recommend", label: "방법 찾기" },
  { code: "menu.process", label: "방법 라이브러리·절차" },
  { code: "menu.methods", label: "방법 라이브러리" },
  { code: "menu.archetype", label: "방법 라이브러리·사례" },
  { code: "menu.system", label: "방법 라이브러리·지도" },
  { code: "menu.viz", label: "그래프 그리기" },
  { code: "menu.survey", label: "설문 만들기" },
  { code: "menu.coding", label: "코딩·분류" },
  { code: "menu.basic-stats", label: "통계 계산" },
  { code: "menu.method-writing", label: "원고 쓰기" },
  { code: "menu.projects", label: "내 연구 프로젝트" },
  { code: "menu.settings", label: "설정" },
  { code: "menu.admin", label: "관리자" },
];

/** 관리자가 잠김/허용로 다루는 상위 메뉴 */
export const TOP_LOCK_MENUS: MenuNode[] = MENU_CATALOG.filter((m) =>
  [
    "menu.dashboard",
    "menu.recommend",
    "menu.process",
    "menu.methods",
    "menu.archetype",
    "menu.system",
    "menu.viz",
    "menu.survey",
    "menu.coding",
    "menu.basic-stats",
    "menu.method-writing",
  ].includes(m.code)
);

/** Free: 설문조사 작성 + 사회과학 통계방법 (전체.docx) */
export const FREE_METHOD_IDS = ["SV-003", "QT-013"] as const;
/** Basic: Free + QL-044·QL-041·코딩매뉴얼 */
export const BASIC_METHOD_IDS = [
  "SV-003",
  "QT-013",
  "QL-044",
  "QL-041",
  "QL-060",
] as const;

export const FREE_CHART_IDS = (CHART_CATALOG.find((c) => c.key === "기본")?.charts || []).map((c) => c.id);
/** Basic: 기본 10 + 분포·통계 8 + 관계·고급 8 */
export const BASIC_CHART_IDS = [
  ...FREE_CHART_IDS,
  ...(CHART_CATALOG.find((c) => c.key === "통계")?.charts || []).map((c) => c.id),
  ...(CHART_CATALOG.find((c) => c.key === "과학")?.charts || []).map((c) => c.id),
];

export const ALL_CHART_IDS = allCharts().map((c) => c.id);

export function methodCode(id: string): string {
  return `method.${id}`;
}
export function vizCode(id: string): string {
  return `viz.${id}`;
}

/** Free/Basic 기본 사이드바 메뉴 (관리자 제외) */
export const MEMBER_MENUS: string[] = MENU_CATALOG.filter((m) => m.code !== "menu.admin").map((m) => m.code);

export function defaultMethodIdsFor(plan?: string | null): string[] {
  const p = (plan || "free").toLowerCase();
  if (p === "scholar" || p === "university" || p === "admin") return []; // empty = all (resolved with full list)
  if (p === "basic") return [...BASIC_METHOD_IDS];
  return [...FREE_METHOD_IDS];
}

export function defaultChartIdsFor(plan?: string | null): string[] {
  const p = (plan || "free").toLowerCase();
  if (p === "scholar" || p === "university" || p === "admin") return []; // empty = all
  if (p === "basic") return [...BASIC_CHART_IDS];
  return [...FREE_CHART_IDS];
}

/** 메뉴 코드 Set (사이드바). scholar는 전체 메뉴 */
export function defaultAllowedFor(plan?: string | null): Set<string> {
  const p = (plan || "free").toLowerCase();
  if (p === "university" || p === "scholar" || p === "admin") {
    return new Set(MENU_CATALOG.map((m) => m.code));
  }
  return new Set(MEMBER_MENUS);
}

/**
 * 등급 기본 + overrides → 허용 코드 전체
 * overrides: permission_code → true(허용) | false(차단)
 * methodIds / chartIds: 전체 목록(레지스트리·카탈로그)
 */
export function resolveEntitlements(opts: {
  plan?: string | null;
  isSuperAdmin?: boolean;
  overrides?: Record<string, boolean>;
  /** all-37: 관리자가 "전체 메뉴(잠김/허용)" 화면에서 설정하는 전체 사용자 공통 override.
   *  등급 기본값 다음, 회원 개별 override 이전에 적용된다(회원 개별 설정이 최종 우선). */
  globalOverrides?: Record<string, boolean>;
  allMethodIds: string[];
  allChartIds?: string[];
}): {
  menus: Set<string>;
  methods: Set<string>;
  charts: Set<string>;
  allowed: string[]; // flat codes for API/UI
} {
  const allChartsList = opts.allChartIds || ALL_CHART_IDS;
  const isAdmin = !!opts.isSuperAdmin;
  const plan = isAdmin ? "university" : opts.plan || "free";
  const gov = opts.globalOverrides || {};
  const ov = opts.overrides || {};

  const menus = isAdmin ? new Set(MENU_CATALOG.map((m) => m.code)) : defaultAllowedFor(plan);
  if (isAdmin) menus.add("menu.admin");

  const defMethods = defaultMethodIdsFor(plan);
  // Free/Basic 기본 ID가 카탈로그에 없으면(예: V61 재구축) 전체 카탈로그를 연다.
  const matchedDefaults =
    defMethods.length === 0
      ? opts.allMethodIds
      : defMethods.filter((id) => opts.allMethodIds.includes(id));
  const methods = new Set(matchedDefaults.length > 0 ? matchedDefaults : opts.allMethodIds);

  const defCharts = defaultChartIdsFor(plan);
  const charts = new Set(defCharts.length === 0 ? allChartsList : defCharts.filter((id) => allChartsList.includes(id)));

  function applyLayer(layer: Record<string, boolean>) {
    Object.entries(layer).forEach(([code, allowed]) => {
      if (code.startsWith("menu.")) {
        if (allowed) menus.add(code);
        else menus.delete(code);
      } else if (code.startsWith("method.")) {
        const id = code.slice("method.".length);
        if (allowed) methods.add(id);
        else methods.delete(id);
      } else if (code.startsWith("viz.")) {
        const id = code.slice("viz.".length);
        if (allowed) charts.add(id);
        else charts.delete(id);
      }
    });
  }

  // 전체 사용자 공통 잠금/허용은 슈퍼관리자에게는 적용하지 않는다(관리 화면 자체가
  // 잠기면 다시 풀 수 없게 되는 것을 방지).
  if (!isAdmin) applyLayer(gov);
  applyLayer(ov);

  const allowed = [
    ...Array.from(menus),
    ...Array.from(methods).map(methodCode),
    ...Array.from(charts).map(vizCode),
  ];

  return { menus, methods, charts, allowed };
}

/** hash 라우트 top → 메뉴 권한 코드 (method→methods 등) */
export function routeTopToMenuCode(top: string): string | null {
  const map: Record<string, string> = {
    dashboard: "menu.dashboard",
    home: "menu.dashboard",
    find: "menu.recommend",
    recommend: "menu.recommend",
    library: "menu.methods",
    process: "menu.process",
    methods: "menu.methods",
    method: "menu.methods",
    archetype: "menu.archetype",
    system: "menu.system",
    tools: "menu.viz", // refined in canRoute
    viz: "menu.viz",
    viztype: "menu.viz",
    vizmake: "menu.viz",
    survey: "menu.survey",
    coding: "menu.coding",
    stats: "menu.basic-stats",
    "basic-stats": "menu.basic-stats",
    charts: "menu.viz",
    writing: "menu.method-writing",
    "method-writing": "menu.method-writing",
    projects: "menu.projects",
    project: "menu.projects",
    settings: "menu.settings",
    admin: "menu.admin",
  };
  return map[top] || null;
}

/** 신규 라우트 권한 — library는 OR, tools는 하위 경로별 */
export function routeAllowed(route: string, allowed: Set<string> | null): boolean {
  if (!allowed) return true;
  const parts = route.split("/");
  const top = parts[0];
  if (top === "library" || top === "methods" || top === "method") {
    return (
      allowed.has("menu.methods") ||
      allowed.has("menu.process") ||
      allowed.has("menu.archetype") ||
      allowed.has("menu.system")
    );
  }
  if (top === "process") return allowed.has("menu.process") || allowed.has("menu.methods");
  if (top === "archetype") return allowed.has("menu.archetype") || allowed.has("menu.methods");
  if (top === "system") return allowed.has("menu.system") || allowed.has("menu.methods");
  if (top === "tools") {
    const sub = parts[1] || "";
    const subMap: Record<string, string> = {
      survey: "menu.survey",
      coding: "menu.coding",
      stats: "menu.basic-stats",
      charts: "menu.viz",
      writing: "menu.method-writing",
    };
    const code = subMap[sub];
    return code ? allowed.has(code) : true;
  }
  const code = routeTopToMenuCode(top);
  if (!code) return true;
  return allowed.has(code);
}

export function routeIdToCode(routeId: string): string {
  return routeTopToMenuCode(routeId) || `menu.${routeId}`;
}

/** 하위 호환: FREE_ALLOWED */
export const FREE_ALLOWED = MEMBER_MENUS;
