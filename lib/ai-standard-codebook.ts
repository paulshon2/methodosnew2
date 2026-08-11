/**
 * AI 기반 질적연구 표준 코딩북 파이프라인
 * 원자료 → 계산(Computational Analytics) → Evidence Extraction
 *   → Interpretive Inference → AI Codebook → Pattern/Category/Theme → 해석 리포트
 *
 * AI 키가 없거나 실패하면 규칙 기반 폴백으로 동일 스키마를 채웁니다.
 */
import { aiComplete } from "@/lib/engine";

export type ProgressEvent = { phase: string; percent: number };
export type ProgressReporter = (e: ProgressEvent) => void;

export type TermCount = { term: string; count: number };
export type TermScore = { term: string; score: number };
export type CoPair = { a: string; b: string; count: number };
export type Cluster = { id: string; label: string; members: string[] };

export type ComputationalAnalytics = {
  frequency: TermCount[];
  tfidf: TermScore[];
  cooccurrence: CoPair[];
  clusters: Cluster[];
  segmentCount: number;
  tokenCount: number;
};

export type EvidencePackage = {
  codeId: string;
  candidateCode: string;
  representativeQuotes: string[];
  relatedSentences: string[];
  context: string;
  similarStatements: string[];
  relatedConcepts: string[];
  researchQuestion: string;
};

export type InterpretiveInference = {
  codeId: string;
  salience: number;
  pattern: string;
  contextSummary: string;
  relationship: string;
  explanation: string;
  themeCandidate: string;
};

export type AiCodebookEntry = {
  codeId: string;
  codeName: string;
  definition: string;
  description: string;
  inclusion: string;
  exclusion: string;
  representativeQuotes: string[];
  frequency: number;
  tfidf: number;
  cooccurrence: string[];
  embeddingCluster: string;
  salienceScore: number;
  pattern: string;
  contextSummary: string;
  relationship: string;
  explanatoryPower: number;
  themeContribution: string;
  aiConfidence: number;
  memo: string;
};

export type SacPattern = { id: string; statement: string; codes: string[] };
export type SacCategory = { id: string; label: string; codes: string[] };
export type SacTheme = { id: string; sentence: string; categories: string[] };

export type StandardAiCodebookState = {
  title: string;
  question: string;
  purpose: string;
  raw: string;
  fileNames: string[];
  segments: string[];
  analytics: ComputationalAnalytics | null;
  evidence: EvidencePackage[];
  inferences: InterpretiveInference[];
  codebook: AiCodebookEntry[];
  patterns: SacPattern[];
  categories: SacCategory[];
  themes: SacTheme[];
  interpretation: string;
  source: "ai" | "rule" | "hybrid" | "";
  updatedAt: string;
};

export function emptyStandardAiCodebook(): StandardAiCodebookState {
  return {
    title: "",
    question: "",
    purpose: "",
    raw: "",
    fileNames: [],
    segments: [],
    analytics: null,
    evidence: [],
    inferences: [],
    codebook: [],
    patterns: [],
    categories: [],
    themes: [],
    interpretation: "",
    source: "",
    updatedAt: "",
  };
}

const STOP = new Set([
  "그리고", "그러나", "그래서", "하지만", "또한", "또는", "이런", "저런", "그런",
  "이것", "그것", "저것", "있는", "없는", "하는", "된다", "했다", "한다", "이다",
  "있습니다", "없습니다", "합니다", "됩니다", "때문", "위해", "통해", "대해", "관련",
  "경우", "정도", "부분", "사람", "우리", "자신", "자신들", "그들", "그녀", "이것들",
  "the", "and", "for", "with", "that", "this", "from", "have", "were", "been",
  "was", "are", "were", "you", "your", "they", "them", "their", "then", "than",
  "but", "not", "all", "any", "can", "had", "has", "his", "her", "she", "him",
  "who", "what", "when", "where", "which", "how", "why", "will", "would", "could",
  "should", "about", "into", "over", "after", "before", "there", "here", "some",
  "just", "like", "also", "only", "very", "more", "most", "other", "such", "than",
  "out", "up", "down", "off", "on", "in", "at", "to", "of", "as", "by", "or",
  "if", "so", "do", "did", "does", "be", "being", "been", "is", "am", "we", "our",
  "my", "me", "i", "a", "an", "its", "it's", "now", "too", "yes", "no",
]);

