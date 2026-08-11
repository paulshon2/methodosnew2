/**
 * public/method-system.json 파서 · 정규화 (순수 함수)
 *
 * 과거 method-system.tsx 는 `doc.lineages` / `doc.maps` / `doc.validity` 를 읽었다.
 * 그러나 파일의 실제 최상위 키는 `version · source · intro · sections` 다.
 * 세 키가 전부 undefined가 되어 조건부 렌더가 모두 건너뛰어졌고,
 * 화면에는 `intro` 문구 한 줄만 남았다. 데이터는 처음부터 충분했다.
 *
 * 여기서는 zod로 실제 스키마를 검증하고, 11개 섹션을 5단계로 매핑한다.
 * 컴포넌트가 아니라 이 파일에 로직을 두는 이유는 scripts/ 에서 단위 테스트하기 위해서다.
 */

import { z } from "zod";
import { MAP_METHODS, type Method } from "./method-map-catalog";

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});
export type Section = z.infer<typeof SectionSchema>;

export const SysDocSchema = z.object({
  version: z.string(),
  source: z.string(),
  intro: z.string(),
  sections: z.array(SectionSchema),
});
export type SysDoc = z.infer<typeof SysDocSchema>;

export type Layer = "lineage" | "map" | "approach" | "process" | "validity";

export const LAYERS: { id: Layer; n: number; label: string; question: string }[] = [
  { id: "lineage", n: 1, label: "계보 · 역사", question: "이 방법은 어떤 흐름에서 나왔는가?" },
  { id: "map", n: 2, label: "전체 체계 · 지도", question: "전체 지형에서 내 방법은 어디쯤인가?" },
  { id: "approach", n: 3, label: "접근별 상세", question: "양적·질적·혼합은 무엇이 다른가?" },
  { id: "process", n: 4, label: "방법별 프로세스", question: "이 방법은 어떤 순서로 수행하는가?" },
  { id: "validity", n: 5, label: "타당도 · 신뢰도", question: "이 결과를 믿어도 되는 근거는 무엇인가?" },
];

/** 섹션 id → 단계. 파일의 섹션 순서가 바뀌어도 견디도록 id로 건다. */
const SECTION_LAYER: Record<string, Layer> = {
  "연구방법 계보": "lineage",
  "01_연구방법론_계보": "lineage",
  "연구방법 전체 체계": "map",
  "02_연구방법_전체체계": "map",
  "양적 연구방법": "approach",
  "질적 연구방법": "approach",
  "혼합·다중 연구방법": "approach",
  자료수집방법: "process",
  자료분석방법: "process",
  "04_방법별_프로세스": "process",
  "05_타당도_신뢰도": "validity",
};

/** id를 못 찾을 때 제목 앞의 동그라미 숫자로 되짚는다. */
const CIRCLE_LAYER: Record<string, Layer> = {
  "①": "lineage", "②": "lineage",
  "③": "map", "④": "map",
  "⑤": "approach", "⑥": "approach", "⑦": "approach",
  "⑧": "process", "⑨": "process", "⑩": "process",
  "⑪": "validity",
};

export function layerOf(s: Section): Layer {
  const byId = SECTION_LAYER[s.id];
  if (byId) return byId;
  const c = s.title.trim()[0];
  return CIRCLE_LAYER[c] || "map";
}

/** 섹션 ⑩의 방법 이름 → 큐레이션 카탈로그 id */
const PROCESS_ALIAS: { match: RegExp; id: string }[] = [
  { match: /Grounded Theory|QL-008/i, id: "gt" },
  { match: /Thematic Analysis|주제분석/i, id: "ca" },
  { match: /Survey Research|조사연구/i, id: "survey" },
  { match: /Quasi-Experiment|준실험/i, id: "quasi" },
  { match: /Experiment|실험연구/i, id: "rct" },
  { match: /Case Study|QL-020/i, id: "case" },
  { match: /Ethnography|문화기술지/i, id: "ethno" },
  { match: /Phenomenology|현상학/i, id: "phen" },
  { match: /Narrative Inquiry|QL-027/i, id: "narr" },
  { match: /Mixed Methods|혼합방법/i, id: "conv" },
  { match: /Meta-Analysis|메타분석/i, id: "meta" },
];

export type SourceStep = { phase: string; no: string; role: string; desc: string; src: string };

function matchMethodId(name: string): string | null {
  const hit = PROCESS_ALIAS.find((a) => a.match.test(name));
  return hit ? hit.id : null;
}

/**
 * 섹션 ⑩(방법별 프로세스)을 방법 id별 단계 목록으로 접는다.
 * 원자료는 셀이 비면 위 행을 잇는 형태라 마지막으로 본 이름을 이어 쓴다.
 */
export function collectSourceProcess(sections: Section[]): Record<string, SourceStep[]> {
  const sec = sections.find((s) => s.id === "04_방법별_프로세스" || s.title.includes("방법별 프로세스"));
  if (!sec) return {};
  const out: Record<string, SourceStep[]> = {};
  let lastId: string | null = null;
  sec.rows.forEach((r) => {
    const name = String(r[0] ?? "").trim();
    if (name) {
      const id = matchMethodId(name);
      if (id) lastId = id;
    }
    if (!lastId) return;
    const role = String(r[3] ?? "").trim();
    if (!role) return;
    (out[lastId] ||= []).push({
      phase: String(r[1] ?? "").trim(),
      no: String(r[2] ?? "").trim(),
      role,
      desc: String(r[4] ?? "").trim(),
      src: String(r[5] ?? "").trim(),
    });
  });
  return out;
}

export type NormalizedSystem = {
  intro: string;
  source: string;
  version: string;
  methods: Method[];
  sourceProcess: Record<string, SourceStep[]>;
  byLayer: Record<Layer, Section[]>;
  /** 검증용 — 전체 섹션 수와 전체 행 수 */
  counts: { sections: number; rows: number };
};

export function normalizeSections(doc: SysDoc): NormalizedSystem {
  const byLayer: Record<Layer, Section[]> = { lineage: [], map: [], approach: [], process: [], validity: [] };
  doc.sections.forEach((s) => byLayer[layerOf(s)].push(s));
  return {
    intro: doc.intro,
    source: doc.source,
    version: doc.version,
    methods: MAP_METHODS,
    sourceProcess: collectSourceProcess(doc.sections),
    byLayer,
    counts: {
      sections: doc.sections.length,
      rows: doc.sections.reduce((n, s) => n + s.rows.length, 0),
    },
  };
}

/** fetch 결과처럼 형태를 믿을 수 없는 입력에 쓴다. 실패하면 null을 돌려 ErrorRetry를 띄운다. */
export function parseSysDoc(raw: unknown): NormalizedSystem | null {
  const r = SysDocSchema.safeParse(raw);
  if (!r.success) return null;
  return normalizeSections(r.data);
}
