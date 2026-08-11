/**
 * Coding Engine — qualitative coding pipeline.
 *
 * 8개 AI 변환기(각각 프롬프트 빌더 + 규칙 폴백)
 *   1) analyze        — 자료 개요·잠재 코드 후보
 *   2) cleanup        — 익명화·분석단위 분절
 *   3) firstCode      — 1차 코딩(방법 선택)
 *   4) recode         — 코드 정련·통합·삭제·재명명
 *   5) categorize     — 범주 + 하위범주 계층
 *   6) patternize     — 반복 패턴 진술
 *   7) themeize       — 완결 문장 테마
 *   8) conceptualize  — 추상 개념
 *   9) theorize       — 이론 진술문·모형
 *
 * 데이터 모델
 *   Segment         : 자료 조각(원문 + 분석단위)
 *   CodedSegment    : Segment + 부여된 코드들
 *   CodeRow         : 코드북 항목
 *   Category / Theme / Concept / TheoryStatement
 *
 * 불러오기
 *   parseImportedRows(rows)  — 엑셀 시트(2차원 배열) → CodedSegment[]
 *   parseImportedText(txt)   — 문단/문장 → Segment[]
 */
import { aiComplete } from "./engine";
import {
  FIRST_CYCLE_METHODS,
  SECOND_CYCLE_METHODS,
  CODING_PROTOCOL,
  METHOD_LINKS,
  VIZ_LINKS,
  type CodingMethod,
} from "./cmq-taxonomy";
import {
  DATA_CLEANING_PROTOCOL,
  type CodebookEntry,
  type ExecutionMode,
  type ProgressReporter,
} from "./coding-standards";
import {
  segmentRaw,
  runComputationalAnalytics,
  extractEvidencePackages,
  buildAiCodebook,
  derivePatternCategoryTheme,
  evidenceMapForTerms,
  type InterpretiveInference,
} from "./ai-standard-codebook";

/* ────────────────── Types ────────────────── */
export type Segment = {
  id: string;         // seg1, seg2 ...
  unit: string;       // "sentence" | "paragraph" | "episode" | ...
  source?: string;    // "interview P01" 등
  text: string;
};
export type CodedSegment = Segment & {
  codes: { code: string; methodId?: string; note?: string }[];
};
export type CodeRow = {
  code: string;
  definition: string;
  example: string;
  methodId: string;   // 어떤 1차 코딩 방법으로 붙였는지
  cmq: string;
  count: number;
};
export type Category = { id: string; label: string; codes: string[]; subcategories?: Category[] };
export type Pattern = { id: string; statement: string; supportingCodes: string[] };
export type Theme = { id: string; sentence: string; categories: string[] };
export type Concept = { id: string; label: string; definition: string; themes: string[] };
export type TheoryStatement = { id: string; statement: string; concepts: string[] };

export type CodingProject = {
  title: string;
  question: string;
  dataSourceId: string;
  unitLevel: string;
  firstMethodIds: string[];
  secondMethodId: string;                      // 호환용(첫 번째 2차 방법)
  secondMethodIds?: string[];                  // v54: 2차 코딩 다중선택
  raw: string;                     // 원자료
  segments: Segment[];
  coded: CodedSegment[];
  codebook: CodeRow[];
  refinedCodes: CodeRow[];
  categories: Category[];
  patterns: Pattern[];
  themes: Theme[];
  concepts: Concept[];
  theory: TheoryStatement[];
  // v47 expanded
  purpose?: string;
  framework?: string;
  participants?: string;
  setting?: string;
  collectionPeriod?: string;
  reflexivity?: string;
  analysisGoals?: string;
  dataSourceIds?: string[];
  // v48 — 표준 프로토콜: 실행모드 · AI Codebook · 클린징 옵션 · 수동 규칙
  executionMode?: ExecutionMode;               // discovery | codebook | hybrid
  aiCodebook?: CodebookEntry[];                // 1차 사이클 코드북
  aiCodebookSecond?: CodebookEntry[];          // v54: 2차(재코딩) 코드북
  proposedCodes?: CodebookEntry[];             // Hybrid에서 AI가 제안한 신규 코드
  cleaningOptions?: Record<string, boolean>;   // { encoding: true, html: true, ... }
  manualRules?: {                              // 변환기·코딩방법별 수동 규칙(코드 매핑)
    coding?: Record<string, { keywords: string; code: string }[]>;
    transformer?: Record<string, string>;      // t.id → 자유 텍스트 규칙
  };
  projectName?: string;                        // 저장/표시용 이름
  schemaVersion?: number;                      // v50 마이그레이션용
  interpretation?: string;                     // 최종 해석 리포트 영속
  /** 최초 불러온 원문(클린징으로 덮어쓰지 않음). 없으면 raw가 원문. */
  rawOriginal?: string;
  /** 표시/디버그용 클린징 결과(태그·주석 포함 가능). AI 코딩 입력으로는 쓰지 않음. */
  cleanedPreview?: string;
  /** v54: AI 초안 생성 기입 힌트(표1) */
  firstDraftHints?: Record<string, string>;
  secondDraftHints?: Record<string, string>;
  /** v55: AI 기반 질적연구 표준 코딩북(원자료→계산→추론→코드북) */
  standardAiCodebook?: any;
  /** v56: 파이프라인(③) 결과 — Computational Analytics · Evidence · Inference (⑤급 해석) */
  pipelineInsight?: PipelineInsight | null;
};

/** v56: 파이프라인 결과 해석용 고품질 인사이트 (표준 코딩북과 동일 스키마) */
export type PipelineInsight = {
  analytics: import("./ai-standard-codebook").ComputationalAnalytics | null;
  evidence: import("./ai-standard-codebook").EvidencePackage[];
  inferences: import("./ai-standard-codebook").InterpretiveInference[];
  codebook: import("./ai-standard-codebook").AiCodebookEntry[];
  patterns: import("./ai-standard-codebook").SacPattern[];
  categories: import("./ai-standard-codebook").SacCategory[];
  themes: import("./ai-standard-codebook").SacTheme[];
  evidenceByTerm: Record<string, string[]>;
  updatedAt: string;
};

export const CMQ_SCHEMA_VERSION = 56;
const MAX_SEGMENTS = 2500;

export function emptyProject(): CodingProject {
  const cleaning: Record<string, boolean> = {};
  DATA_CLEANING_PROTOCOL.forEach((s) => { cleaning[s.id] = true; });
  return {
    title: "", question: "", dataSourceId: "interview", unitLevel: "sentence",
    firstMethodIds: ["descriptive", "in_vivo"],
    secondMethodId: "pattern",
    secondMethodIds: ["pattern"],
    raw: "",
    segments: [], coded: [], codebook: [], refinedCodes: [],
    categories: [], patterns: [], themes: [], concepts: [], theory: [],
    purpose: "", framework: "", participants: "", setting: "",
    collectionPeriod: "", reflexivity: "", analysisGoals: "",
    dataSourceIds: ["interview"],
    // v48
    executionMode: "hybrid",
    aiCodebook: [],
    aiCodebookSecond: [],
    proposedCodes: [],
    cleaningOptions: cleaning,
    manualRules: { coding: {}, transformer: {} },
    projectName: "",
    schemaVersion: CMQ_SCHEMA_VERSION,
    interpretation: "",
    firstDraftHints: {},
    secondDraftHints: {},
    pipelineInsight: null,
  };
}

/** v50: 오염된 초대형 원자료 제거 + 신규 클린징 옵션 병합 */
export function migrateCmqProject(raw: any): CodingProject {
  const base = emptyProject();
  if (!raw || typeof raw !== "object") return base;
  const p = { ...base, ...raw } as CodingProject;
  const cleaning: Record<string, boolean> = { ...base.cleaningOptions };
  Object.entries(raw.cleaningOptions || {}).forEach(([k, v]) => { cleaning[k] = !!v; });
  DATA_CLEANING_PROTOCOL.forEach((s) => {
    if (cleaning[s.id] === undefined) cleaning[s.id] = true;
  });
  p.cleaningOptions = cleaning;
  p.firstMethodIds = Array.isArray(p.firstMethodIds) && p.firstMethodIds.length
    ? p.firstMethodIds.filter(Boolean)
    : ["descriptive", "in_vivo"];
  // v54: 2차 코딩 다중선택 — secondMethodIds 우선, 없으면 secondMethodId에서 승격
  if (Array.isArray((raw as any).secondMethodIds) && (raw as any).secondMethodIds.length) {
    p.secondMethodIds = (raw as any).secondMethodIds.filter(Boolean);
  } else if (p.secondMethodId) {
    p.secondMethodIds = [p.secondMethodId];
  } else {
    p.secondMethodIds = ["pattern"];
  }
  p.secondMethodId = p.secondMethodIds[0] || "pattern";
  p.aiCodebookSecond = Array.isArray((raw as any).aiCodebookSecond) ? (raw as any).aiCodebookSecond : (p.aiCodebookSecond || []);
  p.firstDraftHints = (raw as any).firstDraftHints && typeof (raw as any).firstDraftHints === "object" ? (raw as any).firstDraftHints : {};
  p.secondDraftHints = (raw as any).secondDraftHints && typeof (raw as any).secondDraftHints === "object" ? (raw as any).secondDraftHints : {};
  p.segments = Array.isArray(p.segments) ? p.segments : [];
  p.coded = Array.isArray(p.coded) ? p.coded : [];
  // v50: 원자료 기입란은 기본 비움 — 이전 세션의 초대형 잔여 텍스트 제거
  if ((p.schemaVersion || 0) < 50) {
    p.raw = "";
  }
  p.schemaVersion = CMQ_SCHEMA_VERSION;
  if (typeof p.raw !== "string") p.raw = "";
  // 안전: 비정상적으로 큰 raw는 세션 보호를 위해 비움
  if (p.raw.length > 400000) p.raw = "";
  p.interpretation = typeof (raw as any).interpretation === "string" ? (raw as any).interpretation : (p.interpretation || "");
  p.standardAiCodebook = (raw as any).standardAiCodebook && typeof (raw as any).standardAiCodebook === "object"
    ? (raw as any).standardAiCodebook
    : (p.standardAiCodebook || undefined);
  p.pipelineInsight = (raw as any).pipelineInsight && typeof (raw as any).pipelineInsight === "object"
    ? (raw as any).pipelineInsight
    : (p.pipelineInsight || null);
  return p;
}