function tokenize(text: string): string[] {
  const raw = (text.match(/[가-힣]{2,12}|[A-Za-z]{3,16}/g) || [])
    .map((t) => t.toLowerCase());
  return raw.filter((t) => !STOP.has(t) && t.length >= 2);
}

export function segmentRaw(raw: string): string[] {
  const cleaned = (raw || "").replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];
  const parts = cleaned
    .split(/(?<=[.!?。！？\n])\s+|\n{2,}/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 12);
  if (parts.length) return parts.slice(0, 2500);
  // fallback: chunk by length
  const out: string[] = [];
  for (let i = 0; i < cleaned.length; i += 180) {
    const chunk = cleaned.slice(i, i + 180).trim();
    if (chunk.length >= 12) out.push(chunk);
  }
  return out.slice(0, 2500);
}

function termFreq(segments: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  segments.forEach((s) => {
    const seen = new Set<string>();
    tokenize(s).forEach((t) => {
      if (seen.has(t)) return;
      seen.add(t);
      freq.set(t, (freq.get(t) || 0) + 1);
    });
  });
  return freq;
}

export function runComputationalAnalytics(segments: string[]): ComputationalAnalytics {
  const freqMap = termFreq(segments);
  const nDocs = Math.max(segments.length, 1);
  const frequency = [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([term, count]) => ({ term, count }));

  const tfidf = frequency.map(({ term, count }) => {
    const df = count;
    const idf = Math.log((nDocs + 1) / (df + 1)) + 1;
    const tf = count / nDocs;
    return { term, score: Math.round(tf * idf * 1000) / 1000 };
  }).sort((a, b) => b.score - a.score);

  // co-occurrence on top terms
  const top = frequency.slice(0, 18).map((x) => x.term);
  const pair = new Map<string, number>();
  segments.forEach((s) => {
    const toks = new Set(tokenize(s).filter((t) => top.includes(t)));
    const arr = [...toks];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const [a, b] = arr[i] < arr[j] ? [arr[i], arr[j]] : [arr[j], arr[i]];
        const k = `${a}|||${b}`;
        pair.set(k, (pair.get(k) || 0) + 1);
      }
    }
  });
  const cooccurrence = [...pair.entries()]
    .map(([k, count]) => {
      const [a, b] = k.split("|||");
      return { a, b, count };
    })
    .sort((x, y) => y.count - x.count)
    .slice(0, 30);

  // simple clustering by shared first character / co-occurrence hubs
  const hubs = frequency.slice(0, 8).map((f) => f.term);
  const clusters: Cluster[] = hubs.map((h, i) => {
    const related = cooccurrence
      .filter((p) => p.a === h || p.b === h)
      .flatMap((p) => [p.a, p.b])
      .filter((t) => t !== h);
    const members = [...new Set([h, ...related])].slice(0, 8);
    return { id: `cl${i + 1}`, label: `의미군집:${h}`, members };
  }).filter((c) => c.members.length >= 2);

  const tokenCount = segments.reduce((a, s) => a + tokenize(s).length, 0);
  return {
    frequency,
    tfidf,
    cooccurrence,
    clusters: clusters.length ? clusters : [{ id: "cl1", label: "의미군집:일반", members: frequency.slice(0, 6).map((f) => f.term) }],
    segmentCount: segments.length,
    tokenCount,
  };
}

/** 용어가 등장하는 근거 문장(세그먼트)을 빈도·길이 순으로 반환 */
export function pickQuotes(segments: string[], term: string, limit = 3): string[] {
  if (!term || !segments?.length) return [];
  const termLc = term.toLowerCase();
  const hits = segments.filter((s) => {
    const lc = s.toLowerCase();
    return lc.includes(termLc) || tokenize(s).includes(termLc);
  });
  const ranked = hits.sort((a, b) => {
    let sa = 0; let sb = 0;
    try {
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      sa = (a.match(re) || []).length;
      sb = (b.match(re) || []).length;
    } catch { /* ignore */ }
    return sb - sa || a.length - b.length;
  });
  return ranked.slice(0, limit).map((s) => (s.length > 160 ? s.slice(0, 157) + "…" : s));
}

