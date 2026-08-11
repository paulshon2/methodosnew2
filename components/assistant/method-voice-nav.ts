/** MethodOS · 음성/텍스트 메뉴 이동 (ove-7 classifyIntent 축약) */

export type MethodNavItem = {
  route: string;
  label: string;
  aliases: string[];
};

export const METHOD_NAV_ITEMS: MethodNavItem[] = [
  { route: "home", label: "홈", aliases: ["홈", "home", "대시보드"] },
  { route: "find", label: "방법 찾기", aliases: ["방법찾기", "방법 찾기", "추천"] },
  { route: "library", label: "방법 라이브러리", aliases: ["라이브러리", "방법 라이브러리", "문헌"] },
  { route: "projects", label: "내 연구 프로젝트", aliases: ["프로젝트", "내 프로젝트", "연구 프로젝트"] },
  { route: "tools/survey", label: "설문 만들기", aliases: ["설문", "설문 만들기", "survey"] },
  { route: "tools/coding", label: "코딩·분류", aliases: ["코딩", "분류", "coding"] },
  { route: "tools/stats", label: "통계 계산", aliases: ["통계", "통계 계산", "stats"] },
  { route: "tools/charts", label: "그래프 그리기", aliases: ["그래프", "차트", "charts"] },
  { route: "tools/writing", label: "방법론 집필", aliases: ["집필", "writing", "방법론 집필"] },
];

function normalize(raw: string): string {
  return raw
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?~"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMenuSuffix(text: string): { core: string; menuIntent: boolean } {
  const t = text.trim();
  const menuIntent = /메뉴\s*$/.test(t) || /\bmenu\s*$/i.test(t);
  const core = t.replace(/(?:메뉴|menu)\s*$/i, "").trim();
  return { core: core || t, menuIntent };
}

export function classifyMethodIntent(raw: string): {
  item: MethodNavItem | null;
  candidates: MethodNavItem[];
} {
  const { core, menuIntent } = stripMenuSuffix(normalize(raw));
  if (!core) return { item: null, candidates: [] };

  const scored = METHOD_NAV_ITEMS.map((item) => {
    let best = 0;
    for (const a of item.aliases) {
      const al = normalize(a);
      if (core === al) best = Math.max(best, 1);
      else if (core.includes(al) || al.includes(core)) best = Math.max(best, 0.72);
    }
    if (menuIntent && best >= 0.55) best = Math.max(best, 0.92);
    return { item, score: best };
  }).filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const threshold = menuIntent ? 0.55 : 0.75;
  if (!top || top.score < threshold) return { item: null, candidates: [] };
  const close = scored.filter((s) => top.score - s.score < 0.08 && s.score >= threshold);
  if (close.length > 1) {
    return { item: null, candidates: close.map((c) => c.item) };
  }
  return { item: top.item, candidates: [] };
}