/* ────────────────── Prompt helpers ────────────────── */
function methodsBrief(ids: string[]): string {
  return ids
    .map((id) => FIRST_CYCLE_METHODS.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => `${m!.label}(${m!.labelEn}) — ${m!.easy}`)
    .join("\n- ");
}
function safeJsonArray(raw: string): any[] | null {
  const t = raw.replace(/```json|```/g, "").trim();
  const s = t.indexOf("["); const e = t.lastIndexOf("]");
  if (s < 0 || e <= s) return null;
  try { const arr = JSON.parse(t.slice(s, e + 1)); return Array.isArray(arr) ? arr : null; } catch { return null; }
}

/** 클린징 파이프라인이 삽입한 태그·주석을 제거해 의미 있는 원문 토큰만 남긴다. */
export function stripCleaningArtifacts(t: string): string {
  return (t || "")
    .replace(/\[LANG:[^\]]*\]\s*/gi, "")
    .replace(/\[META:[^\]]*\]\s*/gi, "")
    .replace(/\[(?:EN|KO|MIX)\]\s*/gi, "")
    .replace(/\[인물후보:([^\]]+)\]/g, "$1")
    .replace(/\[장소:([^\]]+)\]/g, "$1")
    .replace(/\[기관:([^\]]+)\]/g, "$1")
    .replace(/\[화자:([^\]]+)\]:\s*/g, "$1: ")
    .replace(/\[POS:[^\]]*\]/g, "")
    .replace(/\[P\d{2}[^\]]*\]/g, "")
    .replace(/\[독성표현\]/g, "")
    .replace(/\[(?:URL|이메일|전화|주민번호|😊)\]/g, " ")
    .replace(/\([^)]*→[^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 코드/세그먼트에서 의미 있는 짧은 라벨을 뽑는다(앞글자 truncation 폴백 대체). */
const CMQ_STOP = new Set([
  "그리고", "그러나", "그래서", "하지만", "또한", "또는", "이런", "저런", "그런",
  "이것", "그것", "저것", "있는", "없는", "하는", "된다", "했다", "한다", "이다",
  "the", "and", "for", "with", "that", "this", "from", "have", "were", "been",
  "was", "are", "you", "your", "they", "them", "their", "then", "than", "but",
  "not", "all", "any", "can", "had", "has", "his", "her", "she", "him", "who",
  "what", "when", "where", "which", "how", "why", "will", "would", "could",
  "should", "about", "into", "over", "after", "before", "there", "here", "some",
  "just", "like", "also", "only", "very", "more", "most", "other", "such",
  "out", "up", "down", "off", "on", "in", "at", "to", "of", "as", "by", "or",
  "if", "so", "do", "did", "does", "be", "being", "is", "am", "we", "our",
  "my", "me", "its", "now", "too", "yes", "no",
]);

function meaningfulLabel(text: string, maxWords = 2): string {
  const clean = stripCleaningArtifacts(text);
  const words = (clean.match(/[가-힣]{2,12}|[A-Za-z]{3,20}/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => !CMQ_STOP.has(w) && w.length >= 2);
  const picked = words.slice(0, maxWords).join("_");
  if (picked) return picked.slice(0, 24);
  const plain = clean.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 16) || "미분류";
}

/** QCA v3 스타일 영문 간이 lemmatize — 최소 어간 길이·보호어휘 가드. */
function lemmatizeLiteEnglish(token: string): string {
  const PROTECT = new Set([
    "was", "this", "is", "as", "his", "has", "does", "goes", "yes", "us", "its", "thus",
    "being", "doing", "having", "been", "are", "were", "am",
  ]);
  if (!/^[A-Za-z][A-Za-z'-]*$/.test(token)) return token;
  const lower = token.toLowerCase();
  if (PROTECT.has(lower)) return token;
  // ies/ied → y
  for (const suf of ["ies", "ied"] as const) {
    if (lower.endsWith(suf) && lower.length > 4) {
      return token.slice(0, -suf.length) + "y";
    }
  }
  // s: 단어 길이 5+ (this/was/cats 보호). ed/ing: 남은 어간 4자 이상.
  const rules: { suf: string; minWord: number; minStem: number }[] = [
    { suf: "ing", minWord: 6, minStem: 4 },
    { suf: "ed", minWord: 5, minStem: 4 },
    { suf: "es", minWord: 5, minStem: 3 },
    { suf: "s", minWord: 5, minStem: 3 },
  ];
  for (const { suf, minWord, minStem } of rules) {
    if (!lower.endsWith(suf)) continue;
    const stemLen = lower.length - suf.length;
    if (lower.length >= minWord && stemLen >= minStem) {
      return token.slice(0, -suf.length);
    }
  }
  return token;
}

function lemmatizeTextSafe(text: string): string {
  return text
    .replace(/했습니다/g, "하다")
    .replace(/합니다/g, "하다")
    .replace(/한다\b/g, "하다")
    .replace(/\b([A-Za-z][A-Za-z'-]*)\b/g, (m) => lemmatizeLiteEnglish(m));
}

/** 이미 [...] 태그 안에 있는 구간은 치환하지 않는다(NER 중첩 방지). */
function replaceOutsideBrackets(text: string, re: RegExp, replacer: (m: string, ...args: any[]) => string): string {
  const parts = text.split(/(\[[^\]]*\])/);
  return parts.map((part) => {
    if (part.startsWith("[") && part.endsWith("]")) return part;
    return part.replace(re, replacer as any);
  }).join("");
}

/* ────────────────── 1) Analyze ────────────────── */
export async function analyzeCorpus(proj: CodingProject, settings: any):
  Promise<{ overview: string; toneAndVoice: string; candidateCodes: string[]; source: "ai" | "rule" }> {
  if (!proj.raw.trim()) return { overview: "", toneAndVoice: "", candidateCodes: [], source: "rule" };
  const prompt =
`너는 질적연구 코딩 자문가다.
아래 원자료를 훑고 다음을 JSON으로만 응답하라.
{"overview": "1~2문장", "toneAndVoice": "1문장", "candidateCodes": ["코드후보1","코드후보2",...]}
코드후보는 8~15개, 짧은 한국어 명사구.

[원자료]
${proj.raw.slice(0, 6000)}`;
  const out = await aiComplete(prompt, settings);
  if (out) {
    try {
      const t = out.replace(/```json|```/g, "");
      const s = t.indexOf("{"); const e = t.lastIndexOf("}");
      if (s >= 0 && e > s) {
        const j = JSON.parse(t.slice(s, e + 1));
        return {
          overview: String(j.overview || ""),
          toneAndVoice: String(j.toneAndVoice || ""),
          candidateCodes: Array.isArray(j.candidateCodes) ? j.candidateCodes.map(String) : [],
          source: "ai",
        };
      }
    } catch { /* fall */ }
  }
  // rule 폴백: 명사/명사구 후보 = 빈도 상위 어휘
  const words = (proj.raw.match(/[가-힣]{2,}|[A-Za-z]{4,}/g) || []);
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => x[0]);
  return {
    overview: `자료 길이 ${proj.raw.length}자, 문장 수 대략 ${(proj.raw.split(/[.!?。！？]/).length)}개.`,
    toneAndVoice: "톤 자동판정 미지원(규칙 폴백).",
    candidateCodes: top, source: "rule",
  };
}

/* ────────────────── 2) Cleanup — 분석단위 분절 ────────────────── */
export function cleanupToSegments(proj: CodingProject): Segment[] {
  const text = (proj.raw || "")
    .replace(/010-?\d{3,4}-?\d{4}/g, "[전화]")
    .replace(/[\w.-]+@[\w.-]+/g, "[이메일]");
  const unit = proj.unitLevel || "sentence";
  let parts: string[] = [];
  if (unit === "paragraph") parts = text.split(/\n\s*\n+/);
  else if (unit === "episode") parts = text.split(/\n{2,}/);
  else if (unit === "phrase") parts = text.split(/[,;、。]|\s—\s/);
  else if (unit === "word") parts = text.split(/\s+/);
  else parts = text.split(/(?<=[.!?。！？])\s+|\n/); // sentence & meaning_unit 기본
  const segs = parts.map((s) => s.trim()).filter((s) => s.length > 1).slice(0, MAX_SEGMENTS);
  return segs.map((s, i) => ({ id: `seg${i + 1}`, unit, source: proj.dataSourceId, text: s }));
}

/* ────────────────── 3) First Cycle Coding ────────────────── */
export async function firstCycleCode(
  proj: CodingProject, settings: any
): Promise<{ coded: CodedSegment[]; codebook: CodeRow[]; source: "ai" | "rule" }> {
  if (proj.segments.length === 0) return { coded: [], codebook: [], source: "rule" };
  const methods = (proj.firstMethodIds || []).filter(Boolean).length
    ? proj.firstMethodIds.filter(Boolean)
    : ["descriptive"];
  const brief = methodsBrief(methods);
  const primary = methods[0] || "descriptive";
  const primaryMethod = FIRST_CYCLE_METHODS.find((m) => m.id === primary)
    || FIRST_CYCLE_METHODS.find((m) => m.id === "descriptive")
    || FIRST_CYCLE_METHODS[0];
  if (!primaryMethod) return { coded: [], codebook: [], source: "rule" };

  // AI: 자료를 배치로 나눠 코드 부여
  const batchSize = 20;
  const outAll: CodedSegment[] = [];
  let usedAi = false;
  for (let b = 0; b < proj.segments.length; b += batchSize) {
    const batch = proj.segments.slice(b, b + batchSize);
    const prompt =
`너는 질적연구 1차 코딩(First Cycle Coding) 코더다.
아래 1차 코딩 방법을 사용해 각 분석단위(id)에 코드를 1~3개 부여하라.
- ${brief}

[분석단위]
${batch.map((s) => `${s.id}: ${s.text}`).join("\n")}

[출력 형식] JSON 배열. 항목:
{"id":"segN","codes":[{"code":"짧은 한국어 코드","methodId":"${primary}","note":"짧은 근거(선택)"}]}
반드시 JSON 배열만 출력.`;
    const raw = await aiComplete(prompt, settings);
    const arr = raw ? safeJsonArray(raw) : null;
    if (arr && arr.length) {
      usedAi = true;
      batch.forEach((s) => {
        const hit = arr.find((x: any) => String(x.id) === s.id);
        outAll.push({
          ...s,
          codes: Array.isArray(hit?.codes)
            ? hit.codes.map((c: any) => ({ code: String(c.code || "").trim() || "미분류", methodId: String(c.methodId || primary), note: c.note ? String(c.note) : undefined }))
            : ruleAssignCode(s, primaryMethod),
        });
      });
    } else {
      batch.forEach((s) => outAll.push({ ...s, codes: ruleAssignCode(s, primaryMethod) }));
    }
  }
  const codebook = buildCodebook(outAll);
  return { coded: outAll, codebook, source: usedAi ? "ai" : "rule" };
}

function ruleAssignCode(s: Segment, m?: CodingMethod | null): { code: string; methodId: string }[] {
  const t = stripCleaningArtifacts(s.text || "");
  if (!m) return [{ code: meaningfulLabel(t) || "미분류", methodId: "descriptive" }];
  if (m.id === "in_vivo") {
    const q = t.match(/["“'『「](.{2,20}?)["”'』」]/);
    return [{ code: q ? `"${q[1]}"` : `"${meaningfulLabel(t, 3)}"`, methodId: m.id }];
  }
  if (m.id === "process") {
    const verb = t.match(/([가-힣]{2,})(하다|한다|합니다|했다|하고|하며|해서)/);
    return [{ code: verb ? `${verb[1]}하기` : "행동하기", methodId: m.id }];
  }
  if (m.id === "emotion") {
    const emo = /힘들|기쁘|슬프|화가|무섭|두렵|안심|불안|외롭|분노|절망|기대|후회/.exec(t);
    return [{ code: emo ? `감정:${emo[0]}` : "감정:평온", methodId: m.id }];
  }
  if (m.id === "values") {
    return [{ code: "V:미확정", methodId: m.id }];
  }
  // descriptive 기본 — 앞 12글자 truncation 금지(태그 오염 시 동일 코드로 붕괴)
  return [{ code: meaningfulLabel(t) || "미분류", methodId: m.id }];
}

function buildCodebook(coded: CodedSegment[]): CodeRow[] {
  const map = new Map<string, CodeRow>();
  coded.forEach((s) => {
    s.codes.forEach((c) => {
      const key = c.code;
      const cur = map.get(key);
      if (cur) { cur.count++; if (!cur.example) cur.example = s.text.slice(0, 60); }
      else {
        const method = FIRST_CYCLE_METHODS.find((m) => m.id === c.methodId);
        map.set(key, {
          code: key, definition: "", example: s.text.slice(0, 60),
          methodId: c.methodId || "descriptive",
          cmq: method?.cmq || "First Cycle Coding Methods",
          count: 1,
        });
      }
    });
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/* ────────────────── 4) Recode (2차) ────────────────── */
export async function recode(
  proj: CodingProject, settings: any
): Promise<{ refined: CodeRow[]; source: "ai" | "rule" }> {
  if (proj.codebook.length === 0) return { refined: [], source: "rule" };
  const secondIds = (proj.secondMethodIds && proj.secondMethodIds.length)
    ? proj.secondMethodIds
    : [proj.secondMethodId || "pattern"];
  const methods = secondIds
    .map((id) => SECOND_CYCLE_METHODS.find((m) => m.id === id))
    .filter(Boolean) as typeof SECOND_CYCLE_METHODS;
  const method = methods[0] || SECOND_CYCLE_METHODS[0];
  const methodBrief = methods.map((m) => `${m.label}(${m.labelEn}) — ${m.easy}`).join("\n");
  const secondCb = (proj.aiCodebookSecond || []).slice(0, 40);
  const firstCb = (proj.aiCodebook || []).slice(0, 40);
  const prompt =
`너는 질적연구 재코딩(Second Cycle) 전문가다. 선택된 2차 방법(다중):
${methodBrief}

반드시 1차↔2차 연결성 원칙을 지켜라:
1) 연속성 — 2차는 1차 결과 기반(임의 의미 추가 금지)
2) 추상화 — 구체→범주·패턴·이론
3) 통합성 — 여러 1차 코드 통합
4) 검증가능성 — 1차 데이터로 검증 가능
5) 발전적 순환 — 필요시 1차로 환류
6) 이론적 정렬 — 연구질문·이론틀 연결

아래 1차 코드북을 (a) 중복 통합 (b) 유사어 병합 (c) 이름 정련 (d) 저빈도·주변부 삭제 규칙으로 다듬어라.
JSON 배열로 응답: [{"code":"정련코드","definition":"짧은 정의","example":"짧은 예","methodId":"${method.id}","count": 합산빈도,"linkage":"연결된 1차코드"}]

[1차 실행 코드북]
${proj.codebook.slice(0, 60).map((r) => `- ${r.code} (n=${r.count}) 예: ${r.example}`).join("\n")}
${firstCb.length ? `\n[1차 준비 코드북]\n${firstCb.map((e) => `- ${e.name}: ${e.definition}`).join("\n")}` : ""}
${secondCb.length ? `\n[2차 준비 코드북]\n${secondCb.map((e) => `- ${e.name}: ${e.definition} | 연결:${(e as any).linkage || e.inclusion || ""}`).join("\n")}` : ""}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    const refined: CodeRow[] = arr.map((x: any) => ({
      code: String(x.code || ""), definition: String(x.definition || ""),
      example: String(x.example || ""), methodId: String(x.methodId || method.id),
      cmq: method.cmq, count: Number(x.count || 1),
    })).filter((r) => r.code);
    return { refined, source: "ai" };
  }
  // rule: 2차 코드북이 있으면 우선 반영, 없으면 빈도 상위 유지
  if (secondCb.length) {
    const refined = secondCb.map((e, i) => ({
      code: e.name,
      definition: e.definition,
      example: e.example,
      methodId: e.methodId || method.id,
      cmq: method.cmq,
      count: Math.max(1, proj.codebook.length - i),
    }));
    return { refined, source: "rule" };
  }
  const refined = proj.codebook
    .filter((r) => r.count >= Math.max(1, Math.floor(proj.codebook[0].count * 0.15)))
    .map((r) => ({ ...r, code: r.code.trim(), cmq: method.cmq }));
  return { refined, source: "rule" };
}

/* ────────────────── 5) Categorize ────────────────── */
export async function categorize(proj: CodingProject, settings: any):
  Promise<{ categories: Category[]; source: "ai" | "rule" }> {
  const codes = (proj.refinedCodes.length ? proj.refinedCodes : proj.codebook).map((r) => r.code);
  if (!codes.length) return { categories: [], source: "rule" };
  const prompt =
`너는 질적연구 범주화(Category) 전문가다.
아래 코드들을 성질별로 묶어 상위 범주와 하위범주(subcategories)로 조직하라.
JSON 배열로: [{"id":"cat1","label":"범주명","codes":["c1","c2"],"subcategories":[{"id":"sub1","label":"하위","codes":["c3"]}]}]
반드시 JSON 배열만.

[코드 목록]
${codes.slice(0, 80).join(", ")}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    const cats: Category[] = arr.map((x: any, i: number) => ({
      id: String(x.id || `cat${i + 1}`),
      label: String(x.label || `범주${i + 1}`),
      codes: Array.isArray(x.codes) ? x.codes.map(String) : [],
      subcategories: Array.isArray(x.subcategories) ? x.subcategories.map((s: any, j: number) => ({
        id: String(s.id || `sub${i + 1}_${j + 1}`),
        label: String(s.label || `하위${j + 1}`),
        codes: Array.isArray(s.codes) ? s.codes.map(String) : [],
      })) : [],
    }));
    return { categories: cats, source: "ai" };
  }
  // rule 폴백: 앞 2글자 truncation 금지 → 의미 키워드 기반 그룹(오염 태그 제거 후)
  const groups = new Map<string, string[]>();
  codes.forEach((c) => {
    const k = meaningfulLabel(c, 1) || "기타";
    groups.set(k, [...(groups.get(k) || []), c]);
  });
  // 그룹이 과도하게 쪼개지면(코드마다 1개) 상위 빈도 키워드로 재묶기
  let entries = [...groups.entries()];
  if (entries.length > Math.max(8, Math.ceil(codes.length / 2))) {
    const freq = new Map<string, number>();
    codes.forEach((c) => {
      const w = meaningfulLabel(c, 1);
      freq.set(w, (freq.get(w) || 0) + 1);
    });
    const topKeys = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
    const regroup = new Map<string, string[]>();
    codes.forEach((c) => {
      const w = meaningfulLabel(c, 1);
      const bucket = topKeys.includes(w) ? w : "기타";
      regroup.set(bucket, [...(regroup.get(bucket) || []), c]);
    });
    entries = [...regroup.entries()];
  }
  const cats: Category[] = entries.map(([k, cs], i) => ({
    id: `cat${i + 1}`,
    label: `주제:${k}`,
    codes: cs,
  }));
  return { categories: cats, source: "rule" };
}

/* ────────────────── 6) Patternize ────────────────── */
export async function patternize(proj: CodingProject, settings: any):
  Promise<{ patterns: Pattern[]; source: "ai" | "rule" }> {
  if (!proj.categories.length) return { patterns: [], source: "rule" };
  const prompt =
`너는 패턴 코딩(Pattern Coding) 전문가다.
아래 범주로부터 반복성·인과·과정·조건의 패턴 진술을 5~10개 뽑아라.
JSON 배열: [{"id":"p1","statement":"~할수록 ~한다","supportingCodes":["c1","c2"]}]

[범주]
${proj.categories.map((c) => `- ${c.label}: ${c.codes.slice(0, 8).join(", ")}`).join("\n")}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    return { patterns: arr.map((x: any, i: number) => ({
      id: String(x.id || `p${i + 1}`),
      statement: String(x.statement || ""),
      supportingCodes: Array.isArray(x.supportingCodes) ? x.supportingCodes.map(String) : [],
    })), source: "ai" };
  }
  return {
    patterns: proj.categories.slice(0, 5).map((c, i) => ({
      id: `p${i + 1}`, statement: `${c.label} 범주는 반복적으로 관찰된다.`,
      supportingCodes: c.codes.slice(0, 4),
    })),
    source: "rule",
  };
}

/* ────────────────── 7) Themeize ────────────────── */
export async function themeize(proj: CodingProject, settings: any):
  Promise<{ themes: Theme[]; source: "ai" | "rule" }> {
  if (!proj.categories.length) return { themes: [], source: "rule" };
  const prompt =
`너는 테마화(Themeing) 전문가다. 코드/범주가 담고 있는 의미를 완결된 한 문장의 테마로 정리하라.
JSON 배열: [{"id":"t1","sentence":"~하다는 것","categories":["범주명"]}]

[범주+패턴]
${proj.categories.map((c) => `- ${c.label}`).join("\n")}
${proj.patterns.map((p) => `* 패턴: ${p.statement}`).join("\n")}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    return { themes: arr.map((x: any, i: number) => ({
      id: String(x.id || `t${i + 1}`),
      sentence: String(x.sentence || ""),
      categories: Array.isArray(x.categories) ? x.categories.map(String) : [],
    })), source: "ai" };
  }
  return {
    themes: proj.categories.slice(0, 4).map((c, i) => ({
      id: `t${i + 1}`, sentence: `${c.label}은(는) 이 자료의 핵심 흐름 중 하나이다.`,
      categories: [c.label],
    })),
    source: "rule",
  };
}

/* ────────────────── 8) Conceptualize ────────────────── */
export async function conceptualize(proj: CodingProject, settings: any):
  Promise<{ concepts: Concept[]; source: "ai" | "rule" }> {
  if (!proj.themes.length) return { concepts: [], source: "rule" };
  const prompt =
`너는 개념화(Concept Generation) 전문가다. 여러 테마를 묶어 추상 개념(Concept) 3~6개로 승격하라.
JSON 배열: [{"id":"c1","label":"개념명","definition":"짧은 정의","themes":["테마 문장 요약","..."]}]

[테마]
${proj.themes.map((t) => `- ${t.sentence}`).join("\n")}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    return { concepts: arr.map((x: any, i: number) => ({
      id: String(x.id || `c${i + 1}`),
      label: String(x.label || `개념${i + 1}`),
      definition: String(x.definition || ""),
      themes: Array.isArray(x.themes) ? x.themes.map(String) : [],
    })), source: "ai" };
  }
  return {
    concepts: proj.themes.slice(0, 3).map((t, i) => ({
      id: `c${i + 1}`, label: `개념 ${i + 1}`, definition: t.sentence,
      themes: [t.sentence],
    })),
    source: "rule",
  };
}

/* ────────────────── 9) Theorize ────────────────── */
export async function theorize(proj: CodingProject, settings: any):
  Promise<{ theory: TheoryStatement[]; source: "ai" | "rule" }> {
  if (!proj.concepts.length) return { theory: [], source: "rule" };
  const prompt =
`너는 이론화(Theory Generation) 전문가다. 개념들 사이의 관계를 진술문(Proposition)으로 3~6개 만들어라.
JSON 배열: [{"id":"th1","statement":"A가 커질수록 B가 증가한다","concepts":["A","B"]}]

[개념]
${proj.concepts.map((c) => `- ${c.label}: ${c.definition}`).join("\n")}`;
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;
  if (arr && arr.length) {
    return { theory: arr.map((x: any, i: number) => ({
      id: String(x.id || `th${i + 1}`),
      statement: String(x.statement || ""),
      concepts: Array.isArray(x.concepts) ? x.concepts.map(String) : [],
    })), source: "ai" };
  }
  return {
    theory: [{
      id: "th1",
      statement: `${proj.concepts.map((c) => c.label).join(" · ")} 은(는) 서로 영향을 주고받는다.`,
      concepts: proj.concepts.map((c) => c.label),
    }],
    source: "rule",
  };
}

/* ────────────────── Import ────────────────── */
export function parseImportedRows(rows: any[][]): CodedSegment[] {
  if (!rows || rows.length === 0) return [];
  const header = (rows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const idx = (cands: string[]) => header.findIndex((h) => cands.some((c) => h.includes(c)));
  const iId = idx(["id", "번호"]);
  const iText = idx(["text", "원문", "segment", "문장"]);
  const iCode = idx(["code", "코드"]);
  const iMethod = idx(["method", "유형"]);
  const iSource = idx(["source", "자료원"]);
  const iUnit = idx(["unit", "단위"]);
  const items: CodedSegment[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]; if (!row) continue;
    const text = String((iText >= 0 ? row[iText] : row[0]) || "").trim();
    if (!text) continue;
    const codeCell = String((iCode >= 0 ? row[iCode] : "") || "").trim();
    const codes = codeCell ? codeCell.split(/[,;/|]/).map((c) => c.trim()).filter(Boolean).map((c) => ({
      code: c, methodId: String((iMethod >= 0 ? row[iMethod] : "descriptive") || "descriptive"),
    })) : [];
    items.push({
      id: String((iId >= 0 ? row[iId] : `seg${items.length + 1}`)) || `seg${items.length + 1}`,
      unit: String((iUnit >= 0 ? row[iUnit] : "sentence") || "sentence"),
      source: String((iSource >= 0 ? row[iSource] : "") || ""),
      text, codes,
    });
  }
  return items;
}

export function parseImportedText(text: string, unit: string = "sentence"): Segment[] {
  let parts: string[] = [];
  if (unit === "paragraph") parts = text.split(/\n\s*\n+/);
  else parts = text.split(/(?<=[.!?。！？])\s+|\n/);
  return parts.map((s) => s.trim()).filter((s) => s.length > 1).map((s, i) => ({
    id: `seg${i + 1}`, unit, text: s,
  }));
}

/* ────────────────── Export ────────────────── */
export function toCsvCoded(coded: CodedSegment[]): string {
  const header = ["id", "unit", "source", "text", "codes", "methods"];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = coded.map((s) => [
    s.id, s.unit, s.source || "", s.text,
    s.codes.map((c) => c.code).join(" | "),
    s.codes.map((c) => c.methodId || "").join(" | "),
  ].map(esc).join(","));
  return "\ufeff" + [header.join(","), ...rows].join("\n");
}
export function toRowsCoded(coded: CodedSegment[]): any[][] {
  return [
    ["id", "unit", "source", "text", "codes", "methods"],
    ...coded.map((s) => [
      s.id, s.unit, s.source || "", s.text,
      s.codes.map((c) => c.code).join(" | "),
      s.codes.map((c) => c.methodId || "").join(" | "),
    ]),
  ];
}
export function toCsvCodebook(cb: CodeRow[]): string {
  const header = ["code", "count", "methodId", "cmq", "definition", "example"];
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = cb.map((r) => [r.code, r.count, r.methodId, r.cmq, r.definition, r.example].map(esc).join(","));
  return "\ufeff" + [header.join(","), ...rows].join("\n");
}

/* ────────────────── Links: 연구방법 / 시각화 ────────────────── */
export function suggestResearchMethods(firstMethodIds: string[]): string[] {
  const out = new Set<string>();
  firstMethodIds.forEach((id) => {
    const link = METHOD_LINKS.find((l) => l.codingId === id);
    (link?.researchMethods || []).forEach((rm) => out.add(rm));
  });
  return [...out];
}
export function suggestVisualizations(hasCategories: boolean, hasThemes: boolean, hasTheory: boolean, longitudinal: boolean): typeof VIZ_LINKS {
  return VIZ_LINKS.filter((v) => {
    if (v.output.includes("종단")) return longitudinal;
    if (v.output.includes("이론")) return hasTheory;
    if (v.output.includes("테마") || v.output.includes("개념")) return hasThemes;
    if (v.output.includes("범주")) return hasCategories;
    return true;
  });
}

export const PROTOCOL_STEPS = CODING_PROTOCOL;

/* ============================================================
 * v48 — 표준 프로토콜 확장
 *   · runDataCleaning       : 19단계 데이터 클린징
 *   · firstCycleCodeWithMode: Discovery/Codebook/Hybrid 실행
 *   · aiGenerateCodebook    : AI로 코드북 초안 생성(Discovery용)
 *   · applyManualRules      : 코딩 방법별 수동 규칙 적용
 *   · runFullPipeline       : 전체 파이프라인(진행률 콜백)
 * ============================================================ */

/** 데이터 클린징 — 표시용(cleaned)과 분석용(analysisText)을 분리한다.
 *  QCA v3처럼 원문 기반 분석 입력을 보존하고, NER/언어태그는 표시용에만 반영한다. */
export async function runDataCleaning(
  raw: string,
  options: Record<string, boolean> | undefined,
  onProgress?: ProgressReporter
): Promise<{
  cleaned: string;
  analysisText: string;
  steps: { id: string; before: number; after: number }[];
  meta?: Record<string, string>;
}> {
  const opts = options || {};
  let display = raw || "";
  let analysis = raw || "";
  const steps: { id: string; before: number; after: number }[] = [];
  const meta: Record<string, string> = {};
  const N = DATA_CLEANING_PROTOCOL.length;
  const rep = (i: number, phase: string, note?: string) =>
    onProgress?.({ phase, percent: Math.round(((i + 1) / N) * 100), note });

  const detectLang = (s: string): string => {
    const ko = (s.match(/[가-힣]/g) || []).length;
    const en = (s.match(/[A-Za-z]/g) || []).length;
    if (ko === 0 && en === 0) return "unknown";
    if (ko > en * 1.2) return "ko";
    if (en > ko * 1.2) return "en";
    return "mixed";
  };

  const applyBoth = (fn: (s: string) => string) => {
    display = fn(display);
    analysis = fn(analysis);
  };

  for (let i = 0; i < DATA_CLEANING_PROTOCOL.length; i++) {
    const step = DATA_CLEANING_PROTOCOL[i];
    const before = display.length;
    if (!opts[step.id]) { rep(i, step.label, "건너뜀"); continue; }
    switch (step.id) {
      case "encoding":
        applyBoth((t) => t.replace(/\u0000/g, "").replace(/[\uFEFF]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
        break;
      case "lang_detect": {
        const lang = detectLang(analysis);
        meta.language = lang;
        // 표시용에만 LANG 태그 — 분석 원문에는 삽입하지 않음
        if (!display.startsWith("[LANG:")) display = `[LANG:${lang}]\n` + display;
        break;
      }
      case "translation": {
        // 표시용 라인 태그만 — 분석 텍스트는 원문 유지
        display = display.split(/\n/).map((line) => {
          const t = line.trim();
          if (!t || t.startsWith("[LANG:") || t.startsWith("[EN]") || t.startsWith("[KO]") || t.startsWith("[MIX]")) return line;
          const l = detectLang(t);
          if (l === "en") return `[EN] ${t}`;
          if (l === "ko") return `[KO] ${t}`;
          if (l === "mixed") return `[MIX] ${t}`;
          return line;
        }).join("\n");
        break;
      }
      case "ocr":
        applyBoth((t) => t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/  +/g, " "));
        break;
      case "stt":
        applyBoth((t) => t.replace(/([가-힣]{2,})\s+\1\b/g, "$1"));
        break;
      case "html":
        applyBoth((t) => t.replace(/<[^>]+>/g, ""));
        break;
      case "markdown":
        applyBoth((t) => t.replace(/^#{1,6}\s+/gm, "").replace(/\*\*|__|`{1,3}|~~/g, "").replace(/\[(.*?)\]\((.*?)\)/g, "$1"));
        break;
      case "noise_filter":
        applyBoth((t) => t
          .replace(/\b(음+|어+|그+|저+|뭐+|uh+|um+|ah+|hmm+)\b/gi, " ")
          .replace(/\s{2,}/g, " ")
          .replace(/^\s+$/gm, ""));
        break;
      case "toxic": {
        const toxicRe = /(씨발|병신|좆|꺼져|fuck|shit|bitch|asshole)/gi;
        applyBoth((t) => t.replace(toxicRe, "[독성표현]"));
        break;
      }
      case "emoji":
        applyBoth((t) => t.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, " "));
        break;
      case "url":
        applyBoth((t) => t.replace(/https?:\/\/\S+/g, " "));
        break;
      case "email":
        applyBoth((t) => t.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, " "));
        break;
      case "phone":
        applyBoth((t) => t.replace(/(?:\+?\d{1,3}[-.\s]?)?(?:0?1\d[-.\s]?)?\d{3,4}[-.\s]?\d{4}/g, " "));
        break;
      case "ner": {
        // 표시용에만 태그. 이미 [...] 안이면 재감싸지 않음(중첩 버그 방지).
        // 분석용 텍스트에는 NER 태그를 넣지 않음(QCA v3: 원문 분리).
        const people: string[] = [];
        display = replaceOutsideBrackets(
          display,
          /(서울|부산|인천|대구|광주|대전|울산|세종|제주)(시|특별시|광역시)?/g,
          (_m, city: string) => `[장소:${city}]`
        );
        display = replaceOutsideBrackets(
          display,
          /(대학교|병원|연구소|센터|공사|청|부|과)\b/g,
          (m) => `[기관:${m}]`
        );
        display = replaceOutsideBrackets(
          display,
          /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g,
          (m) => {
            if (m.length < 3) return m;
            people.push(m);
            return `[인물후보:${m}]`;
          }
        );
        if (people.length) meta.nerPeople = [...new Set(people)].slice(0, 40).join(", ");
        break;
      }
      case "pii":
        applyBoth((t) => t.replace(/\d{6}[-\s]?[1-4]\d{6}/g, "[주민번호]"));
        {
          let count = 0;
          const maskNames = (t: string) => t.replace(
            /\b([가-힣]{2,4})(씨|님|선생님|기자|의원|대표)?(?=\s|,|\.|은|는|이|가|을|를|의|에서|과|와|하고)/g,
            (_m, _n, honorific) => {
              count++;
              return count <= 20 ? `[P${String(count).padStart(2, "0")}${honorific || ""}]` : _m;
            }
          );
          display = maskNames(display);
          // 분석용은 익명 토큰만 통일(의미 붕괴 최소화)
          count = 0;
          analysis = analysis.replace(
            /\b([가-힣]{2,4})(씨|님|선생님|기자|의원|대표)?(?=\s|,|\.|은|는|이|가|을|를|의|에서|과|와|하고)/g,
            (_m, _n, honorific) => {
              count++;
              return count <= 20 ? `참여자${String(count).padStart(2, "0")}${honorific || ""}` : _m;
            }
          );
        }
        break;
      case "coref":
        {
          let lastNoun = "";
          display = display.split(/([.!?。！？\n]+)/).map((chunk) => {
            const noun = chunk.match(/[가-힣A-Za-z]{2,12}(?=(은|는|이|가|을|를|의)\b)/);
            if (noun) lastNoun = noun[0];
            if (lastNoun && /(그|그녀|그것|그들|그거|he|she|they|it)\b/i.test(chunk)) {
              return chunk.replace(/\b(그|그녀|그것|그들|그거|he|she|they|it)\b/gi, (p) => `${p}(→${lastNoun})`);
            }
            return chunk;
          }).join("");
          // analysis: coref 주석 삽입 안 함
        }
        break;
      case "lemma":
        // QCA v3: 최소 어간 길이 가드 — was→wa, this→thi 파괴 방지
        applyBoth((t) => lemmatizeTextSafe(t));
        break;
      case "pos": {
        display = display.split(/\n/).map((line) => {
          if (line.length < 8 || line.length > 120 || line.includes("[POS:")) return line;
          const nouns = line.match(/[가-힣]{2,8}(?=(은|는|이|가|을|를|의|에)\b)/g) || [];
          const verbs = line.match(/[가-힣]{2,6}(하다|한다|하기|했다)/g) || [];
          if (!nouns.length && !verbs.length) return line;
          return `${line} [POS:N=${nouns.slice(0, 3).join("|")};V=${verbs.slice(0, 2).join("|")}]`;
        }).join("\n");
        break;
      }
      case "dedup_exact": {
        const dedup = (t: string) => {
          const seen = new Set<string>();
          return t.split(/\n/).filter((l) => {
            const k = l.trim().replace(/^\[(EN|KO|MIX)\]\s*/, "");
            if (!k) return true;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          }).join("\n");
        };
        display = dedup(display);
        analysis = dedup(analysis);
        break;
      }
      case "dedup_semantic": {
        const dedup = (t: string) => {
          const seen = new Set<string>();
          return t.split(/\n/).filter((l) => {
            const k = stripCleaningArtifacts(l).replace(/\s+/g, "").slice(0, 24);
            if (!k) return true;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          }).join("\n");
        };
        display = dedup(display);
        analysis = dedup(analysis);
        break;
      }
      case "dedup_near": {
        const near = (t: string) => {
          const lines = t.split(/\n/);
          const out: string[] = [];
          for (let k = 0; k < lines.length; k++) {
            const prev = out[out.length - 1] || "";
            const cur = lines[k];
            if (prev && cur.trim() && Math.abs(prev.length - cur.length) <= 2 && prev.slice(0, 5) === cur.slice(0, 5)) continue;
            out.push(cur);
          }
          return out.join("\n");
        };
        display = near(display);
        analysis = near(analysis);
        break;
      }
      case "spelling":
        applyBoth((t) => t.replace(/되요\b/g, "돼요").replace(/안되\b/g, "안 돼").replace(/않되/g, "안 돼"));
        break;
      case "spacing":
        applyBoth((t) => t.replace(/([가-힣]{2,})([은는이가을를의에])(?=[가-힣])/g, "$1$2 "));
        break;
      case "sentence_split":
        applyBoth((t) => t.replace(/([.!?。！？])(\S)/g, "$1\n$2"));
        break;
      case "speaker":
        display = display.replace(/^([가-힣A-Za-z]{2,20})\s*[:：]\s*/gm, "[화자:$1]: ");
        analysis = analysis.replace(/^([가-힣A-Za-z]{2,20})\s*[:：]\s*/gm, "$1: ");
        break;
      case "case_gen":
        break;
      case "mu_gen":
        break;
      case "meta_gen":
        if (meta.language) {
          if (!display.includes("[META:")) display = `[META:lang=${meta.language};chars=${analysis.length}]\n` + display;
        }
        break;
    }
    steps.push({ id: step.id, before, after: display.length });
    rep(i, step.label);
    if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
  }
  // 분석용은 잔여 태그 제거 후 공백 정리
  analysis = stripCleaningArtifacts(analysis).replace(/\n{3,}/g, "\n\n");
  return { cleaned: display, analysisText: analysis, steps, meta };
}

/** Codebook의 코드 하나로 세그먼트를 자동 분류(간단 규칙 폴백). */
function classifyBycodebook(text: string, cb: CodebookEntry[]): CodebookEntry | null {
  if (!cb.length) return null;
  let best: { e: CodebookEntry; score: number } | null = null;
  const norm = (text || "").toLowerCase();
  cb.forEach((e) => {
    let s = 0;
    (e.keywords || []).forEach((k) => { if (k && norm.includes(String(k).toLowerCase())) s += 2; });
    (e.synonyms || []).forEach((k) => { if (k && norm.includes(String(k).toLowerCase())) s += 1; });
    if (e.example && norm.includes(String(e.example).slice(0, 6).toLowerCase())) s += 1;
    if (!best || s > best.score) best = { e, score: s };
  });
  return best && best.score > 0 ? best.e : null;
}

/** Discovery / Codebook / Hybrid 3모드를 처리하는 1차 코딩 실행기.
 *  · discovery: 기존 firstCycleCode 그대로 사용(AI가 신규 코드 생성)
 *  · codebook : proj.aiCodebook 안의 코드로만 분류(신규 생성 없음)
 *  · hybrid   : codebook 우선 분류 + 매칭 실패건은 AI가 신규 코드 제안
 */
export async function firstCycleCodeWithMode(
  proj: CodingProject,
  settings: any,
  onProgress?: ProgressReporter
): Promise<{ coded: CodedSegment[]; codebook: CodeRow[]; proposed?: CodebookEntry[]; source: "ai" | "rule" | "mixed" }> {
  const mode: ExecutionMode = proj.executionMode || "hybrid";
  const cb = proj.aiCodebook || [];
  if (mode === "discovery" || cb.length === 0) {
    onProgress?.({ phase: "Discovery 1차 코딩", percent: 20 });
    const r = await firstCycleCode(proj, settings);
    onProgress?.({ phase: "Discovery 완료", percent: 100 });
    return { ...r };
  }
  const N = proj.segments.length || 1;
  const coded: CodedSegment[] = [];
  const proposedMap = new Map<string, CodebookEntry>();
  let aiUsed = false;
  for (let i = 0; i < proj.segments.length; i++) {
    const s = proj.segments[i];
    const match = classifyBycodebook(s.text, cb);
    if (match) {
      coded.push({
        ...s,
        codes: [{ code: match.name, methodId: proj.firstMethodIds[0] || "descriptive", note: `표준 프로토콜: ${match.id}` }],
      });
    } else if (mode === "hybrid") {
      // AI로 신규 코드 제안
      const suggestion = await proposeNewCodeAI(s.text, cb, settings);
      aiUsed = true;
      if (suggestion) {
        coded.push({
          ...s,
          codes: [{ code: suggestion.name, methodId: proj.firstMethodIds[0] || "descriptive", note: "AI 신규 제안" }],
        });
        proposedMap.set(suggestion.name, suggestion);
      } else {
        coded.push({ ...s, codes: [{ code: "미분류", methodId: proj.firstMethodIds[0] || "descriptive" }] });
      }
    } else {
      // codebook 엄격 모드 — 매칭 실패는 미분류
      coded.push({ ...s, codes: [{ code: "미분류", methodId: proj.firstMethodIds[0] || "descriptive", note: "코드북 미매칭" }] });
    }
    if (i % 5 === 0) onProgress?.({ phase: `${mode === "codebook" ? "Codebook" : "Hybrid"} 분류`, percent: Math.round((i / N) * 100) });
  }
  const codebook = buildCodebook(coded);
  onProgress?.({ phase: "완료", percent: 100 });
  return { coded, codebook, proposed: Array.from(proposedMap.values()), source: aiUsed ? "mixed" : "rule" };
}

/** Hybrid 모드에서 코드북으로 설명이 안 되는 세그먼트에 대해 AI가 신규 코드를 제안. */
async function proposeNewCodeAI(text: string, existing: CodebookEntry[], settings: any): Promise<CodebookEntry | null> {
  const prompt =
`다음 문장은 이미 존재하는 코드북으로 설명되지 않는다. 표준 프로토콜(포함/제외 기준, 예시)에 맞춰 새로운 코드 1개만 JSON으로 제안하라.
[기존 코드북]
${existing.slice(0, 30).map((e) => `- ${e.name}: ${e.definition}`).join("\n")}

[문장]
${text}

[출력 형식 — JSON 객체 하나]
{"id":"C###","name":"영문 또는 한국어 짧은 코드명","definition":"1-2문장 정의","inclusion":"포함기준","exclusion":"제외기준","keywords":["키워드1","키워드2"],"example":"대표 예문","version":"v0.1","createdBy":"AI","status":"Draft"}`;
  const raw = await aiComplete(prompt, settings);
  if (!raw) return null;
  try {
    const t = raw.replace(/```json|```/g, "");
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    if (s < 0 || e <= s) return null;
    const j = JSON.parse(t.slice(s, e + 1));
    return {
      id: String(j.id || `C${Date.now() % 1000}`),
      name: String(j.name || "미명명"),
      definition: String(j.definition || ""),
      inclusion: String(j.inclusion || ""),
      exclusion: String(j.exclusion || ""),
      keywords: Array.isArray(j.keywords) ? j.keywords.map(String) : [],
      example: String(j.example || text.slice(0, 40)),
      version: String(j.version || "v0.1"),
      createdBy: "AI",
      status: "Draft",
    };
  } catch { return null; }
}

/** AI로 원자료를 훑어 코드북 초안(전체 목록) 생성. v54: 1차/2차·연결성 원칙·기입힌트 반영 */
export async function aiGenerateCodebook(
  raw: string,
  settings: any,
  onProgress?: ProgressReporter,
  opts?: {
    cycle?: 1 | 2;
    methodIds?: string[];
    draftHints?: Record<string, string>;
    firstCodebook?: CodebookEntry[];
    question?: string;
    framework?: string;
  }
): Promise<CodebookEntry[]> {
  if (!raw.trim() && !(opts?.draftHints && Object.values(opts.draftHints).some((v) => String(v || "").trim()))) {
    return [];
  }
  const cycle = opts?.cycle || 1;
  onProgress?.({ phase: cycle === 1 ? "1차 코드북 생성 준비" : "2차 코드북 생성 준비", percent: 10 });
  const hints = opts?.draftHints || {};
  const hintBlock = Object.entries(hints)
    .filter(([, v]) => String(v || "").trim())
    .map(([k, v]) => `- ${k}: ${String(v).slice(0, 400)}`)
    .join("\n");
  const methodIds = opts?.methodIds || [];
  const methodBlock = cycle === 1
    ? methodsBrief(methodIds.length ? methodIds : ["descriptive"])
    : methodIds
        .map((id) => SECOND_CYCLE_METHODS.find((m) => m.id === id))
        .filter(Boolean)
        .map((m) => `${m!.label}(${m!.labelEn}) — ${m!.easy}`)
        .join("\n") || "Pattern Coding";

  const linkageBlock = `
[1차↔2차 연결성 원칙 — 반드시 준수]
1. 연속성: 2차는 1차 결과 기반, 임의 의미 추가 금지
2. 추상화: 1차 구체 → 2차 범주·패턴·이론
3. 통합성: 여러 1차 코드를 통합하되 개별 의미 보존
4. 검증가능성: 2차 범주는 1차 데이터로 검증 가능해야 함
5. 발전적 순환: 필요시 1차로 환류·수정
6. 이론적 정렬: 연구질문·이론틀과 연결`;

  const firstCb = (opts?.firstCodebook || []).slice(0, 40);
  const prompt = cycle === 1
    ? `너는 질적연구 1차 코딩(First Cycle) 코드북 설계 전문가다.
선택된 1차 방법: ${methodBlock}
연구질문: ${opts?.question || "(미기재)"}
이론틀: ${opts?.framework || "(미기재)"}

기입 힌트(표1 — 1차 코딩북 작성 항목):
${hintBlock || "(없음 — 원자료 기반으로 추론)"}

${linkageBlock}

원자료를 훑고 8~12개 1차 코드를 JSON 배열로만 작성하라.
각 항목 키: id,name,definition,inclusion,exclusion,applicationCriteria,example,notes,sourceContext,keywords(배열),version,createdBy,status,cycle,methodId
createdBy="AI", status="Draft", cycle=1, methodId는 선택 방법 중 하나.

[원자료]
${(raw || "").slice(0, 6000)}`
    : `너는 질적연구 2차 코딩(Second Cycle / Recoding) 코드북 설계 전문가다.
선택된 2차 방법: ${methodBlock}
연구질문: ${opts?.question || "(미기재)"}
이론틀: ${opts?.framework || "(미기재)"}

기입 힌트(표1 — 2차 코딩북 작성 항목):
${hintBlock || "(없음)"}

${linkageBlock}

반드시 아래 1차 코드북을 기반으로 6~10개 2차 범주/패턴 코드를 만들어라. 1차에 없는 의미를 임의로 만들지 마라.
JSON 배열만. 키: id,name,definition,inclusion,exclusion,applicationCriteria,example,notes,linkage,validation,theoreticalAlignment,keywords(배열),version,createdBy,status,cycle,methodId
createdBy="AI", status="Draft", cycle=2.

[1차 코드북]
${firstCb.length ? firstCb.map((e) => `- ${e.name}: ${e.definition} | 포함:${e.inclusion} | 예:${e.example}`).join("\n") : "(1차 코드북 비어 있음 — 힌트·원자료로 신중히 추론하되 연결성 원칙 명시)"}

[원자료 발췌]
${(raw || "").slice(0, 3000)}`;

  onProgress?.({ phase: "AI 호출 중", percent: 40 });
  const out = await aiComplete(prompt, settings);
  onProgress?.({ phase: "결과 파싱", percent: 80 });
  const arr = out ? safeJsonArray(out) : null;
  if (!arr) {
    const seed = hints.name || hints.definition || "초안코드";
    const words = ((raw || seed).match(/[가-힣]{2,}|[A-Za-z]{4,}/g) || [seed]);
    const freq = new Map<string, number>();
    words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    onProgress?.({ phase: "완료(규칙 폴백)", percent: 100 });
    return top.map(([w], i) => ({
      id: `${cycle === 1 ? "C" : "S"}${String(i + 1).padStart(3, "0")}`,
      name: w,
      definition: hints.definition || `자료에서 도출한 개념 ‘${w}’.`,
      inclusion: hints.applicationCriteria || `‘${w}’이(가) 언급된 문장`,
      exclusion: "",
      keywords: [w],
      example: hints.examples || (raw || "").split(/\n|(?<=[.!?])\s+/).find((s) => s.includes(w))?.slice(0, 80) || "",
      applicationCriteria: hints.applicationCriteria || "",
      notes: hints.notes || "",
      sourceContext: hints.sourceContext || "",
      linkage: hints.linkage || (cycle === 2 ? (firstCb.map((e) => e.name).slice(0, 3).join(" + ") || "") : ""),
      validation: hints.validation || "",
      theoreticalAlignment: hints.theoreticalAlignment || opts?.framework || "",
      cycle,
      methodId: methodIds[0] || (cycle === 1 ? "descriptive" : "pattern"),
      version: "v0.1",
      createdBy: "AI" as const,
      status: "Draft" as const,
    }));
  }
  onProgress?.({ phase: "완료", percent: 100 });
  return arr.map((j: any, i: number) => ({
    id: String(j.id || `${cycle === 1 ? "C" : "S"}${String(i + 1).padStart(3, "0")}`),
    name: String(j.name || `Code${i + 1}`),
    definition: String(j.definition || ""),
    inclusion: String(j.inclusion || j.applicationCriteria || ""),
    exclusion: String(j.exclusion || ""),
    keywords: Array.isArray(j.keywords) ? j.keywords.map(String) : [],
    example: String(j.example || ""),
    applicationCriteria: String(j.applicationCriteria || j.inclusion || ""),
    notes: String(j.notes || ""),
    sourceContext: String(j.sourceContext || ""),
    linkage: String(j.linkage || ""),
    validation: String(j.validation || ""),
    theoreticalAlignment: String(j.theoreticalAlignment || ""),
    cycle,
    methodId: String(j.methodId || methodIds[0] || (cycle === 1 ? "descriptive" : "pattern")),
    version: String(j.version || "v0.1"),
    createdBy: "AI" as const,
    status: (j.status === "Approved" ? "Approved" : "Draft") as "Draft" | "Approved",
  }));
}

/** 사용자가 정의한 수동 규칙(방법별 keywords→code)을 CodedSegment에 적용. */
export function applyManualRules(
  coded: CodedSegment[],
  rules: Record<string, { keywords: string; code: string }[]> | undefined,
  methodId: string
): CodedSegment[] {
  const list = rules?.[methodId] || [];
  if (!list.length) return coded;
  return coded.map((s) => {
    const extra: { code: string; methodId: string; note?: string }[] = [];
    list.forEach((r) => {
      if (!r.code || !r.keywords) return;
      const kws = r.keywords.split(/[,|]/).map((k) => k.trim()).filter(Boolean);
      if (kws.some((k) => s.text.includes(k))) {
        extra.push({ code: r.code, methodId, note: "수동 규칙" });
      }
    });
    if (!extra.length) return s;
    // 중복 방지
    const existing = new Set(s.codes.map((c) => c.code));
    return { ...s, codes: [...s.codes, ...extra.filter((c) => !existing.has(c.code))] };
  });
}

/** 전체 파이프라인 실행 — 진행률 콜백을 사용. */
export async function runFullPipeline(
  proj: CodingProject,
  settings: any,
  onProgress?: ProgressReporter
): Promise<CodingProject> {
  const pct = (n: number, phase: string) => onProgress?.({ phase, percent: n });
  pct(3, "데이터 클린징 준비");
  const clean = await runDataCleaning(proj.rawOriginal || proj.raw, proj.cleaningOptions, (e) => {
    onProgress?.({ phase: `클린징: ${e.phase}`, percent: 3 + Math.round(e.percent * 0.17) });
  });
  const p0 = {
    ...proj,
    rawOriginal: proj.rawOriginal || proj.raw,
    raw: proj.rawOriginal || proj.raw,
    cleanedPreview: clean.cleaned,
  };
  pct(22, "분석단위 분절");
  const segs = cleanupToSegments({ ...p0, raw: clean.analysisText });
  const p1 = { ...p0, segments: segs };
  pct(30, "1차 코딩(표준 프로토콜)");
  const fc = await firstCycleCodeWithMode(p1, settings, (e) => {
    onProgress?.({ phase: `1차 코딩: ${e.phase}`, percent: 30 + Math.round(e.percent * 0.20) });
  });
  let p2 = { ...p1, coded: fc.coded, codebook: fc.codebook } as CodingProject;
  // 수동 규칙 반영(첫 방법에 대해)
  const method0 = proj.firstMethodIds[0] || "descriptive";
  p2 = { ...p2, coded: applyManualRules(p2.coded, proj.manualRules?.coding, method0) };
  if (fc.proposed && fc.proposed.length) p2.proposedCodes = [...(p2.proposedCodes || []), ...fc.proposed];
  pct(52, "재코딩");
  const rc = await recode(p2, settings);
  const p3 = { ...p2, refinedCodes: rc.refined };
  pct(62, "범주화");
  const ct = await categorize(p3, settings);
  const p4 = { ...p3, categories: ct.categories };
  pct(72, "패턴분석");
  const pt = await patternize(p4, settings);
  const p5 = { ...p4, patterns: pt.patterns };
  pct(80, "Theme 생성");
  const th = await themeize(p5, settings);
  const p6 = { ...p5, themes: th.themes };
  pct(88, "Concept 생성");
  const cp = await conceptualize(p6, settings);
  const p7 = { ...p6, concepts: cp.concepts };
  pct(95, "Theory 생성");
  const ty = await theorize(p7, settings);
  let p8 = { ...p7, theory: ty.theory };
  pct(97, "결과 해석 · Evidence · 시각화 데이터");
  p8 = { ...p8, pipelineInsight: buildPipelineInsight(p8) };
  pct(100, "완료");
  return p8;
}

/* ══════════════════════════════════════════════════════════════════
   v53 — 빠른 텍스트마이닝 파이프라인 (옵션 5-2)
   원자료 → (가벼운) 클린징 → AI 텍스트마이닝 코드 추출 → 범주화 → 패턴
   전체 파이프라인(Theme/Concept/Theory)을 건너뛰고 결과 요약에 바로 연동.
   ══════════════════════════════════════════════════════════════════ */

/** 세그먼트 전체를 훑어 AI가 상위 코드(키워드/개념)와 빈도를 한 번에 추출. */
async function textMineCodes(
  segments: Segment[], settings: any, onProgress?: ProgressReporter
): Promise<{ coded: CodedSegment[]; codebook: CodeRow[]; source: "ai" | "rule" }> {
  if (!segments.length) return { coded: [], codebook: [], source: "rule" };
  // 코퍼스를 배치로 나눠 코드 후보 목록을 뽑고, 각 세그먼트에 매칭
  const sample = segments.slice(0, 400).map((s) => stripCleaningArtifacts(s.text)).filter(Boolean);
  const prompt =
`너는 텍스트마이닝 코더다. 아래 자료 전체에서 반복적으로 나타나는 핵심 주제어(코드)를 12~24개 뽑아라.
- 각 코드는 2~8자의 짧은 한국어 명사구.
- 표면 단어가 아니라 의미 단위(주제)로.
JSON 배열만 출력: [{"code":"코드","keywords":["관련어1","관련어2"]}]

[자료 표본]
${sample.slice(0, 200).join("\n").slice(0, 6000)}`;
  onProgress?.({ phase: "AI 텍스트마이닝: 코드 추출", percent: 30 });
  const raw = await aiComplete(prompt, settings);
  const arr = raw ? safeJsonArray(raw) : null;

  let mined: { code: string; keywords: string[] }[] = [];
  if (arr && arr.length) {
    mined = arr.map((x: any) => ({
      code: String(x.code || "").trim(),
      keywords: Array.isArray(x.keywords) ? x.keywords.map((k: any) => String(k)) : [],
    })).filter((x) => x.code);
  }
  // 규칙 폴백: 빈도 상위 명사구를 코드로 (불용어 제외)
  if (!mined.length) {
    const freq = new Map<string, number>();
    segments.forEach((s) => {
      const tokens = (stripCleaningArtifacts(s.text).match(/[가-힣]{2,10}|[A-Za-z]{3,16}/g) || [])
        .map((w) => w.toLowerCase())
        .filter((w) => !CMQ_STOP.has(w));
      tokens.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
    });
    mined = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16)
      .map(([w]) => ({ code: w, keywords: [w] }));
  }

  onProgress?.({ phase: "AI 텍스트마이닝: 세그먼트 매칭", percent: 70 });
  const coded: CodedSegment[] = segments.map((s) => {
    const t = stripCleaningArtifacts(s.text);
    const hits = mined.filter((m) =>
      t.includes(m.code) || m.keywords.some((k) => k && t.includes(k))
    ).slice(0, 3);
    const codes = hits.length
      ? hits.map((m) => ({ code: m.code, methodId: "descriptive", note: "textmining" }))
      : [{ code: meaningfulLabel(t) || "미분류", methodId: "descriptive", note: "textmining-fallback" }];
    return { ...s, codes };
  });
  const codebook = buildCodebook(coded);
  onProgress?.({ phase: "AI 텍스트마이닝 완료", percent: 100 });
  return { coded, codebook, source: arr && arr.length ? "ai" : "rule" };
}

export async function runQuickTextMining(
  proj: CodingProject,
  settings: any,
  onProgress?: ProgressReporter
): Promise<CodingProject> {
  const pct = (n: number, phase: string) => onProgress?.({ phase, percent: n });
  pct(4, "가벼운 데이터 클린징");
  // "어느 정도의" 클린징: 사용자가 옵션을 지정했으면 그대로, 아니면 핵심 몇 개만 적용
  const lightDefaults: Record<string, boolean> = {
    encoding: true, html: true, markdown: true, noise_filter: true,
    url: true, email: true, phone: true, pii: true,
    spacing: true, dedup_exact: true,
  };
  const opts = proj.cleaningOptions && Object.values(proj.cleaningOptions).some(Boolean)
    ? proj.cleaningOptions
    : lightDefaults;
  const clean = await runDataCleaning(proj.rawOriginal || proj.raw, opts, (e) => {
    onProgress?.({ phase: `클린징: ${e.phase}`, percent: 4 + Math.round(e.percent * 0.16) });
  });
  const p0: CodingProject = {
    ...proj,
    rawOriginal: proj.rawOriginal || proj.raw,
    raw: proj.rawOriginal || proj.raw,
    cleanedPreview: clean.cleaned,
  };
  pct(22, "분석단위 분절");
  const segs = cleanupToSegments({ ...p0, raw: clean.analysisText });
  const p1: CodingProject = { ...p0, segments: segs };

  pct(30, "AI 텍스트마이닝");
  const tm = await textMineCodes(segs, settings, (e) =>
    onProgress?.({ phase: e.phase, percent: 30 + Math.round(e.percent * 0.25) }));
  const p2: CodingProject = { ...p1, coded: tm.coded, codebook: tm.codebook, refinedCodes: [] };

  pct(62, "범주화");
  const ct = await categorize(p2, settings);
  const p3: CodingProject = { ...p2, categories: ct.categories };

  pct(82, "패턴분석");
  const ptn = await patternize(p3, settings);
  let p4: CodingProject = {
    ...p3, patterns: ptn.patterns,
    // 빠른 모드: 상위 단계는 비움(결과 요약은 범주·패턴 중심)
    themes: [], concepts: [], theory: [],
  };
  pct(95, "결과 해석 · Evidence · 시각화 데이터");
  p4 = { ...p4, pipelineInsight: buildPipelineInsight(p4) };
  pct(100, "완료");
  return p4;
}

/* ══════════════════════════════════════════════════════════════════
   v53 — 결과 요약 집계: 범주 빈도/밀도 + 상위범주(메타) + 상위주제(담론)
   ══════════════════════════════════════════════════════════════════ */

export type CategoryStat = {
  id: string; label: string;
  codeCount: number;     // 범주에 속한 코드 수
  freq: number;          // 코드북 기준 부여 빈도 합
  densityPct: number;    // 전체 부여 빈도 대비 비중(%)
};

/** 코딩 결과를 범주별 빈도/밀도로 집계. */
export function aggregateCategoryStats(proj: CodingProject): CategoryStat[] {
  const countOf = new Map<string, number>();
  (proj.codebook || []).forEach((c) => countOf.set(c.code, c.count || 0));
  const cats = proj.categories || [];
  const raw = cats.map((c) => {
    const codeCount = (c.codes || []).length;
    const freq = (c.codes || []).reduce((a, code) => a + (countOf.get(code) || 0), 0);
    return { id: c.id, label: c.label, codeCount, freq };
  });
  const totalFreq = raw.reduce((a, r) => a + r.freq, 0) || 1;
  return raw
    .map((r) => ({ ...r, densityPct: Math.round((r.freq / totalFreq) * 1000) / 10 }))
    .sort((a, b) => b.freq - a.freq || b.codeCount - a.codeCount);
}

export type MetaCategory = { id: string; label: string; members: string[]; freq: number };

/**
 * 상위범주(메타) 도출 — 범주 라벨의 의미 키워드를 공유하는 것끼리 묶는다.
 * (규칙 기반: AI 키 없이도 항상 동작)
 */
export function deriveMetaCategories(proj: CodingProject): MetaCategory[] {
  const stats = aggregateCategoryStats(proj);
  if (!stats.length) return [];
  const freqOf = new Map(stats.map((s) => [s.label, s.freq]));
  // 각 범주 라벨에서 대표 키워드 추출
  const keyOf = (label: string): string => {
    const clean = label.replace(/^주제:/, "").replace(/^범주\d+/, "").trim();
    const w = clean.match(/[가-힣]{2,}/g) || [];
    return w[0] || clean.slice(0, 4) || "기타";
  };
  const groups = new Map<string, string[]>();
  stats.forEach((s) => {
    const k = keyOf(s.label);
    groups.set(k, [...(groups.get(k) || []), s.label]);
  });
  // 1개짜리 그룹이 너무 많으면 상위 빈도 키로 재편
  let entries = [...groups.entries()];
  if (entries.length > Math.max(4, Math.ceil(stats.length / 2))) {
    // 빈도 상위 키를 메타 축으로, 나머지는 '기타 주제'
    const topKeys = entries
      .map(([k, labels]) => [k, labels.reduce((a, l) => a + (freqOf.get(l) || 0), 0)] as [string, number])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    const regroup = new Map<string, string[]>();
    stats.forEach((s) => {
      const k = keyOf(s.label);
      const bucket = topKeys.includes(k) ? k : "기타 주제";
      regroup.set(bucket, [...(regroup.get(bucket) || []), s.label]);
    });
    entries = [...regroup.entries()];
  }
  return entries.map(([k, labels], i) => ({
    id: `meta${i + 1}`,
    label: `상위범주: ${k}`,
    members: labels,
    freq: labels.reduce((a, l) => a + (freqOf.get(l) || 0), 0),
  })).sort((a, b) => b.freq - a.freq);
}

export type Discourse = { id: string; statement: string; basis: string[] };

/**
 * 상위주제(담론) 도출 — 메타 범주와 패턴/테마를 결합해 담론 진술을 만든다.
 */
export function deriveDiscourseThemes(proj: CodingProject): Discourse[] {
  const metas = deriveMetaCategories(proj);
  const out: Discourse[] = [];
  const topMetas = metas.slice(0, 4);
  topMetas.forEach((m, i) => {
    const key = m.label.replace(/^상위범주:\s*/, "");
    out.push({
      id: `disc${i + 1}`,
      statement: `‘${key}’을(를) 중심으로 한 담론 — 관련 범주 ${m.members.length}개(부여 ${m.freq}회)가 반복적으로 결집한다.`,
      basis: m.members.slice(0, 5),
    });
  });
  // 패턴/테마가 있으면 담론 진술로 승격
  (proj.patterns || []).slice(0, 3).forEach((p, i) => {
    out.push({ id: `discp${i + 1}`, statement: `담론(패턴): ${p.statement}`, basis: p.supportingCodes?.slice(0, 5) || [] });
  });
  (proj.themes || []).slice(0, 2).forEach((t, i) => {
    out.push({ id: `disct${i + 1}`, statement: `담론(테마): ${t.sentence}`, basis: t.categories?.slice(0, 5) || [] });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════════
   v56 — 파이프라인 결과 해석을 표준 코딩북(⑤) 수준으로 승격
   Computational Analytics · Evidence · Inference · 근거 문장
   ══════════════════════════════════════════════════════════════════ */

function ruleInferPipeline(
  ev: { codeId: string; candidateCode: string; context: string; researchQuestion: string; relatedConcepts: string[] },
  analytics: NonNullable<PipelineInsight["analytics"]>
): InterpretiveInference {
  const freq = analytics.frequency.find((f) => f.term === ev.candidateCode)?.count || 1;
  const maxF = analytics.frequency[0]?.count || 1;
  const salience = Math.round((freq / maxF) * 100) / 100;
  const co = analytics.cooccurrence
    .filter((p) => p.a === ev.candidateCode || p.b === ev.candidateCode)
    .slice(0, 3)
    .map((p) => (p.a === ev.candidateCode ? p.b : p.a));
  return {
    codeId: ev.codeId,
    salience,
    pattern: `'${ev.candidateCode}'이(가) 자료에서 반복되며 ${co.slice(0, 2).join("·") || "관련 개념"}과 함께 나타남`,
    contextSummary: (ev.context || "").slice(0, 180) || "문맥 정보 부족",
    relationship: co.length ? `공출현: ${co.join(", ")}` : "독립적으로 등장하는 경향",
    explanation: `연구질문(${ev.researchQuestion})에 대해 '${ev.candidateCode}'은(는) 경험적 단서로 기능함`,
    themeCandidate: `${ev.candidateCode} 중심 의미 구조`,
  };
}

/** 파이프라인 완료 후 Computational Analytics · Evidence 패키지 생성 */
export function buildPipelineInsight(proj: CodingProject): PipelineInsight {
  const segTexts = (proj.segments || [])
    .map((s) => stripCleaningArtifacts(s.text || ""))
    .filter((t) => t.length >= 12);
  const corpus = segTexts.length
    ? segTexts
    : segmentRaw(stripCleaningArtifacts(proj.rawOriginal || proj.raw || ""));
  if (!corpus.length) {
    return {
      analytics: null, evidence: [], inferences: [], codebook: [],
      patterns: [], categories: [], themes: [], evidenceByTerm: {},
      updatedAt: new Date().toISOString(),
    };
  }
  const analytics = runComputationalAnalytics(corpus);
  const evidence = extractEvidencePackages(corpus, analytics, proj.question || "");
  const inferences = evidence.map((e) => ruleInferPipeline(e, analytics));
  const codebook = buildAiCodebook(evidence, inferences, analytics);
  const { patterns, categories, themes } = derivePatternCategoryTheme(codebook, inferences);
  const terms = [
    ...analytics.frequency.map((f) => f.term),
    ...evidence.map((e) => e.candidateCode),
    ...(proj.codebook || []).slice(0, 20).map((c) => c.code),
  ];
  const evidenceByTerm = evidenceMapForTerms(corpus, [...new Set(terms)].filter(Boolean), 2);
  return {
    analytics, evidence, inferences, codebook, patterns, categories, themes,
    evidenceByTerm, updatedAt: new Date().toISOString(),
  };
}

/** ⑤급 구조의 최종 해석 리포트 (파이프라인용) */
export function buildPipelineRuleInterpretation(proj: CodingProject): string {
  const insight = proj.pipelineInsight || buildPipelineInsight(proj);
  const topCodes = [...(insight.codebook || [])].sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  const pipeTop = [...(proj.codebook || [])].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 5);
  const topCats = (insight.categories || []).slice(0, 5);
  const topThemes = (insight.themes?.length ? insight.themes : proj.themes).slice(0, 5);
  const coverage = proj.segments.length
    ? Math.round((proj.coded.filter((c) => c.codes?.some((x) => x.code && x.code !== "미분류")).length / proj.segments.length) * 100)
    : 0;
  return [
    `# 최종 해석 리포트 — ${proj.title || "무제 프로젝트"}`,
    ``,
    `## 1. 연구 프레임`,
    `- 연구질문: ${proj.question || "(미입력)"}`,
    `- 연구목적: ${proj.purpose || "(미입력)"}`,
    `- 프로세스: 원자료 → 계산 → Evidence → 추론 → 코드북 (AI 파이프라인)`,
    `- 실행모드: ${proj.executionMode || "hybrid"} · 분석단위: ${proj.unitLevel || "sentence"}`,
    `- 1차 방법: ${(proj.firstMethodIds || []).join(", ") || "descriptive"}`,
    ``,
    `## 2. 자료·코딩 규모`,
    `- 원자료 ${(proj.raw || "").length.toLocaleString()}자 · 세그먼트 ${proj.segments.length} · 코딩 ${proj.coded.length} (유효 커버리지 약 ${coverage}%)`,
    `- Evidence Package ${insight.evidence.length} · AI 코드 ${insight.codebook.length}`,
    `- 파이프라인 코드 ${proj.codebook.length} · 범주 ${proj.categories.length} · 테마 ${proj.themes.length} · 개념 ${proj.concepts.length} · 이론 ${proj.theory.length}`,
    `- 토큰(추정) ${insight.analytics?.tokenCount ?? 0}`,
    ``,
    `## 3. 핵심 발견`,
    `- 계산적 분석으로 ${insight.analytics?.frequency.length || 0}개 핵심 용어와 ${insight.analytics?.clusters.length || 0}개 의미 군집이 구조화되었습니다.`,
    `- Evidence Extraction으로 ${insight.evidence.length}개 해석 근거 패키지가 자동 생성되었습니다.`,
    `- 최빈 코드(계산): ${topCodes.map((c) => `${c.codeName}(${c.frequency})`).join(", ") || "(없음)"}`,
    `- 파이프라인 상위 코드: ${pipeTop.map((c) => `${c.code}(${c.count})`).join(", ") || "(없음)"}`,
    ``,
    `## 4. 테마/범주 해석`,
    ...(topThemes.length
      ? topThemes.map((t: any, i: number) => `${i + 1}. ${t.sentence || t}`)
      : ["(테마 없음)"]),
    ``,
    `### 범주 (계산·추론)`,
    ...(topCats.length
      ? topCats.map((c) => `- ${c.label}: ${c.codes.slice(0, 6).join(", ")}`)
      : (proj.categories.slice(0, 5).map((c) => `- ${c.label}: ${(c.codes || []).slice(0, 6).join(", ")}`) || ["(범주 없음)"])),
    ``,
    `## 5. 개념·이론 · Evidence`,
    ...insight.codebook.slice(0, 5).map((c) =>
      `- ${c.codeName}: ${c.definition} (현저성 ${c.salienceScore}, 설명력 ${c.explanatoryPower})`),
    ...insight.patterns.slice(0, 4).map((p) => `- 패턴 · ${p.statement}`),
    ...(proj.concepts.slice(0, 3).map((c) => `- 개념 · ${c.label}: ${c.definition}`)),
    ...(proj.theory.slice(0, 3).map((t) => `- 이론 · ${t.statement}`)),
    ``,
    `### Evidence Packages (근거 문장)`,
    ...insight.evidence.slice(0, 8).map((e) =>
      `- ${e.codeId} ${e.candidateCode}: “${(e.representativeQuotes[0] || e.relatedSentences[0] || "(인용 없음)").slice(0, 120)}”`),
    ``,
    `## 6. 잠정 답변`,
    `- "${proj.question || "연구질문 미입력"}"에 대해, Evidence Package와 Interpretive Inference는 반복 패턴에 기반한 초안 해석을 제공합니다.`,
    `- 인과·일반화 주장은 대표 인용문·반증 사례 검토 후에만 확정하세요.`,
    ``,
    `## 7. 후속 체크리스트`,
    `1) 각 코드의 대표 인용문이 원문과 일치하는지 확인`,
    `2) Evidence Package의 문맥(Context)이 왜곡되지 않았는지 검토`,
    `3) Salience·설명력이 낮은 코드의 유지/통합 여부 결정`,
    `4) 범주·테마 간 관계(조건/결과/대립)를 메모로 보완`,
    `5) Living AI Codebook으로 연구자 검토·수정 후 최종화`,
  ].join("\n");
}