/** 분석 결과에 단어가 나올 때마다 붙일 근거 문장 맵 */
export function evidenceMapForTerms(
  segments: string[],
  terms: string[],
  limitPerTerm = 2
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  terms.forEach((t) => {
    const q = pickQuotes(segments, t, limitPerTerm);
    if (q.length) out[t] = q;
  });
  return out;
}

function contextAround(segments: string[], quote: string): string {
  const idx = segments.findIndex((s) => s === quote || s.includes(quote.slice(0, 40)));
  if (idx < 0) return quote.slice(0, 120);
  const prev = segments[idx - 1] || "";
  const next = segments[idx + 1] || "";
  return [prev, segments[idx], next].filter(Boolean).join(" / ").slice(0, 280);
}

export function extractEvidencePackages(
  segments: string[],
  analytics: ComputationalAnalytics,
  question: string
): EvidencePackage[] {
  const seeds = analytics.tfidf.slice(0, 12).map((t) => t.term);
  return seeds.map((term, i) => {
    const quotes = pickQuotes(segments, term, 3);
    const related = segments
      .filter((s) => tokenize(s).some((t) => t === term || analytics.cooccurrence.some(
        (p) => (p.a === term || p.b === term) && (p.a === t || p.b === t)
      )))
      .slice(0, 4)
      .map((s) => (s.length > 140 ? s.slice(0, 137) + "…" : s));
    const cluster = analytics.clusters.find((c) => c.members.includes(term));
    const relatedConcepts = (cluster?.members || []).filter((m) => m !== term).slice(0, 5);
    return {
      codeId: `C${String(i + 1).padStart(3, "0")}`,
      candidateCode: term,
      representativeQuotes: quotes.length ? quotes : related.slice(0, 2),
      relatedSentences: related,
      context: quotes[0] ? contextAround(segments, quotes[0]) : related[0] || "",
      similarStatements: related.slice(0, 3),
      relatedConcepts,
      researchQuestion: question || "(미입력)",
    };
  });
}

function ruleInfer(ev: EvidencePackage, analytics: ComputationalAnalytics): InterpretiveInference {
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
    contextSummary: ev.context.slice(0, 180) || "문맥 정보 부족",
    relationship: co.length
      ? `공출현: ${co.join(", ")}`
      : "독립적으로 등장하는 경향",
    explanation: `연구질문(${ev.researchQuestion})에 대해 '${ev.candidateCode}'은(는) 경험적 단서로 기능함`,
    themeCandidate: `${ev.candidateCode} 중심 의미 구조`,
  };
}

async function aiEnrichInferences(
  evidence: EvidencePackage[],
  question: string,
  settings: any
): Promise<InterpretiveInference[] | null> {
  const compact = evidence.slice(0, 10).map((e) => ({
    codeId: e.codeId,
    code: e.candidateCode,
    quotes: e.representativeQuotes.slice(0, 2),
    concepts: e.relatedConcepts.slice(0, 4),
  }));
  const prompt =
    `당신은 질적연구 해석 조교입니다. Evidence Package를 바탕으로 Interpretive Inference JSON 배열만 출력하세요.\n` +
    `각 항목: {"codeId","salience"(0~1),"pattern","contextSummary","relationship","explanation","themeCandidate"}\n` +
    `연구질문: ${question || "(미입력)"}\n` +
    `Evidence:\n${JSON.stringify(compact, null, 0).slice(0, 7000)}`;
  const raw = await aiComplete(prompt, settings);
  if (!raw) return null;
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.map((x: any, i: number) => ({
      codeId: String(x.codeId || evidence[i]?.codeId || `C${i + 1}`),
      salience: Math.max(0, Math.min(1, Number(x.salience) || 0.5)),
      pattern: String(x.pattern || ""),
      contextSummary: String(x.contextSummary || ""),
      relationship: String(x.relationship || ""),
      explanation: String(x.explanation || ""),
      themeCandidate: String(x.themeCandidate || ""),
    }));
  } catch {
    return null;
  }
}

export function buildAiCodebook(
  evidence: EvidencePackage[],
  inferences: InterpretiveInference[],
  analytics: ComputationalAnalytics
): AiCodebookEntry[] {
  const infMap = new Map(inferences.map((x) => [x.codeId, x]));
  return evidence.map((ev) => {
    const inf = infMap.get(ev.codeId) || ruleInfer(ev, analytics);
    const freq = analytics.frequency.find((f) => f.term === ev.candidateCode)?.count || 0;
    const tf = analytics.tfidf.find((t) => t.term === ev.candidateCode)?.score || 0;
    const cluster = analytics.clusters.find((c) => c.members.includes(ev.candidateCode));
    const co = analytics.cooccurrence
      .filter((p) => p.a === ev.candidateCode || p.b === ev.candidateCode)
      .slice(0, 4)
      .map((p) => (p.a === ev.candidateCode ? p.b : p.a));
    return {
      codeId: ev.codeId,
      codeName: ev.candidateCode,
      definition: `'${ev.candidateCode}'에 관한 의미 단위 — 원자료에서 반복·공출현으로 도출`,
      description: inf.explanation || `${ev.candidateCode} 관련 진술 묶음`,
      inclusion: `${ev.candidateCode} 또는 동의 표현이 명시적으로 등장하는 문장`,
      exclusion: `단순 언급만 있고 맥락·평가가 없는 경우`,
      representativeQuotes: ev.representativeQuotes,
      frequency: freq,
      tfidf: tf,
      cooccurrence: co,
      embeddingCluster: cluster?.label || "미배정",
      salienceScore: inf.salience,
      pattern: inf.pattern,
      contextSummary: inf.contextSummary,
      relationship: inf.relationship,
      explanatoryPower: Math.round(inf.salience * (1 + Math.min(freq, 10) / 10) * 50) / 50,
      themeContribution: inf.themeCandidate,
      aiConfidence: Math.round((0.45 + inf.salience * 0.4 + Math.min(freq, 8) / 40) * 100) / 100,
      memo: "",
    };
  });
}

export function derivePatternCategoryTheme(
  codebook: AiCodebookEntry[],
  inferences: InterpretiveInference[]
): { patterns: SacPattern[]; categories: SacCategory[]; themes: SacTheme[] } {
  const patterns: SacPattern[] = inferences.slice(0, 8).map((inf, i) => ({
    id: `P${i + 1}`,
    statement: inf.pattern,
    codes: [codebook.find((c) => c.codeId === inf.codeId)?.codeName || inf.codeId],
  }));

  // category by cluster label / first char of theme candidate
  const buckets = new Map<string, string[]>();
  codebook.forEach((c) => {
    const key = (c.embeddingCluster || "기타").replace(/^의미군집:/, "") || "기타";
    buckets.set(key, [...(buckets.get(key) || []), c.codeName]);
  });
  const categories: SacCategory[] = [...buckets.entries()].slice(0, 10).map(([label, codes], i) => ({
    id: `CAT${i + 1}`,
    label: `범주:${label}`,
    codes: [...new Set(codes)],
  }));

  const themeSeeds = [...new Set(inferences.map((x) => x.themeCandidate).filter(Boolean))].slice(0, 6);
  const themes: SacTheme[] = themeSeeds.map((sentence, i) => ({
    id: `TH${i + 1}`,
    sentence,
    categories: categories.slice(0, 3).map((c) => c.label),
  }));
  if (!themes.length && categories.length) {
    themes.push({
      id: "TH1",
      sentence: `${categories[0].label}을(를) 중심으로 한 핵심 의미 흐름`,
      categories: categories.slice(0, 3).map((c) => c.label),
    });
  }
  return { patterns, categories, themes };
}

export function buildRuleInterpretation(state: StandardAiCodebookState): string {
  const topCodes = [...state.codebook].sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  const topCats = state.categories.slice(0, 5);
  const topThemes = state.themes.slice(0, 5);
  return [
    `# 최종 해석 리포트 — ${state.title || "AI 표준 코딩북"}`,
    ``,
    `## 1. 연구 프레임`,
    `- 연구질문: ${state.question || "(미입력)"}`,
    `- 연구목적: ${state.purpose || "(미입력)"}`,
    `- 프로세스: 원자료 → 계산 → 추론 → 코드북 (AI 기반 표준 코딩)`,
    `- 산출 소스: ${state.source || "rule"}`,
    ``,
    `## 2. 자료·코딩 규모`,
    `- 원자료 ${(state.raw || "").length.toLocaleString()}자 · 세그먼트 ${state.segments.length}`,
    `- Evidence Package ${state.evidence.length} · AI 코드 ${state.codebook.length}`,
    `- 범주 ${state.categories.length} · 패턴 ${state.patterns.length} · 테마 ${state.themes.length}`,
    `- 토큰(추정) ${state.analytics?.tokenCount ?? 0}`,
    ``,
    `## 3. 핵심 발견`,
    `- 계산적 분석으로 ${state.analytics?.frequency.length || 0}개 핵심 용어와 ${state.analytics?.clusters.length || 0}개 의미 군집이 구조화되었습니다.`,
    `- Evidence Extraction으로 ${state.evidence.length}개 해석 근거 패키지가 자동 생성되었습니다.`,
    `- 최빈 코드: ${topCodes.map((c) => `${c.codeName}(${c.frequency})`).join(", ") || "(없음)"}`,
    ``,
    `## 4. 테마/범주 해석`,
    ...(topThemes.length
      ? topThemes.map((t, i) => `${i + 1}. ${t.sentence}`)
      : ["(테마 없음)"]),
    ``,
    `### 범주`,
    ...(topCats.length
      ? topCats.map((c) => `- ${c.label}: ${c.codes.slice(0, 6).join(", ")}`)
      : ["(범주 없음)"]),
    ``,
    `## 5. 개념·이론`,
    ...state.codebook.slice(0, 5).map((c) =>
      `- ${c.codeName}: ${c.definition} (현저성 ${c.salienceScore}, 설명력 ${c.explanatoryPower})`),
    ...state.patterns.slice(0, 4).map((p) => `- 패턴 · ${p.statement}`),
    ``,
    `## 6. 잠정 답변`,
    `- "${state.question || "연구질문 미입력"}"에 대해, Evidence Package와 Interpretive Inference는 반복 패턴에 기반한 초안 해석을 제공합니다.`,
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

export async function generateStandardInterpretation(
  state: StandardAiCodebookState,
  settings: any
): Promise<{ text: string; source: "ai" | "rule" }> {
  if (!state.codebook.length && !state.themes.length) {
    return { text: "", source: "rule" };
  }
  const prompt =
    `당신은 사회과학 질적연구 조교입니다. AI 표준 코딩북 결과를 바탕으로 한국어 최종 해석 리포트를 작성하세요.\n` +
    `반드시 포함: 1) 연구 프레임 2) 자료·코딩 규모 3) 핵심 발견 4) 테마/범주 해석 5) 개념·이론 6) 잠정 답변 7) 후속 체크리스트\n` +
    `근거 없는 확대해석 금지.\n\n` +
    `[연구질문] ${state.question || "(미입력)"}\n[목적] ${state.purpose || "(미입력)"}\n` +
    `[규모] raw=${state.raw.length} segs=${state.segments.length} codes=${state.codebook.length}\n` +
    `[코드]\n${state.codebook.slice(0, 12).map((c) => `- ${c.codeName} f=${c.frequency} sal=${c.salienceScore}`).join("\n")}\n` +
    `[범주]\n${state.categories.slice(0, 8).map((c) => `- ${c.label}: ${c.codes.slice(0, 5).join(", ")}`).join("\n")}\n` +
    `[테마]\n${state.themes.slice(0, 8).map((t) => `- ${t.sentence}`).join("\n")}\n` +
    `[Evidence 요약]\n${state.evidence.slice(0, 6).map((e) => `- ${e.candidateCode}: ${(e.representativeQuotes[0] || "").slice(0, 80)}`).join("\n")}`;
  try {
    const ai = await aiComplete(prompt, settings);
    if (ai && ai.trim().length > 80) return { text: ai.trim(), source: "ai" };
  } catch { /* fallthrough */ }
  return { text: buildRuleInterpretation(state), source: "rule" };
}

/** 전체 표준 코딩북 파이프라인 */
export async function runStandardAiCodebookPipeline(
  input: Pick<StandardAiCodebookState, "title" | "question" | "purpose" | "raw" | "fileNames">,
  settings: any,
  onProgress?: ProgressReporter
): Promise<StandardAiCodebookState> {
  const pct = (n: number, phase: string) => onProgress?.({ phase, percent: n });
  const base = emptyStandardAiCodebook();
  const raw = (input.raw || "").trim();
  if (!raw) throw new Error("원자료가 비어 있습니다.");

  pct(5, "원자료 전처리 · 분절");
  const segments = segmentRaw(raw);

  pct(18, "Computational Analytics");
  const analytics = runComputationalAnalytics(segments);

  pct(35, "Evidence Extraction");
  let evidence = extractEvidencePackages(segments, analytics, input.question || "");
  let source: StandardAiCodebookState["source"] = "rule";

  // optional AI refinement of candidate codes
  pct(48, "AI 코드 후보 정제");
  try {
    const prompt =
      `질적연구 코더로서 아래 핵심어를 코드명(2~8자 한국어 명사구)으로 정제하고 JSON 배열만 출력하세요.\n` +
      `형식: [{"codeId":"C001","codeName":"...","definition":"한줄 정의"}]\n` +
      `연구질문: ${input.question || "(미입력)"}\n` +
      `후보: ${evidence.map((e) => e.candidateCode).join(", ")}\n` +
      `표본:\n${segments.slice(0, 40).join("\n").slice(0, 3500)}`;
    const ai = await aiComplete(prompt, settings);
    const m = ai?.match(/\[[\s\S]*\]/);
    if (m) {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr) && arr.length) {
        evidence = evidence.map((e, i) => {
          const hit = arr.find((x: any) => String(x.codeId) === e.codeId) || arr[i];
          if (!hit) return e;
          return {
            ...e,
            candidateCode: String(hit.codeName || e.candidateCode).trim() || e.candidateCode,
            relatedConcepts: [...new Set([...(e.relatedConcepts || []), String(hit.definition || "").slice(0, 40)].filter(Boolean))],
          };
        });
        source = "hybrid";
      }
    }
  } catch { /* keep rule evidence */ }

  pct(62, "Interpretive Inference");
  let inferences = evidence.map((e) => ruleInfer(e, analytics));
  const aiInf = await aiEnrichInferences(evidence, input.question || "", settings);
  if (aiInf && aiInf.length) {
    const byId = new Map(aiInf.map((x) => [x.codeId, x]));
    inferences = inferences.map((r) => byId.get(r.codeId) || r);
    source = source === "hybrid" ? "hybrid" : "ai";
  }

  pct(75, "AI Codebook 생성");
  const codebook = buildAiCodebook(evidence, inferences, analytics);

  pct(85, "Pattern · Category · Theme");
  const { patterns, categories, themes } = derivePatternCategoryTheme(codebook, inferences);

  const draft: StandardAiCodebookState = {
    ...base,
    title: input.title || "AI 표준 코딩북",
    question: input.question || "",
    purpose: input.purpose || "",
    raw,
    fileNames: input.fileNames || [],
    segments,
    analytics,
    evidence,
    inferences,
    codebook,
    patterns,
    categories,
    themes,
    interpretation: "",
    source,
    updatedAt: new Date().toISOString(),
  };

  pct(92, "최종 해석 리포트");
  const report = await generateStandardInterpretation(draft, settings);
  draft.interpretation = report.text;
  if (report.source === "ai" && draft.source === "rule") draft.source = "hybrid";
  else if (report.source === "ai") draft.source = draft.source || "ai";

  pct(100, "완료");
  return draft;
}

/** 상위범주(메타) — 엑셀 시트용 */
export function sacMetaCategories(state: StandardAiCodebookState): { label: string; freq: number; members: string[] }[] {
  return state.categories.map((c) => ({
    label: c.label,
    members: c.codes,
    freq: c.codes.reduce((a, code) => {
      const row = state.codebook.find((x) => x.codeName === code);
      return a + (row?.frequency || 0);
    }, 0),
  })).sort((a, b) => b.freq - a.freq);
}

/** 상위주제 — 엑셀 시트용 */
export function sacTopThemes(state: StandardAiCodebookState): { statement: string; basis: string[] }[] {
  return state.themes.map((t) => ({
    statement: t.sentence,
    basis: t.categories,
  }));
}

/** 범주 빈도 시트 */
export function sacCategoryFreq(state: StandardAiCodebookState): { label: string; codeCount: number; freq: number; densityPct: number }[] {
  const rows = state.categories.map((c) => {
    const freq = c.codes.reduce((a, code) => {
      const row = state.codebook.find((x) => x.codeName === code);
      return a + (row?.frequency || 0);
    }, 0);
    return { label: c.label, codeCount: c.codes.length, freq };
  });
  const total = rows.reduce((a, r) => a + r.freq, 0) || 1;
  return rows
    .map((r) => ({ ...r, densityPct: Math.round((r.freq / total) * 1000) / 10 }))
    .sort((a, b) => b.freq - a.freq);
}
